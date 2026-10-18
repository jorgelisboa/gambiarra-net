"use client";

import { useState } from "react";
import { t } from "@/i18n";
import { chooseRole, login, logout, signIn, signUp, useApp } from "@/lib/store";
import type { UserRole } from "@/lib/types";
import { Sprite } from "./Pixel";

const ROLE_IDS: UserRole[] = ["mestre", "jogador"];

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
          {t.auth.tagline.base} {mode === "cloud" ? t.auth.tagline.cloud : t.auth.tagline.local}
        </p>

        {sentTo ? (
          <div className="mt-8 space-y-4">
            <p>
              {t.auth.sent.before} <span className="text-net">{sentTo}</span> {t.auth.sent.after}
            </p>
            <button
              type="button"
              className="btn w-full"
              onClick={() => {
                setSentTo(null);
                setTab("entrar");
              }}
            >
              {t.common.actions.back}
            </button>
          </div>
        ) : (
          <>
            {mode === "local" && (
              <Field
                id="user"
                label={t.auth.fields.login.label}
                value={name}
                onChange={setName}
                placeholder={t.auth.fields.login.placeholder}
                maxLength={24}
                autoFocus
              />
            )}

            {mode === "cloud" && !cloudSignedIn && (
              <>
                <div role="tablist" aria-label={t.auth.tabs.aria} className="mt-8 grid grid-cols-2 border-b-2 border-line">
                  {(["entrar", "cadastro"] as const).map((id) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={tab === id}
                      onClick={() => {
                        setTab(id);
                        setError(null);
                      }}
                      className={`-mb-[2px] border-b-2 py-1.5 ${
                        tab === id ? "border-red text-red" : "glitch-hover border-transparent text-dim hover:text-fg"
                      }`}
                    >
                      {id === "entrar" ? t.auth.tabs.signIn : t.auth.tabs.signUp}
                    </button>
                  ))}
                </div>
                {signingUp && (
                  <Field
                    id="name"
                    label={t.auth.fields.name.label}
                    value={name}
                    onChange={setName}
                    placeholder={t.auth.fields.name.placeholder}
                    maxLength={24}
                    autoComplete="nickname"
                  />
                )}
                <Field
                  id="email"
                  label={t.auth.fields.email.label}
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder={t.auth.fields.email.placeholder}
                  autoComplete="email"
                  autoFocus={!signingUp}
                />
                <Field
                  id="password"
                  label={signingUp ? t.auth.fields.password.labelNew : t.auth.fields.password.label}
                  type="password"
                  value={password}
                  onChange={setPassword}
                  autoComplete={signingUp ? "new-password" : "current-password"}
                />
              </>
            )}

            {cloudSignedIn && (
              <p className="mt-8 flex flex-wrap items-center gap-x-2">
                <span className="label">{t.auth.signedInAs}</span>
                <span className="text-fg">{user}</span>
                <button type="button" className="btn btn-bare !p-0 text-dim underline" onClick={() => void logout()}>
                  {t.auth.switchAccount}
                </button>
              </p>
            )}

            <fieldset className="mt-6">
              <legend className="label">{t.auth.roleLegend}</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {ROLE_IDS.map((id) => {
                  const on = role === id;
                  const o = t.auth.roles[id];
                  return (
                    <label
                      key={id}
                      className={`box role-option flex cursor-pointer flex-col items-center gap-2 p-3 text-center ${
                        on ? "box-active text-red" : "hover:border-dim"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={id}
                        checked={on}
                        onChange={() => setPicked(id)}
                        className="sr-only"
                      />
                      <Sprite seed={id} color="currentColor" size={32} />
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
              {busy
                ? t.auth.submit.busy
                : mode === "cloud" && !cloudSignedIn && signingUp
                  ? t.auth.tabs.signUp
                  : t.auth.submit.connect}
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
