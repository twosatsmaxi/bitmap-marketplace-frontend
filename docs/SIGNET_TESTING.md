# Regtest Testing Guide — Listing + Buy Flow

Regtest is fully local — no sync, no faucets, instant blocks. You mine your own coins. This is the fastest way to test the trading flow end-to-end.

> Wallet extensions (Xverse/UniSat) don't connect to regtest. Use `curl` to test the backend API directly. Move to signet later for wallet UX testing.

## Prerequisites

- Bitcoin Core (at `~/codebase/bitcoin/src/bitcoind`)
- ord binary (at `~/codebase/ord-official/ord`)
- PostgreSQL running

---

## 1. Start Bitcoin Core (regtest)

```bash
~/codebase/bitcoin/src/bitcoind -regtest -txindex -daemon

# Verify
bitcoin-cli -regtest getblockchaininfo
# "chain": "regtest"
```

No sync needed — starts instantly.

## 2. Start ord server (regtest)

```bash
cd ~/codebase/ord-official/ord
cargo build --release

# Start ord (keep this terminal open)
./target/release/ord --regtest server --http-port 8080
```

Indexing is instant on regtest.

## 3. Create wallet + mine coins

```bash
cd ~/codebase/ord-official/ord

# Create ord wallet
./target/release/ord --regtest wallet create

# Get a receive address
./target/release/ord --regtest wallet receive
# → bcrt1q...

# Mine 101 blocks to that address (coins mature after 100 confirmations)
bitcoin-cli -regtest generatetoaddress 101 <address_from_above>

# Verify you have funds
./target/release/ord --regtest wallet outputs
```

## 4. Inscribe a test bitmap

```bash
echo "0.bitmap" > /tmp/test-bitmap.txt

./target/release/ord --regtest wallet inscribe --fee-rate 1 --file /tmp/test-bitmap.txt
```

Output:
```json
{
  "commit": "<commit_txid>",
  "inscriptions": [{ "id": "<INSCRIPTION_ID>" }],
  "reveal": "<reveal_txid>"
}
```

Mine a block to confirm it:
```bash
bitcoin-cli -regtest generatetoaddress 1 <your_address>
```

Verify:
```bash
./target/release/ord --regtest wallet inscriptions
curl http://localhost:8080/inscription/<INSCRIPTION_ID> | jq .
# Should show satpoint, address, value
```

## 5. Start the Rust backend

```bash
cd ~/codebase/bitmap-marketplace

cat > .env.regtest << 'ENVEOF'
BITCOIN_NETWORK=regtest
ALLOWED_ADDRESS_NETWORK=regtest
BITCOIN_RPC_URL=http://127.0.0.1:18443
BITCOIN_RPC_USER=__cookie__
BITCOIN_RPC_PASS=__cookie__
ORD_URL=http://127.0.0.1:8080
DATABASE_URL=postgres://localhost/bitmap_marketplace_regtest
MARKETPLACE_SECRET_KEY=0000000000000000000000000000000000000000000000000000000000000001
JWT_SECRET=0000000000000000000000000000000000000000000000000000000000000002
FRONTEND_URL=http://localhost:3000
MARKETPLACE_FEE_ADDRESS=
MARKETPLACE_FEE_BPS=0
ENVEOF

# Create DB
createdb bitmap_marketplace_regtest
cd ~/codebase/bitmap-marketplace && sqlx database setup

# Run
env $(cat .env.regtest | xargs) cargo run
```

Note: regtest RPC port is **18443** (not 38332 like signet).
For cookie auth, check `~/.bitcoin/regtest/.cookie`.

## 6. Start the frontend

```bash
cd ~/codebase/bitmap-marketplace-frontend

cat > .env.local << 'ENVEOF'
NEXT_PUBLIC_BITCOIN_NETWORK=regtest
NEXT_PUBLIC_MARKETPLACE_API_BASE=http://localhost:8080
BITMAP_INDEX_API_BASE=http://localhost:8080
ENVEOF

npm run dev
```

## 7. Test listing flow (via curl)

Since wallet extensions don't support regtest, test the API directly:

```bash
# Step 1: Verify the prepare endpoint resolves your inscription
curl "http://localhost:8080/api/listings/prepare?inscription_id=<INSCRIPTION_ID>" | jq .
# Returns: txid, vout, value_sats, script_pubkey_hex, owner_address

# Step 2: Create a listing (replace values from step 1)
curl -X POST http://localhost:8080/api/listings \
  -H "Content-Type: application/json" \
  -d '{
    "inscription_id": "<INSCRIPTION_ID>",
    "price_sats": 10000,
    "seller_address": "<owner_address from step 1>"
  }' | jq .
# Returns listing with id, status: "active"

# Step 3: Verify listing exists
curl http://localhost:8080/api/listings | jq .
```

For the **protected flow** (with mempool protection), you also need to provide `seller_pubkey` and `inscription_input` — but testing the unprotected flow first confirms the pipeline works.

## 8. Test buy flow (via curl)

```bash
# Get a second address for the buyer
bitcoin-cli -regtest getnewaddress

# Fund it
bitcoin-cli -regtest generatetoaddress 101 <buyer_address>

# Initiate buy
curl -X POST http://localhost:8080/api/orders/buy \
  -H "Content-Type: application/json" \
  -d '{
    "listing_id": "<listing_id from step 2>",
    "buyer_address": "<buyer_address>"
  }' | jq .

# The response includes a PSBT that needs signing
# On regtest without wallet extensions, you can sign with bitcoin-cli:
# bitcoin-cli -regtest walletprocesspsbt "<psbt_hex>"
```

After confirming, mine a block:
```bash
bitcoin-cli -regtest generatetoaddress 1 <any_address>
```

## 9. Frontend UI testing (no wallet signing)

Even without wallet extensions, you can verify the frontend UI:

1. Open http://localhost:3000
2. The network badge shows "Regtest" in the top bar
3. The listing/buy modals render correctly
4. Step progress indicators work
5. Error states display properly

The wallet signing steps will fail (no regtest wallet extension), but everything before and after signing can be verified.

---

## When to move to Signet

Once the regtest API flow works end-to-end, switch to signet for full wallet UX testing:

1. Change env vars: `regtest` → `signet`, port `18443` → `38332`
2. Switch wallet extensions to Signet network
3. Get signet BTC from faucet (https://signet.bc-2.jp/)
4. Test the actual wallet signing popups in the browser

---

## Quick Reference

```bash
# Mine a block (regtest only)
bitcoin-cli -regtest generatetoaddress 1 <address>

# Check inscription UTXO
curl http://localhost:8080/inscription/<ID> | jq '.satpoint, .address, .value'

# List all listings
curl http://localhost:8080/api/listings | jq .

# Prepare listing data
curl "http://localhost:8080/api/listings/prepare?inscription_id=<ID>" | jq .
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `bitcoin-cli -regtest` timeout | Start: `~/codebase/bitcoin/src/bitcoind -regtest -txindex -daemon` |
| ord "failed to connect" | Start ord server, ensure bitcoind is running |
| "UTXO is already spent" | Mine a block, re-check `ord --regtest wallet inscriptions` |
| No funds after mining | Need 101+ blocks for coinbase maturity |
| RPC auth failure | Check `~/.bitcoin/regtest/.cookie` |
| Port 18443 refused | That's regtest RPC port (not 8332 mainnet, not 38332 signet) |
