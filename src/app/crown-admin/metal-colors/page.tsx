"use client";

import { useEffect, useState } from "react";
import styles from "../admin.module.css";
import { FiSave } from "react-icons/fi";

const API = `${process.env.NEXT_PUBLIC_API_URL}/api/admin`;

interface MetalColorMapping {
  metal_name: string;
  color_hex: string;
}

export default function MetalColorsPage() {
  const [colors, setColors] = useState<Record<string, string>>({});
  const [allMetals, setAllMetals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingMetal, setSavingMetal] = useState<string | null>(null);

  const fetchMetalColors = async () => {
    try {
      const res = await fetch(`${API}/metal-colors`, { credentials: "include" });
      const data = await res.json();
      
      if (data.allMetals) {
        setAllMetals(data.allMetals);
      }
      
      if (data.colors) {
        const colorMap: Record<string, string> = {};
        data.colors.forEach((c: MetalColorMapping) => {
          colorMap[c.metal_name] = c.color_hex;
        });
        setColors(colorMap);
      }
    } catch (err) {
      setError("Failed to load metal colors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetalColors();
  }, []);

  const handleColorChange = (metal: string, newColor: string) => {
    setColors(prev => ({ ...prev, [metal]: newColor }));
  };

  const handleSave = async (metal: string) => {
    setSavingMetal(metal);
    setError("");

    try {
      const colorToSave = colors[metal] || "#cccccc";
      const res = await fetch(`${API}/metal-colors`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ metal_name: metal, color_hex: colorToSave }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save color");
      }
    } catch (err) {
      setError("Network error while saving");
    } finally {
      setSavingMetal(null);
    }
  };

  if (loading) return <div className={styles.emptyState}>Loading metal colors...</div>;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Metal Colors</h1>
      </div>

      <p style={{ color: "#666", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
        Assign display colors for each metal type. These colors are used as swatches on product cards and filters.
      </p>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.tableContainer}>
        <table className={styles.adminTable}>
          <thead>
            <tr>
              <th>Metal Name</th>
              <th>Preview</th>
              <th>Color Code</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allMetals.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.emptyState}>
                  No metal types found in the database.
                </td>
              </tr>
            ) : (
              allMetals.map((metal) => {
                const currentColor = colors[metal] || "#cccccc";
                const isSaving = savingMetal === metal;

                return (
                  <tr key={metal}>
                    <td><strong>{metal}</strong></td>
                    <td>
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          backgroundColor: colors[metal] ? currentColor : "transparent",
                          backgroundImage: colors[metal] ? "none" : "linear-gradient(to bottom right, transparent 45%, #d0d5dd 45%, #d0d5dd 55%, transparent 55%)",
                          border: "1px solid #d0d5dd",
                        }}
                        title={currentColor}
                      ></div>
                    </td>
                    <td>
                      <input
                        type="color"
                        value={currentColor}
                        onChange={(e) => handleColorChange(metal, e.target.value)}
                        style={{ padding: "0", border: "none", width: "40px", height: "40px", cursor: "pointer", background: "none" }}
                      />
                      <span style={{ marginLeft: "10px", fontFamily: "monospace" }}>{currentColor}</span>
                    </td>
                    <td>
                      <button
                        className={styles.btnPrimary}
                        onClick={() => handleSave(metal)}
                        disabled={isSaving}
                        style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", opacity: isSaving ? 0.7 : 1 }}
                      >
                        <FiSave style={{ marginRight: "5px" }} />
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
