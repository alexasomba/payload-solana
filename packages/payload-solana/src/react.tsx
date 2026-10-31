"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

type CheckoutRequest = {
  reference: string;
  amount: string;
  mint: string;
  decimals: number;
  recipient: string;
  paymentUrl: string;
};

type CheckoutStatus = {
  reference: string;
  status: "pending" | "confirmed";
  signature?: string;
  confirmationStatus?: string;
};

export type SolanaCheckoutProps = {
  orderId: string;
  createEndpoint?: string;
  statusEndpoint?: (reference: string) => string;
  label?: string;
  className?: string;
  onConfirmed?: (status: CheckoutStatus) => void;
  onError?: (error: Error) => void;
  pollIntervalMs?: number;
};

export function SolanaCheckout({
  orderId,
  createEndpoint = "/api/solana/checkout",
  statusEndpoint = (reference) => "/api/solana/payments/" + encodeURIComponent(reference) + "/status",
  label = "Pay with Solana",
  className,
  onConfirmed,
  onError,
  pollIntervalMs = 5000,
}: SolanaCheckoutProps) {
  const [request, setRequest] = useState<CheckoutRequest | null>(null);
  const [status, setStatus] = useState<CheckoutStatus | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void fetch(createEndpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ orderId }),
    })
      .then(async (response) => {
        const body = (await response.json()) as CheckoutRequest & { error?: string };
        if (!response.ok) throw new Error(body.error ?? "Unable to create a Solana payment request.");
        return body;
      })
      .then((body) => {
        if (active) setRequest(body);
      })
      .catch((reason: unknown) => {
        const normalized = reason instanceof Error ? reason : new Error("Solana checkout failed.");
        if (active) setError(normalized.message);
        onError?.(normalized);
      });
    return () => {
      active = false;
    };
  }, [createEndpoint, onError, orderId]);

  useEffect(() => {
    if (!request || status?.status === "confirmed") return;
    let active = true;
    const poll = async () => {
      try {
        const response = await fetch(statusEndpoint(request.reference), { credentials: "same-origin" });
        const body = (await response.json()) as CheckoutStatus & { error?: string };
        if (!response.ok) throw new Error(body.error ?? "Unable to check payment status.");
        if (active) {
          setStatus(body);
          if (body.status === "confirmed") onConfirmed?.(body);
        }
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to check payment status.");
      }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), pollIntervalMs);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [onConfirmed, pollIntervalMs, request, status?.status, statusEndpoint]);

  return (
    <section className={className} aria-live="polite">
      <h2>{label}</h2>
      {error ? <p role="alert">{error}</p> : null}
      {!request && !error ? <p>Preparing your payment request…</p> : null}
      {request ? (
        <>
          <QRCodeSVG value={request.paymentUrl} size={220} title="Solana payment QR code" />
          <p>
            {request.amount} tokens to {request.recipient}
          </p>
          <p>
            <a href={request.paymentUrl}>Open in a Solana wallet</a>
          </p>
          <p role="status">
            {status?.status === "confirmed"
              ? "Payment confirmed"
              : "Waiting for payment confirmation"}
          </p>
          {status?.signature ? <code>{status.signature}</code> : null}
        </>
      ) : null}
    </section>
  );
}
