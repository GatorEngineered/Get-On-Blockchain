"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface PasswordStrength {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export default function MemberRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Get return URL and merchant slug from query params
  const returnTo = searchParams.get("returnTo") || "/member/dashboard";
  const merchantSlug = searchParams.get("merchant");

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

  const passwordStrength = getPasswordStrength(formData.password);
  const isPasswordValid = Object.values(passwordStrength).every((v) => v);
  const passwordsMatch = formData.password === formData.confirmPassword;

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validate passwords match
    if (!passwordsMatch) {
      setMessage({
        type: "error",
        text: "Passwords do not match",
      });
      setLoading(false);
      return;
    }

    // Validate password strength
    if (!isPasswordValid) {
      setMessage({
        type: "error",
        text: "Password does not meet all requirements",
      });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/member/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone || undefined,
          password: formData.password,
          merchantSlug: merchantSlug || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || data.details?.join(", ") || "Registration failed"
        );
      }

      // Store session token
      localStorage.setItem("member_token", data.token);

      setMessage({
        type: "success",
        text: "Account created successfully! Redirecting...",
      });

      // Redirect after short delay
      setTimeout(() => {
        router.push(returnTo);
      }, 1500);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Something went wrong. Please try again.",
      });
      setLoading(false);
    }
  };

  return (
    <div className="member-register-page">
      <div className="register-container">
        <div className="register-header">
          <h1>Create Your Account</h1>
          <p>Join the rewards program and start earning points today!</p>
        </div>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="firstName">
                First Name <span className="required">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="lastName">
                Last Name <span className="required">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="email">
              Email <span className="required">*</span>
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-field">
            <label htmlFor="phone">Phone (optional)</label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
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

            {formData.password && (
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
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
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

            {formData.confirmPassword && !passwordsMatch && (
              <p className="error-hint">Passwords do not match</p>
            )}
            {formData.confirmPassword && passwordsMatch && (
              <p className="success-hint">Passwords match</p>
            )}
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={loading || !isPasswordValid || !passwordsMatch}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Already have an account?{" "}
            <Link href={`/member/login${merchantSlug ? `?merchant=${merchantSlug}` : ""}`}>
              Log in here
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .member-register-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .register-container {
          background: white;
          border-radius: 12px;
          padding: 2.5rem;
          max-width: 600px;
          width: 100%;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        .register-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .register-header h1 {
          font-size: 2rem;
          color: #1a202c;
          margin-bottom: 0.5rem;
        }

        .register-header p {
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

        .register-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
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

        .register-footer {
          text-align: center;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e2e8f0;
        }

        .register-footer p {
          color: #718096;
          font-size: 0.95rem;
        }

        .register-footer a {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
        }

        .register-footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 640px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .register-container {
            padding: 1.5rem;
          }

          .register-header h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
