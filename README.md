# Monero Testnet Faucet

A simple web application with a backend for a Monero testnet faucet. It provides a web UI and an API endpoint to request testnet XMR.

## Requirements

- Node.js
- A running `monero-wallet-rpc` instance with a funded testnet wallet.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd monero-faucet-backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Configuration

### 1. Run `monero-wallet-rpc`

You need a testnet wallet with some funds. First, create a directory for your wallets (e.g., `/home/user/monero-wallets`). Then, start the RPC server, pointing it to that directory:
```bash
monero-wallet-rpc \
  --rpc-bind-port 28088 \
  --wallet-dir /home/user/monero-wallets \
  --password your-wallet-password \
  --rpc-login monero:rpcPassword \
  --testnet \
  --log-file logs/monero-wallet-rpc.log \
  --non-interactive
```
**Note:** Your faucet wallet file (e.g., `faucet-wallet`) must be located inside the directory specified by `--wallet-dir`. You may need to create this wallet first using `monero-wallet-cli` and move it there.

### 2. Set Environment Variables

The backend server is configured using environment variables. Before running the server, you must set the following variables.
```bash
export RPC_USER="monero"
export RPC_PASSWORD="rpcPassword"
# This must be the FILENAME of the wallet inside the wallet-dir
export WALLET_FILE="faucet-wallet"
export WALLET_PASSWORD="your-wallet-password"

# Optional, defaults are shown:
# export RPC_HOST="127.0.0.1"
# export RPC_PORT="28088"
```

## Usage

1.  **Start the server:**
    ```bash
    npm start
    ```
    The server will start and be accessible at `http://<your-server-ip>:3000`.

2.  **Use the Web Interface:**
    Open your web browser and navigate to `http://localhost:3000` (or your server's IP address if running remotely). The current faucet balance is displayed at the top. Enter your testnet wallet address and click the "Request 1 XMR" button to receive funds.

### API Usage (Optional)

The API provides two endpoints:

-   `GET /faucet/balance`: Fetches the current balance of the faucet wallet.
-   `POST /faucet/send`: Sends funds to a specified address.

**Example using `curl` to send funds:**
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"address": "YOUR_TESTNET_WALLET_ADDRESS", "amount": "1"}' \
  http://localhost:3000/faucet/send
```

A successful request will return a JSON response like this:
```json
{
  "success": true,
  "message": "Sent 1 XMR to YOUR_TESTNET_WALLET_ADDRESS",
  "txHash": "a_transaction_hash"
}
```

## Disclaimer

This is a proof-of-concept and should be used for testing purposes only. Ensure your `monero-wallet-rpc` is not exposed to the public internet without proper security measures.