"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./account-layout.module.css";
import { FiUser, FiMapPin, FiBriefcase, FiUsers, FiLogOut } from "react-icons/fi";
import { apiUrl } from "@/lib/cart";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSubUser, setIsSubUser] = useState(false);

  useEffect(() => {
    fetch(apiUrl('/api/account/profile'), { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error("Not logged in");
        return r.json();
      })
      .then(data => {
        // If parent_user_id exists, they are a sub-user
        if (data.parent_user_id) {
          setIsSubUser(true);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <h3>My Account</h3>
        <Link
          href="/account/profile"
          className={`${styles.navLink} ${pathname === '/account/profile' ? styles.navLinkActive : ''}`}
        >
          <FiUser /> Profile
        </Link>
        {/* Hide Company, Addresses, and Sub-Users if the current user is a Sub-User */}
        {!isSubUser && (
          <>
            <Link
              href="/account/company"
              className={`${styles.navLink} ${pathname === '/account/company' ? styles.navLinkActive : ''}`}
            >
              <FiBriefcase /> Company Details
            </Link>
            <Link
              href="/account/addresses"
              className={`${styles.navLink} ${pathname === '/account/addresses' ? styles.navLinkActive : ''}`}
            >
              <FiMapPin /> Addresses
            </Link>
            <Link
              href="/account/users"
              className={`${styles.navLink} ${pathname === '/account/users' ? styles.navLinkActive : ''}`}
            >
              <FiUsers /> Sub-Users
            </Link>
          </>
        )}
        <a href="#" onClick={handleLogout} className={styles.navLink} style={{ marginTop: '1rem', color: '#c62828' }}>
          <FiLogOut /> Logout
        </a>
      </aside>

      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
}
