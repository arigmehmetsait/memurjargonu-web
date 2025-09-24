"use client";
import { useRouter } from "next/router";
import { ReactNode, useEffect } from "react";
import { useAuthClaims } from "@/hooks/useAuthClaims";

export default function AdminGuard({ children }: { children: ReactNode }) {
  const { loading, claims } = useAuthClaims();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!claims?.admin) router.replace("/login");
  }, [loading, claims, router]);

  if (loading) return <div style={{ padding: 16 }}>Yükleniyor…</div>;
  if (!claims?.admin) return <div style={{ padding: 16 }}>Yetki yok.</div>;
  return <>{children}</>;
}
