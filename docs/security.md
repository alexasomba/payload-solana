# Security notes

- No wallet secret key is accepted or stored. The package creates only read-only payment requests and verifies ledger data.
- Version one accepts incoming SPL-token payments only. It has no recurring charges, refunds, transfers, or payouts.
- Resolve order amount server-side and never accept a browser-provided amount, mint, or recipient.
- The payment collection is readable only to the configured Payload admin user collection and rejects direct writes.
- Use a reliable RPC provider in production. Public RPC services are rate-limited and do not provide a payment-processing SLA.
- Treat a transaction as paid only after confirmed/finalized verification and exact reference, recipient, mint, and amount matching.
