"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BannerEditor from "../../BannerEditor";
import adminStyles from "../../../admin.module.css";

export default function EditBannerPage() {
  const params = useParams();
  const bannerId = params.id as string;

  const [banner, setBanner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/banners/${bannerId}`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("Banner not found");
        const data = await res.json();
        setBanner(data.banner);
      } catch (err) {
        setError("Could not load banner data.");
      } finally {
        setLoading(false);
      }
    };

    if (bannerId) fetchBanner();
  }, [bannerId]);

  if (loading) return <div>Loading banner...</div>;
  if (error) return <div className={adminStyles.errorMessage}>{error}</div>;
  if (!banner) return <div className={adminStyles.errorMessage}>Banner not found</div>;

  return <BannerEditor initialData={banner} isEdit />;
}
