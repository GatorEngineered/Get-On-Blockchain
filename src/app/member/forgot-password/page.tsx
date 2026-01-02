"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/member/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset email");
      }

      setMessage({
        type: "success",
        text: data.message || "Check your email for password reset instructions.",
      });
      setEmail("");
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-header">
          <h1>Forgot Password?</h1>
          <p>Enter your email address and we'll send you a link to reset your password.</p>
        </div>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="form-field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={loading || !email}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="form-footer">
          <p>
            Remember your password?{" "}
            <Link href="/member/login">Back to login</Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .forgot-password-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .forgot-password-container {
          background: white;
          border-radius: 12px;
          padding: 2.5rem;
          max-width: 480px;
          width: 100%;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        .forgot-password-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .forgot-password-header h1 {
          font-size: 2rem;
          color: #1a202c;
          margin-bottom: 0.5rem;
        }

        .forgot-password-header p {
          color: #718096;
          font-size: 1rem;
        }

        .message {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-size: 0.95rem;
        }

        .message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .forgot-password-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-field label {
          font-weight: 600;
          color: #2d3748;
          font-size: 0.95rem;
        }

        .form-field input {
          padding: 0.75rem;
          border: 1px solid #cbd5e0;
          border-radius: 6px;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .form-field input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-field input:disabled {
          background: #f7fafc;
          cursor: not-allowed;
        }

        .submit-button {
          padding: 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .submit-button:disabled {
          background: #cbd5e0;
          cursor: not-allowed;
          transform: none;
        }

        .form-footer {
          text-align: center;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e2e8f0;
        }

        .form-footer p {
          color: #718096;
          font-size: 0.95rem;
        }

        .form-footer a {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
        }

        .form-footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 640px) {
          .forgot-password-container {
            padding: 1.5rem;
          }

          .forgot-password-header h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
