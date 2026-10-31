"use client";

import { SolanaCheckout } from "payload-solana/react";
import { useState } from "react";

export default function Home() {
  const [orderId, setOrderId] = useState(process.env.NEXT_PUBLIC_DEMO_ORDER_ID ?? "");
  const [message, setMessage] = useState("");
  return (
    <main className="checkout">
      <h1>Payload Solana demo</h1>
      <p>Enter an order ID created in the Payload admin to create a non-custodial SPL payment request.</p>
      <label htmlFor="order-id">Order ID</label>
      <input id="order-id" value={orderId} onChange={(event) => setOrderId(event.currentTarget.value)} />
      {orderId ? (
        <SolanaCheckout
          key={orderId}
          orderId={orderId}
          onConfirmed={() => setMessage("Your payment has been confirmed.")}
          onError={(error) => setMessage(error.message)}
        />
      ) : null}
      {message ? <p role="status">{message}</p> : null}
      <p>Visit /admin to create a pending order and review payment records.</p>
    </main>
  );
}
