import type { CollectionConfig, Config, Endpoint, Field, PayloadRequest } from "payload";
import {
  createPayloadSolanaPayments,
  createSolanaPaymentRequest,
  verifySolanaPayment,
} from "./server.js";
import type { SolanaPluginOptions } from "./types.js";
import {
  adminCollection,
  asCollectionSlug,
  collectionAccess,
  defaultCollectionSlug,
  fieldValue,
  newPaymentReference,
  resolveRecipient,
  resolveToken,
  safeJson,
  validateTokenAmount,
} from "./internal/shared.js";

const text = (name: string, required = false, extra: { unique?: boolean; index?: boolean } = {}): Field => ({
  name,
  type: "text",
  required,
  ...extra,
});

function buildCollection(slug: string, adminUser: string | undefined): CollectionConfig {
  return {
    slug,
    labels: { singular: "Solana payment", plural: "Solana payments" },
    admin: { useAsTitle: "reference" },
    access: collectionAccess(adminUser),
    fields: [
      text("reference", true, { unique: true, index: true }),
      text("orderId", false, { index: true }),
      text("amount", true),
      { name: "decimals", type: "number", required: true, min: 0, max: 18 },
      text("mint", true),
      text("recipient", true),
      text("paymentUrl", true),
      text("memo", true),
      text("signature", false, { unique: true, index: true }),
      text("confirmationStatus"),
      {
        name: "status",
        type: "select",
        required: true,
        defaultValue: "pending",
        options: ["pending", "confirmed"].map((value) => ({ label: value, value })),
      },
      { name: "metadata", type: "json", admin: { readOnly: true } },
    ],
  };
}

function findOne(req: PayloadRequest, slug: string, reference: string) {
  return req.payload.find({
    collection: asCollectionSlug(slug),
    where: { reference: { equals: reference } },
    limit: 1,
    overrideAccess: true,
  });
}

function endpoint(method: Endpoint["method"], path: string, handler: Endpoint["handler"]): Endpoint {
  return { method, path, handler };
}

function parseBody(req: PayloadRequest): Promise<Record<string, unknown>> {
  if (typeof req.json !== "function") return Promise.reject(new Error("Request body is unavailable."));
  return req.json().then(safeJson);
}

export function solanaPaymentsPlugin(options: SolanaPluginOptions) {
  return (config: Config): Config => {
    const slug = options.collectionSlug ?? defaultCollectionSlug;
    const existing = (config.collections ?? []).some((item) => item.slug === slug);
    if (existing) throw new Error("Payload Solana collection slug already exists: " + slug);

    const adminUser = adminCollection(config);
    const endpoints: Endpoint[] = [
      endpoint("post", "/solana/checkout", async (req) => {
        if (!options.resolveCheckout) {
          return Response.json({ error: "Configure resolveCheckout to validate orders on the server." }, { status: 503 });
        }
        try {
          const input = await parseBody(req);
          const orderId = fieldValue(input.orderId);
          if (!orderId) return Response.json({ error: "orderId is required." }, { status: 400 });
          const details = await options.resolveCheckout({ req, orderId });
          if (!details) return Response.json({ error: "Order not found or not payable." }, { status: 404 });
          const token = resolveToken(options);
          const amount = validateTokenAmount(details.amount, token.decimals);
          const recipient = resolveRecipient(options);
          const client = createPayloadSolanaPayments(options);
          const reference = newPaymentReference(options.referencePrefix);
          const checkout = createSolanaPaymentRequest(client, {
            amount,
            recipient,
            reference,
            metadata: details.metadata,
            label: options.label,
            message: options.message ?? "Payment for order " + orderId,
          });
          const request = checkout.request;
          await req.payload.create({
            collection: asCollectionSlug(slug),
            data: {
              reference: request.reference,
              orderId,
              amount: request.displayAmount,
              decimals: token.decimals,
              mint: String(token.mint),
              recipient,
              paymentUrl: checkout.paymentUrl,
              memo: request.memo,
              status: "pending",
              metadata: details.metadata,
            },
            overrideAccess: true,
          });
          return Response.json({
            reference: request.reference,
            amount: request.displayAmount,
            mint: String(token.mint),
            decimals: token.decimals,
            recipient,
            paymentUrl: checkout.paymentUrl,
            createdAt: request.createdAt,
          });
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : "Unable to create a Solana payment request." },
            { status: 400 },
          );
        }
      }),

      endpoint("get", "/solana/payments/:reference/status", async (req) => {
        const reference = decodeURIComponent(new URL(req.url ?? "/", "http://payload.local").pathname.split("/").at(-2) ?? "");
        if (!reference) return Response.json({ error: "reference is required." }, { status: 400 });
        try {
          const result = await findOne(req, slug, reference);
          const payment = result.docs[0];
          if (!payment) return Response.json({ error: "Payment request not found." }, { status: 404 });
          if (payment.status === "confirmed") {
            return Response.json({
              reference,
              status: "confirmed",
              signature: payment.signature,
              confirmationStatus: payment.confirmationStatus,
            });
          }

          const token = resolveToken(options);
          const verification = await verifySolanaPayment(createPayloadSolanaPayments(options), {
            reference,
            recipient: resolveRecipient(options),
            amount: String(payment.amount),
            decimals: token.decimals,
          });
          if (!verification.found) return Response.json({ reference, status: "pending" });
          const updated = await req.payload.update({
            collection: asCollectionSlug(slug),
            id: payment.id,
            data: {
              status: "confirmed",
              signature: verification.signature,
              confirmationStatus: verification.confirmationStatus ?? "confirmed",
            },
            overrideAccess: true,
          });
          return Response.json({
            reference,
            status: "confirmed",
            signature: updated.signature,
            confirmationStatus: updated.confirmationStatus,
          });
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : "Unable to check Solana payment status." },
            { status: 502 },
          );
        }
      }),

      endpoint("post", "/solana/payments/:reference/verify", async (req) => {
        const reference = decodeURIComponent(new URL(req.url ?? "/", "http://payload.local").pathname.split("/").at(-2) ?? "");
        try {
          const result = await findOne(req, slug, reference);
          const payment = result.docs[0];
          if (!payment) return Response.json({ error: "Payment request not found." }, { status: 404 });
          const input = await parseBody(req);
          const signature = fieldValue(input.signature);
          if (!signature) return Response.json({ error: "signature is required." }, { status: 400 });
          const token = resolveToken(options);
          const verification = await verifySolanaPayment(createPayloadSolanaPayments(options), {
            reference,
            signature,
            recipient: resolveRecipient(options),
            amount: String(payment.amount),
            decimals: token.decimals,
          });
          if (!verification.found) {
            return Response.json({ reference, status: "pending", found: false }, { status: 202 });
          }
          const updated = await req.payload.update({
            collection: asCollectionSlug(slug),
            id: payment.id,
            data: {
              status: "confirmed",
              signature: verification.signature,
              confirmationStatus: verification.confirmationStatus ?? "confirmed",
            },
            overrideAccess: true,
          });
          return Response.json({
            reference,
            status: "confirmed",
            signature: updated.signature,
            confirmationStatus: updated.confirmationStatus,
          });
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : "Unable to verify Solana payment." },
            { status: 502 },
          );
        }
      }),
    ];

    config.collections = [...(config.collections ?? []), buildCollection(slug, adminUser)];
    config.endpoints = [...(config.endpoints ?? []), ...endpoints];
    if (options.admin !== false) {
      config.admin = {
        ...config.admin,
        components: {
          ...config.admin?.components,
          beforeNavLinks: [
            ...(config.admin?.components?.beforeNavLinks ?? []),
            { path: "payload-solana/admin#SolanaAdminNav" },
          ],
          views: {
            ...config.admin?.components?.views,
            solanaPayments: {
              path: "/solana-payments",
              Component: {
                path: "payload-solana/admin#SolanaAdmin",
                serverProps: { collectionSlug: slug },
              },
            },
          },
        },
      };
    }
    return config;
  };
}
