"use client";

import { useId, type ReactNode } from "react";

/** Bloco da ficha: título "// assim" à esquerda e, se houver, um link pequeno à direita. */
export function Section({
  title,
  aside,
  children,
  className = "",
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={`box bg-raise min-w-0 p-2.5 ${className}`}>
      <header className="mb-3 flex min-h-6 items-center justify-between gap-2">
        <h3 id={id} className="label">
          {title}
        </h3>
        {aside}
      </header>
      {children}
    </section>
  );
}

/**
 * Link pequeno que troca de aba. A área de toque tem 40px de altura; a margem negativa
 * (`-my-2`) devolve esse espaço pro cabeçalho, que continua baixo. Fora de cabeçalho, `!my-0`.
 */
export function LinkBtn({
  onClick,
  children,
  className = "",
}: {
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`glitch-hover -my-2 inline-flex min-h-10 items-center px-2 text-right text-xs text-dim underline underline-offset-4 hover:text-fg ${className}`}
    >
      {children}
    </button>
  );
}
