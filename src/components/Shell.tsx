"use client";

import { useState } from "react";
import { logout, useApp } from "@/lib/store";
import type { UserRole } from "@/lib/types";
import { Characters } from "./Characters";
import { Combat } from "./Combat";
import { NetTab } from "./net/NetTab";

const TABS = [
  { id: "net", label: "netrunner", roles: ["mestre"] },
  { id: "combat", label: "combate", roles: ["mestre"] },
  { id: "chars", label: "personagens", roles: ["mestre", "jogador"] },
] as const satisfies readonly { id: string; label: string; roles: readonly UserRole[] }[];

type TabId = (typeof TABS)[number]["id"];

export function Shell({ user, role }: { user: string; role: UserRole }) {
  const { syncError } = useApp();
  const tabs = TABS.filter((t) => (t.roles as readonly UserRole[]).includes(role));
  const [tab, setTab] = useState<TabId>(role === "mestre" ? "combat" : "chars");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b-2 border-line px-3 py-3 sm:px-5">
        <span className="font-pixel cursor text-xl">
          gambiarra<span className="text-net">.net</span>
        </span>
        {tabs.length > 1 && (
          <nav
            className="order-last -mx-3 flex w-[calc(100%+1.5rem)] gap-1 overflow-x-auto px-3 sm:order-none sm:mx-0 sm:w-auto sm:px-0"
            aria-label="seções"
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
                className={`shrink-0 px-3 py-1 ${
                  tab === t.id ? "bg-red text-black" : "glitch-hover text-dim hover:text-fg"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        )}
        <div className="ml-auto flex items-center gap-3 text-dim">
          <span className="min-w-0 truncate">
            <span className={role === "mestre" ? "text-red" : "text-net"}>{role}</span>
            <span className="hidden sm:inline"> · </span>
            <span className="hidden sm:inline">
              @<span className="text-fg">{user}</span>
            </span>
          </span>
          {syncError && (
            <span className="text-red" title={syncError}>
              offline
            </span>
          )}
          <button className="btn btn-danger" onClick={() => void logout()}>
            sair
          </button>
        </div>
      </header>
      <main className="flex-1 p-3 sm:p-5">
        {tab === "net" && <NetTab />}
        {tab === "combat" && <Combat />}
        {tab === "chars" && <Characters />}
      </main>
    </div>
  );
}
