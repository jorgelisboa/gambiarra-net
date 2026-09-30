"use client";

import { useState } from "react";
import { logout } from "@/lib/store";
import { Characters } from "./Characters";
import { Combat } from "./Combat";
import { NetTab } from "./NetTab";

const TABS = [
  { id: "net", label: "netrunner" },
  { id: "combat", label: "combate" },
  { id: "chars", label: "personagens" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function Shell({ user }: { user: string }) {
  const [tab, setTab] = useState<TabId>("combat");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b-2 border-line px-5 py-3">
        <span className="font-pixel cursor text-xl">
          gambiarra<span className="text-net">.net</span>
        </span>
        <nav className="flex gap-1" aria-label="seções">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`px-3 py-1 ${
                tab === t.id
                  ? "bg-red text-black"
                  : "text-dim hover:text-fg"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-dim">
          <span>
            @<span className="text-fg">{user}</span>
          </span>
          <button className="btn btn-danger" onClick={logout}>
            sair
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
