"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./admin.module.css";
import {
  FiMenu, FiGrid, FiFileText, FiUsers, FiSettings, FiLogOut, FiLayers, FiMail, FiImage, FiPackage
} from "react-icons/fi";

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<{ username: string } | null>(null);

  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/crown-admin/login";

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/check-session`, {
          credentials: "include"
        });
        const data = await res.json();

        if (data.authenticated) {
          setAdminUser(data.admin);
          if (isLoginPage) {
            router.push("/crown-admin");
          } else {
            setLoading(false);
          }
        } else {
          setAdminUser(null);
          if (!isLoginPage) {
            router.push("/crown-admin/login");
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Session check failed", err);
        if (!isLoginPage) {
          router.push("/crown-admin/login");
        } else {
          setLoading(false);
        }
      }
    };

    checkSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/logout`, {
        method: "POST",
        credentials: "include"
      });
      router.push("/crown-admin/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  if (loading) {
    return <div className={styles.loader}>Loading...</div>;
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className={styles.adminContainer}>
      <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}>
        <div className={styles.brand}>
          <h2>Crown Admin</h2>
          <button
            className={styles.toggleBtn}
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle Sidebar"
          >
            <FiMenu />
          </button>
        </div>

        <nav>
          <ul className={styles.navLinks}>
            <li>
              <Link
                href="/crown-admin"
                className={`${styles.navLink} ${pathname === "/crown-admin" ? styles.navLinkActive : ""}`}
              >
                <span className={styles.navLinkIcon}><FiGrid /></span>
                <span className={styles.navLinkText}>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link
                href="/crown-admin/products"
                className={`${styles.navLink} ${pathname.startsWith("/crown-admin/products") ? styles.navLinkActive : ""}`}
              >
                <span className={styles.navLinkIcon}><FiPackage /></span>
                <span className={styles.navLinkText}>Products</span>
              </Link>
            </li>
            <li>
              <Link
                href="/crown-admin/blogs"
                className={`${styles.navLink} ${pathname.startsWith("/crown-admin/blogs") ? styles.navLinkActive : ""}`}
              >
                <span className={styles.navLinkIcon}><FiFileText /></span>
                <span className={styles.navLinkText}>Blogs</span>
              </Link>
            </li>
            <li>
              <Link
                href="/crown-admin/registrations"
                className={`${styles.navLink} ${pathname.startsWith("/crown-admin/registrations") ? styles.navLinkActive : ""}`}
              >
                <span className={styles.navLinkIcon}><FiUsers /></span>
                <span className={styles.navLinkText}>Registrations</span>
              </Link>
            </li>
            <li>
              <Link
                href="/crown-admin/collections"
                className={`${styles.navLink} ${pathname.startsWith("/crown-admin/collections") ? styles.navLinkActive : ""}`}
              >
                <span className={styles.navLinkIcon}><FiLayers /></span>
                <span className={styles.navLinkText}>Collections</span>
              </Link>
            </li>
            <li>
              <Link
                href="/crown-admin/banners"
                className={`${styles.navLink} ${pathname.startsWith("/crown-admin/banners") ? styles.navLinkActive : ""}`}
              >
                <span className={styles.navLinkIcon}><FiImage /></span>
                <span className={styles.navLinkText}>Banners</span>
              </Link>
            </li>
            <li>
              <Link
                href="/crown-admin/newsletter"
                className={`${styles.navLink} ${pathname.startsWith("/crown-admin/newsletter") ? styles.navLinkActive : ""}`}
              >
                <span className={styles.navLinkIcon}><FiMail /></span>
                <span className={styles.navLinkText}>Newsletter</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.topbar}>
          <div className={styles.userMenu}>
            <span className={styles.userName}>{adminUser?.username || "Admin"}</span>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              <FiLogOut style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Logout
            </button>
          </div>
        </header>

        <div className={styles.pageContent}>
          {children}
        </div>
      </main>
    </div>
  );
}
