"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useEffect } from "react";

export default function MemberLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loginMethod, setLoginMethod] = useState<"email" | "password" | "wallet">("password");

  // Get return URL from query params (where to redirect after login)
  const returnTo = searchParams.get("returnTo") || "/member/dashboard";
  const merchantSlug = searchParams.get("merchant");

  // Auto-login with wallet if connected
  useEffect(() => {
    if (isConnected && address && loginMethod === "wallet") {
      handleWalletLogin();
    }
  }, [isConnected, address, loginMethod]);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/member/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          merchantSlug,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store session token
      localStorage.setItem("member_token", data.token);

      setMessage({
        type: "success",
        text: "Login successful! Redirecting...",
      });

      // Redirect to dashboard or return URL
      setTimeout(() => {
        router.push(returnTo);
      }, 500);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Login failed. Please try again.",
      });
      setLoading(false);
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/member/auth/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          returnTo,
          merchantSlug,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send magic link");
      }

      setMessage({
        type: "success",
        text: "Check your email! We sent you a magic link to log in.",
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
  }

  async function handleWalletLogin() {
    if (!address) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/member/auth/login-with-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          merchantSlug,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to log in with wallet");
      }

      // Store session token
      localStorage.setItem("member_token", data.token);

      // Redirect to dashboard or return URL
      router.push(returnTo);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Wallet login failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: "480px" }}>
        <div className="login-card">
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
            Member Login
          </h1>
          <p className="section-sub" style={{ marginBottom: "2rem" }}>
            Access your rewards, points, and claim payouts
          </p>

          {/* Login Method Tabs */}
          <div className="login-tabs">
            <button
              className={`login-tab ${loginMethod === "password" ? "active" : ""}`}
              onClick={() => setLoginMethod("password")}
            >
              Password
            </button>
            <button
              className={`login-tab ${loginMethod === "email" ? "active" : ""}`}
              onClick={() => setLoginMethod("email")}
            >
              Magic Link
            </button>
            <button
              className={`login-tab ${loginMethod === "wallet" ? "active" : ""}`}
              onClick={() => setLoginMethod("wallet")}
            >
              Wallet
            </button>
          </div>

          {message && (
            <div className={`login-message login-message-${message.type}`}>
              {message.text}
            </div>
          )}

          {/* Password Login */}
          {loginMethod === "password" && (
            <form onSubmit={handlePasswordLogin} className="login-form">
              <div className="login-field">
                <label htmlFor="email-password">Email Address</label>
                <input
                  id="email-password"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="login-field">
                <label htmlFor="password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <p className="login-hint">
                  <a href="/member/forgot-password" className="forgot-link">
                    Forgot password?
                  </a>
                </p>
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={loading || !email || !password}
              >
                {loading ? "Logging in..." : "Log In"}
              </button>

              <div className="register-prompt">
                <p>
                  Don't have an account?{" "}
                  <a href={`/member/register${merchantSlug ? `?merchant=${merchantSlug}` : ""}`}>
                    Sign up
                  </a>
                </p>
              </div>
            </form>
          )}

          {/* Email Login */}
          {loginMethod === "email" && (
            <form onSubmit={handleEmailLogin} className="login-form">
              <div className="login-field">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={loading}
                />
                <p className="login-hint">
                  We'll send you a magic link to log in - no password needed!
                </p>
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={loading || !email}
              >
                {loading ? "Sending..." : "Send Magic Link"}
              </button>
            </form>
          )}

          {/* Wallet Login */}
          {loginMethod === "wallet" && (
            <div className="wallet-login">
              <p className="login-hint" style={{ marginBottom: "1.5rem" }}>
                Connect your wallet to access your account
              </p>

              <div className="wallet-connect-wrapper">
                <ConnectButton showBalance={false} />
              </div>

              {isConnected && address && (
                <div className="wallet-connected">
                  <p>✅ Wallet Connected</p>
                  <p className="wallet-address">
                    {address.slice(0, 8)}...{address.slice(-6)}
                  </p>
                  <button
                    onClick={handleWalletLogin}
                    className="login-button"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Continue"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="login-divider">
            <span>or</span>
          </div>

          {/* Help Text */}
          <div className="login-help">
            <p>
              <strong>New here?</strong>
            </p>
            <p>
              Visit your favorite merchant and scan their QR code to create an
              account and start earning rewards!
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-card {
          background: white;
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
          border: 1px solid rgba(15, 23, 42, 0.05);
        }

        .login-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          background: #f3f4f6;
          border-radius: 12px;
          padding: 0.25rem;
        }

        .login-tab {
          flex: 1;
          padding: 0.75rem 1.5rem;
          border: none;
          background: transparent;
          border-radius: 10px;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .login-tab.active {
          background: white;
          color: #244b7a;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .login-message {
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
        }

        .login-message-success {
          background: #e0fbea;
          color: #166534;
          border: 1px solid #16a34a;
        }

        .login-message-error {
          background: #fee2e2;
          color: #b91c1c;
          border: 1px solid #ef4444;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .login-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .login-field label {
          font-weight: 500;
          color: #374151;
          font-size: 0.95rem;
        }

        .login-field input {
          padding: 0.75rem 1rem;
          border-radius: 12px;
          border: 1px solid #d1d5db;
          background: #f9fafb;
          font-size: 1rem;
          transition: all 0.2s ease;
        }

        .login-field input:focus {
          outline: none;
          border-color: #244b7a;
          box-shadow: 0 0 0 3px rgba(36, 75, 122, 0.1);
          background: white;
        }

        .login-field input:disabled {
          opacity: 0.5;
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

        .password-toggle {
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

        .login-hint {
          font-size: 0.85rem;
          color: #9ca3af;
        }

        .login-button {
          padding: 0.875rem 1.5rem;
          border-radius: 999px;
          border: none;
          background: linear-gradient(to right, #244b7a, #8bbcff);
          color: white;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(36, 75, 122, 0.3);
        }

        .login-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .wallet-login {
          text-align: center;
        }

        .wallet-connect-wrapper {
          display: flex;
          justify-content: center;
          margin: 1.5rem 0;
        }

        .wallet-connected {
          margin-top: 1.5rem;
          padding: 1.5rem;
          background: #eef5ff;
          border-radius: 12px;
          border: 2px solid #244b7a;
        }

        .wallet-connected p {
          margin: 0.5rem 0;
        }

        .wallet-address {
          font-family: "Courier New", monospace;
          font-size: 0.9rem;
          color: #4b5563;
          margin-bottom: 1rem !important;
        }

        .login-divider {
          position: relative;
          text-align: center;
          margin: 2rem 0;
        }

        .login-divider::before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 1px;
          background: #e5e7eb;
        }

        .login-divider span {
          position: relative;
          background: white;
          padding: 0 1rem;
          color: #9ca3af;
          font-size: 0.85rem;
        }

        .login-help {
          text-align: center;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .login-help p {
          margin: 0.5rem 0;
        }

        .login-help strong {
          color: #374151;
        }

        .forgot-link {
          color: #244b7a;
          text-decoration: none;
          font-weight: 500;
        }

        .forgot-link:hover {
          text-decoration: underline;
        }

        .register-prompt {
          text-align: center;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
        }

        .register-prompt p {
          color: #6b7280;
          font-size: 0.9rem;
          margin: 0;
        }

        .register-prompt a {
          color: #244b7a;
          text-decoration: none;
          font-weight: 600;
        }

        .register-prompt a:hover {
          text-decoration: underline;
        }

        @media (max-width: 640px) {
          .login-card {
            padding: 1.5rem;
          }
        }
      `}</style>
    </main>
  );
}
