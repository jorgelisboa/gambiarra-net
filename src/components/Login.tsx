"use client";

import { useState } from "react";
import { login } from "@/lib/store";

export function Login() {
  const [name, setName] = useState("");

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          login(name);
        }}
        className="w-full max-w-sm border border-line bg-ink-900 p-8"
      >
        <h1 className="glitch text-4xl font-black tracking-tight text-neon">
          Gambiarra<span className="text-ice">.net</span>
        </h1>
        <p className="mt-1 text-sm text-muted">
          Ferramenta de fã pra Cyberpunk RED. Tudo salvo neste navegador.
        </p>
        <label className="mt-8 block text-xs uppercase tracking-widest text-muted">
          Username
        </label>
        <input
          autoFocus
          className="field mt-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ex: rache_b"
          maxLength={24}
        />
        <button
          className="btn btn-primary mt-4 w-full"
          disabled={name.trim().length < 2}
        >
          Conectar
        </button>
      </form>
    </main>
  );
}
