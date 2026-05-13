"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "../admin.module.css";
import nl from "./newsletter.module.css";
import {
  FiSend, FiUsers, FiClock, FiMail, FiCheckCircle, FiAlertCircle,
  FiChevronDown, FiChevronUp, FiEye, FiRefreshCw
} from "react-icons/fi";

const API = "https://usa-crown-back.vercel.app/api/admin";

interface Subscriber {
  id: string;
  email: string;
  name: string;
  company: string;
  type: "guest" | "member";
  status: string;
  date: string;
}

interface Campaign {
  id: string;
  subject: string;
  content: string;
  recipient_count: number;
  sent_at: string;
}

type Tab = "compose" | "subscribers" | "campaigns";

export default function NewsletterPage() {
  const [tab, setTab] = useState<Tab>("compose");

  // Compose state
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Subscribers state
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);

  // Campaigns state
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);

  // Preview modal
  const [showPreview, setShowPreview] = useState(false);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  // ─── Fetch subscribers ─────────────────────────────
  const fetchSubscribers = useCallback(async () => {
    setSubsLoading(true);
    try {
      const res = await fetch(`${API}/newsletter/subscribers`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubscribers(data.subscribers || []);
    } catch (err: any) {
      showToast("error", err.message || "Failed to load subscribers");
    } finally {
      setSubsLoading(false);
    }
  }, []);

  // ─── Fetch campaigns ──────────────────────────────
  const fetchCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    try {
      const res = await fetch(`${API}/newsletter/campaigns`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCampaigns(data.campaigns || []);
    } catch (err: any) {
      showToast("error", err.message || "Failed to load campaigns");
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "subscribers") fetchSubscribers();
    if (tab === "campaigns") fetchCampaigns();
  }, [tab, fetchSubscribers, fetchCampaigns]);

  // ─── Send test email ──────────────────────────────
  const handleTestSend = async () => {
    if (!subject || !content || !testEmail) {
      showToast("error", "Fill in subject, content, and test email.");
      return;
    }
    setTestSending(true);
    try {
      const res = await fetch(`${API}/newsletter/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subject, content, testEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("success", data.message || "Test sent!");
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setTestSending(false);
    }
  };

  // ─── Broadcast to all ─────────────────────────────
  const handleBroadcast = async () => {
    if (!subject || !content) {
      showToast("error", "Subject and content are required.");
      return;
    }
    if (!window.confirm("This will send the newsletter to ALL active subscribers. Continue?")) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/newsletter/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subject, content })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("success", data.message || "Newsletter sent!");
      setSubject("");
      setContent("");
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setSending(false);
    }
  };

  // ─── Build preview HTML ─────────────────────────────
  const previewHtml = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #ddd;">
      <div style="background:#1a1a2e;padding:28px 24px;text-align:center;border-bottom:3px solid #d4af37;">
        <h1 style="color:#d4af37;margin:0;font-size:26px;letter-spacing:2px;font-weight:700;">CROWN FINDINGS</h1>
        <p style="color:#a0a0b8;margin:6px 0 0;font-size:11px;letter-spacing:3px;text-transform:uppercase;">Wholesale Jewelry Findings</p>
      </div>
      <div style="padding:28px 24px;color:#333;line-height:1.7;font-size:15px;">
        ${content || '<em style="color:#999;">Your content will appear here...</em>'}
      </div>
      <div style="background:#f8f9fa;padding:20px 24px;text-align:center;border-top:1px solid #eee;font-size:11px;color:#888;">
        <p style="margin:0 0 8px;">You received this because you subscribed to Crown Findings updates.</p>
        <p style="margin:0;">Members can manage preferences in their Profile. Guests can unsubscribe anytime.</p>
        <p style="margin:10px 0 0;color:#aaa;">&copy; 2026 Crown Findings Co., Inc.</p>
      </div>
    </div>
  `;

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <div className={`${nl.toast} ${toast.type === "success" ? nl.toastSuccess : nl.toastError}`}>
          {toast.type === "success" ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Page header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Newsletter & Broadcasts</h1>
      </div>

      {/* Tabs */}
      <div className={nl.tabs}>
        <button
          className={`${nl.tab} ${tab === "compose" ? nl.tabActive : ""}`}
          onClick={() => setTab("compose")}
        >
          <FiMail /> Compose
        </button>
        <button
          className={`${nl.tab} ${tab === "subscribers" ? nl.tabActive : ""}`}
          onClick={() => setTab("subscribers")}
        >
          <FiUsers /> Subscribers
        </button>
        <button
          className={`${nl.tab} ${tab === "campaigns" ? nl.tabActive : ""}`}
          onClick={() => setTab("campaigns")}
        >
          <FiClock /> Campaign History
        </button>
      </div>

      {/* ═══════════════ COMPOSE TAB ═══════════════ */}
      {tab === "compose" && (
        <div className={nl.composeGrid}>
          {/* Left: Editor */}
          <div className={nl.editorPane}>
            <div className={nl.card}>
              <h3 className={nl.cardTitle}>
                <FiSend style={{ verticalAlign: "middle", marginRight: 8 }} />
                Compose Newsletter
              </h3>

              <div className={styles.formGroup}>
                <label>Subject Line</label>
                <input
                  type="text"
                  className={styles.formControl}
                  placeholder="e.g. New Spring Collection — Now Available"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Email Content (HTML supported)</label>
                <textarea
                  className={`${styles.formControl} ${nl.contentArea}`}
                  placeholder={`<h2>Hello!</h2>\n<p>We're excited to announce our new spring collection...</p>\n<p><a href="https://crownfindings.com/collections">Shop Now →</a></p>`}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={14}
                />
              </div>

              <div className={nl.quickInsert}>
                <span className={nl.quickLabel}>Quick Insert:</span>
                <button
                  className={nl.chipBtn}
                  onClick={() => setContent(c => c + '\n<h2>📢 Announcement Title</h2>\n<p>Your announcement text here.</p>')}
                >
                  Heading
                </button>
                <button
                  className={nl.chipBtn}
                  onClick={() => setContent(c => c + '\n<a href="https://crownfindings.com" style="display:inline-block;padding:12px 28px;background:#1a1a2e;color:#fff;text-decoration:none;font-weight:600;letter-spacing:1px;">SHOP NOW</a>')}
                >
                  CTA Button
                </button>
                <button
                  className={nl.chipBtn}
                  onClick={() => setContent(c => c + '\n<hr style="border:none;border-top:1px solid #ddd;margin:20px 0;" />')}
                >
                  Divider
                </button>
                <button
                  className={nl.chipBtn}
                  onClick={() => setContent(c => c + '\n<img src="https://placehold.co/560x280/1a1a2e/d4af37?text=Crown+Findings" alt="Banner" style="width:100%;max-width:560px;" />')}
                >
                  Image
                </button>
              </div>

              {/* Action buttons */}
              <div className={nl.actions}>
                <button
                  className={nl.previewBtn}
                  onClick={() => setShowPreview(true)}
                  disabled={!content}
                >
                  <FiEye /> Preview
                </button>
                <button
                  className={styles.btnPrimary}
                  onClick={handleBroadcast}
                  disabled={sending || !subject || !content}
                >
                  <FiSend style={{ marginRight: 6 }} />
                  {sending ? "Sending…" : "Send to All Subscribers"}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Test & Info */}
          <div className={nl.sidePane}>
            {/* Test send */}
            <div className={nl.card}>
              <h3 className={nl.cardTitle}>Send Test Email</h3>
              <p className={nl.cardSubtitle}>
                Send a preview to yourself before broadcasting to all subscribers.
              </p>
              <div className={styles.formGroup}>
                <input
                  type="email"
                  className={styles.formControl}
                  placeholder="your@email.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <button
                className={styles.btnSecondary}
                onClick={handleTestSend}
                disabled={testSending || !subject || !content || !testEmail}
                style={{ width: "100%" }}
              >
                {testSending ? "Sending…" : "Send Test"}
              </button>
            </div>

            {/* Mailjet status */}
            <div className={nl.card}>
              <h3 className={nl.cardTitle}>Mailjet Integration</h3>
              <div className={nl.infoRow}>
                <span className={nl.infoDot} />
                <span className={nl.infoText}>
                  Add your <code>MAILJET_API_KEY</code> and <code>MAILJET_SECRET_KEY</code> in the backend <code>.env</code> file to enable real email delivery.
                </span>
              </div>
              <div className={nl.infoRow} style={{ marginTop: 12 }}>
                <span className={nl.infoDot} style={{ background: "#d4af37" }} />
                <span className={nl.infoText}>
                  Without keys configured, sends are <strong>simulated</strong> (logged server-side only).
                </span>
              </div>
            </div>

            {/* Tips */}
            <div className={nl.card}>
              <h3 className={nl.cardTitle}>Tips</h3>
              <ul className={nl.tipsList}>
                <li>Use HTML in the content area for rich formatting</li>
                <li>Always send a test email first</li>
                <li>Keep subject lines under 60 characters</li>
                <li>Include a clear call-to-action</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ SUBSCRIBERS TAB ═══════════════ */}
      {tab === "subscribers" && (
        <div className={nl.card}>
          <div className={nl.cardHeader}>
            <h3 className={nl.cardTitle} style={{ margin: 0 }}>
              <FiUsers style={{ verticalAlign: "middle", marginRight: 8 }} />
              All Subscribers ({subscribers.length})
            </h3>
            <button className={nl.refreshBtn} onClick={fetchSubscribers} disabled={subsLoading}>
              <FiRefreshCw className={subsLoading ? nl.spin : ""} />
            </button>
          </div>

          {subsLoading ? (
            <div className={nl.emptyState}>Loading subscribers…</div>
          ) : subscribers.length === 0 ? (
            <div className={nl.emptyState}>No subscribers yet.</div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Company</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((s) => (
                    <tr key={`${s.type}-${s.id}`}>
                      <td style={{ fontWeight: 600 }}>{s.email}</td>
                      <td>{s.name}</td>
                      <td>{s.company}</td>
                      <td>
                        <span className={`${nl.typeBadge} ${s.type === "member" ? nl.typeMember : nl.typeGuest}`}>
                          {s.type}
                        </span>
                      </td>
                      <td>
                        <span className={`${nl.statusDot} ${s.status === "subscribed" ? nl.statusActive :
                            s.status === "unsubscribed" ? nl.statusInactive : nl.statusDeactivated
                          }`} />
                        {s.status}
                      </td>
                      <td>{new Date(s.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ CAMPAIGNS TAB ═══════════════ */}
      {tab === "campaigns" && (
        <div className={nl.card}>
          <div className={nl.cardHeader}>
            <h3 className={nl.cardTitle} style={{ margin: 0 }}>
              <FiClock style={{ verticalAlign: "middle", marginRight: 8 }} />
              Campaign History
            </h3>
            <button className={nl.refreshBtn} onClick={fetchCampaigns} disabled={campaignsLoading}>
              <FiRefreshCw className={campaignsLoading ? nl.spin : ""} />
            </button>
          </div>

          {campaignsLoading ? (
            <div className={nl.emptyState}>Loading campaigns…</div>
          ) : campaigns.length === 0 ? (
            <div className={nl.emptyState}>No campaigns sent yet. Compose and send your first newsletter!</div>
          ) : (
            <div className={nl.campaignList}>
              {campaigns.map((c) => (
                <div key={c.id} className={nl.campaignItem}>
                  <div
                    className={nl.campaignRow}
                    onClick={() => setExpandedCampaign(expandedCampaign === c.id ? null : c.id)}
                  >
                    <div className={nl.campaignInfo}>
                      <strong>{c.subject}</strong>
                      <span className={nl.campaignMeta}>
                        <FiUsers size={12} /> {c.recipient_count} recipients &nbsp;·&nbsp;
                        <FiClock size={12} /> {new Date(c.sent_at).toLocaleString()}
                      </span>
                    </div>
                    <span className={nl.expandIcon}>
                      {expandedCampaign === c.id ? <FiChevronUp /> : <FiChevronDown />}
                    </span>
                  </div>
                  {expandedCampaign === c.id && (
                    <div className={nl.campaignContent}>
                      <div dangerouslySetInnerHTML={{ __html: c.content || "<em>No content recorded.</em>" }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ PREVIEW MODAL ═══════════════ */}
      {showPreview && (
        <div className={nl.modal} onClick={() => setShowPreview(false)}>
          <div className={nl.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={nl.modalHeader}>
              <h3>Email Preview</h3>
              <button className={nl.modalClose} onClick={() => setShowPreview(false)}>✕</button>
            </div>
            <div className={nl.modalBody}>
              <div className={nl.previewMeta}>
                <strong>Subject:</strong> {subject || "(no subject)"}
              </div>
              <div
                className={nl.previewFrame}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
