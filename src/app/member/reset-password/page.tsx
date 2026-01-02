"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface PasswordStrength {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Calculate password strength
  const getPasswordStrength = (password: string): PasswordStrength => {
    return {
      hasMinLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
  };

  const passwordStrength = getPasswordStrength(password);
  const isPasswordValid = Object.values(passwordStrength).every((v) => v);
  const passwordsMatch = password === confirmPassword;

  useEffect(() => {
    if (!token) {
      setMessage({
        type: "error",
        text: "No reset token provided. Please request a new password reset link.",
      });
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setMessage({
        type: "error",
        text: "No reset token provided",
      });
      return;
    }

    if (!passwordsMatch) {
      setMessage({
        type: "error",
        text: "Passwords do not match",
      });
      return;
    }

    if (!isPasswordValid) {
      setMessage({
        type: "error",
        text: "Password does not meet all requirements",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/member/password-reset/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || data.details?.join(", ") || "Password reset failed"
        );
      }

      setMessage({
        type: "success",
        text: "Password reset successful! Redirecting to login...",
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/member/login");
      }, 2000);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Something went wrong. Please try again.",
      });
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-password-header">
          <h1>Reset Your Password</h1>
          <p>Enter your new password below.</p>
        </div>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {token && !message && (
          <form onSubmit={handleSubmit} className="reset-password-form">
            <div className="form-field">
              <label htmlFor="password">
                New Password <span className="required">*</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

              {password && (
                <div className="password-requirements">
                  <p className="requirements-title">Password must contain:</p>
                  <ul>
                    <li className={passwordStrength.hasMinLength ? "valid" : ""}>
                      At least 8 characters
                    </li>
                    <li className={passwordStrength.hasUppercase ? "valid" : ""}>
                      One uppercase letter
                    </li>
                    <li className={passwordStrength.hasLowercase ? "valid" : ""}>
                      One lowercase letter
                    </li>
                    <li className={passwordStrength.hasNumber ? "valid" : ""}>
                      One number
                    </li>
                    <li className={passwordStrength.hasSpecial ? "valid" : ""}>
                      One special character (!@#$%^&*...)
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="confirmPassword">
                Confirm Password <span className="required">*</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>

              {confirmPassword && !passwordsMatch && (
                <p className="error-hint">Passwords do not match</p>
              )}
              {confirmPassword && passwordsMatch && (
                <p className="success-hint">Passwords match</p>
              )}
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={loading || !isPasswordValid || !passwordsMatch}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className="form-footer">
          <p>
            <Link href="/member/login">Back to login</Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .reset-password-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .reset-password-container {
          background: white;
          border-radius: 12px;
          padding: 2.5rem;
          max-width: 600px;
          width: 100%;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        .reset-password-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .reset-password-header h1 {
          font-size: 2rem;
          color: #1a202c;
          margin-bottom: 0.5rem;
        }

        .reset-password-header p {
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

        .reset-password-form {
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

        .required {
          color: #e53e3e;
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

        .password-input-wrapper {
          position: relative;
          display: flex;
        }

        .password-input-wrapper input {
          flex: 1;
          padding-right: 4rem;
        }

        .toggle-password {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #667eea;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .toggle-password:hover {
          color: #764ba2;
        }

        .password-requirements {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 1rem;
          margin-top: 0.5rem;
        }

        .requirements-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 0.5rem;
        }

        .password-requirements ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .password-requirements li {
          font-size: 0.85rem;
          color: #718096;
          padding: 0.25rem 0;
          padding-left: 1.5rem;
          position: relative;
        }

        .password-requirements li::before {
          content: "✗";
          position: absolute;
          left: 0;
          color: #e53e3e;
          font-weight: bold;
        }

        .password-requirements li.valid {
          color: #38a169;
        }

        .password-requirements li.valid::before {
          content: "✓";
          color: #38a169;
        }

        .error-hint {
          font-size: 0.85rem;
          color: #e53e3e;
          margin-top: 0.25rem;
        }

        .success-hint {
          font-size: 0.85rem;
          color: #38a169;
          margin-top: 0.25rem;
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
          margin-top: 0.5rem;
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
          .reset-password-container {
            padding: 1.5rem;
          }

          .reset-password-header h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
