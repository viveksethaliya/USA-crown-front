"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiTrash2, FiPlus, FiSearch } from "react-icons/fi";
import { toast } from "react-hot-toast";

interface CustomerGroup {
  id: string;
  name: string;
  description: string;
}

interface Member {
  id: string;
  full_name: string;
  email: string;
  roles: { name: string } | null;
}

export default function CustomerGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();

  const [group, setGroup] = useState<CustomerGroup | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);

  const fetchGroupDetails = async () => {
    try {
      const res = await fetch(`/api/admin/customer-groups/${id}`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) {
          toast.error("Customer group not found");
          router.push("/crown-admin/customer-groups");
          return;
        }
        throw new Error("Failed to fetch customer group details");
      }
      const data = await res.json();
      setGroup(data);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/admin/customer-groups/${id}/members`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch members");
      const data = await res.json();
      setMembers(data || []);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchGroupDetails(), fetchMembers()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${userName} from this group?`)) return;
    try {
      const res = await fetch(`/api/admin/customer-groups/${id}/members/${userId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to remove member");
      toast.success("Member removed");
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSearchUsers = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setIsSearching(true);
    try {
      const isInitialLoad = !searchQuery.trim();
      const limit = isInitialLoad ? 5 : 50;
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(searchQuery.trim())}&limit=${limit}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to search users");
      const data = await res.json();
      
      // Filter out users already in the group
      const existingIds = new Set(members.map(m => m.id));
      const filtered = (data.users || []).filter((u: any) => !existingIds.has(u.id));
      
      setSearchResults(filtered);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (showAddModal) {
      handleSearchUsers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAddModal]);

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleAddMembers = async () => {
    if (selectedUserIds.size === 0) return;
    setIsAdding(true);
    try {
      const res = await fetch(`/api/admin/customer-groups/${id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: Array.from(selectedUserIds) }),
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to add members");
      
      toast.success("Members added successfully");
      setShowAddModal(false);
      setSearchQuery("");
      setSearchResults([]);
      setSelectedUserIds(new Set());
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) return <div style={{ padding: "20px" }}>Loading group details...</div>;
  if (!group) return <div style={{ padding: "20px" }}>Group not found</div>;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "20px" }}>
        <Link href="/crown-admin/customer-groups" style={{ color: "#4b5563", display: "flex", alignItems: "center", textDecoration: "none" }}>
          <FiArrowLeft style={{ marginRight: "5px" }} /> Back
        </Link>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>{group.name} - Members</h1>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <p style={{ color: "#4b5563", margin: 0 }}>{group.description || "No description provided."}</p>
        <button 
          onClick={() => setShowAddModal(true)}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#10b981", color: "white", padding: "10px 16px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
        >
          <FiPlus /> Add Members
        </button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", background: "white", border: "1px solid #e5e7eb" }}>
        <thead style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
          <tr>
            <th style={{ padding: "12px", textAlign: "left" }}>Name</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Email</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Role</th>
            <th style={{ padding: "12px", textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>
                No members found in this group.
              </td>
            </tr>
          ) : (
            members.map(m => (
              <tr key={m.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "12px", fontWeight: "500" }}>{m.full_name}</td>
                <td style={{ padding: "12px", color: "#4b5563" }}>{m.email}</td>
                <td style={{ padding: "12px", color: "#4b5563" }}>{m.roles?.name || "-"}</td>
                <td style={{ padding: "12px", textAlign: "right" }}>
                  <button 
                    onClick={() => handleRemoveMember(m.id, m.full_name)} 
                    style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                    title="Remove from group"
                  >
                    <FiTrash2 /> Remove
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Add Members Modal */}
      {showAddModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "24px", borderRadius: "8px", width: "100%", maxWidth: "600px", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", margin: 0 }}>Add Members to {group.name}</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", lineHeight: 1 }}>&times;</button>
            </div>
            
            <form onSubmit={handleSearchUsers} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, padding: "10px", border: "1px solid #d1d5db", borderRadius: "4px" }}
              />
              <button 
                type="submit"
                disabled={isSearching}
                style={{ background: "#111827", color: "white", padding: "10px 16px", border: "none", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <FiSearch /> {isSearching ? "Searching..." : "Search"}
              </button>
            </form>

            <div style={{ overflowY: "auto", flex: 1, border: "1px solid #e5e7eb", borderRadius: "4px", marginBottom: "20px" }}>
              {searchResults.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>
                  {searchQuery ? "No matching users found (or all matches are already in the group)." : "Search for users to add."}
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    {searchResults.map(user => (
                      <tr key={user.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={{ padding: "12px", width: "40px" }}>
                          <input 
                            type="checkbox" 
                            checked={selectedUserIds.has(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            style={{ cursor: "pointer" }}
                          />
                        </td>
                        <td style={{ padding: "12px" }}>
                          <div style={{ fontWeight: "500" }}>{user.full_name}</div>
                          <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>{user.email}</div>
                        </td>
                        <td style={{ padding: "12px", color: "#4b5563", fontSize: "0.9rem" }}>
                          {user.roles?.name || "No Role"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "auto" }}>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ padding: "10px 16px", border: "1px solid #d1d5db", background: "white", borderRadius: "4px", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button 
                onClick={handleAddMembers}
                disabled={isAdding || selectedUserIds.size === 0}
                style={{ padding: "10px 16px", border: "none", background: "#10b981", color: "white", borderRadius: "4px", cursor: selectedUserIds.size === 0 ? "not-allowed" : "pointer", opacity: selectedUserIds.size === 0 ? 0.5 : 1 }}
              >
                {isAdding ? "Adding..." : `Add Selected (${selectedUserIds.size})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
