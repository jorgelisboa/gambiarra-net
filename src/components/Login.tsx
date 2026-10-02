"use client";

import { useState } from "react";
import { chooseRole, login, loginWithGoogle, logout, useApp } from "@/lib/store";
import type { UserRole } from "@/lib/types";
import { Sprite } from "./Pixel";

const ROLE_OPTIONS: { id: UserRole; label: string; hint: string }[] = [
  { id: "mestre", label: "mestre", hint: "combate, net e fichas da mesa" },
  { id: "jogador", label: "jogador", hint: "criar e ver seus personagens" },
];

export function Login() {
  const { mode, user, lastRole } = useApp();
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<UserRole | null>(null);
  const [busy, setBusy] = useState(false);
  const role = picked ?? lastRole;

  // nuvem: primeiro o Google, depois o papel
  const cloudSignedIn = mode === "cloud" && !!user;
  const canSubmit =
    mode === "local" ? name.trim().length >= 2 && !!role : cloudSignedIn ? !!role : !busy;

  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (mode === "local") {
            if (role) login(name, role);
          } else if (cloudSignedIn) {
            if (role) chooseRole(role);
          } else {
            setBusy(true);
            loginWithGoogle().catch(() => setBusy(false));
          }
        }}
        className="box w-full max-w-md p-5 sm:p-8"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <Sprite seed="gambiarra" color="var(--red)" size={48} />
          <h1 className="font-pixel text-2xl leading-none sm:text-3xl">
            gambiarra<span className="text-net">.net</span>
          </h1>
        </div>
        <p className="mt-4 text-dim">
          vtt não oficial pra cyberpunk red.{" "}
          {mode === "cloud"
            ? "entre com o google e suas fichas ficam salvas no seu perfil."
            : "tudo fica salvo neste navegador."}
        </p>

        {mode === "local" && (
          <>
            <label className="label mt-8 block" htmlFor="user">
              login
            </label>
            <input
              id="user"
              autoFocus
              autoComplete="off"
              className="field mt-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="username"
              maxLength={24}
            />
          </>
        )}

        {cloudSignedIn && (
          <p className="mt-8 flex flex-wrap items-center gap-x-2">
            <span className="label">conectado como</span>
            <span className="text-fg">{user}</span>
            <button type="button" className="btn btn-bare !p-0 text-dim underline" onClick={() => void logout()}>
              trocar conta
            </button>
          </p>
        )}

        {(mode === "local" || cloudSignedIn) && (
          <fieldset className="mt-6">
            <legend className="label">entrar como</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {ROLE_OPTIONS.map((o) => {
                const on = role === o.id;
                return (
                  <label
                    key={o.id}
                    className={`box role-option flex cursor-pointer flex-col items-center gap-2 p-3 text-center ${
                      on ? "box-active text-red" : "hover:border-dim"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={o.id}
                      checked={on}
                      onChange={() => setPicked(o.id)}
                      className="sr-only"
                    />
                    <Sprite seed={o.id} color="currentColor" size={32} />
                    <span className="font-pixel text-lg leading-none">{o.label}</span>
                    <span className="text-xs text-dim">{o.hint}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        <button className="btn btn-primary mt-6 w-full" disabled={!canSubmit}>
          {mode === "cloud" && !cloudSignedIn
            ? busy
              ? "abrindo o google..."
              : "entrar com google"
            : "conectar"}
        </button>
      </form>
    </main>
  );
}
