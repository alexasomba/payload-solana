# Payment verification

Each request stores a unique business reference, recipient, mint, amount, decimals, memo, and Solana Pay URL. The checkout component renders a QR code and wallet deep link, then polls the status endpoint.

Verification uses the configured read-only client and checks the requested reference, recipient, configured mint, and exact token amount. A payment is marked confirmed only after the SDK reports a successful confirmed transaction. A supplied signature is an additional lookup hint and is checked against the same expected payment fields.

The package accepts SPL tokens configured by mint and decimals. Token-2022 mints can specify their token program. Token-specific transfer extensions are not assumed to be compatible.
