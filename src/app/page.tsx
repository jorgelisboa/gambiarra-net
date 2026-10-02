"use client";

import { Login } from "@/components/Login";
import { Shell } from "@/components/Shell";
import { useApp } from "@/lib/store";

export default function Home() {
  const { ready, user, role } = useApp();
  if (!ready) {
    return (
      <main className="flex flex-1 items-center justify-center text-dim">
        <span className="cursor">conectando</span>
      </main>
    );
  }
  return user && role ? <Shell user={user} role={role} /> : <Login />;
}
