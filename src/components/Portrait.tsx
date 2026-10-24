"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { t } from "@/i18n";
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
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 90vw",
}: {
  photo?: string | null;
  seed: string;
  color: string;
  dim?: boolean;
  /** Largura em que a foto aparece (o padrão é a carta do palco). */
  sizes?: string;
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
      sizes={sizes}
      unoptimized
      onError={() => setBroken(photo)}
      className={`object-cover object-top ${dim ? "portrait-dim" : ""}`}
    />
  );
}

/**
 * Foto na ficha, grande e em pé (3:4, presa no topo). Com foto, o clique abre ela inteira por cima
 * da tela; "trocar" e "tirar" ficam embaixo. Sem foto, o clique escolhe uma. Soltar uma imagem em
 * cima troca. Erros vão pro `onFail`.
 */
export function PhotoPicker({
  ch,
  width,
  onFail,
}: {
  ch: Character;
  width: number;
  onFail: (message: string | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const viewer = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const color = colorFor(ch.id);
  const height = Math.round((width * 4) / 3);
  const pick = () => input.current?.click();

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
    <div className="flex shrink-0 flex-col items-center gap-1 text-xs" style={{ width }}>
      <button
        type="button"
        // foto reduzida suave, sem pixelar (o html todo é pixelated)
        className={`relative block overflow-hidden [&_img]:[image-rendering:auto] ${
          over ? "outline-2 outline-offset-2 outline-red" : ""
        }`}
        style={{ width, height, border: `2px solid ${color}` }}
        disabled={busy}
        title={ch.photo ? t.shell.photo.view(ch.name) : t.shell.photo.dropHint}
        aria-label={ch.photo ? t.shell.photo.view(ch.name) : t.shell.photo.add}
        onClick={() => (ch.photo ? viewer.current?.showModal() : pick())}
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
        <PortraitArt photo={ch.photo} seed={ch.id} color={color} dim={busy} sizes={`${width}px`} />
      </button>
      {busy ? (
        <span className="cursor text-dim">{t.shell.photo.sending}</span>
      ) : (
        <span className="flex gap-3">
          <button type="button" className="text-dim hover:text-red" title={t.shell.photo.dropHint} onClick={pick}>
            {ch.photo ? t.shell.photo.change : t.shell.photo.add}
          </button>
          {ch.photo && (
            <button type="button" className="text-dim hover:text-red" onClick={() => void change(null)}>
              {t.shell.photo.remove}
            </button>
          )}
        </span>
      )}
      {ch.photo && (
        <dialog
          ref={viewer}
          aria-label={t.shell.photo.view(ch.name)}
          className="photo-viewer"
          // clique fora da foto (no fundo escuro) fecha
          onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        >
          <figure className="flex flex-col items-center gap-3">
            <Image
              src={ch.photo}
              alt={ch.name}
              width={576}
              height={960}
              unoptimized
              className="block [image-rendering:auto]"
              style={{
                width: "auto",
                height: "auto",
                maxWidth: "min(92vw, 576px)",
                maxHeight: "78dvh",
                border: `2px solid ${color}`,
              }}
            />
            <figcaption className="font-pixel text-xl">{ch.name}</figcaption>
            <button type="button" className="btn" onClick={() => viewer.current?.close()}>
              {t.shell.photo.close}
            </button>
          </figure>
        </dialog>
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
