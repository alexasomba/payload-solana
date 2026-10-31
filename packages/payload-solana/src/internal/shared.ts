import type { CollectionSlug, Config, PayloadRequest } from "payload";
import { createReference, formatTokenAmount, parseTokenAmount, type SolanaToken } from "solana-payments";
import type { SolanaPluginOptions } from "../types.js";

export const defaultCollectionSlug = "solana-payments";

export function resolveRpcUrl(options: SolanaPluginOptions): string {
  const rpcUrl = options.rpcUrl ?? process.env.SOLANA_RPC_URL;
  if (!rpcUrl) throw new Error("SOLANA_RPC_URL is required on the server.");
  return rpcUrl;
}

export function resolveRecipient(options: SolanaPluginOptions): string {
  const recipient = options.recipient || process.env.SOLANA_PAYMENT_RECIPIENT;
  if (!recipient) throw new Error("A Solana payment recipient address is required.");
  return recipient;
}

export function resolveToken(options: SolanaPluginOptions): SolanaToken {
  const { mint, decimals } = options.token;
  if (!mint || !Number.isInteger(decimals) || decimals < 0 || decimals > 18) {
    throw new Error("Configure an SPL token mint and decimal count between 0 and 18.");
  }
  return options.token;
}

export function validateTokenAmount(amount: string, decimals: number): string {
  const parsed = parseTokenAmount(amount, decimals);
  if (parsed <= 0n) throw new Error("Payment amount must be greater than zero.");
  return formatTokenAmount(parsed, decimals);
}

export function newPaymentReference(prefix?: string): string {
  return createReference(prefix ?? "payload-solana");
}

export function adminCollection(config: Config): string | undefined {
  const user = config.admin?.user;
  return typeof user === "string" ? user : undefined;
}

export function isAdminRequest(req: PayloadRequest, collection: string | undefined): boolean {
  return Boolean(req.user && collection && req.user.collection === collection);
}

export function collectionAccess(collection: string | undefined) {
  return {
    read: ({ req }: { req: PayloadRequest }) => isAdminRequest(req, collection),
    create: () => false,
    update: () => false,
    delete: () => false,
  };
}

export function requireAdmin(req: PayloadRequest, collection: string | undefined): Response | null {
  return isAdminRequest(req, collection)
    ? null
    : Response.json({ error: "Administrator access is required." }, { status: 403 });
}

export function asCollectionSlug(value: string): CollectionSlug {
  return value as CollectionSlug;
}

export function safeJson(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function fieldValue(value: unknown): string | undefined {
  return typeof value === "string" || typeof value === "number" ? String(value) : undefined;
}
