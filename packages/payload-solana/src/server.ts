import {
  createReadOnlySolanaPayments,
  formatTokenAmount,
  isSolanaPaymentsError,
  parseTokenAmount,
  SOLANA_USDT,
  SolanaPaymentsError,
  type Commitment,
  type SolanaPaymentsReadOnlyClient,
  type SolanaToken,
} from "solana-payments";
import type { SolanaPluginOptions } from "./types.js";
import { resolveRpcUrl, resolveToken, validateTokenAmount } from "./internal/shared.js";

export type { Commitment, SolanaPaymentsReadOnlyClient, SolanaToken };
export {
  createReadOnlySolanaPayments,
  formatTokenAmount,
  isSolanaPaymentsError,
  parseTokenAmount,
  SOLANA_USDT,
  SolanaPaymentsError,
};

export function createPayloadSolanaPayments(options: SolanaPluginOptions): SolanaPaymentsReadOnlyClient {
  return createReadOnlySolanaPayments({
    rpcUrl: resolveRpcUrl(options),
    token: resolveToken(options),
    commitment: options.commitment ?? "confirmed",
    retry: { retries: 2 },
  });
}

export function createSolanaPaymentRequest(
  client: SolanaPaymentsReadOnlyClient,
  input: {
    amount: string;
    recipient: string;
    reference: string;
    metadata?: Record<string, unknown>;
    label?: string;
    message?: string;
  },
) {
  const request = client.payments.createRequest({
    amount: input.amount,
    recipient: input.recipient,
    reference: input.reference,
    metadata: input.metadata,
  });
  return {
    request,
    paymentUrl: client.payments.toSolanaPayUrl(request, {
      label: input.label,
      message: input.message,
    }).toString(),
  };
}

export async function verifySolanaPayment(
  client: SolanaPaymentsReadOnlyClient,
  input: {
    reference?: string;
    signature?: string;
    recipient: string;
    amount: string;
    decimals: number;
    allowMissingReference?: boolean;
  },
) {
  const reference = input.allowMissingReference && input.signature ? undefined : input.reference;
  if (!reference && !(input.allowMissingReference && input.signature)) {
    throw new Error("A Solana payment reference is required unless signature recovery is enabled.");
  }
  return client.payments.verify({
    reference,
    signature: input.signature,
    recipient: input.recipient,
    amount: validateTokenAmount(input.amount, input.decimals),
    maxPages: 3,
    limit: 20,
  });
}
