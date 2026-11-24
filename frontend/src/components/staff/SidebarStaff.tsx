"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookPlus,
  Users,
  ShieldCheck,
  BookOpen,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { User } from "@/types";

interface SidebarStaffProps {
  user: User;
}

export function SidebarStaff({ user }: SidebarStaffProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await apiClient("/api/auth/logout", { method: "POST" });
      router.push("/staff/login");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  }

  const isAdmin = user.role === "admin";

  const novelisLinks = [
    {
      label: "Dashboard Penulis",
      href: "/staff/novelis/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Tambah Novel Baru",
      href: "/staff/novelis/novel/create",
      icon: BookPlus,
    },
  ];

  const adminLinks = [
    {
      label: "Statistik & Moderasi",
      href: "/staff/admin/dashboard",
      icon: ShieldCheck,
    },
    {
      label: "Kelola Pengguna",
      href: "/staff/admin/users",
      icon: Users,
    },
    {
      label: "Kelola Novel & Genre",
      href: "/staff/admin/novels",
      icon: BookOpen,
    },
  ];

  return (
    <aside className="w-64 bg-[#0F172A] text-slate-200 flex flex-col justify-between border-r border-slate-800 shrink-0 min-h-screen">
      <div className="p-5 space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-extrabold shadow-md">
            NP
          </div>
          <div className="min-w-0">
            <span className="font-sans font-bold text-sm text-white tracking-tight block">
              Portal Staff
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-mono">
              Web Baca Novel
            </span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-3">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.display_name}
              className="w-9 h-9 rounded-full object-cover border border-slate-700"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
              {user.display_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{user.display_name}</p>
            <span
              className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                isAdmin ? "bg-amber-500/20 text-amber-300" : "bg-indigo-500/20 text-indigo-300"
              }`}
            >
              {user.role}
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="space-y-6">
          {/* Author Section */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block">
              Menu Novelis
            </span>
            {novelisLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Admin Section */}
          {isAdmin && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block">
                Menu Administrator
              </span>
              {adminLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-primary text-white shadow-sm"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer Actions */}
      <div className="p-4 border-t border-slate-800 space-y-1">
        <Link
          href="/"
          target="_blank"
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Lihat Web Publik</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Sesi</span>
        </button>
      </div>
    </aside>
  );
}
