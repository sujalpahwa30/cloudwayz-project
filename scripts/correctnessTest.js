require("dotenv").config();

const axios = require("axios");
const minimist = require("minimist");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000/api";

const args = minimist(process.argv.slice(2));

const workers = Number(args.workers || 100);
const initialBalance = Number(args.balance || 1000);
const seed = Number(args.seed || 42);

let walletId = args.walletId;

/**
 * Deterministic pseudo-random generator
 */
function createRandom(seed) {
    let value = seed;

    return () => {
        value = (value * 9301 + 49297) % 233280;
        return value / 233280;
    };
}

const random = createRandom(seed);

function randomDelta() {
    const sign = random() > 0.5 ? 1 : -1;
    const magnitude = Math.floor(random() * 20) + 1;
    return sign * magnitude;
}

async function createWallet() {

    const response = await axios.post(`${BASE_URL}/wallets`, {
        owner: "Correctness Wallet",
        balance: initialBalance,

    });

    return response.data.data.id;
}

async function updateWallet(id, delta) {

    return axios.patch(`${BASE_URL}/wallets/${id}`, {
        delta,

    });
}

async function getWallet(id) {

    const response = await axios.get(`${BASE_URL}/wallets/${id}`);
    return response.data.data;
}

(async () => {

    try {
        if (!walletId) {
            walletId = await createWallet();
        }

        const operations = [];
        let expected = initialBalance;
        for (let i = 0; i < workers; i++) {
            const delta = randomDelta();
            operations.push(delta);
            expected += delta;
        }

        console.log("\n====================================");

        console.log("Wallet Correctness Test");

        console.log("====================================");

        console.log(`Wallet ID : ${walletId}`);

        console.log(`Workers   : ${workers}`);

        console.log(`Seed      : ${seed}`);

        console.log("------------------------------------");

        const start = Date.now();

        await Promise.all(

            operations.map(delta => updateWallet(walletId, delta))

        );

        const duration = Date.now() - start;

        const wallet = await getWallet(walletId);

        console.log(`Expected Balance : ${expected}`);

        console.log(`Actual Balance   : ${wallet.balance}`);

        console.log(`Execution Time   : ${duration} ms`);

        console.log("------------------------------------");

        if (wallet.balance === expected) {

            console.log("✅ CORRECTNESS TEST PASSED");

            process.exit(0);

        }

        console.log("❌ CORRECTNESS TEST FAILED");

        process.exit(1);
    } catch (err) {
        console.error(err.response?.data || err.message);
        process.exit(1);
    }
})();