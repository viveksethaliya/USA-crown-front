"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./admin.module.css";
import {
  FiMenu, FiGrid, FiFileText, FiUsers, FiSettings, FiLogOut, FiLayers, FiMail, FiImage, FiPackage, FiShoppingCart, FiPercent,
  FiList, FiTag, FiSliders, FiShield, FiUserPlus, FiFolder, FiShoppingBag
} from "react-icons/fi";

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<{ email: string, name?: string, role?: string } | null>(null);

  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/crown-admin/login";

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch(`/api/admin/check-session`, {
          credentials: "include"
        });

        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server returned non-JSON response");
        }

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
      await fetch(`/api/admin/logout`, {
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

  const role = adminUser?.role || '';
  const isSuperAdmin = role === 'super_admin';
  const isCatalog = isSuperAdmin || role === 'catalog_manager';
  const isOrders = isSuperAdmin || role === 'order_manager';

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
            {/* Store Group */}
            <li className={styles.navGroupTitle}>Store</li>
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
                href="/crown-admin/orders"
                className={`${styles.navLink} ${pathname.startsWith("/crown-admin/orders") ? styles.navLinkActive : ""}`}
              >
                <span className={styles.navLinkIcon}><FiShoppingCart /></span>
                <span className={styles.navLinkText}>Orders</span>
              </Link>
            </li>
            <li>
              <Link
                href="/crown-admin/carts"
                className={`${styles.navLink} ${pathname.startsWith("/crown-admin/carts") ? styles.navLinkActive : ""}`}
              >
                <span className={styles.navLinkIcon}><FiShoppingBag /></span>
                <span className={styles.navLinkText}>Carts</span>
              </Link>
            </li>

            {isCatalog && (<>           {/* Products Group */}
              <li className={styles.navGroupTitle}>Products</li>
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
                  href="/crown-admin/categories"
                  className={`${styles.navLink} ${pathname.startsWith("/crown-admin/categories") ? styles.navLinkActive : ""}`}
                >
                  <span className={styles.navLinkIcon}><FiList /></span>
                  <span className={styles.navLinkText}>Categories</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/crown-admin/tags"
                  className={`${styles.navLink} ${pathname.startsWith("/crown-admin/tags") ? styles.navLinkActive : ""}`}
                >
                  <span className={styles.navLinkIcon}><FiTag /></span>
                  <span className={styles.navLinkText}>Tags</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/crown-admin/attributes"
                  className={`${styles.navLink} ${pathname.startsWith("/crown-admin/attributes") ? styles.navLinkActive : ""}`}
                >
                  <span className={styles.navLinkIcon}><FiSliders /></span>
                  <span className={styles.navLinkText}>Attributes</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/crown-admin/metal-colors"
                  className={`${styles.navLink} ${pathname.startsWith("/crown-admin/metal-colors") ? styles.navLinkActive : ""}`}
                >
                  <span className={styles.navLinkIcon}><FiSettings /></span>
                  <span className={styles.navLinkText}>Metal Colors</span>
                </Link>
              </li>

            </>)}         {isCatalog && (<>           {/* Content/Marketing Group */}
              <li className={styles.navGroupTitle}>Content/Marketing</li>
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
                  href="/crown-admin/banners"
                  className={`${styles.navLink} ${pathname.startsWith("/crown-admin/banners") ? styles.navLinkActive : ""}`}
                >
                  <span className={styles.navLinkIcon}><FiImage /></span>
                  <span className={styles.navLinkText}>Banners</span>
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
                  href="/crown-admin/discounts"
                  className={`${styles.navLink} ${pathname.startsWith("/crown-admin/discounts") ? styles.navLinkActive : ""}`}
                >
                  <span className={styles.navLinkIcon}><FiPercent /></span>
                  <span className={styles.navLinkText}>Discounts</span>
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

            </>)}            {isSuperAdmin && (<>          {/* Customers Group */}
              <li className={styles.navGroupTitle}>Customers</li>
              <li>
                <Link
                  href="/crown-admin/users"
                  className={`${styles.navLink} ${pathname.startsWith("/crown-admin/users") ? styles.navLinkActive : ""}`}
                >
                  <span className={styles.navLinkIcon}><FiUsers /></span>
                  <span className={styles.navLinkText}>Users</span>
                </Link>
              </li>

              <li>
                <Link
                  href="/crown-admin/registrations"
                  className={`${styles.navLink} ${pathname.startsWith("/crown-admin/registrations") ? styles.navLinkActive : ""}`}
                >
                  <span className={styles.navLinkIcon}><FiUserPlus /></span>
                  <span className={styles.navLinkText}>Registrations</span>
                </Link>
              </li>

            </>)}

            {isSuperAdmin && (<>
              {/* Settings/System Group */}
              <li className={styles.navGroupTitle}>Settings/System</li>
              <li>
                <Link
                  href="/crown-admin/media"
                  className={`${styles.navLink} ${pathname.startsWith("/crown-admin/media") ? styles.navLinkActive : ""}`}
                >
                  <span className={styles.navLinkIcon}><FiFolder /></span>
                  <span className={styles.navLinkText}>Media Library</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/crown-admin/roles"
                  className={`${styles.navLink} ${pathname.startsWith("/crown-admin/roles") ? styles.navLinkActive : ""}`}
                >
                  <span className={styles.navLinkIcon}><FiShield /></span>
                  <span className={styles.navLinkText}>Roles & Permissions</span>
                </Link>
              </li>
            </>)}
          </ul>
        </nav>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.topbar}>
          <div className={styles.userMenu}>
            <span className={styles.userName}>{adminUser?.name || adminUser?.email || "Admin"}</span>
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
