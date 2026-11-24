"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Bell, User as UserIcon, LogOut, CheckCheck } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { User, NotificationItem } from "@/types";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch current session and notifications on mount
  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const res = await apiClient<{ status: string; data: User | null }>("/api/auth/me");
        if (isMounted && res.data) {
          setUser(res.data);
          // Load notifications if user is authenticated
          loadNotifications();
        }
      } catch {
        // Guest mode
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  async function loadNotifications() {
    try {
      const res = await apiClient<{
        status: string;
        data: { notifications: NotificationItem[]; unread_count: number };
      }>("/api/notifications");
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch {
      // Ignore notif fetch errors
    }
  }

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleMarkAllRead() {
    try {
      await apiClient("/api/notifications/read-all", { method: "PUT" });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleMarkOneRead(id: string) {
    try {
      await apiClient(`/api/notifications/${id}/read`, { method: "PUT" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleLogout() {
    try {
      await apiClient("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Logout failed", err);
    }
  }

  const navLinks = [
    { label: "Beranda", href: "/" },
    { label: "Katalog", href: "/katalog" },
    { label: "Ranking", href: "/ranking" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-border-subtle shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/25 group-hover:bg-primary-hover transition-colors">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="font-sans font-extrabold text-lg text-text-primary tracking-tight">
              Novel<span className="text-primary">Publik</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] text-text-secondary font-medium block -mt-1 tracking-wider uppercase">
              Baca Gratis Tanpa Batas
            </span>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-text-secondary hover:text-text-primary hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Notification & User Menu */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-gray-100 relative transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Notifikasi"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-border-subtle rounded-xl shadow-xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-border-subtle flex items-center justify-between">
                      <span className="font-bold text-sm text-text-primary">Notifikasi</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Tandai semua dibaca
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-text-secondary">
                          Belum ada notifikasi baru.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleMarkOneRead(n.id)}
                            className={`p-3.5 hover:bg-gray-50 cursor-pointer transition-colors ${
                              !n.is_read ? "bg-indigo-50/40" : ""
                            }`}
                          >
                            <p className="text-xs font-semibold text-text-primary">{n.title}</p>
                            <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-gray-400 mt-1 block">
                              {new Date(n.created_at).toLocaleDateString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.display_name}
                      className="w-8 h-8 rounded-full object-cover border border-border-subtle"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                      {user.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline-block text-sm font-semibold text-text-primary max-w-[120px] truncate">
                    {user.display_name}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-border-subtle rounded-xl shadow-xl py-1.5 z-50">
                    <div className="px-4 py-2 border-b border-border-subtle">
                      <p className="text-xs font-bold text-text-primary truncate">
                        {user.display_name}
                      </p>
                      <p className="text-[11px] text-text-secondary truncate">{user.email}</p>
                    </div>

                    <Link
                      href="/profil"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-text-primary hover:bg-gray-50 flex items-center gap-2"
                    >
                      <UserIcon className="w-4 h-4 text-text-secondary" />
                      Profil & Rak Buku
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-border-subtle"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      Keluar
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-sm transition-all shadow-primary/20 hover:shadow-md"
            >
              Masuk
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
