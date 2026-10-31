import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { solanaPaymentsPlugin } from "payload-solana";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildConfig, type CollectionConfig } from "payload";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  fields: [{ name: "name", type: "text", required: true }],
};

const Orders: CollectionConfig = {
  slug: "orders",
  fields: [
    { name: "email", type: "email", required: true },
    { name: "amountToken", type: "text", required: true, defaultValue: "1.00" },
    { name: "status", type: "select", options: ["pending", "paid", "cancelled"], defaultValue: "pending" },
  ],
};

export default buildConfig({
  admin: {
    user: "users",
    importMap: { baseDir: dirname, autoGenerate: false },
  },
  collections: [Users, Orders],
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL },
  }),
  editor: lexicalEditor(),
  plugins: [
    solanaPaymentsPlugin({
      rpcUrl: process.env.SOLANA_RPC_URL,
      recipient: process.env.SOLANA_PAYMENT_RECIPIENT ?? "ReplaceWithWalletAddress",
      token: {
        mint: process.env.SOLANA_TOKEN_MINT ?? "ReplaceWithDevnetMintAddress",
        decimals: Number(process.env.SOLANA_TOKEN_DECIMALS ?? "6"),
        program: process.env.SOLANA_TOKEN_PROGRAM === "token-2022" ? "token-2022" : "token",
        symbol: process.env.SOLANA_TOKEN_SYMBOL ?? "TEST",
      },
      commitment: "confirmed",
      label: "Payload Solana Demo",
      resolveCheckout: async ({ req, orderId }) => {
        try {
          const order = await req.payload.findByID({
            collection: "orders",
            id: orderId,
            overrideAccess: true,
          });
          if (order.status !== "pending") return null;
          return {
            amount: order.amountToken,
            metadata: { orderId: String(order.id) },
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  secret: process.env.PAYLOAD_SECRET ?? "local-demo-secret-change-me",
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
});
