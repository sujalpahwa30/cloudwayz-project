require("dotenv").config();

const express = require("express");
const morgan = require("morgan");

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

app.use("/api/wallets", walletRoutes);

app.use(errorHandler);

module.exports = app;