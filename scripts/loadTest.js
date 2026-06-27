require("dotenv").config();

const axios = require("axios");
const minimist = require("minimist");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000/api";

const args = minimist(process.argv.slice(2));

const workers = Number(args.workers || 50);
const delta = Number(args.delta || 1);
const initialBalance = Number(args.balance || 1000);

let walletId = args.walletId;

const createWallet = async () => {
    const response = await axios.post(`${BASE_URL}/wallets`, {
        owner: "Load Test Wallet",
        balance: initialBalance,
    });

    return response.data.data.id;
};

const getWallet = async (id) => {
    const response = await axios.get(`${BASE_URL}/wallets/${id}`);
    return response.data.data;
};

const updateWallet = async (id) => {
    return axios.patch(`${BASE_URL}/wallets/${id}`, {
        delta,
    });
};

(async () => {
    try {

        if (!walletId) {
            walletId = await createWallet();
        }

        console.log("\n====================================");
        console.log("CloudWayZ Concurrent Load Test");
        console.log("====================================");

        console.log(`Wallet ID       : ${walletId}`);
        console.log(`Workers         : ${workers}`);
        console.log(`Delta           : ${delta}`);

        const start = Date.now();

        const requests = [];

        for (let i = 0; i < workers; i++) {
            requests.push(updateWallet(walletId));
        }

        await Promise.all(requests);

        const duration = Date.now() - start;
        const wallet = await getWallet(walletId);
        const expected = initialBalance + workers * delta;

        console.log("------------------------------------");

        console.log(`Expected Balance : ${expected}`);
        console.log(`Actual Balance   : ${wallet.balance}`);
        console.log(`Execution Time   : ${duration} ms`);

        console.log("------------------------------------");

        if (wallet.balance === expected) {
            console.log("✅ LOAD TEST PASSED");
            process.exit(0);
        } else {
            console.log("❌ LOAD TEST FAILED");
            process.exit(1);
        }
    } catch (error) {
        console.error(error.response?.data || error.message);
        process.exit(1);
    }
})();