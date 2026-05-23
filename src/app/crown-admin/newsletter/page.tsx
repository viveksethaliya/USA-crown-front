"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import styles from "../admin.module.css";
import nl from "./newsletter.module.css";
import {
  FiSend, FiUsers, FiClock, FiMail, FiCheckCircle, FiAlertCircle,
  FiChevronDown, FiChevronUp, FiEye, FiRefreshCw, FiX
} from "react-icons/fi";

const API = '/api/admin';

import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <p style={{ padding: 20 }}>Loading editor...</p>,
});

const QuillEditor = ReactQuill as React.ComponentType<any>;
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
  const router = useRouter();
  const quillRef = useRef<any>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const testEmailRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("compose");

  // Compose state
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [errorField, setErrorField] = useState("");

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

  // ─── Custom Image Handler ─────────────────────────────
  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files ? input.files[0] : null;
      if (!file) return;

      const formData = new FormData();
      formData.append("image", file);

      try {
        const res = await fetch(`${API}/upload-image`, {
          method: "POST",
          body: formData,
          credentials: "include"
        });

        if (res.status === 401) {
          alert("Session expired. Please log in again.");
          router.push("/crown-admin/login");
          return;
        }

        const data = await res.json();

        if (res.ok && data.url) {
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, "image", data.url);
          }
        } else {
          alert(data.error || "Image upload failed");
        }
      } catch (err) {
        console.error("Upload error", err);
        alert("Image upload failed");
      }
    };
  }, [router]);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  }), [imageHandler]);

  // ─── Send test email ──────────────────────────────
  const handleTestSend = async () => {
    if (!subject.trim()) {
      showToast("error", "Subject line is required.");
      setErrorField("subject");
      if (subjectRef.current) {
        subjectRef.current.focus();
      }
      return;
    }
    if (!content || content === "<p><br></p>") {
      showToast("error", "Email content is required.");
      quillRef.current?.focus();
      return;
    }
    if (!testEmail.trim()) {
      showToast("error", "Test email address is required.");
      setErrorField("testEmail");
      testEmailRef.current?.focus();
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
    if (!subject.trim()) {
      showToast("error", "Subject line is required.");
      setErrorField("subject");
      if (subjectRef.current) {
        subjectRef.current.focus();
      }
      return;
    }
    if (!content || content === "<p><br></p>") {
      showToast("error", "Email content is required.");
      quillRef.current?.focus();
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
                  ref={subjectRef}
                  type="text"
                  className={`${styles.formControl} ${errorField === 'subject' ? nl.errorBlink : ''}`}
                  placeholder="e.g. New Spring Collection — Now Available"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  onAnimationEnd={() => setErrorField('')}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Email Content</label>
                <div style={{ background: '#fff', borderRadius: '4px', overflow: 'hidden', border: '1px solid #333' }}>
                  <QuillEditor
                    ref={quillRef}
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    modules={modules}
                    style={{ minHeight: '350px' }}
                  />
                </div>
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
                  disabled={sending}
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
                  ref={testEmailRef}
                  type="email"
                  className={`${styles.formControl} ${errorField === 'testEmail' ? nl.errorBlink : ''}`}
                  placeholder="your@email.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  onAnimationEnd={() => setErrorField('')}
                />
              </div>
              <button
                className={styles.btnSecondary}
                onClick={handleTestSend}
                disabled={testSending}
                style={{ width: "100%" }}
              >
                {testSending ? "Sending…" : "Send Test"}
              </button>
            </div>

            {/* Tips */}
            <div className={nl.card}>
              <h3 className={nl.cardTitle}>Tips</h3>
              <ul className={nl.tipsList}>
                <li>Use the toolbar to easily format text, add lists, or insert links</li>
                <li>Upload custom images directly from your computer</li>
                <li>Always send a test email first to review your layout</li>
                <li>Keep subject lines under 60 characters</li>
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
              <button className={nl.modalClose} onClick={() => setShowPreview(false)}><FiX /></button>
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
