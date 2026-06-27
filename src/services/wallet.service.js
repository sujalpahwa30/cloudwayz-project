const pool = require("../config/db");
const walletRepository = require("../repositories/wallet.repository");

/**
 * Create Wallet
 */
const createWallet = async (owner, balance) => {
    const connection = await pool.getConnection();

    try {
        const walletId = await walletRepository.createWallet(
            connection,
            owner,
            balance
        );
        return await walletRepository.findWalletById(
            connection,
            walletId
        );
    } finally {
        connection.release();
    }
};

/**
 * Get Wallet
 */
const getWallet = async (walletId) => {
    const connection = await pool.getConnection();

    try {
        const wallet = await walletRepository.findWalletById(
            connection,
            walletId
        );
        if (!wallet) {
            throw new Error("Wallet not found");
        }
        return wallet;
    } finally {
        connection.release();
    }
};

const applyDelta = async (walletId, delta) => {
    const connection = await pool.getConnection();

    try {
        // Begin Transaction
        await connection.beginTransaction();
        // Lock Wallet Row
        const wallet = await walletRepository.lockWalletById(
            connection,
            walletId
        );
        if (!wallet) {
            throw new Error("Wallet not found");
        }

        /**
         * Business Rule
         *
         * Wallet balance cannot become negative.
         */
        const newBalance = wallet.balance + delta;
        if (newBalance < 0) {
            throw new Error("Insufficient wallet balance");
        }
        // Atomic Update
        await walletRepository.updateWalletBalance(
            connection,
            walletId,
            delta
        );
        // Fetch Updated Wallet
        const updatedWallet =
            await walletRepository.findWalletById(
                connection,
                walletId
            );
        // Commit
        await connection.commit();
        return updatedWallet;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    createWallet,
    getWallet,
    applyDelta,
};