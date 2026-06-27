/**
 * Create a new wallet.
 */
const createWallet = async (connection, owner, balance) => {
  const [result] = await connection.execute(
    `
        INSERT INTO wallets (owner, balance)
        VALUES (?, ?)
        `,
    [owner, balance]
  );

  return result.insertId;
};

/**
 * Fetch wallet by ID.
 */
const findWalletById = async (connection, walletId) => {
  const [rows] = await connection.execute(
    `
        SELECT
            id,
            owner,
            balance,
            created_at,
            updated_at
        FROM wallets
        WHERE id = ?
        `,
    [walletId]
  );

  return rows.length ? rows[0] : null;
};

/**
 * Lock a wallet row for update.
 *
 * NOTE:
 * This MUST be called inside an active transaction.
 * The row remains locked until COMMIT or ROLLBACK.
 */
const lockWalletById = async (connection, walletId) => {
  const [rows] = await connection.execute(
    `
        SELECT
            id,
            owner,
            balance,
            created_at,
            updated_at
        FROM wallets
        WHERE id = ?
        FOR UPDATE
        `,
    [walletId]
  );

  return rows.length ? rows[0] : null;
};

/**
 * Apply a balance delta.
 *
 * Uses MySQL's atomic arithmetic operation.
 */
const updateWalletBalance = async (connection, walletId, delta) => {
  const [result] = await connection.execute(
    `
        UPDATE wallets
        SET
            balance = balance + ?
        WHERE id = ?
        `,
    [delta, walletId]
  );

  return result.affectedRows;
};

/**
 * Delete wallet.
 * (Not required by the assignment but useful for tests.)
 */
const deleteWallet = async (connection, walletId) => {
  const [result] = await connection.execute(
    `
        DELETE FROM wallets
        WHERE id = ?
        `,
    [walletId]
  );

  return result.affectedRows;
};

module.exports = {
  createWallet,
  findWalletById,
  lockWalletById,
  updateWalletBalance,
  deleteWallet,
};