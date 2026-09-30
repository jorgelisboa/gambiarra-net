"use client";

import { Login } from "@/components/Login";
import { Shell } from "@/components/Shell";
import { useApp } from "@/lib/store";

export default function Home() {
  const { ready, user } = useApp();
  if (!ready) return null;
  return user ? <Shell user={user} /> : <Login />;
}
