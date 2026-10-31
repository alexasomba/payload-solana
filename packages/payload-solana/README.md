# payload-solana

Non-custodial SPL-token checkout for Payload CMS 3.

## Install

pnpm add payload-solana

## Configure

Register solanaPaymentsPlugin in your Payload config with an RPC URL, recipient wallet, and token mint/decimals. Keep resolveCheckout server-side and return the amount as a decimal string. The browser sends only an order ID.

The plugin creates a Payload payment request, stores its reference and expected token details, and exposes status verification. The React component displays a Solana Pay QR code/deep link and checks for a confirmed matching payment. No merchant signing key is accepted.

## Entry points

- payload-solana — Payload plugin and option types
- payload-solana/server — read-only Solana payment helpers
- payload-solana/react — Solana Pay QR and checkout component
- payload-solana/admin — Payload admin view and navigation link

## Use with an existing order flow

Import the server entry point when your application already owns its ecommerce transactions, order finalization, inventory checks, or recovery policy. It exports read-only request and verification helpers plus the `SOLANA_USDT` preset and error guard. Keep checkout totals and settlement in the application's Payload payment adapter. The standalone plugin collection and routes are optional and should not become a second order ledger.

## Compatibility

Payload 3.79.1 or newer, or Payload 4.0.0-beta.6 or newer; React 19.2.1 or newer; Node.js 22 or newer.

## License

MIT
