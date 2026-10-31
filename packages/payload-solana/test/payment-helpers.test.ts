import { SOLANA_USDT, createReadOnlySolanaPayments } from "solana-payments";
import { describe, expect, it, vi } from "vitest";
import { solanaPaymentsPlugin } from "../src/plugin.js";
import {
  createSolanaPaymentRequest,
  verifySolanaPayment,
} from "../src/server.js";
import { newPaymentReference, validateTokenAmount } from "../src/internal/shared.js";

describe("Solana payment helpers", () => {
  it("keeps configured token precision and rejects invalid amounts", () => {
    expect(validateTokenAmount("1.25", 6)).toBe("1.25");
    expect(() => validateTokenAmount("1.0000001", 6)).toThrow();
    expect(() => validateTokenAmount("0", 6)).toThrow();
    expect(() => validateTokenAmount("-1", 6)).toThrow();
  });

  it("generates distinct references", () => {
    expect(newPaymentReference()).not.toBe(newPaymentReference());
  });

  it("builds a Solana Pay URL for the configured SPL token", () => {
    const client = createReadOnlySolanaPayments({
      rpcUrl: "https://api.devnet.solana.com",
      token: SOLANA_USDT,
    });
    const checkout = createSolanaPaymentRequest(client, {
      amount: "3.5",
      recipient: "11111111111111111111111111111111",
      reference: "order-17",
      label: "Test store",
    });

    const url = new URL(checkout.paymentUrl);
    expect(url.protocol).toBe("solana:");
    expect(url.searchParams.get("amount")).toBe("3.5");
    expect(url.searchParams.get("spl-token")).toBe(SOLANA_USDT.mint);
    expect(url.searchParams.get("memo")).toContain("order-17");
  });

  it("verifies signature, amount, reference, and recipient as one expected payment", async () => {
    const verify = vi.fn().mockResolvedValue({
      found: true,
      reference: "order-17",
      signature: "fixture-signature",
      confirmationStatus: "confirmed",
      displayAmount: "3.5",
    });
    const client = {
      payments: { verify },
      balances: {},
      transactions: {},
    } as never;

    const result = await verifySolanaPayment(client, {
      reference: "order-17",
      signature: "fixture-signature",
      recipient: "11111111111111111111111111111111",
      amount: "3.5",
      decimals: 6,
    });

    expect(result.found).toBe(true);
    expect(result.confirmationStatus).toBe("confirmed");
    expect(verify).toHaveBeenCalledWith({
      reference: "order-17",
      signature: "fixture-signature",
      recipient: "11111111111111111111111111111111",
      amount: "3.5",
      maxPages: 3,
      limit: 20,
    });
  });

  it("supports a signed-transaction recovery hint without dropping recipient and amount checks", async () => {
    const verify = vi.fn().mockResolvedValue({
      found: true,
      signature: "fixture-signature",
      confirmationStatus: "finalized",
    });
    const client = {
      payments: { verify },
      balances: {},
      transactions: {},
    } as never;

    const result = await verifySolanaPayment(client, {
      signature: "fixture-signature",
      allowMissingReference: true,
      recipient: "11111111111111111111111111111111",
      amount: "3.5",
      decimals: 6,
    });

    expect(result.found).toBe(true);
    expect(verify).toHaveBeenCalledWith({
      reference: undefined,
      signature: "fixture-signature",
      recipient: "11111111111111111111111111111111",
      amount: "3.5",
      maxPages: 3,
      limit: 20,
    });
  });

  it("requires a reference or a bounded signature recovery hint", async () => {
    const verify = vi.fn();
    const client = {
      payments: { verify },
      balances: {},
      transactions: {},
    } as never;

    await expect(verifySolanaPayment(client, {
      recipient: "11111111111111111111111111111111",
      amount: "3.5",
      decimals: 6,
    })).rejects.toThrow("reference is required unless signature recovery is enabled");
    expect(verify).not.toHaveBeenCalled();
  });

  it("does not perform signature-only recovery unless explicitly enabled", async () => {
    const verify = vi.fn();
    const client = {
      payments: { verify },
      balances: {},
      transactions: {},
    } as never;

    await expect(verifySolanaPayment(client, {
      signature: "fixture-signature",
      recipient: "11111111111111111111111111111111",
      amount: "3.5",
      decimals: 6,
    })).rejects.toThrow("signature recovery is enabled");
    expect(verify).not.toHaveBeenCalled();
  });

  it("keeps missing, failed, or mismatched transfers pending", async () => {
    const verify = vi.fn().mockResolvedValue({
      found: false,
      reference: "order-17",
      signature: "failed-or-mismatched-signature",
    });
    const client = {
      payments: { verify },
      balances: {},
      transactions: {},
    } as never;

    const result = await verifySolanaPayment(client, {
      reference: "order-17",
      signature: "failed-or-mismatched-signature",
      recipient: "11111111111111111111111111111111",
      amount: "3.5",
      decimals: 6,
    });

    expect(result.found).toBe(false);
    expect(result.confirmationStatus).toBeUndefined();
  });

  it("propagates provider mismatch failures instead of treating them as paid", async () => {
    const verify = vi.fn().mockRejectedValue(new Error("Payment amount does not match."));
    const client = {
      payments: { verify },
      balances: {},
      transactions: {},
    } as never;

    await expect(verifySolanaPayment(client, {
      reference: "order-17",
      signature: "fixture-signature",
      recipient: "11111111111111111111111111111111",
      amount: "3.5",
      decimals: 6,
    })).rejects.toThrow("Payment amount does not match.");
  });

  it("registers a protected payment collection and checkout/status routes", () => {
    const config = solanaPaymentsPlugin({
      rpcUrl: "https://api.devnet.solana.com",
      recipient: "11111111111111111111111111111111",
      token: SOLANA_USDT,
    })({
      admin: { user: "users" },
      collections: [],
      endpoints: [],
    } as never);

    expect(config.collections?.map((item) => item.slug)).toContain("solana-payments");
    expect(config.endpoints?.map((item) => item.path)).toContain("/solana/checkout");
    expect(config.endpoints?.map((item) => item.path)).toContain("/solana/payments/:reference/status");
  });
});
