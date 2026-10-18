"use client";

import { useState } from "react";
import { t } from "@/i18n";
import { logout, useApp } from "@/lib/store";
import type { UserRole } from "@/lib/types";
import { Characters } from "./Characters";
import { Combat } from "./Combat";
import { InfraTab } from "./infra/InfraTab";
import { NetTab } from "./net/NetTab";

const TABS = [
  { id: "net", roles: ["mestre"] },
  { id: "infra", roles: ["mestre"] },
  { id: "combat", roles: ["mestre"] },
  { id: "chars", roles: ["mestre", "jogador"] },
] as const satisfies readonly { id: keyof typeof t.shell.nav.tabs; roles: readonly UserRole[] }[];

type TabId = (typeof TABS)[number]["id"];

export function Shell({ user, role }: { user: string; role: UserRole }) {
  const { syncError } = useApp();
  const tabs = TABS.filter((x) => (x.roles as readonly UserRole[]).includes(role));
  const [tab, setTab] = useState<TabId>(role === "mestre" ? "combat" : "chars");
  /** Arquitetura que a aba infra pediu pra abrir no construtor da aba netrunner. */
  const [focusArch, setFocusArch] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b-2 border-line px-3 py-3 sm:px-5">
        <span className="font-pixel cursor text-xl">
          gambiarra<span className="text-net">.net</span>
        </span>
        {tabs.length > 1 && (
          <nav
            className="order-last -mx-3 flex w-[calc(100%+1.5rem)] gap-1 overflow-x-auto px-3 sm:order-none sm:mx-0 sm:w-auto sm:px-0"
            aria-label={t.shell.nav.aria}
          >
            {tabs.map((x) => (
              <button
                key={x.id}
                onClick={() => {
                  // trocar de aba na mão volta o construtor pra primeira arquitetura, como antes
                  setFocusArch(null);
                  setTab(x.id);
                }}
                aria-current={tab === x.id ? "page" : undefined}
                className={`shrink-0 px-3 py-1 ${
                  tab === x.id ? "bg-red text-black" : "glitch-hover text-dim hover:text-fg"
                }`}
              >
                {t.shell.nav.tabs[x.id]}
              </button>
            ))}
          </nav>
        )}
        <div className="ml-auto flex items-center gap-3 text-dim">
          <span className="min-w-0 truncate">
            <span className={role === "mestre" ? "text-red" : "text-net"}>{t.auth.roles[role].label}</span>
            <span className="hidden sm:inline"> · </span>
            <span className="hidden sm:inline">
              @<span className="text-fg">{user}</span>
            </span>
          </span>
          {syncError && (
            <span className="text-red" title={t.shell.syncFailed(syncError)}>
              {t.shell.offline}
            </span>
          )}
          <button className="btn btn-danger" onClick={() => void logout()}>
            {t.shell.logout}
          </button>
        </div>
      </header>
      <main className="flex-1 p-3 sm:p-5">
        {tab === "net" && <NetTab focusId={focusArch} />}
        {tab === "infra" && (
          <InfraTab
            onOpenArchitecture={(id) => {
              setFocusArch(id);
              setTab("net");
            }}
          />
        )}
        {tab === "combat" && <Combat />}
        {tab === "chars" && <Characters />}
      </main>
    </div>
  );
}
