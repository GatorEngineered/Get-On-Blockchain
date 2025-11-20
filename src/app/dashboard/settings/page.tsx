"use client";

import React, { useEffect, useState } from "react";

type MerchantSettings = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  welcomePoints: number;
  earnPerVisit: number;
  vipThreshold: number;
  primaryColor: string | null;
  accentColor: string | null;
};

export default function DashboardSettingsPage() {
  const [settings, setSettings] = useState<MerchantSettings | null>(null);

  const [welcomePoints, setWelcomePoints] = useState("");
  const [earnPerVisit, setEarnPerVisit] = useState("");
  const [vipThreshold, setVipThreshold] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [accentColor, setAccentColor] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Load settings from API
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/merchant-settings");

        if (!res.ok) {
          const text = await res.text();
          console.error(
            "GET /api/merchant-settings failed:",
            res.status,
            text,
          );
          throw new Error("Failed to load settings");
        }

        const data: MerchantSettings = await res.json();

        setSettings(data);
        setWelcomePoints(String(data.welcomePoints ?? 10));
        setEarnPerVisit(String(data.earnPerVisit ?? 10));
        setVipThreshold(String(data.vipThreshold ?? 100));
        setPrimaryColor(data.primaryColor ?? "#244b7a");
        setAccentColor(data.accentColor ?? "#8bbcff");
      } catch (err) {
        console.error("Failed to load settings", err);
        setStatus("Could not load settings.");
      }
    }

    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setIsSaving(true);

    try {
      const res = await fetch("/api/merchant-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          welcomePoints: Number(welcomePoints),
          earnPerVisit: Number(earnPerVisit),
          vipThreshold: Number(vipThreshold),
          primaryColor,
          accentColor,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg = data?.error || "Failed to save settings";
        throw new Error(msg);
      }

      const updated: MerchantSettings = await res.json();
      setSettings(updated);
      setStatus("Settings saved.");
    } catch (err: any) {
      console.error("Save failed", err);
      setStatus(err?.message || "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="settings-page">
      <h1 className="settings-title">Merchant settings</h1>

      {status && (
        <p
          className={
            status === "Settings saved."
              ? "settings-status settings-status--ok"
              : "settings-status settings-status--error"
          }
        >
          {status}
        </p>
      )}

      {!settings && !status && (
        <p className="settings-loading">Loading settings…</p>
      )}

      {settings && (
        <>
          {/* Top summary */}
          <section className="settings-card settings-card--summary">
            <div>
              <h2 className="settings-merchant-name">{settings.name}</h2>
              <p className="settings-merchant-plan">
                Plan: <strong>{settings.plan}</strong>
              </p>
              <p className="settings-merchant-slug">
                Slug: <code>{settings.slug}</code>
              </p>
            </div>

            <div className="settings-points-summary">
              <p>
                Welcome points:{" "}
                <strong>{settings.welcomePoints ?? 0}</strong>
              </p>
              <p>
                Per-visit points:{" "}
                <strong>{settings.earnPerVisit ?? 0}</strong>
              </p>
              <p>
                VIP threshold:{" "}
                <strong>{settings.vipThreshold ?? 0}</strong>
              </p>
            </div>
          </section>

          {/* Form */}
          <form className="settings-card settings-form" onSubmit={handleSave}>
            <h2>Reward logic</h2>

            <div className="settings-field">
              <label>
                Welcome points
                <input
                  type="number"
                  min={0}
                  value={welcomePoints}
                  onChange={(e) => setWelcomePoints(e.target.value)}
                />
              </label>
            </div>

            <div className="settings-field">
              <label>
                Per-visit points
                <input
                  type="number"
                  min={0}
                  value={earnPerVisit}
                  onChange={(e) => setEarnPerVisit(e.target.value)}
                />
              </label>
            </div>

            <div className="settings-field">
              <label>
                VIP threshold (points)
                <input
                  type="number"
                  min={0}
                  value={vipThreshold}
                  onChange={(e) => setVipThreshold(e.target.value)}
                />
              </label>
            </div>

            <h2>Branding</h2>

            <div className="settings-colors">
              <div className="settings-field">
                <label>
                  Primary color
                  <div className="settings-color-input">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                    />
                  </div>
                </label>
              </div>

              <div className="settings-field">
                <label>
                  Accent color
                  <div className="settings-color-input">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                    />
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="settings-save-button"
              disabled={isSaving}
            >
              {isSaving ? "Saving…" : "Save changes"}
            </button>
          </form>
        </>
      )}
    </main>
  );
}
