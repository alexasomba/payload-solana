# @alexasomba/payload-solana

Non-custodial SPL-token checkout for Payload CMS 3.

## Install

pnpm add @alexasomba/payload-solana

## Configure

Register solanaPaymentsPlugin in your Payload config with an RPC URL, recipient wallet, and token mint/decimals. Keep resolveCheckout server-side and return the amount as a decimal string. The browser sends only an order ID.

The plugin creates a Payload payment request, stores its reference and expected token details, and exposes status verification. The React component displays a Solana Pay QR code/deep link and checks for a confirmed matching payment. No merchant signing key is accepted.

## Entry points

- @alexasomba/payload-solana — Payload plugin and option types
- @alexasomba/payload-solana/server — read-only Solana payment helpers
- @alexasomba/payload-solana/react — Solana Pay QR and checkout component
- @alexasomba/payload-solana/admin — Payload admin view and navigation link

## Compatibility

Payload 3.79.1 or newer, React 19.2.1 or newer, Node.js 22 or newer.

## License

MIT
