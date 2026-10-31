import type { PayloadRequest } from "payload";
import type { Commitment, SolanaToken } from "solana-payments";

export type SolanaCheckoutDetails = {
  amount: string;
  metadata?: Record<string, unknown>;
};

export type SolanaPluginOptions = {
  rpcUrl?: string;
  recipient: string;
  token: SolanaToken;
  commitment?: Commitment;
  label?: string;
  message?: string;
  referencePrefix?: string;
  resolveCheckout?: (args: {
    req: PayloadRequest;
    orderId: string;
  }) => Promise<SolanaCheckoutDetails | null>;
  collectionSlug?: string;
  admin?: boolean;
};

export type SolanaCheckoutRequest = {
  reference: string;
  amount: string;
  mint: string;
  decimals: number;
  recipient: string;
  paymentUrl: string;
  createdAt: string;
};

export type SolanaPaymentStatus = {
  reference: string;
  status: "pending" | "confirmed";
  signature?: string;
  confirmationStatus?: string;
};
