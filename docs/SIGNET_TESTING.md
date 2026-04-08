# Signet Testing Guide — Listing + Buy Flow

## Prerequisites

- Bitcoin Core (built at `~/codebase/bitcoin/src/bitcoind`)
- ord binary (at `~/codebase/ord-official/ord`)
- Xverse or UniSat wallet extension
- PostgreSQL running

`bitcoin-cli` is already aliased to `bitcoin-cli --signet`.

---

## 1. Start Bitcoin Core (signet)

```bash
# Start in background with tx index
~/codebase/bitcoin/src/bitcoind -signet -txindex -daemon

# Verify it's running (wait a few seconds)
bitcoin-cli getblockchaininfo
# Should show "chain": "signet"

# Check sync progress — wait until "verificationprogress" is close to 1.0
bitcoin-cli getblockchaininfo | grep verificationprogress
```

First sync takes ~30 min depending on connection. Subsequent starts are instant.

## 2. Start ord server (signet)

```bash
cd ~/codebase/ord-official/ord

# Build if not already built
cargo build --release

# Start ord server (keep this terminal open)
./target/release/ord --signet server --http-port 8080

# Wait for indexing — first run takes a while
# You'll see log output as it indexes blocks
```

## 3. Create ord wallet + get signet BTC

```bash
cd ~/codebase/ord-official/ord

# Create a wallet (SAVE THE MNEMONIC)
./target/release/ord --signet wallet create

# Get a receive address
./target/release/ord --signet wallet receive
```

Send signet BTC to this address from a faucet:
- https://signet.bc-2.jp/
- https://alt.signetfaucet.com/

Wait for 1 confirmation (~10 min on signet), then verify:

```bash
./target/release/ord --signet wallet outputs
# Should show your UTXO
```

## 4. Inscribe a test bitmap

```bash
echo "0.bitmap" > /tmp/test-bitmap.txt

./target/release/ord --signet wallet inscribe --fee-rate 2 --file /tmp/test-bitmap.txt
```

Output will show:
```
{
  "commit": "<commit_txid>",
  "inscriptions": [
    {
      "id": "<inscription_id>",    <-- SAVE THIS
      ...
    }
  ],
  "reveal": "<reveal_txid>",
  ...
}
```

Wait for confirmation, then verify:
```bash
./target/release/ord --signet wallet inscriptions

# Check the inscription via API
curl http://localhost:8080/inscription/<inscription_id> | jq .
# Should show satpoint, address, value
```

## 5. Start the Rust backend (signet)

```bash
cd ~/codebase/bitmap-marketplace

# Create/update .env with signet config:
cat > .env.signet << 'ENVEOF'
BITCOIN_NETWORK=signet
ALLOWED_ADDRESS_NETWORK=signet
BITCOIN_RPC_URL=http://127.0.0.1:38332
BITCOIN_RPC_USER=__cookie__
BITCOIN_RPC_PASS=__cookie__
ORD_URL=http://127.0.0.1:8080
DATABASE_URL=postgres://localhost/bitmap_marketplace_signet
MARKETPLACE_SECRET_KEY=0000000000000000000000000000000000000000000000000000000000000001
JWT_SECRET=0000000000000000000000000000000000000000000000000000000000000002
FRONTEND_URL=http://localhost:3000
MARKETPLACE_FEE_ADDRESS=
MARKETPLACE_FEE_BPS=0
ENVEOF

# Note: For RPC auth, check ~/.bitcoin/signet/.cookie for the actual cookie
# Or set rpcuser/rpcpassword in bitcoin.conf

# Create the signet DB if needed
createdb bitmap_marketplace_signet
sqlx database setup  # or cargo sqlx migrate run

# Run with signet env
env $(cat .env.signet | xargs) cargo run
```

## 6. Start the frontend (signet)

```bash
cd ~/codebase/bitmap-marketplace-frontend

# Create .env.local for signet
cat > .env.local << 'ENVEOF'
NEXT_PUBLIC_BITCOIN_NETWORK=signet
NEXT_PUBLIC_MARKETPLACE_API_BASE=http://localhost:8080
BITMAP_INDEX_API_BASE=http://localhost:8080
ENVEOF

npm run dev
```

## 7. Switch wallet to Signet

- **Xverse**: Settings > Network > Signet
- **UniSat**: Settings > Network > Signet

## 8. Test the listing flow

1. Open http://localhost:3000
2. You should see "SIGNET" badge (blue) in the top bar instead of "Preview"
3. Connect your wallet
4. Navigate to a bitmap detail page where YOU are the owner
   - Since the bitmap index might not have your test inscription, you may need to go directly to the backend: `curl http://localhost:8080/api/listings/prepare?inscription_id=<your_inscription_id>`
   - This verifies the prepare endpoint works
5. Click **"List for Sale"**
6. Enter a price (e.g., 10000 sats)
7. Wallet will prompt to sign the **locking PSBT** — approve
8. Wallet will prompt to sign the **sale template PSBT** — approve
9. Should see "Listed successfully!"

Verify in the backend:
```bash
curl http://localhost:8080/api/listings | jq .
# Should show your listing with protection_status: "active"
```

## 9. Test the buy flow

To test buying, you need a **second wallet** on signet with BTC:

1. Switch to a different wallet (or different browser profile)
2. Connect that wallet
3. Navigate to the listed bitmap
4. Click **"Buy Now"**
5. Approve the purchase PSBT signature
6. Backend co-signs and broadcasts
7. Check `mempool.space/signet/tx/<txid>` for the transaction

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `bitcoin-cli` timeout | Start bitcoind: `~/codebase/bitcoin/src/bitcoind -signet -txindex -daemon` |
| ord "failed to connect" | Start ord server first, ensure bitcoind is running |
| "UTXO is already spent" | Inscription moved — re-check with `ord --signet wallet inscriptions` |
| Frontend shows mainnet data | Check `.env.local` has `NEXT_PUBLIC_BITCOIN_NETWORK=signet` |
| Wallet shows mainnet addresses | Switch wallet network to Signet in extension settings |
| "No API key configured" | BestInSlot signet API may not need a key, or set `BESTINSLOT_API_KEY` |
| RPC auth failure | Check `~/.bitcoin/signet/.cookie` for cookie auth, or set rpcuser/rpcpassword |

## Quick Verify Checklist

```bash
# Is bitcoind running?
bitcoin-cli getblockchaininfo | grep chain
# "signet"

# Is ord running?
curl -s http://localhost:8080/status | head -5

# Does prepare endpoint work?
curl "http://localhost:8080/api/listings/prepare?inscription_id=YOUR_ID" | jq .

# Are there any listings?
curl http://localhost:8080/api/listings | jq .
```
