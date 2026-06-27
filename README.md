# 🚀 CloudWayZ Wallet API

A production-inspired RESTful backend service built with **Node.js**, **Express**, and **MySQL** that demonstrates safe concurrent updates to a shared resource using **database transactions** and **row-level locking**.

This project was developed as part of the **CloudWayZ Solutions LLP - SDE Intern AI Coding Challenge (Track 2: High-Velocity REST APIs & Event Streaming)**.

---

# 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Architecture](#-project-architecture)
- [Folder Structure](#-folder-structure)
- [Database Schema](#-database-schema)
- [Concurrency Problem](#-concurrency-problem)
- [Concurrency Strategy](#-concurrency-strategy)
- [Why This Approach?](#-why-this-approach)
- [API Documentation](#-api-documentation)
- [Environment Variables](#-environment-variables)
- [Installation & Setup](#-installation--setup)
- [Running the Application](#-running-the-application)
- [Load Testing](#-load-testing)
- [Correctness Testing](#-correctness-testing)
- [Sample Results](#-sample-results)
- [Future Improvements](#-future-improvements)

---

# 📌 Overview

This project implements a **wallet management service** capable of handling **highly concurrent updates** without data corruption.

The primary objective is to safely process multiple simultaneous requests that modify the same wallet balance while guaranteeing data consistency.

The implementation focuses on:

- Clean layered architecture
- Transaction management
- Row-level locking
- Concurrent request handling
- Automated correctness verification
- Reproducible load testing

---

# ✨ Features

- Create Wallet
- Get Wallet
- Apply Balance Delta
- MySQL Storage
- Transaction Management
- Row-Level Locking (`SELECT ... FOR UPDATE`)
- Concurrent Load Testing
- Correctness Validation
- Input Validation using Zod
- Centralized Error Handling
- Clean Repository-Service Architecture

---

# 🛠 Technology Stack

| Technology | Purpose |
|------------|----------|
| Node.js | Runtime |
| Express.js | REST API |
| MySQL | Database |
| mysql2 | Database Driver |
| Zod | Request Validation |
| Axios | Load Testing |
| Morgan | HTTP Logging |
| Nodemon | Development |

---

# 🏗 Project Architecture

```
                    HTTP Request
                         │
                         ▼
                   Express Routes
                         │
                         ▼
                    Controllers
                         │
                         ▼
                 Service Layer
         (Business Logic + Transactions)
                         │
                         ▼
                Repository Layer
                  (SQL Queries)
                         │
                         ▼
                       MySQL
```

## Responsibilities

### Routes

Maps HTTP endpoints to controllers.

### Controllers

- Validate request
- Invoke service layer
- Return HTTP responses

### Services

Contains business logic.

Responsible for:

- Transaction lifecycle
- Business validation
- Row locking
- Commit / Rollback

### Repository

Responsible only for SQL queries.

No business logic.

---

# 📂 Folder Structure

```
cloudwayz-wallet-api/

├── scripts/
│   ├── loadTest.js
│   └── correctnessTest.js
│
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── validators/
│
├── tests/
│
├── .env.example
├── package.json
├── README.md
├── PROMPTS.md
└── server.js
```

---

# 🗄 Database Schema

```sql
CREATE TABLE wallets (

    id INT AUTO_INCREMENT PRIMARY KEY,

    owner VARCHAR(100) NOT NULL,

    balance BIGINT NOT NULL DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP

);
```

---

# ⚠ Concurrency Problem

A naive implementation looks like this:

```
Worker A

Read Balance = 1000

-------------------

Worker B

Read Balance = 1000

-------------------

Worker A

Write 1010

-------------------

Worker B

Write 1010
```

Expected Balance

```
1020
```

Actual Balance

```
1010
```

This is known as the **Lost Update Problem**.

---

# ✅ Concurrency Strategy

To prevent lost updates, this project uses:

- Database Transactions
- Row-Level Locking
- Atomic SQL Updates

Flow:

```
BEGIN TRANSACTION

↓

SELECT ... FOR UPDATE

↓

Business Validation

↓

UPDATE balance = balance + ?

↓

COMMIT
```

While one transaction owns the row lock, every other concurrent transaction waits.

This guarantees that updates are applied sequentially without losing data.

---

# 🤔 Why This Approach?

Several approaches were considered.

| Strategy | Advantages | Limitations | Used |
|----------|------------|-------------|------|
| Read → Modify → Write | Simple | Race Conditions | ❌ |
| Atomic UPDATE | Fast | Limited Business Logic | ❌ |
| Optimistic Locking | High Throughput | Retry Logic Required | ❌ |
| Redis Atomic Operations | Extremely Fast | Different Storage Layer | ❌ |
| Transactions + SELECT FOR UPDATE | Safe, Extensible, Deterministic | Row Waits | ✅ |

Although a single atomic `UPDATE balance = balance + ?` would work for simple increments, explicit transactions with row-level locking were chosen because they naturally support future business rules such as:

- Preventing negative balances
- Daily withdrawal limits
- Audit logging
- Multi-step financial operations

---

# 📚 API Documentation

---

## Create Wallet

**POST**

```
/api/wallets
```

Request

```json
{
    "owner":"Sujal",
    "balance":1000
}
```

Response

```json
{
    "success":true,
    "message":"Wallet created successfully",
    "data":{
        "id":1,
        "owner":"Sujal",
        "balance":1000
    }
}
```

---

## Get Wallet

**GET**

```
/api/wallets/:id
```

Response

```json
{
    "success":true,
    "data":{
        "id":1,
        "owner":"Sujal",
        "balance":1200
    }
}
```

---

## Apply Delta

**PATCH**

```
/api/wallets/:id
```

Request

```json
{
    "delta":50
}
```

or

```json
{
    "delta":-25
}
```

Response

```json
{
    "success":true,
    "message":"Wallet updated successfully",
    "data":{
        "id":1,
        "balance":1250
    }
}
```

---

# ⚙ Environment Variables

Create a `.env` file.

```
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=wallet_user
DB_PASSWORD=your_password
DB_NAME=cloudwayz_wallet

BASE_URL=http://localhost:3000/api
```

---

# 🚀 Installation & Setup

Clone the repository

```bash
git clone <repository-url>
```

Install dependencies

```bash
npm install
```

Create MySQL database

```sql
CREATE DATABASE cloudwayz_wallet;
```

Create the wallet table using the schema above.

Configure your `.env`.

---

# ▶ Running the Application

Development

```bash
npm run dev
```

Production

```bash
npm start
```

---

# 🧪 Load Testing

The repository includes a configurable concurrent load harness.

Default

```bash
npm run load-test
```

Custom workers

```bash
node scripts/loadTest.js --workers=500
```

Custom delta

```bash
node scripts/loadTest.js --workers=500 --delta=5
```

Existing wallet

```bash
node scripts/loadTest.js --walletId=1 --workers=500
```

---

# ✅ Correctness Testing

The correctness test generates a deterministic sequence of balance updates and verifies that the final balance matches the mathematically expected value.

Run

```bash
npm run correctness-test
```

Custom

```bash
node scripts/correctnessTest.js --workers=500 --seed=42
```

---

# 📈 Sample Results

## Load Test

```
Workers            : 500

Expected Balance   : 1500

Actual Balance     : 1500

Execution Time     : 12092 ms

Status             : PASS
```

---

## Correctness Test

```
Workers            : 100

Expected Balance   : 982

Actual Balance     : 982

Execution Time     : 3020 ms

Status             : PASS
```

---

# 🔒 Data Consistency Guarantees

This implementation guarantees:

- No lost updates
- Transactional consistency
- Safe concurrent writes
- Atomic balance updates
- Row-level isolation during modification

Successfully tested with:

- 50 concurrent workers
- 100 concurrent workers
- 500 concurrent workers

---

# 🚀 Future Improvements

Possible enhancements include:

- Docker support
- Authentication & Authorization
- Audit Logs
- API Versioning
- Redis Caching
- Prometheus Metrics
- Rate Limiting
- CI/CD Pipeline
- Integration Tests
- OpenAPI / Swagger Documentation

---

# 👨‍💻 Author

**Sujal Pahwa**
