"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function useAuthClaims() {
  const [state, setState] = useState<{
    loading: boolean;
    uid?: string;
    email?: string;
    claims?: any;
  }>({ loading: true });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return setState({ loading: false });
      const t = await u.getIdTokenResult(true);
      setState({
        loading: false,
        uid: u.uid,
        email: u.email || undefined,
        claims: t.claims,
      });
    });
    return () => unsub();
  }, []);

  return state;
}
