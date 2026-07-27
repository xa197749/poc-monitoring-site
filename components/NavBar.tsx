"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

interface NavBarProps {
  username: string;
}

export default function NavBar({ username }: NavBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const navLinks = [
    { href: "/dashboard", label: "ダッシュボード" },
    { href: "/features/page-a", label: "機能A" },
    { href: "/features/page-b", label: "機能B" },
    { href: "/features/page-c", label: "機能C" },
    { href: "/settings", label: "設定" },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-bold text-blue-600 text-sm">POC Monitor</span>
        <div className="flex gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-testid={`nav-${link.label}`}
              className={`text-sm transition-colors ${
                pathname === link.href || pathname.startsWith(link.href + "/")
                  ? "text-blue-600 font-medium"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">{username}</span>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          data-testid="logout-button"
          className="text-sm text-gray-500 hover:text-red-600 transition-colors"
        >
          {loggingOut ? "..." : "ログアウト"}
        </button>
      </div>
    </nav>
  );
}
