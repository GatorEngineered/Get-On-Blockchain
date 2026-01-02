"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PasswordStrength {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

interface Location {
  name: string;
  nickname: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface StaffMember {
  name: string;
  email: string;
}

export default function BusinessRegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    password: "",
    confirmPassword: "",
  });

  const [locations, setLocations] = useState<Location[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);

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

  const passwordStrength = getPasswordStrength(formData.password);
  const isPasswordValid = Object.values(passwordStrength).every((v) => v);
  const passwordsMatch = formData.password === formData.confirmPassword;

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addLocation = () => {
    setLocations([...locations, { name: "", nickname: "", street: "", city: "", state: "", zipCode: "" }]);
  };

  const removeLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const updateLocation = (index: number, field: string, value: string) => {
    const updated = [...locations];
    updated[index] = { ...updated[index], [field]: value };
    setLocations(updated);
  };

  const addStaff = () => {
    setStaff([...staff, { name: "", email: "" }]);
  };

  const removeStaff = (index: number) => {
    setStaff(staff.filter((_, i) => i !== index));
  };

  const updateStaff = (index: number, field: string, value: string) => {
    const updated = [...staff];
    updated[index] = { ...updated[index], [field]: value };
    setStaff(updated);
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
      // Combine main address fields
      const mainAddress = `${formData.street}, ${formData.city}, ${formData.state} ${formData.zipCode}`;

      // Combine additional location addresses
      const processedLocations = locations
        .filter((loc) => loc.name && loc.street && loc.city && loc.state && loc.zipCode)
        .map((loc) => ({
          name: loc.name,
          nickname: loc.nickname,
          address: `${loc.street}, ${loc.city}, ${loc.state} ${loc.zipCode}`,
        }));

      const res = await fetch("/api/business/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: formData.businessName,
          ownerName: formData.ownerName,
          email: formData.email,
          phone: formData.phone || undefined,
          address: mainAddress,
          password: formData.password,
          plan: "STARTER", // 7-day trial
          locations: processedLocations,
          staff: staff.filter((s) => s.name && s.email),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || data.details?.join(", ") || "Registration failed"
        );
      }

      setMessage({
        type: "success",
        text: "Business registered successfully! Redirecting to dashboard...",
      });

      // Redirect to dashboard after 1.5 seconds (user is already authenticated via session cookie)
      setTimeout(() => {
        router.push("/dashboard");
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
    <div className="business-register-page">
      <div className="register-container">
        <div className="register-header">
          <h1>Start Your 7-Day Free Trial</h1>
          <p>Join Get On Blockchain and start rewarding your customers today!</p>
        </div>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          {/* Business Information */}
          <div className="form-section">
            <h3 className="section-title">Business Information</h3>

            <div className="form-field">
              <label htmlFor="businessName">
                Business Name <span className="required">*</span>
              </label>
              <input
                id="businessName"
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => handleChange("businessName", e.target.value)}
                disabled={loading}
                placeholder="e.g., Coffee Shop"
              />
            </div>

            <div className="form-field">
              <label htmlFor="street">
                Street Address <span className="required">*</span>
              </label>
              <input
                id="street"
                type="text"
                required
                value={formData.street}
                onChange={(e) => handleChange("street", e.target.value)}
                disabled={loading}
                placeholder="123 Main St"
              />
            </div>

            <div className="address-row">
              <div className="form-field">
                <label htmlFor="city">
                  City <span className="required">*</span>
                </label>
                <input
                  id="city"
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  disabled={loading}
                  placeholder="City"
                />
              </div>

              <div className="form-field">
                <label htmlFor="state">
                  State <span className="required">*</span>
                </label>
                <input
                  id="state"
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  disabled={loading}
                  placeholder="State"
                  maxLength={2}
                  
                />
              </div>

              <div className="form-field">
                <label htmlFor="zipCode">
                  ZIP Code <span className="required">*</span>
                </label>
                <input
                  id="zipCode"
                  type="text"
                  required
                  value={formData.zipCode}
                  onChange={(e) => handleChange("zipCode", e.target.value)}
                  disabled={loading}
                  placeholder="12345"
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="form-section">
            <h3 className="section-title">Owner Information</h3>

            <div className="form-field">
              <label htmlFor="ownerName">
                Owner Name <span className="required">*</span>
              </label>
              <input
                id="ownerName"
                type="text"
                required
                value={formData.ownerName}
                onChange={(e) => handleChange("ownerName", e.target.value)}
                disabled={loading}
                placeholder="John Doe"
              />
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
                placeholder="owner@business.com"
              />
              <p className="field-hint">This will be your login email</p>
            </div>

            <div className="form-field">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                disabled={loading}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-section">
            <h3 className="section-title">Create Password</h3>

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
          </div>

          {/* Additional Locations (Optional) */}
          <div className="form-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="section-title">Additional Locations (Optional)</h3>
              <button
                type="button"
                onClick={addLocation}
                className="add-button"
                disabled={loading}
              >
                + Add Location
              </button>
            </div>

            {locations.map((loc, index) => (
              <div key={index} className="nested-form">
                <div className="nested-header">
                  <span>Location {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeLocation(index)}
                    className="remove-button"
                    disabled={loading}
                  >
                    Remove
                  </button>
                </div>

                <div className="form-field">
                  <label>Location Name</label>
                  <input
                    type="text"
                    value={loc.name}
                    onChange={(e) => updateLocation(index, "name", e.target.value)}
                    disabled={loading}
                    placeholder="e.g., Downtown, Airport"
                  />
                </div>

                <div className="form-field">
                  <label>Nickname (Optional)</label>
                  <input
                    type="text"
                    value={loc.nickname}
                    onChange={(e) => updateLocation(index, "nickname", e.target.value)}
                    disabled={loading}
                    placeholder="Friendly name for this location"
                  />
                </div>

                <div className="form-field">
                  <label>Street Address</label>
                  <input
                    type="text"
                    value={loc.street}
                    onChange={(e) => updateLocation(index, "street", e.target.value)}
                    disabled={loading}
                    placeholder="123 Main St"
                  />
                </div>

                <div className="address-row">
                  <div className="form-field">
                    <label>City</label>
                    <input
                      type="text"
                      value={loc.city}
                      onChange={(e) => updateLocation(index, "city", e.target.value)}
                      disabled={loading}
                      placeholder="City"
                    />
                  </div>

                  <div className="form-field">
                    <label>State</label>
                    <input
                      type="text"
                      value={loc.state}
                      onChange={(e) => updateLocation(index, "state", e.target.value)}
                      disabled={loading}
                      placeholder="State"
                      maxLength={2}
                      style={{ textTransform: "uppercase" }}
                    />
                  </div>

                  <div className="form-field">
                    <label>ZIP Code</label>
                    <input
                      type="text"
                      value={loc.zipCode}
                      onChange={(e) => updateLocation(index, "zipCode", e.target.value)}
                      disabled={loading}
                      placeholder="12345"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Staff Members (Optional) */}
          <div className="form-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="section-title">Staff Members (Optional)</h3>
              <button
                type="button"
                onClick={addStaff}
                className="add-button"
                disabled={loading}
              >
                + Add Staff
              </button>
            </div>

            {staff.map((member, index) => (
              <div key={index} className="nested-form">
                <div className="nested-header">
                  <span>Staff Member {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeStaff(index)}
                    className="remove-button"
                    disabled={loading}
                  >
                    Remove
                  </button>
                </div>

                <div className="form-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => updateStaff(index, "name", e.target.value)}
                    disabled={loading}
                    placeholder="Staff member's name"
                  />
                </div>

                <div className="form-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={member.email}
                    onChange={(e) => updateStaff(index, "email", e.target.value)}
                    disabled={loading}
                    placeholder="staff@business.com"
                  />
                  {member.email === formData.email && (
                    <p className="success-hint">
                      ✓ This staff member will have full management access
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Trial Info */}
          <div className="trial-info">
            <h4>Your 7-Day Free Trial Includes:</h4>
            <ul>
              <li>✓ Unlimited member sign-ups</li>
              <li>✓ Points and rewards management</li>
              <li>✓ QR code check-ins</li>
              <li>✓ Basic analytics dashboard</li>
              <li>✓ Email support</li>
            </ul>
            <p className="trial-note">
              No payment required now. You can add payment details later to continue after your trial.
            </p>
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={loading || !isPasswordValid || !passwordsMatch}
          >
            {loading ? "Creating account..." : "Start Free Trial"}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Already have an account?{" "}
            <Link href="/dashboard/login">Log in here</Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .business-register-page {
          min-height: 100vh;
          padding: 2rem;
          background: linear-gradient(135deg, #244b7a 0%, #8bbcff 100%);
        }

        .register-container {
          background: white;
          border-radius: 12px;
          padding: 2.5rem;
          max-width: 800px;
          margin: 0 auto;
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
          gap: 2rem;
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .form-section:last-of-type {
          border-bottom: none;
        }

        .section-title {
          font-size: 1.25rem;
          color: #2d3748;
          margin: 0;
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
          border-color: #244b7a;
          box-shadow: 0 0 0 3px rgba(36, 75, 122, 0.1);
        }

        .form-field input:disabled {
          background: #f7fafc;
          cursor: not-allowed;
        }

        .field-hint {
          font-size: 0.85rem;
          color: #718096;
          margin: 0;
        }

        .address-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 1rem;
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
          color: #244b7a;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .toggle-password:hover {
          color: #8bbcff;
        }

        .password-requirements {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 1rem;
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
        }

        .success-hint {
          font-size: 0.85rem;
          color: #38a169;
        }

        .add-button {
          padding: 0.5rem 1rem;
          background: #244b7a;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .add-button:hover:not(:disabled) {
          background: #1a3b5f;
        }

        .add-button:disabled {
          background: #cbd5e0;
          cursor: not-allowed;
        }

        .nested-form {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .nested-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
          color: #2d3748;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .remove-button {
          padding: 0.25rem 0.75rem;
          background: transparent;
          color: #e53e3e;
          border: 1px solid #e53e3e;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .remove-button:hover:not(:disabled) {
          background: #e53e3e;
          color: white;
        }

        .trial-info {
          background: #eef5ff;
          border: 2px solid #244b7a;
          border-radius: 8px;
          padding: 1.5rem;
        }

        .trial-info h4 {
          margin: 0 0 1rem 0;
          color: #244b7a;
          font-size: 1.1rem;
        }

        .trial-info ul {
          margin: 0 0 1rem 0;
          padding-left: 1.5rem;
          color: #2d3748;
        }

        .trial-info li {
          margin: 0.5rem 0;
        }

        .trial-note {
          margin: 0;
          font-size: 0.875rem;
          color: #718096;
          font-style: italic;
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
          color: #244b7a;
          text-decoration: none;
          font-weight: 600;
        }

        .register-footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 640px) {
          .register-container {
            padding: 1.5rem;
          }

          .register-header h1 {
            font-size: 1.5rem;
          }

          .address-row {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
