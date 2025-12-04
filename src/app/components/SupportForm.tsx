// src/app/components/SupportForm.tsx
"use client";

import { useState } from "react";
import styles from "@/app/styles/support-form.module.css";

type Role = "business" | "customer";

export default function SupportForm() {
  const [role, setRole] = useState<Role>("business");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honey, setHoney] = useState("");
  const [status, setStatus] =
    useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isSending = status === "sending";

  const resetForm = () => {
    setName("");
    setBusinessName("");
    setMerchantId("");
    setEmail("");
    setMessage("");
    setHoney("");
    setStatus("idle");
    setErrorMsg(null);
  };

  const handleRoleChange = (nextRole: Role) => {
    setRole(nextRole);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMsg("Name, email, and message are required.");
      return;
    }

    setStatus("sending");

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          name: name.trim(),
          businessName: businessName.trim() || undefined,
          merchantId: merchantId.trim() || undefined,
          email: email.trim(),
          message: message.trim(),
          honey,
          meta: {
            page: "/support",
            ts: new Date().toISOString(),
            userAgent:
              typeof window !== "undefined" ? navigator.userAgent : "",
          },
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Status ${res.status}`);
      }

      setStatus("success");
      resetForm(); // fields cleared, status already set to success above
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again in a moment.");
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.toggleRow}>
        <button
          type="button"
          className={
            styles.toggleBtn +
            (role === "business" ? " " + styles.toggleBtnActive : "")
          }
          onClick={() => handleRoleChange("business")}
        >
          Business
        </button>
        <button
          type="button"
          className={
            styles.toggleBtn +
            (role === "customer" ? " " + styles.toggleBtnActive : "")
          }
          onClick={() => handleRoleChange("customer")}
        >
          Customer
        </button>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {role === "business" && (
          <>
            <div className={styles.row}>
              <label className={styles.label} htmlFor="businessName">
                Business name
              </label>
              <input
                id="businessName"
                className={styles.input}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Example Coffee Roasters"
              />
            </div>

            <div className={styles.row}>
              <label className={styles.label} htmlFor="merchantId">
                Merchant ID (optional)
              </label>
              <input
                id="merchantId"
                className={styles.input}
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                placeholder="If you already have an ID"
              />
            </div>
          </>
        )}

        <div className={styles.row}>
          <label className={styles.label} htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
          />
        </div>

        <div className={styles.row}>
          <label className={styles.label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div className={styles.row}>
          <label className={styles.label} htmlFor="message">
            Message
          </label>
          <textarea
            id="message"
            className={styles.textarea}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              role === "business"
                ? "Tell us what you’d like your rewards or payments to do…"
                : "Tell us what you need help with…"
            }
            rows={5}
            required
          />
        </div>

        {/* Honeypot – keep it hidden in CSS */}
        <input
          type="text"
          name="honey"
          className={styles.hp}
          value={honey}
          onChange={(e) => setHoney(e.target.value)}
          autoComplete="off"
        />

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.submit}
            disabled={isSending}
          >
            {status === "sending"
              ? "Sending…"
              : status === "success"
              ? "Sent ✓"
              : "Submit"}
          </button>
        </div>

        {errorMsg && (
          <p className={styles.error} aria-live="polite">
            {errorMsg}
          </p>
        )}
        {status === "success" && !errorMsg && (
          <p className={styles.success} aria-live="polite">
            Thanks — your message is on its way.
          </p>
        )}
      </form>
    </div>
  );
}
