"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { setCharacterPhoto } from "@/lib/store";
import { colorFor } from "@/lib/rules";
import type { Character } from "@/lib/types";
import { Sprite } from "./Pixel";

/** Avatar: a foto da ficha, com borda na cor do personagem; sem foto (ou se ela não abrir), o sprite. */
export function Portrait({
  photo,
  seed,
  color,
  size,
  dim,
}: {
  photo?: string | null;
  seed: string;
  color: string;
  size: number;
  dim?: boolean;
}) {
  // guarda qual URL falhou: foto nova tenta de novo
  const [broken, setBroken] = useState<string | null>(null);
  if (!photo || broken === photo) return <Sprite seed={seed} color={color} size={size} dim={dim} />;
  return (
    <Image
      src={photo}
      alt=""
      width={size}
      height={size}
      // já vem reduzida (src/lib/photo.ts); data URL no modo local
      unoptimized
      onError={() => setBroken(photo)}
      className={`portrait ${dim ? "portrait-dim" : ""}`}
      // quadrada mesmo com foto em pé: o height: auto do preflight seguiria a proporção da foto
      style={{ borderColor: color, width: size, height: size }}
    />
  );
}

/**
 * Foto ocupando o contêiner todo (carta do palco), presa no topo pra não cortar a cabeça.
 * Sem foto: o sprite grande, num fundo na cor do personagem.
 */
export function PortraitArt({
  photo,
  seed,
  color,
  dim,
}: {
  photo?: string | null;
  seed: string;
  color: string;
  dim?: boolean;
}) {
  const [broken, setBroken] = useState<string | null>(null);
  if (!photo || broken === photo) {
    return (
      <div
        className="absolute inset-0 flex items-start justify-center pt-[22%]"
        style={{ background: `color-mix(in srgb, ${color} 12%, var(--color-panel))` }}
      >
        <div className="w-3/5 [&>svg]:h-auto [&>svg]:w-full">
          <Sprite seed={seed} color={color} size={256} dim={dim} />
        </div>
      </div>
    );
  }
  return (
    <Image
      src={photo}
      alt=""
      fill
      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 90vw"
      unoptimized
      onError={() => setBroken(photo)}
      className={`object-cover object-top ${dim ? "portrait-dim" : ""}`}
    />
  );
}

/** Foto na ficha: clique ou solte uma imagem pra trocar. Erros vão pro `onFail`. */
export function PhotoPicker({
  ch,
  size,
  onFail,
}: {
  ch: Character;
  size: number;
  onFail: (message: string | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  async function change(file: File | null) {
    setBusy(true);
    onFail(null);
    try {
      await setCharacterPhoto(ch.id, file);
    } catch (e) {
      onFail(e instanceof Error ? e.message : String(e));
    }
    setBusy(false);
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-1 text-xs" style={{ width: size }}>
      <button
        type="button"
        className={`group flex flex-col items-center gap-1 ${over ? "outline-2 outline-offset-2 outline-red" : ""}`}
        disabled={busy}
        title="clique ou solte uma imagem aqui"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const file = e.dataTransfer.files[0];
          if (file) void change(file);
        }}
      >
        <Portrait photo={ch.photo} seed={ch.id} color={colorFor(ch.id)} size={size} dim={busy} />
        {busy ? (
          <span className="cursor text-dim">enviando</span>
        ) : (
          <span className="text-dim group-hover:text-red">{ch.photo ? "trocar" : "pôr foto"}</span>
        )}
      </button>
      {ch.photo && !busy && (
        <button type="button" className="text-dim hover:text-red" onClick={() => void change(null)}>
          tirar
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          // limpa pra escolher o mesmo arquivo de novo disparar o change
          e.target.value = "";
          if (file) void change(file);
        }}
      />
    </div>
  );
}
