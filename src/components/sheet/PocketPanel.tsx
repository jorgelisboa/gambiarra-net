"use client";

import { catalogItem, fmtEb, itemName } from "@/lib/rpg";
import type { Character } from "@/lib/types";
import type { SheetTabId } from "./SheetView";
import { LinkBtn, Section } from "./ui";

/** O que se leva no bolso: eurobucks, munição e o resto do equipamento (sem armas, armadura e roupas). */
export function PocketPanel({
  ch,
  onTab,
  className,
}: {
  ch: Character;
  onTab: (tab: SheetTabId) => void;
  className?: string;
}) {
  const kindOf = (g: Character["gear"][number]) => catalogItem(g.ref)?.kind;
  const ammo = ch.gear.filter((g) => kindOf(g) === "ammo" && g.qty > 0);
  // sem catálogo = item escrito à mão; programas moram no cyberdeck, então só contam
  const other = ch.gear.filter((g) => {
    const k = kindOf(g);
    return k === undefined || k === "gear" || k === "cyberdeck";
  });
  const programs = ch.gear.filter((g) => kindOf(g) === "program").length;
  const fashion = ch.gear.filter((g) => kindOf(g) === "fashion").reduce((n, g) => n + g.qty, 0);
  const withQty = (g: Character["gear"][number]) => `${itemName(g)}${g.qty > 1 ? ` ×${g.qty}` : ""}`;

  return (
    <Section
      title="bolso"
      className={className}
      aside={<LinkBtn onClick={() => onTab("gear")}>equipamento</LinkBtn>}
    >
      <p className="text-xl font-bold leading-none text-red">{fmtEb(ch.money)}</p>
      <div className="mt-2 space-y-1 text-xs">
        {ammo.length > 0 && (
          <p>
            <span className="text-dim">munição:</span> {ammo.map((g) => `${itemName(g)} ×${g.qty}`).join(" · ")}
          </p>
        )}
        {other.length > 0 && (
          <p>
            <span className="text-dim">itens:</span> {other.map(withQty).join(" · ")}
          </p>
        )}
        {programs > 0 && <p className="text-dim">programas: {programs}</p>}
        {fashion > 0 && (
          <p className="text-dim">
            roupas: {fashion} {fashion === 1 ? "peça" : "peças"}
          </p>
        )}
        {ammo.length === 0 && other.length === 0 && programs === 0 && fashion === 0 && (
          <p className="text-dim">bolso vazio.</p>
        )}
      </div>
    </Section>
  );
}
