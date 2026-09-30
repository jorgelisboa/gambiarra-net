"use client";

import { patchCombatant } from "@/lib/store";
import type { Combatant } from "@/lib/types";
import { Icon, type IconName } from "./Pixel";

interface Props {
  c: Combatant;
  netMax: number;
  /** tamanho do ícone em px */
  size?: number;
  disabled?: boolean;
}

/** Ícones de ação. Ao mudar de estado o ícone "salta" (key reinicia a animação). */
export function TurnActions({ c, netMax, size = 24, disabled }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ActionIcon
        label="ação"
        icon="action"
        used={c.actionUsed}
        size={size}
        disabled={disabled}
        onClick={() => patchCombatant(c.id, { actionUsed: !c.actionUsed })}
      />
      <ActionIcon
        label="movimento"
        icon="move"
        used={c.moveUsed}
        size={size}
        disabled={disabled}
        onClick={() => patchCombatant(c.id, { moveUsed: !c.moveUsed })}
      />
      {Array.from({ length: netMax }, (_, i) => (
        <ActionIcon
          key={i}
          label={`ação de net ${i + 1}`}
          icon="net"
          used={i < c.netUsed}
          size={size}
          disabled={disabled}
          tint="var(--net)"
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
  icon,
  used,
  size,
  disabled,
  tint = "var(--red)",
  onClick,
}: {
  label: string;
  icon: IconName;
  used: boolean;
  size: number;
  disabled?: boolean;
  tint?: string;
  onClick: () => void;
}) {
  return (
    <button
      title={`${label}${used ? " (usada)" : ""}`}
      aria-pressed={used}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex items-center justify-center border-2 disabled:cursor-not-allowed"
      style={{
        width: size * 1.7,
        height: size * 1.7,
        borderColor: used ? "var(--line)" : tint,
        color: used ? "var(--line)" : tint,
        background: used ? "transparent" : "var(--color-raise)",
      }}
    >
      <span key={String(used)} className={used ? "animate-hop" : ""}>
        <Icon name={icon} size={size} />
      </span>
    </button>
  );
}
