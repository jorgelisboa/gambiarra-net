"use client";

import { useState } from "react";
import { chooseRole, login, logout, signIn, signUp, useApp } from "@/lib/store";
import type { UserRole } from "@/lib/types";
import { Sprite } from "./Pixel";

const ROLE_OPTIONS: { id: UserRole; label: string; hint: string }[] = [
  { id: "mestre", label: "mestre", hint: "combate, net e fichas da mesa" },
  { id: "jogador", label: "jogador", hint: "criar e ver seus personagens" },
];

type CloudTab = "entrar" | "cadastro";

export function Login() {
  const { mode, user, lastRole } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<CloudTab>("entrar");
  const [picked, setPicked] = useState<UserRole | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const role = picked ?? lastRole;

  // nuvem com sessão aberta mas sem papel (ex.: voltou do link de confirmação)
  const cloudSignedIn = mode === "cloud" && !!user;
  const signingUp = tab === "cadastro";

  const canSubmit =
    !!role &&
    !busy &&
    (mode === "local"
      ? name.trim().length >= 2
      : cloudSignedIn ||
        (email.includes("@") &&
          password.length >= 6 &&
          (!signingUp || name.trim().length >= 2)));

  async function submit() {
    if (!role) return;
    if (mode === "local") return login(name, role);
    if (cloudSignedIn) return chooseRole(role);
    setBusy(true);
    setError(null);
    const r = signingUp
      ? await signUp(name, email, password, role)
      : await signIn(email, password, role);
    setBusy(false);
    if (r.error) setError(r.error);
    else if (r.needsConfirm) setSentTo(email.trim());
  }

  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
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
            ? "suas fichas ficam salvas na sua conta."
            : "tudo fica salvo neste navegador."}
        </p>

        {sentTo ? (
          <div className="mt-8 space-y-4">
            <p>
              conta criada. abra o link que enviamos pra{" "}
              <span className="text-net">{sentTo}</span> e você entra direto.
            </p>
            <button
              type="button"
              className="btn w-full"
              onClick={() => {
                setSentTo(null);
                setTab("entrar");
              }}
            >
              voltar
            </button>
          </div>
        ) : (
          <>
            {mode === "local" && (
              <Field id="user" label="login" value={name} onChange={setName} placeholder="username" maxLength={24} autoFocus />
            )}

            {mode === "cloud" && !cloudSignedIn && (
              <>
                <div role="tablist" aria-label="acesso" className="mt-8 grid grid-cols-2 border-b-2 border-line">
                  {(["entrar", "cadastro"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      role="tab"
                      aria-selected={tab === t}
                      onClick={() => {
                        setTab(t);
                        setError(null);
                      }}
                      className={`-mb-[2px] border-b-2 py-1.5 ${
                        tab === t ? "border-red text-red" : "glitch-hover border-transparent text-dim hover:text-fg"
                      }`}
                    >
                      {t === "entrar" ? "entrar" : "criar conta"}
                    </button>
                  ))}
                </div>
                {signingUp && (
                  <Field id="name" label="nome / handle" value={name} onChange={setName} placeholder="como a mesa te chama" maxLength={24} autoComplete="nickname" />
                )}
                <Field id="email" label="email" type="email" value={email} onChange={setEmail} placeholder="voce@exemplo.com" autoComplete="email" autoFocus={!signingUp} />
                <Field
                  id="password"
                  label={signingUp ? "senha (mín. 6)" : "senha"}
                  type="password"
                  value={password}
                  onChange={setPassword}
                  autoComplete={signingUp ? "new-password" : "current-password"}
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

            {error && (
              <p role="alert" className="mt-4 text-red">
                {error}
              </p>
            )}

            <button className="btn btn-primary mt-6 w-full" disabled={!canSubmit}>
              {busy ? "conectando..." : mode === "cloud" && !cloudSignedIn && signingUp ? "criar conta" : "conectar"}
            </button>
          </>
        )}
      </form>
    </main>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  maxLength,
  autoComplete = "off",
  autoFocus,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  autoComplete?: string;
  autoFocus?: boolean;
}) {
  return (
    <>
      <label className="label mt-5 block" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        className="field mt-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
      />
    </>
  );
}
