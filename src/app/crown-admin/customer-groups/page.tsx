"use client";

import { useState, useEffect } from "react";
import { apiUrl } from "@/lib/cart";
import styles from "../discounts/discounts.module.css"; // Reuse if exists, else we use inline styles

interface CustomerGroup {
  id: string;
  name: string;
  description: string;
}

export default function CustomerGroupsPage() {
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchGroups = async () => {
    try {
      const res = await fetch(apiUrl("/api/admin/customer-groups"), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch customer groups");
      const data = await res.json();
      setGroups(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setError("");
  };

  const handleEdit = (g: CustomerGroup) => {
    setEditingId(g.id);
    setName(g.name);
    setDescription(g.description || "");
    setError("");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this group?")) return;
    try {
      const res = await fetch(apiUrl(`/api/admin/customer-groups/${id}`), {
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to delete group");
      fetchGroups();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/admin/customer-groups/${editingId}` : "/api/admin/customer-groups";
      
      const res = await fetch(apiUrl(url), {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
        credentials: "include"
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save customer group");
      }

      resetForm();
      fetchGroups();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: "20px" }}>Loading customer groups...</div>;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>Customer Groups</h1>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #ef4444", color: "#b91c1c", padding: "10px", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "30px" }}>
        <div>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "white", border: "1px solid #e5e7eb" }}>
            <thead style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
              <tr>
                <th style={{ padding: "12px", textAlign: "left" }}>Group Name</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Description</th>
                <th style={{ padding: "12px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>
                    No customer groups found.
                  </td>
                </tr>
              ) : (
                groups.map(g => (
                  <tr key={g.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "12px", fontWeight: "500" }}>{g.name}</td>
                    <td style={{ padding: "12px", color: "#4b5563" }}>{g.description || "-"}</td>
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      <button onClick={() => handleEdit(g)} style={{ color: "#2563eb", marginRight: "10px", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                      <button onClick={() => handleDelete(g.id)} style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer" }}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ background: "white", border: "1px solid #e5e7eb", padding: "20px", alignSelf: "start" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "15px" }}>
            {editingId ? "Edit Group" : "Add New Group"}
          </h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "bold" }}>Group Name *</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                placeholder="e.g. Wholesale Level 1"
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "bold" }}>Description</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Optional description"
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", minHeight: "80px" }}
              />
            </div>
            
            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button 
                type="submit" 
                disabled={saving}
                style={{ flex: 1, background: "#111827", color: "white", padding: "10px", border: "none", cursor: "pointer", fontWeight: "bold" }}
              >
                {saving ? "Saving..." : (editingId ? "Update Group" : "Add Group")}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={resetForm}
                  style={{ flex: 1, background: "#f3f4f6", color: "#374151", padding: "10px", border: "1px solid #d1d5db", cursor: "pointer" }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
