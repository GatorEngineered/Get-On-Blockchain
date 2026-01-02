"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/merchant/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Session is set via HTTP-only cookie by the API
      setMessage({
        type: "success",
        text: "Login successful! Redirecting...",
      });

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Login failed. Please try again.",
      });
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="logo">
            <h1>Get On Blockchain</h1>
            <p className="subtitle">Business Dashboard</p>
          </div>
        </div>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@business.com"
              disabled={loading}
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <p className="field-hint">
              <Link href="/dashboard/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </p>
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={loading || !email || !password}
          >
            {loading ? "Logging in..." : "Log In to Dashboard"}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have a business account?{" "}
            <Link href="/business/register">Start your free trial</Link>
          </p>
          <p className="divider">or</p>
          <p>
            <Link href="/" className="home-link">← Back to Home</Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .dashboard-login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: linear-gradient(135deg, #244b7a 0%, #8bbcff 100%);
        }

        .login-container {
          background: white;
          border-radius: 12px;
          padding: 2.5rem;
          max-width: 480px;
          width: 100%;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .logo h1 {
          font-size: 1.75rem;
          color: #244b7a;
          margin: 0 0 0.25rem 0;
          font-weight: 700;
        }

        .subtitle {
          color: #718096;
          font-size: 0.95rem;
          margin: 0;
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

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
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
          border-color: #244b7a;
          box-shadow: 0 0 0 3px rgba(36, 75, 122, 0.1);
        }

        .form-field input:disabled {
          background: #f7fafc;
          cursor: not-allowed;
        }

        .password-input-wrapper {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
        }

        .password-input-wrapper input {
          grid-column: 1 / -1;
          grid-row: 1;
          width: 100%;
          padding-right: 4rem;
        }

        .toggle-password {
          grid-column: 2;
          grid-row: 1;
          justify-self: end;
          margin-right: 0.75rem;
          background: none;
          border: none;
          color: #244b7a;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          white-space: nowrap;
          z-index: 1;
        }

        .toggle-password:hover {
          color: #8bbcff;
        }

        .field-hint {
          font-size: 0.85rem;
          margin: 0;
        }

        .forgot-link {
          color: #244b7a;
          text-decoration: none;
          font-weight: 500;
        }

        .forgot-link:hover {
          text-decoration: underline;
        }

        .submit-button {
          padding: 1rem;
          background: linear-gradient(135deg, #244b7a 0%, #8bbcff 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 0.5rem;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(36, 75, 122, 0.4);
        }

        .submit-button:disabled {
          background: #cbd5e0;
          cursor: not-allowed;
          transform: none;
        }

        .login-footer {
          text-align: center;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e2e8f0;
        }

        .login-footer p {
          color: #718096;
          font-size: 0.95rem;
          margin: 0.75rem 0;
        }

        .login-footer a {
          color: #244b7a;
          text-decoration: none;
          font-weight: 600;
        }

        .login-footer a:hover {
          text-decoration: underline;
        }

        .divider {
          color: #cbd5e0;
          font-size: 0.85rem;
        }

        .home-link {
          font-weight: 500;
        }

        @media (max-width: 640px) {
          .login-container {
            padding: 1.5rem;
          }

          .logo h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
