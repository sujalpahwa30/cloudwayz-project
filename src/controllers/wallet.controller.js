const walletService = require("../services/wallet.service");

const { createWalletSchema, updateWalletSchema } = require("../validators/wallet.validator");

/**
 * POST /api/wallets
 */
const createWallet = async (req, res, next) => {
    try {

        const data = createWalletSchema.parse(req.body);

        const wallet = await walletService.createWallet(
            data.owner,
            data.balance
        );

        return res.status(201).json({
            success: true,
            message: "Wallet created successfully",
            data: wallet,
        });

    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/wallets/:id
 */
const getWallet = async (req, res, next) => {
    try {

        const wallet = await walletService.getWallet(
            Number(req.params.id)
        );

        return res.status(200).json({
            success: true,
            data: wallet,
        });

    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/wallets/:id
 */
const updateBalance = async (req, res, next) => {
    try {

        const data = updateWalletSchema.parse(req.body);

        const wallet = await walletService.applyDelta(
            Number(req.params.id),
            data.delta
        );

        return res.status(200).json({
            success: true,
            message: "Wallet updated successfully",
            data: wallet,
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createWallet,
    getWallet,
    updateBalance,
};