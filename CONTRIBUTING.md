# Contributing

Use Node.js 22 or newer and pnpm 12.16.1. Install dependencies with pnpm install, then run pnpm check before submitting changes. Add focused Vitest coverage for amount precision, request construction, and transaction verification.

The Payload demo uses a local PostgreSQL database and a Devnet SPL mint. Copy demo/.env.example to demo/.env.local. Never put a merchant keypair in the demo configuration or test fixtures.
