"use client";

import { useEffect, useState } from "react";

type Props = { collectionSlug?: string };

type Payment = {
  id: string | number;
  reference?: string;
  amount?: string;
  mint?: string;
  status?: string;
  signature?: string;
  createdAt?: string;
};

export function SolanaAdmin({ collectionSlug = "solana-payments" }: Props) {
  const [rows, setRows] = useState<Payment[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/" + collectionSlug + "?limit=12&sort=-createdAt", {
      credentials: "same-origin",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load Solana payments.");
        return (await response.json()) as { docs?: Payment[] };
      })
      .then((data) => {
        if (active) setRows(data.docs ?? []);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load payments.");
      });
    return () => {
      active = false;
    };
  }, [collectionSlug]);

  return (
    <main className="payload-solana-admin">
      <h1>Solana payments</h1>
      <p>Incoming SPL-token requests and their on-chain confirmation status.</p>
      {error ? <p role="alert">{error}</p> : null}
      <div className="payload-solana-admin__panel">
        <h2>Recent payments</h2>
        {rows.length === 0 && !error ? <p>No payments yet.</p> : null}
        {rows.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th scope="col">Reference</th>
                <th scope="col">Amount</th>
                <th scope="col">Mint</th>
                <th scope="col">Status</th>
                <th scope="col">Signature</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.reference ?? "—"}</td>
                  <td>{row.amount ?? "—"}</td>
                  <td>{row.mint ? row.mint.slice(0, 8) + "…" : "—"}</td>
                  <td>
                    <span className="payload-solana-admin__status">{row.status ?? "pending"}</span>
                  </td>
                  <td>{row.signature ? row.signature.slice(0, 12) + "…" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </main>
  );
}

export function SolanaAdminNav() {
  return <a href="/admin/solana-payments">Solana</a>;
}
