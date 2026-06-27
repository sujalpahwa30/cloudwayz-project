require("dotenv").config();

const app = require("./src/app");

const PORT = process.env.PORT || 3000;

const pool = require("./src/config/db");

const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

const shutdown = async () => {
    console.log("\nGracefully shutting down...");
    server.close(async () => {
        await pool.end();
        console.log("Database pool closed.");
        process.exit(0);
    });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);