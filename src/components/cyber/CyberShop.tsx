"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { gameName, t } from "@/i18n";
import {
  CATALOG,
  CYBERWARE,
  CYBER_CATEGORIES,
  INSTALL_COST,
  INSTALL_LABELS,
  SKILLS,
  canInstall,
  catalogItem,
  currentEmp,
  cyberPrice,
  fmtEb,
  hlText,
  hostsOf,
  installCyberware,
  itemName,
  needsFixer,
  rollHl,
  weaponStats,
  type CyberCategory,
  type CyberwareDef,
  type InstallCheck,
  type InstallOptions,
  type WeaponDef,
} from "@/lib/rpg";
import type { Character } from "@/lib/types";
import { BookName } from "../BookName";

type Save = (patch: Partial<Character>) => void;
type Pay = "buy" | "have" | "free";

const SKILL_CHIP = "skillChip";
const MELEE_CHOICES = ["lightMelee", "mediumMelee", "heavyMelee"] as const;

/** Armas que cabem num popup ranged: uma mão, de longo alcance ou exótica, com preço. */
const POPUP_GUNS = CATALOG.filter(
  (d): d is WeaponDef =>
    d.kind === "weapon" &&
    (d.class === "ranged" || d.class === "exotic") &&
    d.cost !== null &&
    weaponStats(d).hands === 1,
);

/** Nome em pt-BR da arma branca do popup. */
const meleeName = (id: string) => {
  const d = catalogItem(id);
  return d ? gameName(d) : id;
};

/** Botão de alternar no estilo dos colchetes, com o selecionado em vermelho. */
function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`btn btn-bare !px-2 !py-1 text-left text-xs ${on ? "!border-red !text-red hover:!text-bg" : ""}`}
    >
      {children}
    </button>
  );
}

/** Loja de cyberware (ripperdoc): o catálogo do livro com painel de compra e instalação. */
export function CyberShop({ ch, save, onClose }: { ch: Character; save: Save; onClose?: () => void }) {
  const [tab, setTab] = useState<CyberCategory>(CYBER_CATEGORIES[0].id);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const cat = CYBER_CATEGORIES.find((c) => c.id === tab)!;
  const items = useMemo(
    () =>
      CYBERWARE.filter((d) =>
        q
          ? d.name.toLowerCase().includes(q) || d.namePt.toLowerCase().includes(q) || d.summary.toLowerCase().includes(q)
          : d.category === tab,
      ),
    [tab, q],
  );
  const checks = useMemo(() => new Map(items.map((d) => [d.id, canInstall(ch, d.id)] as const)), [items, ch]);

  return (
    <div className="box space-y-3 p-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <h3 className="font-pixel text-xl">{t.cyber.shop.title}</h3>
        <span className="text-dim">
          {t.cyber.shop.cash} <span className="font-bold text-red">{fmtEb(ch.money)}</span>
        </span>
        <span className="text-dim">
          {t.cyber.humanity.label} <span className="text-fg">{ch.humanity}</span>
          {t.common.sep}
          {t.cyber.humanity.empInUse} <span className="text-fg">{currentEmp(ch.stats, ch.humanity)}</span>
        </span>
        {onClose && (
          <button type="button" className="btn ml-auto !px-2 !py-0 text-xs" onClick={onClose}>
            {t.common.actions.close}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label={t.cyber.shop.categories} className="flex min-w-0 flex-wrap gap-x-1 border-b-2 border-line">
          {CYBER_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={tab === c.id && !q}
              onClick={() => {
                setTab(c.id);
                setQuery("");
                setOpenId(null);
              }}
              className={`-mb-[2px] border-b-2 px-2 py-1 ${
                tab === c.id && !q ? "border-red text-red" : "border-transparent text-dim hover:text-fg"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <input
          className="field !w-auto min-w-32 flex-1"
          placeholder={t.cyber.shop.search}
          aria-label={t.cyber.shop.search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <p className="text-xs text-dim">{q ? t.cyber.shop.results(items.length) : t.cyber.shop.categoryHint(cat.en, cat.base)}</p>

      {done && (
        <p role="status" className="text-xs text-net">
          {done}
        </p>
      )}

      <div className="max-h-[32rem] overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="text-dim">{t.cyber.shop.nothing}</p>
        ) : (
          <ul className="divide-y-2 divide-line">
            {items.map((d) => {
              const check = checks.get(d.id)!;
              const price = cyberPrice(d);
              const open = openId === d.id && check.ok;
              return (
                <li key={d.id} className="py-2">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <div className="min-w-0 flex-1 basis-56">
                      <div>
                        <span className="font-bold">{gameName(d)}</span>
                        <BookName def={d} />
                      </div>
                      <div className="text-xs text-dim">{d.summary}</div>
                      <div className="text-xs">
                        {t.cyber.shop.line(d.install ? INSTALL_LABELS[d.install] : t.cyber.chipPlace, hlText(d), fmtEb(price), !!d.paired)}
                        {needsFixer(price) && (
                          <span className="ml-2 text-dim" title={t.cyber.shop.fixerHint}>
                            {t.cyber.shop.onlyFixer}
                          </span>
                        )}
                      </div>
                      {!check.ok && <div className="text-xs text-red">{check.reason ?? t.cyber.shop.cantInstall}</div>}
                    </div>
                    <div className="ml-auto flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        className="btn !px-2 !py-0 text-xs"
                        disabled={!check.ok}
                        title={check.ok ? undefined : (check.reason ?? t.cyber.shop.cantInstall)}
                        aria-expanded={open}
                        onClick={() => {
                          setDone(null);
                          setOpenId(open ? null : d.id);
                        }}
                      >
                        {t.cyber.shop.install}
                      </button>
                    </div>
                  </div>
                  {open && (
                    <InstallPanel
                      key={d.id}
                      ch={ch}
                      def={d}
                      check={check}
                      save={save}
                      onCancel={() => setOpenId(null)}
                      onDone={(msg) => {
                        setDone(msg);
                        setOpenId(null);
                      }}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-xs text-dim">{t.cyber.shop.footnote}</p>
    </div>
  );
}

/** Painel de compra aberto embaixo da linha: lugar, escolhas da peça, pagamento e humanidade. */
function InstallPanel({
  ch,
  def,
  check,
  save,
  onCancel,
  onDone,
}: {
  ch: Character;
  def: CyberwareDef;
  check: InstallCheck;
  save: Save;
  onCancel: () => void;
  onDone: (msg: string) => void;
}) {
  const n = def.paired ? 2 : 1;
  const isChip = def.id === SKILL_CHIP;
  const popup = def.effects?.weapon;

  const ref = useRef<HTMLDivElement>(null);
  const [picked, setPicked] = useState<string[]>(() => check.hosts.slice(0, n));
  const [skill, setSkill] = useState("");
  const [melee, setMelee] = useState<string>(MELEE_CHOICES[0]);
  const [gun, setGun] = useState("");
  const [mode, setMode] = useState<Pay>("buy");
  const [hl, setHl] = useState<string[]>(() => Array.from({ length: n }, () => String(rollHl(def.hlDice))));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    ref.current?.scrollIntoView({ block: "nearest" });
  }, []);

  const spots = useMemo(() => hostsOf(ch), [ch]);
  const label = (id: string) => spots.find((s) => s.id === id)?.label ?? id;

  // se a ficha mudou por fora e a escolha deixou de valer, volta pros primeiros lugares livres
  const valid = picked.length === n && new Set(picked).size === n && picked.every((h) => check.hosts.includes(h));
  const hosts = valid ? picked : check.hosts.slice(0, n);
  const choose = check.hosts.length > n;

  const ownedGuns = ch.gear.filter((g) => {
    if (g.implant) return false;
    const d = catalogItem(g.ref);
    return d?.kind === "weapon" && (d.class === "ranged" || d.class === "exotic") && weaponStats(d).hands === 1;
  });
  const boughtGun = gun.startsWith("ref:") ? catalogItem(gun.slice(4)) : undefined;

  const price = cyberPrice(def, isChip && skill ? { skill } : {});
  const fee = def.install ? INSTALL_COST[def.install] : 0;
  const gunCost = mode !== "free" && boughtGun?.cost ? boughtGun.cost : 0;
  // peça em par é comprada (e instalada) duas vezes, uma em cada olho ou perna
  const pay = (mode === "buy" ? price * n : mode === "have" ? fee * n : 0) + gunCost;
  const times = (v: number) => (n > 1 ? `${n} × ${fmtEb(v)}` : fmtEb(v));

  const loss = hl.map((s) => {
    const v = Math.floor(Number(s));
    return Number.isFinite(v) && v > 0 ? v : 0;
  });
  const total = loss.reduce((a, b) => a + b, 0);
  const after = ch.humanity - total;
  const empNow = currentEmp(ch.stats, ch.humanity);
  const empAfter = currentEmp(ch.stats, after);

  const noMoney = pay > ch.money;
  const noSkill = isChip && !skill;

  const weapon = (): InstallOptions["weapon"] => {
    if (popup === "popupMelee") return { ref: melee };
    if (popup !== "popupRanged" || !gun) return undefined;
    return gun.startsWith("gear:") ? { gearId: gun.slice(5) } : { ref: gun.slice(4) };
  };

  const confirm = () => {
    const next = installCyberware(ch, def.id, {
      hosts,
      hl: loss,
      pay,
      skill: isChip ? skill : undefined,
      weapon: weapon(),
    });
    if (next === ch) {
      setFailed(true);
      return;
    }
    save(next);
    onDone(t.cyber.panel.done(gameName(def), total));
  };

  return (
    <div ref={ref} className="box mt-2 space-y-2 !bg-raise p-3">
      {choose ? (
        <div className="space-y-1">
          {Array.from({ length: n }, (_, i) => (
            <label key={i} className="flex flex-wrap items-center gap-2 text-xs">
              <span className="label">{n > 1 ? t.cyber.panel.pieceIn(i + 1) : t.cyber.panel.goesIn}</span>
              <select
                className="field !w-auto min-w-0 max-w-full !py-1"
                aria-label={n > 1 ? t.cyber.panel.wherePiece(i + 1) : t.cyber.panel.whereOne}
                value={hosts[i]}
                onChange={(e) => setPicked(hosts.map((h, j) => (j === i ? e.target.value : h)))}
              >
                {check.hosts
                  .filter((h) => n === 1 || h !== hosts[1 - i])
                  .map((h) => (
                    <option key={h} value={h}>
                      {label(h)}
                    </option>
                  ))}
              </select>
            </label>
          ))}
        </div>
      ) : (
        <p className="text-xs">
          {t.cyber.panel.goesInList} <span className="font-bold">{hosts.map(label).join(", ")}</span>
        </p>
      )}

      {isChip && (
        <label className="flex flex-wrap items-center gap-2 text-xs">
          <span className="label">{t.cyber.panel.chipSkill}</span>
          <select
            className="field !w-auto min-w-0 max-w-full !py-1"
            aria-label={t.cyber.panel.chipSkill}
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
          >
            <option value="">{t.cyber.panel.chooseSkill}</option>
            {SKILLS.map((s) => (
              <option key={s.id} value={s.id}>
                {t.cyber.panel.skillOption(gameName(s), !!s.x2)}
              </option>
            ))}
          </select>
          <span className="text-dim">{skill ? fmtEb(price) : t.cyber.panel.required}</span>
        </label>
      )}

      {popup === "popupMelee" && (
        <div role="group" aria-label={t.cyber.panel.meleeGroup} className="flex flex-wrap items-center gap-2">
          <span className="label">{t.cyber.panel.weapon}</span>
          {MELEE_CHOICES.map((id) => (
            <Toggle key={id} on={melee === id} onClick={() => setMelee(id)}>
              {meleeName(id)}
            </Toggle>
          ))}
        </div>
      )}

      {popup === "popupRanged" && (
        <div className="space-y-1">
          <label className="flex flex-wrap items-center gap-2 text-xs">
            <span className="label">{t.cyber.panel.weapon}</span>
            <select
              className="field !w-auto min-w-0 max-w-full !py-1"
              aria-label={t.cyber.panel.gunAria}
              value={gun}
              onChange={(e) => setGun(e.target.value)}
            >
              <option value="">{t.cyber.panel.noGun}</option>
              {ownedGuns.length > 0 && (
                <optgroup label={t.cyber.panel.fromGear}>
                  {ownedGuns.map((g) => (
                    <option key={g.id} value={`gear:${g.id}`}>
                      {itemName(g)}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label={t.cyber.panel.buyWith}>
                {POPUP_GUNS.map((d) => (
                  <option key={d.id} value={`ref:${d.id}`}>
                    {t.cyber.panel.gunOption(gameName(d), fmtEb(d.cost!))}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
          {boughtGun?.cost != null && (
            <p className="text-xs text-dim">{t.cyber.panel.gunBought(mode === "free", fmtEb(boughtGun.cost))}</p>
          )}
        </div>
      )}

      <div role="group" aria-label={t.cyber.panel.payment} className="space-y-1">
        <span className="label">{t.cyber.panel.payment}</span>
        <div className="flex flex-wrap gap-2">
          <Toggle on={mode === "buy"} onClick={() => setMode("buy")}>
            {t.cyber.panel.buy(times(price))}
          </Toggle>
          <Toggle on={mode === "have"} onClick={() => setMode("have")}>
            {def.install ? t.cyber.panel.haveParts(n > 1, times(fee)) : t.cyber.panel.haveChip}
          </Toggle>
          <Toggle on={mode === "free"} onClick={() => setMode("free")}>
            {t.cyber.panel.free}
          </Toggle>
        </div>
        {mode === "buy" && <p className="text-xs text-dim">{t.cyber.panel.included}</p>}
      </div>

      <div className="space-y-1">
        <span className="label">{t.cyber.panel.lossLabel}</span>
        {def.hlDice === "0" ? (
          <p className="text-xs">{t.cyber.panel.noLoss}</p>
        ) : (
          <>
            {hl.map((value, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 text-xs">
                {n > 1 && <span className="text-dim">{label(hosts[i])}</span>}
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  className="field !w-20 !py-1"
                  aria-label={n > 1 ? t.cyber.panel.lossAriaPiece(i + 1) : t.cyber.panel.lossAria}
                  value={value}
                  onChange={(e) => setHl(hl.map((v, j) => (j === i ? e.target.value : v)))}
                />
                <button
                  type="button"
                  className="btn !px-2 !py-0 text-xs"
                  aria-label={n > 1 ? t.cyber.panel.rerollPiece(i + 1) : t.cyber.panel.reroll}
                  onClick={() => setHl(hl.map((v, j) => (j === i ? String(rollHl(def.hlDice)) : v)))}
                >
                  {t.cyber.panel.reroll}
                </button>
              </div>
            ))}
            <p className="text-xs text-dim">{t.cyber.panel.atCreation(def.hl)}</p>
          </>
        )}
      </div>

      <p className="text-xs">
        {t.common.words.total} <span className="font-bold">{fmtEb(pay)}</span>
        {noMoney && <span className="text-red"> ({t.cyber.noMoney})</span>}
        {t.common.sep}
        {t.cyber.humanity.label} {ch.humanity} → <span className="font-bold">{after}</span>
        {t.common.sep}
        {t.cyber.humanity.empInUse} {empNow} → {empAfter}
      </p>
      {after < 0 && <p className="text-xs font-bold text-red">{t.cyber.panel.psychosisWarn}</p>}
      {failed && <p className="text-xs text-red">{t.cyber.panel.failed}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-primary"
          disabled={noMoney || noSkill}
          title={noMoney ? t.cyber.noMoney : noSkill ? t.cyber.panel.chooseSkillTitle : undefined}
          onClick={confirm}
        >
          {t.common.actions.confirm}
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          {t.common.actions.cancel}
        </button>
      </div>
    </div>
  );
}
