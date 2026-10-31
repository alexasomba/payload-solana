# Installation

Install @alexasomba/payload-solana in a Payload CMS 3 application and register solanaPaymentsPlugin in the plugins array.

```ts
import { solanaPaymentsPlugin } from "@alexasomba/payload-solana";

export default buildConfig({
  plugins: [
    solanaPaymentsPlugin({
      rpcUrl: process.env.SOLANA_RPC_URL,
      recipient: process.env.SOLANA_PAYMENT_RECIPIENT!,
      token: {
        mint: process.env.SOLANA_TOKEN_MINT!,
        decimals: Number(process.env.SOLANA_TOKEN_DECIMALS),
        program: "token",
      },
      commitment: "confirmed",
      resolveCheckout: async ({ req, orderId }) => {
        const order = await req.payload.findByID({
          collection: "orders",
          id: orderId,
          overrideAccess: true,
        });
        if (order.status !== "pending") return null;
        return { amount: order.amountToken };
      },
    }),
  ],
});
```

Render a QR and wallet deep link from a client component:

```tsx
import { SolanaCheckout } from "@alexasomba/payload-solana/react";

<SolanaCheckout orderId={order.id} />
```

Provide a recipient address, an RPC URL, and an SPL token configuration with mint and decimals. Configure resolveCheckout so the server loads a payable order and returns its amount as a decimal string. The checkout component accepts an orderId only; the browser cannot choose a price, mint, or recipient.

The plugin adds a protected Solana payments collection, checkout and status endpoints, and an admin payments view. It uses read-only RPC calls and never loads a merchant signing key.

The demo targets Devnet. Production apps should configure an RPC provider intended for payment verification and select the correct mint for their cluster.
