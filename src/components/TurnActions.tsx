"use client";

import { patchCombatant } from "@/lib/store";
import type { Combatant } from "@/lib/types";

interface Props {
  c: Combatant;
  netMax: number;
  /** tamanho do ícone em px */
  size?: number;
  disabled?: boolean;
}

/** Ícones de ação. Ao mudar de estado o ícone "salta" (key força a animação). */
export function TurnActions({ c, netMax, size = 28, disabled }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ActionIcon
        label="Ação"
        glyph="⚔️"
        used={c.actionUsed}
        size={size}
        disabled={disabled}
        onClick={() => patchCombatant(c.id, { actionUsed: !c.actionUsed })}
      />
      <ActionIcon
        label="Movimento"
        glyph="👟"
        used={c.moveUsed}
        size={size}
        disabled={disabled}
        onClick={() => patchCombatant(c.id, { moveUsed: !c.moveUsed })}
      />
      {Array.from({ length: netMax }, (_, i) => (
        <ActionIcon
          key={i}
          label={`Ação de Net ${i + 1}`}
          glyph="🌐"
          used={i < c.netUsed}
          size={size}
          disabled={disabled}
          tint="#05d9e8"
          onClick={() =>
            patchCombatant(c.id, { netUsed: i < c.netUsed ? i : i + 1 })
          }
        />
      ))}
    </div>
  );
}

function ActionIcon({
  label,
  glyph,
  used,
  size,
  disabled,
  tint = "#fcee0a",
  onClick,
}: {
  label: string;
  glyph: string;
  used: boolean;
  size: number;
  disabled?: boolean;
  tint?: string;
  onClick: () => void;
}) {
  return (
    <button
      title={`${label}${used ? " (usada)" : ""}`}
      disabled={disabled}
      onClick={onClick}
      className="flex items-center justify-center border transition-colors disabled:cursor-not-allowed"
      style={{
        width: size * 1.8,
        height: size * 1.8,
        borderColor: used ? "#2c2c40" : tint,
        background: used ? "#0d0d14" : `${tint}1a`,
      }}
    >
      <span
        key={String(used)}
        className={used ? "animate-hop" : ""}
        style={{
          fontSize: size,
          filter: used ? "grayscale(1) opacity(0.35)" : "none",
          display: "inline-block",
        }}
      >
        {glyph}
      </span>
    </button>
  );
}
