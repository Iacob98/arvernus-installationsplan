"use client";

import { useState } from "react";

type Step = "email" | "confirm" | "done";

export default function UnsubscribePage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ein Fehler ist aufgetreten");
        setStep("email");
      } else {
        setStep("done");
      }
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.");
      setStep("email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      fontFamily: "system-ui, sans-serif",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      margin: 0,
      background: "#f5f5f5",
      padding: "1rem",
    }}>
      <div style={{
        textAlign: "center",
        padding: "2rem",
        background: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        maxWidth: "420px",
        width: "100%",
      }}>
        {step === "email" && (
          <>
            <h2 style={{ marginTop: 0 }}>Von Kampagnen-E-Mails abmelden</h2>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              Geben Sie Ihre E-Mail-Adresse ein, um sich von unseren Kampagnen-E-Mails abzumelden.
            </p>
            {error && (
              <p style={{ color: "#e11d48", fontSize: "14px", margin: "0.5rem 0" }}>{error}</p>
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ihre@email.de"
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "16px",
                marginBottom: "1rem",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={() => {
                if (!email.includes("@")) {
                  setError("Bitte geben Sie eine gültige E-Mail-Adresse ein");
                  return;
                }
                setError("");
                setStep("confirm");
              }}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "#1a1a2e",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              Weiter
            </button>
          </>
        )}

        {step === "confirm" && (
          <>
            <h2 style={{ marginTop: 0 }}>Abmeldung bestätigen</h2>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              Möchten Sie <strong>{email}</strong> wirklich von unseren Kampagnen-E-Mails abmelden?
            </p>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button
                onClick={() => setStep("email")}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  background: "white",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                Abbrechen
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  background: "#e11d48",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "16px",
                  cursor: loading ? "wait" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Wird abgemeldet..." : "Abmelden bestätigen"}
              </button>
            </div>
          </>
        )}

        {step === "done" && (
          <>
            <div style={{ fontSize: "48px", color: "#16a34a" }}>&#10003;</div>
            <h2>Erfolgreich abgemeldet</h2>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              <strong>{email}</strong> wurde erfolgreich von unseren Kampagnen-E-Mails abgemeldet.
              Sie erhalten keine weiteren Kampagnen-Nachrichten mehr.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
