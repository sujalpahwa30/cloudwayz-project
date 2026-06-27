const { z } = require("zod");

const createWalletSchema = z.object({
    owner: z
        .string()
        .trim()
        .min(1, "Owner name is required")
        .max(100),

    balance: z
        .number()
        .int()
        .nonnegative("Initial balance cannot be negative"),
});

const updateWalletSchema = z.object({
    delta: z
        .number()
        .int("Delta must be an integer"),
});

module.exports = {
    createWalletSchema,
    updateWalletSchema,
};