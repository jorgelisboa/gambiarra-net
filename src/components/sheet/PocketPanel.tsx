"use client";

import { t } from "@/i18n";
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
  const withQty = (g: Character["gear"][number]) => (g.qty > 1 ? t.sheet.pocket.qty(itemName(g), g.qty) : itemName(g));

  return (
    <Section
      title={t.sheet.pocket.title}
      className={className}
      aside={<LinkBtn onClick={() => onTab("gear")}>{t.sheet.pocket.gear}</LinkBtn>}
    >
      <p className="text-xl font-bold leading-none text-red">{fmtEb(ch.money)}</p>
      <div className="mt-2 space-y-1 text-xs">
        {ammo.length > 0 && (
          <p>
            <span className="text-dim">{t.sheet.pocket.ammo}</span>{" "}
            {ammo.map((g) => t.sheet.pocket.qty(itemName(g), g.qty)).join(t.common.sep)}
          </p>
        )}
        {other.length > 0 && (
          <p>
            <span className="text-dim">{t.sheet.pocket.items}</span> {other.map(withQty).join(t.common.sep)}
          </p>
        )}
        {programs > 0 && (
          <p className="text-dim">
            {t.sheet.pocket.programs} {programs}
          </p>
        )}
        {fashion > 0 && (
          <p className="text-dim">
            {t.sheet.pocket.fashion} {t.sheet.pieces(fashion)}
          </p>
        )}
        {ammo.length === 0 && other.length === 0 && programs === 0 && fashion === 0 && (
          <p className="text-dim">{t.sheet.pocket.empty}</p>
        )}
      </div>
    </Section>
  );
}
