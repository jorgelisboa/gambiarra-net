"use client";

import { Login } from "@/components/Login";
import { Shell } from "@/components/Shell";
import { useApp } from "@/lib/store";

export default function Home() {
  const { ready, user, role } = useApp();
  if (!ready) return null;
  return user && role ? <Shell user={user} role={role} /> : <Login />;
}
