require("dotenv").config();

const express = require("express");
const morgan = require("morgan");

const pool = require("./config/db");

const walletRoutes = require("./routes/wallet.routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "CloudWayZ Wallet API Running"
    });
});

app.get("/health", async (req, res) => {
    try {
        const connection = await pool.getConnection();
        await connection.query("SELECT 1");
        connection.release();

        return res.status(200).json({
            success: true,
            status: "UP",
            database: "CONNECTED",
            timestamp: new Date().toISOString(),
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            status: "DOWN",
            database: "DISCONNECTED",
            timestamp: new Date().toISOString(),
        });

    }
});

app.use("/api/wallets", walletRoutes);

app.use(errorHandler);

module.exports = app;