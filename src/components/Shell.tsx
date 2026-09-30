"use client";

import { useState } from "react";
import { logout } from "@/lib/store";
import { Characters } from "./Characters";
import { Combat } from "./Combat";
import { NetTab } from "./NetTab";

const TABS = [
  { id: "net", label: "Netrunner" },
  { id: "combat", label: "Combate" },
  { id: "chars", label: "Personagens" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function Shell({ user }: { user: string }) {
  const [tab, setTab] = useState<TabId>("combat");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-wrap items-center gap-4 border-b border-line bg-ink-900 px-5 py-3">
        <span className="text-xl font-black tracking-tight text-neon">
          Gambiarra<span className="text-ice">.net</span>
        </span>
        <nav className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm uppercase tracking-wider ${
                tab === t.id
                  ? "border-b-2 border-neon text-neon"
                  : "border-b-2 border-transparent text-muted hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm text-muted">
          <span>
            @<span className="text-white">{user}</span>
          </span>
          <button className="btn btn-danger" onClick={logout}>
            Sair
          </button>
        </div>
      </header>
      <main className="flex-1 p-5">
        {tab === "net" && <NetTab />}
        {tab === "combat" && <Combat />}
        {tab === "chars" && <Characters />}
      </main>
    </div>
  );
}
