# Payload Solana demo app

Create a PostgreSQL database and copy .env.example to .env.local. Set SOLANA_RPC_URL to a Devnet RPC endpoint, configure a funded recipient address and an SPL mint on that same cluster, and set the token decimals. Create a pending order in the Payload admin with amountToken in the configured token units.

The demo renders the request QR/deep link and polls for a confirmed transaction. No wallet key is entered into Payload or stored by the plugin.
