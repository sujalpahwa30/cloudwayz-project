const { z } = require("zod");

exports.createWalletSchema = z.object({
    owner: z.string().min(1).max(100),
    balance: z.number().int()
});

exports.updateWalletSchema = z.object({
    delta: z.number().int()
});