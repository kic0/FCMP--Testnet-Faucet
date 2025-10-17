const express = require('express');
const bodyParser = require('body-parser');
const moneroTs = require('monero-ts');

const app = express();
const port = 3000;
const host = '0.0.0.0';

let walletRpc;

// Serve static files from the 'public' directory
app.use(express.static('public'));
app.use(bodyParser.json());

// Balance endpoint
app.get('/faucet/balance', async (req, res) => {
    if (!walletRpc) {
        return res.status(503).json({ error: 'Wallet is not yet initialized. Please try again in a moment.' });
    }

    try {
        const balance = await walletRpc.getBalance();
        const unlockedBalance = await walletRpc.getUnlockedBalance();

        res.json({
            balance: moneroTs.MoneroUtils.atomicUnitsToXmr(balance),
            unlockedBalance: moneroTs.MoneroUtils.atomicUnitsToXmr(unlockedBalance)
        });

    } catch (error) {
        console.error('Balance check error:', error.message);
        res.status(500).json({ error: 'Failed to get faucet balance. Check server logs for details.' });
    }
});

// Faucet endpoint
app.post('/faucet/send', async (req, res) => {
    if (!walletRpc) {
        return res.status(503).json({ error: 'Wallet is not yet initialized. Please try again in a moment.' });
    }

    const { address, amount } = req.body;
    const sendAmount = amount || '1'; // Default to 1 XMR if not provided

    if (!address) {
        return res.status(400).json({ error: 'Address is required' });
    }

    // Validate the address
    const networkType = moneroTs.MoneroNetworkType.TESTNET;
    if (!moneroTs.MoneroUtils.isValidAddress(address, networkType)) {
        return res.status(400).json({ error: 'Invalid Monero testnet address provided.' });
    }

    try {
        // Check for sufficient unlocked balance before attempting to create a transaction
        const unlockedBalance = await walletRpc.getUnlockedBalance();
        const requestedAmount = moneroTs.MoneroUtils.xmrToAtomicUnits(sendAmount);

        // The getUnlockedBalance() and xmrToAtomicUnits() methods return BigInts
        if (unlockedBalance < requestedAmount) {
            const errorMessage = 'Faucet has insufficient unlocked funds. This can happen if the faucet has recently received funds and is waiting for them to confirm (10 blocks).';
            console.error(errorMessage);
            return res.status(503).json({ error: 'Faucet is waiting for funds to confirm. Please try again in a few minutes.' });
        }

        // Define the transaction and relay it
        const tx = {
            accountIndex: 0, // Send from the first account
            address: address,
            amount: moneroTs.MoneroUtils.xmrToAtomicUnits(sendAmount),
            priority: 3, // Use "Normal" priority to calculate a suitable fee,
            relay: true
        };

        // Create and send the transaction
        let sentTx;
        try {
            sentTx = await walletRpc.createTx(tx);
        } catch (e) {
            console.error('Full error object:', JSON.stringify(e, null, 2)); // Log the full error
            if (e.message && e.message.toLowerCase().includes('double spend')) {
                console.log('Double spend error detected, rescanning spent outputs and retrying...');
                await walletRpc.rescanSpent();
                sentTx = await walletRpc.createTx(tx); // Retry once
            } else {
                throw e; // Re-throw other errors
            }
        }

        console.log(`Sent ${sendAmount} XMR to ${address}. Transaction hash: ${sentTx.getHash()}`);
        res.json({ success: true, message: `Sent ${sendAmount} XMR to ${address}`, txHash: sentTx.getHash() });

    } catch (error) {
        console.error('Faucet error:', error.message);
        // Check for specific error messages to provide better feedback
        if (error.message && error.message.includes('Invalid destination address')) {
            return res.status(400).json({ error: 'Invalid address' });
        }
        res.status(500).json({ error: 'Failed to send funds from faucet. Check server logs for details.' });
    }
});

async function main() {
    // Read configuration from environment variables
    const rpcHost = process.env.RPC_HOST || '127.0.0.1';
    const rpcPort = process.env.RPC_PORT || 28088;
    const rpcUser = process.env.RPC_USER;
    const rpcPassword = process.env.RPC_PASSWORD;
    const walletFile = process.env.WALLET_FILE;
    const walletPassword = process.env.WALLET_PASSWORD;

    if (!rpcUser || !rpcPassword || !walletFile || !walletPassword) {
        console.error('Missing required environment variables. Please set RPC_USER, RPC_PASSWORD, WALLET_FILE, and WALLET_PASSWORD.');
        process.exit(1);
    }

    try {
        // Connect to the wallet RPC
        walletRpc = await moneroTs.connectToWalletRpc({
            uri: `http://${rpcHost}:${rpcPort}`,
            username: rpcUser,
            password: rpcPassword,
            timeoutMs: 60000000,
        });
        await walletRpc.openWallet(walletFile, walletPassword);
        console.log('Wallet opened successfully.');

        const server = app.listen(port, host, () => {
            console.log(`Server listening at http://${host}:${port}`);
        });

        // Graceful shutdown
        const shutdown = async () => {
            console.log('Shutting down server...');
            server.close(() => {
                console.log('Server closed.');
                if (walletRpc) {
                    walletRpc.close(true).then(() => {
                        console.log('Wallet closed.');
                        process.exit(0);
                    });
                } else {
                    process.exit(0);
                }
            });
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

    } catch (error) {
        console.error('Failed to open wallet:', error.message);
        process.exit(1);
    }
}

main();