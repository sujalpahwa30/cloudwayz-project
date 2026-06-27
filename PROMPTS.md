# PROMPTS.md

# AI Interaction Log

This document records how AI was used during the design, implementation, testing, and documentation of this project.

Rather than treating AI as a code generator, I used it as an engineering assistant for architecture discussions, design reviews, implementation guidance, debugging, testing strategy, and documentation. Every significant design decision was reviewed before implementation, and the final solution reflects the combination of AI-assisted exploration and manual engineering judgement.

---

# 1. Architecture Prompt

## Initial Prompt

> I have received this email just a few hours ago, consider yourself as a senior software developer with an expertise in software development, cloud development, AI/ML, and backend systems. Help me complete this task within a day with the best efficiency and maximum output. I want to build a solution that is not only correct but also professionally engineered. Please reason deeply about the architecture, think beyond the obvious implementation, and guide me step by step while explaining every important design decision. Feel free to use any resources, best practices, or engineering approaches that would help produce a production-quality submission.

> Along with this prompt, I also shared the complete coding challenge email from CloudWayZ Solutions LLP describing the assignment requirements, deliverables, evaluation criteria, and the required `PROMPTS.md` documentation.


---

## Initial AI Suggestions

The AI recommended:

* Using a layered architecture:

  * Routes
  * Controllers
  * Services
  * Repository
  * MySQL

* Using MySQL as the storage layer.

* Separating SQL from business logic.

* Implementing a configurable load-testing script.

* Building a correctness test in addition to stress testing.

These suggestions formed the overall project structure.

---

# 2. Refinement Loop

The following examples describe situations where the initial AI suggestions required additional review or refinement before they were incorporated into the project.

---

## Refinement Loop #1

### Initial AI Suggestion

The AI initially discussed updating the wallet balance using a simple read-modify-write workflow.

Example:

```text
Read current balance

↓

balance = balance + delta

↓

UPDATE wallets
SET balance = newBalance
```

### Problem

Although straightforward, this approach is unsafe under concurrent execution.

If multiple requests read the same balance before either request writes the updated value, one update can overwrite another, producing a **Lost Update** race condition.

Example:

```text
Worker A reads 1000

Worker B reads 1000

Worker A writes 1010

Worker B writes 1010

Expected:
1020

Actual:
1010
```

This implementation would fail the primary requirement of the assignment.

### Final Decision

The implementation was changed to use explicit database transactions together with row-level locking.

```sql
BEGIN;

SELECT *
FROM wallets
WHERE id = ?
FOR UPDATE;

UPDATE wallets
SET balance = balance + ?
WHERE id = ?;

COMMIT;
```

This guarantees that only one transaction can modify a wallet row at a time and prevents lost updates under concurrent execution.

---

## Refinement Loop #2

### Initial AI Suggestion

The AI noted that a single SQL statement such as:

```sql
UPDATE wallets
SET balance = balance + ?
WHERE id = ?;
```

is atomic in MySQL.

This statement is technically correct for simple balance increments.

### Problem

While atomic arithmetic updates work for basic increments, they become insufficient once business rules require reading the current state before updating it.

Examples include:

* Preventing negative balances
* Withdrawal limits
* Fraud detection
* Multi-step financial workflows
* Audit logging

These scenarios require safely reading the current row before applying business logic.

### Final Decision

The implementation retained explicit transactions with:

```sql
SELECT ... FOR UPDATE
```

before updating the balance.

Although this approach introduces temporary row-level waiting under heavy contention, it provides a more extensible design that naturally supports additional business rules without introducing race conditions.

---

## Refinement Loop #3

### Initial AI Suggestion

The first version of the testing strategy focused primarily on concurrent load generation using identical requests.

Example:

```text
50 workers

delta = +1
```

### Problem

This verifies concurrency but does not independently prove mathematical correctness.

A system could process many concurrent requests yet still produce incorrect balances under more varied operations.

### Final Decision

The testing strategy was expanded into two independent scripts.

### Load Harness

* Configurable worker count
* Configurable delta
* Supports 50–500 concurrent requests
* Measures execution time

### Correctness Test

* Generates a deterministic sequence of positive and negative balance updates
* Computes the expected balance before execution
* Executes all requests concurrently
* Reads the final wallet balance
* Verifies that:

```text
Expected Balance == Actual Balance
```

This separates performance validation from correctness validation.

---

# 3. AI Blindspot Note

Throughout the implementation, the AI consistently produced technically valid solutions but generally optimized for concise implementations rather than production-oriented concurrency design.

For example, the AI naturally gravitated toward simpler SQL solutions such as atomic arithmetic updates without initially emphasizing transaction boundaries, row-level locking, or future extensibility for additional business rules.

The AI also focused first on generating concurrent requests before distinguishing between stress testing and correctness testing. That distinction became important because demonstrating high concurrency alone does not prove that every update is applied exactly once.

To address these limitations, every architectural decision was reviewed manually. Particular attention was given to transaction management, row-level locking, repository/service separation, and deterministic testing. The final implementation therefore reflects a combination of AI-assisted development and deliberate engineering decisions rather than accepting the initial suggestions without review.

---

# Summary

AI was used throughout the project as an engineering assistant for:

* brainstorming the architecture
* reviewing design alternatives
* discussing concurrency strategies
* explaining database transactions
* refining repository and service boundaries
* improving testing methodology
* reviewing documentation

Every significant implementation decision was verified and refined before being incorporated into the final project.

## Closing Note

The final implementation is not a direct transcript of AI-generated code. The project evolved through multiple iterations involving architectural discussions, implementation, testing, debugging, and refinement. AI accelerated exploration and review, while the final engineering decisions—including the concurrency strategy, transaction boundaries, repository-service separation, and testing approach—were validated before being incorporated into the codebase.
