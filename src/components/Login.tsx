"use client";

import { useState } from "react";
import { login } from "@/lib/store";
import { Sprite } from "./Pixel";

export function Login() {
  const [name, setName] = useState("");

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          login(name);
        }}
        className="box w-full max-w-md p-8"
      >
        <div className="flex items-center gap-4">
          <Sprite seed="gambiarra" color="var(--red)" size={48} />
          <h1 className="font-pixel text-3xl leading-none">
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
        <button
          className="btn btn-primary mt-5 w-full"
          disabled={name.trim().length < 2}
        >
          conectar
        </button>
      </form>
    </main>
  );
}
