"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./new-user.module.css";
import { FiArrowLeft } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { apiUrl } from "@/lib/cart";

const TABS = ["Personal Info", "Company Info", "Address"] as const;
type Tab = typeof TABS[number];

export default function NewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Personal Info");

  // ── Personal Info ──────────────────────────────────────────
  const [personal, setPersonal] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    password: "",
    role_id: "",
    username_override: "",
    hear_about: "",
  });

  // ── Company Info ────────────────────────────────────────────
  const [company, setCompany] = useState({
    company_name: "",
    company_website: "",
    phone: "",
    fax: "",
    resale_tax_id: "",
    credit_application: "",
    company_notes: "",
  });

  // ── Address ─────────────────────────────────────────────────
  const [address, setAddress] = useState({
    address_line_1: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
  });

  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [generatedUsername, setGeneratedUsername] = useState("");

  useEffect(() => {
    fetch(apiUrl("/api/admin/roles"))
      .then((r) => r.json())
      .then((data) => setRoles(data || []));
  }, []);

  const pSet = (field: string, val: string) =>
    setPersonal((p) => ({ ...p, [field]: val }));
  const cSet = (field: string, val: string) =>
    setCompany((c) => ({ ...c, [field]: val }));
  const aSet = (field: string, val: string) =>
    setAddress((a) => ({ ...a, [field]: val }));

  const handlePreviewUsername = async () => {
    if (!personal.first_name || !personal.mobile) {
      toast.error("First name and mobile are required to preview username");
      return;
    }
    try {
      const full_name = `${personal.first_name} ${personal.last_name || ""}`.trim();
      const res = await fetch(apiUrl("/api/admin/users/generate-username"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name,
          mobile: personal.mobile,
          candidate: personal.username_override || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.available) {
        toast.error(data.error || data.message || "Failed to generate username");
        setGeneratedUsername("");
      } else {
        setGeneratedUsername(`✓ Available: ${data.username}`);
      }
    } catch {
      toast.error("Error checking username");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/admin/users"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...personal,
          // Company
          company_name: company.company_name,
          company_website: company.company_website,
          company_phone: company.phone,
          fax: company.fax,
          resale_tax_id: company.resale_tax_id,
          credit_application: company.credit_application,
          company_notes: company.company_notes,
          // Address
          address_line_1: address.address_line_1,
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
          country: address.country,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");
      toast.success("User created successfully");
      router.push("/crown-admin/users");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <Link href="/crown-admin/users" className={styles.backBtn}>
          <FiArrowLeft size={18} /> Back to Users
        </Link>
      </div>
      <h1 className={styles.pageTitle}>Create New User</h1>

      {/* Section Tabs */}
      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.card}>
          {/* ══════════════ PERSONAL INFO ══════════════ */}
          {activeTab === "Personal Info" && (
            <>
              <h2 className={styles.sectionTitle}>Personal Information</h2>
              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label>First Name <span className={styles.required}>*</span></label>
                  <input
                    required
                    type="text"
                    className={styles.input}
                    placeholder="First name"
                    value={personal.first_name}
                    onChange={(e) => pSet("first_name", e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Last Name <span className={styles.required}>*</span></label>
                  <input
                    required
                    type="text"
                    className={styles.input}
                    placeholder="Last name"
                    value={personal.last_name}
                    onChange={(e) => pSet("last_name", e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email <span className={styles.required}>*</span></label>
                  <input
                    required
                    type="email"
                    className={styles.input}
                    placeholder="email@example.com"
                    value={personal.email}
                    onChange={(e) => pSet("email", e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Mobile / Phone <span className={styles.required}>*</span></label>
                  <input
                    required
                    type="tel"
                    className={styles.input}
                    placeholder="+1 (555) 123-4567"
                    value={personal.mobile}
                    onChange={(e) => pSet("mobile", e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Password <span className={styles.required}>*</span></label>
                  <input
                    required
                    type="password"
                    className={styles.input}
                    placeholder="Set a password"
                    value={personal.password}
                    onChange={(e) => pSet("password", e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Role <span className={styles.required}>*</span></label>
                  <select
                    required
                    className={styles.select}
                    value={personal.role_id}
                    onChange={(e) => pSet("role_id", e.target.value)}
                  >
                    <option value="">Select a role...</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>How did they hear about us?</label>
                  <select
                    className={styles.select}
                    value={personal.hear_about}
                    onChange={(e) => pSet("hear_about", e.target.value)}
                  >
                    <option value="">Select...</option>
                    <option value="google">Google Search</option>
                    <option value="referral">Referral</option>
                    <option value="tradeshow">Trade Show</option>
                    <option value="social">Social Media</option>
                    <option value="diamond-district">Diamond District Walk-in</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Manual Username Override</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Leave blank to auto-generate"
                    value={personal.username_override}
                    onChange={(e) => pSet("username_override", e.target.value)}
                  />
                  {generatedUsername && (
                    <span className={styles.usernamePreview}>{generatedUsername}</span>
                  )}
                  <span className={styles.hint}>Auto-generated from name + mobile if left blank</span>
                </div>
              </div>

              <div className={styles.actions}>
                <span />
                <div className={styles.actionsRight}>
                  <button
                    type="button"
                    onClick={handlePreviewUsername}
                    className={styles.previewBtn}
                  >
                    Check Username
                  </button>
                  <button
                    type="button"
                    className={styles.submitBtn}
                    onClick={() => setActiveTab("Company Info")}
                  >
                    Next: Company Info →
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ══════════════ COMPANY INFO ══════════════ */}
          {activeTab === "Company Info" && (
            <>
              <h2 className={styles.sectionTitle}>Company Information</h2>
              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label>Company Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Company Name"
                    value={company.company_name}
                    onChange={(e) => cSet("company_name", e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Company Website</label>
                  <input
                    type="url"
                    className={styles.input}
                    placeholder="https://example.com"
                    value={company.company_website}
                    onChange={(e) => cSet("company_website", e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Business Phone</label>
                  <input
                    type="tel"
                    className={styles.input}
                    placeholder="+1 (555) 000-0000"
                    value={company.phone}
                    onChange={(e) => cSet("phone", e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Fax</label>
                  <input
                    type="tel"
                    className={styles.input}
                    placeholder="Fax number"
                    value={company.fax}
                    onChange={(e) => cSet("fax", e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Resale / Tax ID Number</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Resale/Tax ID"
                    value={company.resale_tax_id}
                    onChange={(e) => cSet("resale_tax_id", e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Credit Application</label>
                  <div className={styles.radioRow}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="creditApp"
                        value="yes"
                        checked={company.credit_application === "yes"}
                        onChange={() => cSet("credit_application", "yes")}
                      />
                      Yes — Apply for credit
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="creditApp"
                        value="no"
                        checked={company.credit_application === "no"}
                        onChange={() => cSet("credit_application", "no")}
                      />
                      No
                    </label>
                  </div>
                </div>
                <div className={`${styles.formGroup} ${styles.full}`}>
                  <label>Company Notes</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Internal notes about this company"
                    value={company.company_notes}
                    onChange={(e) => cSet("company_notes", e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.actions}>
                <button type="button" className={styles.previewBtn} onClick={() => setActiveTab("Personal Info")}>
                  ← Back
                </button>
                <button type="button" className={styles.submitBtn} onClick={() => setActiveTab("Address")}>
                  Next: Address →
                </button>
              </div>
            </>
          )}

          {/* ══════════════ ADDRESS ══════════════ */}
          {activeTab === "Address" && (
            <>
              <h2 className={styles.sectionTitle}>Address</h2>
              <div className={styles.grid2}>
                <div className={`${styles.formGroup} ${styles.full}`}>
                  <label>Address Line 1</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Street address"
                    value={address.address_line_1}
                    onChange={(e) => aSet("address_line_1", e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>City</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="City"
                    value={address.city}
                    onChange={(e) => aSet("city", e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>State / Province / Region</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="State / Province"
                    value={address.state}
                    onChange={(e) => aSet("state", e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Postal / Zip Code</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Zip / Postal code"
                    value={address.postal_code}
                    onChange={(e) => aSet("postal_code", e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Country</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Country"
                    value={address.country}
                    onChange={(e) => aSet("country", e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.actions}>
                <button type="button" className={styles.previewBtn} onClick={() => setActiveTab("Company Info")}>
                  ← Back
                </button>
                <button type="submit" disabled={loading} className={styles.submitBtn}>
                  {loading ? "Creating User..." : "✓ Create User"}
                </button>
              </div>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
