# Payload Solana

Non-custodial SPL-token checkout for Payload CMS 3.

The repository contains the publishable package, a Payload demo application, and implementation documentation. It uses solana-payments for read-only request creation and payment verification.

## Install

pnpm add payload-solana

## Package entry points

- The package root exports the Payload plugin and options.
- The server entry point exports read-only Solana payment helpers.
- The React entry point exports Solana Pay checkout UI.
- The admin entry point exports the payment management view.

## Development

Run pnpm install, then pnpm check. Run the demo with pnpm --filter payload-solana-demo dev after configuring a Payload database and SOLANA_RPC_URL.

## Security

The package never needs merchant private keys. Configure a recipient address, RPC endpoint, and token mint with its decimal count. Checkout amounts are resolved on the server from an order identifier. Production deployments should use a reliable private RPC provider; the demo is configured for Devnet.

## License

MIT
