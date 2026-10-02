"use client";

import { useState } from "react";
import { login } from "@/lib/store";
import type { UserRole } from "@/lib/types";
import { Sprite } from "./Pixel";

const ROLE_OPTIONS: { id: UserRole; label: string; hint: string }[] = [
  { id: "mestre", label: "mestre", hint: "combate, net e fichas da mesa" },
  { id: "jogador", label: "jogador", hint: "criar e ver seus personagens" },
];

export function Login() {
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole | null>(null);

  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (role) login(name, role);
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
          vtt não oficial pra cyberpunk red. tudo fica salvo neste navegador.
        </p>
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
                    onChange={() => setRole(o.id)}
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

        <button
          className="btn btn-primary mt-6 w-full"
          disabled={name.trim().length < 2 || !role}
        >
          conectar
        </button>
      </form>
    </main>
  );
}
