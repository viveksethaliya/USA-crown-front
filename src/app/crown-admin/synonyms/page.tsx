"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import { ADMIN_API as API } from "@/lib/config";


interface Synonym {
  id: number;
  term: string;
  synonyms: string[];
}

export default function SynonymsPage() {
  const [synonymsList, setSynonymsList] = useState<Synonym[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formTerm, setFormTerm] = useState("");
  const [formSynonyms, setFormSynonyms] = useState("");

  const fetchSynonyms = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API}/synonyms`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSynonymsList(data.synonyms || []);
      }
    } catch (err) {
      toast.error("Failed to load synonyms");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSynonyms();
  }, []);

  const handleSave = async () => {
    if (!formTerm.trim()) return toast.error("Term is required");
    const parsedSynonyms = formSynonyms.split(",").map(s => s.trim()).filter(Boolean);
    if (parsedSynonyms.length === 0) return toast.error("At least one synonym is required");

    try {
      const token = localStorage.getItem("adminToken");
      const method = editingId ? "PUT" : "POST";
      const url = editingId 
        ? `${API}/synonyms/${editingId}`
        : `${API}/synonyms`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          term: formTerm,
          synonyms: parsedSynonyms
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save");
      }
      
      toast.success("Synonym rule saved!");
      setIsAdding(false);
      setEditingId(null);
      setFormTerm("");
      setFormSynonyms("");
      fetchSynonyms();
    } catch (err: any) {
      toast.error(err.message || "Error saving synonym rule");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this synonym rule?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API}/synonyms/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error();
      toast.success("Deleted successfully");
      fetchSynonyms();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const startEdit = (item: Synonym) => {
    setEditingId(item.id);
    setFormTerm(item.term);
    setFormSynonyms(item.synonyms.join(", "));
    setIsAdding(true);
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormTerm("");
    setFormSynonyms("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#312f2c]">Search Synonyms</h1>
          <p className="text-[#312f2c]/60 mt-1">Manage bidirectional word groups to expand search queries.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-[#d1a054] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#b88c49] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Rule
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white/60 border border-white/60 p-6 rounded-3xl shadow-sm space-y-4">
          <h2 className="text-lg font-bold">{editingId ? "Edit Rule" : "New Synonym Rule"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Base Term</label>
              <input 
                type="text" 
                placeholder="e.g. laptop"
                value={formTerm}
                onChange={e => setFormTerm(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-black/10 focus:border-[#d1a054] focus:ring-1 focus:ring-[#d1a054] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Synonyms (comma separated)</label>
              <input 
                type="text" 
                placeholder="e.g. notebook, macbook, computer"
                value={formSynonyms}
                onChange={e => setFormSynonyms(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-black/10 focus:border-[#d1a054] focus:ring-1 focus:ring-[#d1a054] outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 bg-[#312f2c] text-white px-6 py-2 rounded-xl font-medium hover:bg-[#312f2c]/80 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Rule
            </button>
            <button 
              onClick={cancelEdit}
              className="flex items-center gap-2 px-6 py-2 rounded-xl font-medium text-[#312f2c]/60 hover:bg-black/5 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white/60 border border-white/60 rounded-3xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-black/50">Loading...</div>
        ) : synonymsList.length === 0 ? (
          <div className="p-8 text-center text-black/50">No synonym rules defined yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/5 border-b border-black/5">
                <th className="p-4 font-semibold text-sm">Base Term</th>
                <th className="p-4 font-semibold text-sm">Synonyms</th>
                <th className="p-4 font-semibold text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {synonymsList.map(item => (
                <tr key={item.id} className="border-b border-black/5 last:border-0 hover:bg-white/40">
                  <td className="p-4 font-medium">{item.term}</td>
                  <td className="p-4 text-black/70">
                    <div className="flex flex-wrap gap-2">
                      {item.synonyms.map((s, i) => (
                        <span key={i} className="px-2 py-1 bg-black/5 rounded-md text-xs font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => startEdit(item)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mr-2 inline-flex"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
