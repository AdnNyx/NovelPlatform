"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { User } from "@/types";
import { SidebarStaff } from "@/components/staff/SidebarStaff";

export default function StaffRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  // Authentication & RBAC Guard
  useEffect(() => {
    let isMounted = true;
    const isAuthRoute =
      pathname === "/staff/login" || pathname === "/staff/verify-otp";

    async function checkStaffAuth() {
      if (isAuthRoute) {
        if (isMounted) setCheckingAuth(false);
        return;
      }

      try {
        const res = await apiClient<{ status: string; data: User | null }>("/api/auth/me");
        const currentUser = res.data;

        if (!currentUser) {
          router.push("/staff/login");
          return;
        }

        // Pembaca cannot access staff portal
        if (currentUser.role === "pembaca") {
          router.push("/staff/login");
          return;
        }

        // Admin-only routes
        if (pathname.startsWith("/staff/admin") && currentUser.role !== "admin") {
          router.push("/staff/novelis/dashboard");
          return;
        }

        if (isMounted) {
          setUser(currentUser);
          setCheckingAuth(false);
        }
      } catch (err) {
        router.push("/staff/login");
      }
    }

    checkStaffAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  // Auth routes (Login & OTP) render standalone without sidebar
  const isAuthPage =
    pathname === "/staff/login" || pathname === "/staff/verify-otp";

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        {/* Strict Guardrail: NO Lenis and NO GSAP */}
        {children}
      </div>
    );
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-400 flex items-center justify-center text-xs animate-pulse">
        Memverifikasi kredensial staff...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-900">
      {/* High-density Utilitarian Staff Sidebar */}
      <SidebarStaff user={user} />
      {/* Main Utilitarian Dashboard Work Area */}
      <main className="flex-1 min-w-0 p-6 sm:p-8 lg:p-10 overflow-y-auto max-h-screen">
        {children}
      </main>
    </div>
  );
}
