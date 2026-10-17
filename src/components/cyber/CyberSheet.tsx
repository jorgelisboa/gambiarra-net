"use client";

import { useState } from "react";
import {
  THERAPIES,
  applyTherapy,
  currentEmp,
  cyberDef,
  cyberIssues,
  cyberName,
  cyberStats,
  cyberpsychosis,
  d6,
  fmtEb,
  hostsOf,
  humanityCap,
  installKit,
  maxHumanity,
  moveChip,
  patchCyber,
  removeCyberware,
  setCyberActive,
  skillDef,
  type HostSpot,
  type TherapyDef,
} from "@/lib/rpg";
import type { Character, CyberwareItem } from "@/lib/types";
import { CyberKitPicker, hlLabel } from "./CyberKitPicker";
import { CyberShop } from "./CyberShop";

type Save = (patch: Partial<Character>) => void;

const AMBER = "text-[#ffb000]";

/** Cor do nível de ciberpsicose: 1 e 2 âmbar, 3 e 4 vermelho, 0 sem cor. */
export const psychosisTone = (level: number) => (level >= 3 ? "text-red" : level >= 1 ? AMBER : "");

/** Soma `dice` ("2d6", "4d6") de d6. */
const rollDice = (dice: TherapyDef["dice"]) =>
  Array.from({ length: Number(dice[0]) }, () => d6()).reduce((a, b) => a + b, 0);

/** Quantas peças estão instaladas em `id`, e nas peças dentro dela. */
function hostedIn(ch: Character, id: string): number {
  const seen = new Set<string>([id]);
  const queue = [id];
  let n = 0;
  while (queue.length > 0) {
    const at = queue.pop()!;
    for (const o of ch.cyberware) {
      if (o.host === at && !seen.has(o.id)) {
        seen.add(o.id);
        queue.push(o.id);
        n++;
      }
    }
  }
  return n;
}

/** Aba "cyberware": humanidade, terapia, loja e as peças por lugar do corpo. */
export function CyberSheet({ ch, save }: { ch: Character; save: Save }) {
  const [shop, setShop] = useState(false);
  const [picks, setPicks] = useState<Record<string, number>>({});

  const spots = hostsOf(ch);
  const issues = cyberIssues(ch);
  const stored = ch.cyberware.filter((it) => it.host === null);
  const freeSockets = spots.filter((s) => s.kind === "socket" && s.used < s.slots);
  const isPool = (s: HostSpot) => s.kind === "fashion" || s.kind === "internal" || s.kind === "external";
  const shown = spots.filter((s) => s.items.length > 0 || s.owner);
  const idle = spots.filter((s) => isPool(s) && s.items.length === 0 && !s.owner);
  const body = cyberStats(ch).BODY;

  return (
    <div className="space-y-4">
      <Humanity ch={ch} save={save} />

      <div className="flex flex-wrap items-center gap-2">
        <button className={`btn ${shop ? "btn-primary" : ""}`} aria-expanded={shop} onClick={() => setShop(!shop)}>
          loja de cyberware
        </button>
      </div>

      {shop && <CyberShop ch={ch} save={save} onClose={() => setShop(false)} />}

      {ch.cyberware.length === 0 && (
        <section className="box min-w-0 space-y-3 p-3">
          <h3 className="font-pixel text-xl">sem cyberware ainda</h3>
          <CyberKitPicker role={ch.role} picks={picks} onPicks={setPicks} emp={ch.stats.EMP} />
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-primary" onClick={() => save(installKit(ch, ch.role, picks))}>
              instalar o cyberware inicial ({ch.role.toLowerCase()})
            </button>
          </div>
          <p className="text-xs text-dim">o kit do livro usa a perda de humanidade fixa, como na criação.</p>
        </section>
      )}

      {issues.length > 0 && (
        <ul className={`space-y-0.5 border-l-2 border-[#ffb000] pl-2 text-xs ${AMBER}`} aria-label="avisos do cyberware">
          {issues.map((msg, i) => (
            <li key={`${i}-${msg}`}>{msg}</li>
          ))}
        </ul>
      )}

      {shown.map((spot) => (
        <Spot key={spot.id} ch={ch} save={save} spot={spot} body={body} />
      ))}

      {idle.length > 0 && (
        <p className="text-xs text-dim">
          livres: {idle.map((s) => `${s.label.replace(/^corpo · /, "")} ${s.slots - s.used}/${s.slots}`).join(" · ")}
        </p>
      )}

      {stored.length > 0 && (
        <section className="box min-w-0 space-y-2 p-3">
          <h3 className="label">chips guardados</h3>
          <ul className="space-y-2">
            {stored.map((item) => (
              <PieceRow key={item.id} ch={ch} save={save} item={item} body={body} sockets={freeSockets} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** Humanidade, teto, ciberpsicose e a terapia. */
function Humanity({ ch, save }: { ch: Character; save: Save }) {
  const [therapy, setTherapy] = useState(false);
  const [tid, setTid] = useState<TherapyDef["id"]>("standard");
  const [who, setWho] = useState<"clinic" | "medtech" | "free">("clinic");
  const [gain, setGain] = useState(0);

  const max = maxHumanity(ch.stats);
  const cap = humanityCap(ch);
  const emp = currentEmp(ch.stats, ch.humanity);
  const psy = cyberpsychosis(ch);
  const lost = ch.cyberware.reduce((a, it) => a + it.hl, 0);

  const t = THERAPIES.find((x) => x.id === tid) ?? THERAPIES[0];
  const pay = who === "clinic" ? t.cost : who === "medtech" ? t.materials : 0;
  const atCap = ch.humanity >= cap;
  const broke = pay > ch.money;

  const pickTherapy = (next: TherapyDef) => {
    setTid(next.id);
    setGain(rollDice(next.dice));
  };
  const toggle = () => {
    if (!therapy) setGain(rollDice(t.dice));
    setTherapy(!therapy);
  };
  const apply = () => {
    save(applyTherapy(ch, gain, pay));
    setTherapy(false);
  };

  return (
    <section className="box bg-raise min-w-0 space-y-2 p-3">
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <p>
          humanidade <span className="font-mono text-lg font-bold text-net">{ch.humanity}</span>
          <span className="font-mono text-dim">/{max}</span>
        </p>
        <p>
          teto <span className="font-mono font-bold">{cap}</span>
        </p>
        <p>
          emp em uso <span className="font-mono font-bold">{emp}</span>
          <span className="font-mono text-dim">/{ch.stats.EMP}</span>
        </p>
        <button className="btn ml-auto" aria-expanded={therapy} onClick={toggle}>
          terapia
        </button>
      </div>
      <p className="text-xs">
        <span className={psychosisTone(psy.level)}>{psy.label}</span> <span className="text-dim">{psy.text}</span>
      </p>
      <p className="text-xs text-dim">
        perdida no cyberware: <span className="font-mono">{lost}</span>
      </p>

      {therapy && (
        <div className="space-y-3 border-t-2 border-line pt-3">
          <div role="group" aria-label="tipo de terapia" className="flex flex-wrap gap-1">
            {THERAPIES.map((x) => (
              <button
                key={x.id}
                aria-pressed={x.id === tid}
                onClick={() => pickTherapy(x)}
                className={`min-w-0 border-2 px-2 py-0.5 text-left ${
                  x.id === tid ? "border-red text-red" : "border-line text-dim hover:text-fg"
                }`}
              >
                {x.name} · <span className="font-mono">{x.dice}</span> · {fmtEb(x.cost)}
              </button>
            ))}
          </div>

          <div role="group" aria-label="quem faz a terapia" className="flex flex-wrap gap-1">
            {(
              [
                ["clinic", `clínica · ${fmtEb(t.cost)}`],
                ["medtech", `medtech da mesa · materiais ${fmtEb(t.materials)} · Medical Tech DV${t.dv}`],
                ["free", "sem custo"],
              ] as const
            ).map(([id, text]) => (
              <button
                key={id}
                aria-pressed={who === id}
                onClick={() => setWho(id)}
                className={`min-w-0 border-2 px-2 py-0.5 text-left ${
                  who === id ? "border-red text-red" : "border-line text-dim hover:text-fg"
                }`}
              >
                {text}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2">
              <span className="label">humanidade recuperada</span>
              <input
                type="number"
                min={0}
                aria-label="humanidade recuperada"
                className="field !w-20 text-center font-mono"
                value={gain}
                onChange={(e) => setGain(Math.max(0, Math.floor(Number(e.target.value)) || 0))}
              />
            </label>
            <button className="btn" title={`rolar ${t.dice}`} onClick={() => setGain(rollDice(t.dice))}>
              rolar
            </button>
            <button className="btn btn-primary" disabled={atCap || broke || gain <= 0} onClick={apply}>
              aplicar
            </button>
            {atCap ? (
              <span className="text-xs text-dim">já está no teto</span>
            ) : broke ? (
              <span className="text-xs text-red">sem grana</span>
            ) : (
              gain > 0 && (
                <span className="font-mono text-xs text-dim">
                  {ch.humanity} → {Math.min(cap, ch.humanity + gain)}
                </span>
              )
            )}
          </div>
          <p className="text-xs text-dim">uma semana inteira. sem tirar cyberware, a humanidade não passa do teto.</p>
        </div>
      )}
    </section>
  );
}

/** Um lugar do corpo: cabeçalho com os slots e as peças que estão nele. */
function Spot({ ch, save, spot, body }: { ch: Character; save: Save; spot: HostSpot; body: number }) {
  const showSlots = spot.kind !== "body";
  const over = spot.used > spot.slots;
  const cells = Math.max(spot.slots, spot.used);
  return (
    <section className="box min-w-0 space-y-2 p-3">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="label">{spot.label}</h3>
        {showSlots && (
          <>
            <span className={`font-mono text-xs ${over ? "text-red" : "text-dim"}`}>
              {spot.used}/{spot.slots}
            </span>
            <span className="flex flex-wrap gap-0.5" aria-hidden="true">
              {Array.from({ length: cells }, (_, i) => (
                <span
                  key={i}
                  className={`inline-block h-3 w-3 border-2 ${
                    i < spot.used ? (over ? "border-red bg-red" : "border-net bg-net") : "border-line"
                  }`}
                />
              ))}
            </span>
          </>
        )}
      </header>
      {spot.items.length === 0 ? (
        <p className="text-xs text-dim">vazio</p>
      ) : (
        <ul className="space-y-2">
          {spot.items.map((item) => (
            <PieceRow key={item.id} ch={ch} save={save} item={item} body={body} />
          ))}
        </ul>
      )}
    </section>
  );
}

/** O que a peça muda na ficha, em etiquetas curtas. O que não tem etiqueta fica só no resumo. */
function effectTags(item: CyberwareItem, body: number): { key: string; text: string; net?: boolean }[] {
  const def = cyberDef(item.ref);
  const fx = def?.effects;
  const tags: { key: string; text: string; net?: boolean }[] = [];
  if (fx?.initiative) tags.push({ key: "init", text: `+${fx.initiative} iniciativa` });
  if (fx?.body) tags.push({ key: "body", text: `BODY ${body}` });
  if (fx?.weapon) tags.push({ key: "weapon", text: "arma no inventário" });
  if (fx?.shield) tags.push({ key: "shield", text: "escudo no inventário" });
  if (fx?.armor) tags.push({ key: "armor", text: "SP na cabeça e no corpo" });
  if (fx?.ignoreSerious) tags.push({ key: "serious", text: "ignora gravemente ferido" });
  if (fx?.netrun) tags.push({ key: "net", text: "netrun", net: true });
  fx?.skills?.forEach((s) => {
    const name = skillDef(s.skill)?.namePt ?? s.skill;
    tags.push({ key: `skill-${s.skill}`, text: `+${s.value} ${name}${s.when ? ` (${s.when})` : ""}` });
  });
  if (item.skill) tags.push({ key: "chip", text: `perícia: ${skillDef(item.skill)?.namePt ?? item.skill}` });
  return tags;
}

/** Uma peça: nome, perda de humanidade, resumo, efeitos e ações. */
function PieceRow({
  ch,
  save,
  item,
  body,
  sockets,
}: {
  ch: Character;
  save: Save;
  item: CyberwareItem;
  body: number;
  /** Só pra chip guardado: soquetes sem chip. */
  sockets?: HostSpot[];
}) {
  const def = cyberDef(item.ref);
  const name = cyberName(item);
  const tags = effectTags(item, body);
  const sandevistan = def?.effects?.activeInitiative;
  const inSocket = def?.category === "chipware" && item.host !== null;

  function remove() {
    const n = hostedIn(ch, item.id);
    const extra = n > 0 ? ` leva junto ${n} ${n === 1 ? "peça instalada" : "peças instaladas"} nela.` : "";
    if (confirm(`remover ${name}? a humanidade perdida não volta (só com terapia).${extra}`)) {
      save(removeCyberware(ch, item.id));
    }
  }

  return (
    <li className="flex min-w-0 flex-wrap items-start gap-x-3 gap-y-1 border-t-2 border-line pt-2 first:border-t-0 first:pt-0">
      <div className="min-w-0 flex-1 basis-60 space-y-1">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="min-w-0 break-words font-bold">{name}</span>
          {def && <span className="text-dim">{def.namePt}</span>}
          <span className="font-mono text-xs text-dim">{hlLabel(item.hl)}</span>
        </p>
        {def && <p className="text-xs text-dim">{def.summary}</p>}
        {(tags.length > 0 || sandevistan) && (
          <div className="flex flex-wrap items-center gap-1 text-xs">
            {sandevistan ? (
              <button
                aria-pressed={!!item.active}
                onClick={() => save(setCyberActive(ch, item.id, !item.active))}
                className={`border-2 px-2 py-0.5 ${
                  item.active ? "border-red text-red" : "border-line text-dim hover:text-fg"
                }`}
              >
                {item.active ? `ligado · +${sandevistan} iniciativa` : "ligar"}
              </button>
            ) : null}
            {tags.map((t) => (
              <span key={t.key} className={`border-2 px-1 ${t.net ? "border-net text-net" : "border-line text-fg"}`}>
                {t.text}
              </span>
            ))}
          </div>
        )}
        <input
          className="field max-w-sm !px-2 !py-0.5 text-xs"
          placeholder="nota"
          aria-label={`nota de ${name}`}
          value={item.note}
          onChange={(e) => save(patchCyber(ch, item.id, { note: e.target.value }))}
        />
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-1">
        {sockets && <SocketPicker ch={ch} save={save} item={item} name={name} sockets={sockets} />}
        {inSocket && (
          <button className="btn !px-2 !py-0 text-xs" onClick={() => save(moveChip(ch, item.id, null))}>
            tirar do soquete
          </button>
        )}
        <button className="btn btn-danger !px-2 !py-0 text-xs" onClick={remove}>
          remover
        </button>
      </div>
    </li>
  );
}

/** Chip guardado: escolhe um soquete sem chip e encaixa. */
function SocketPicker({
  ch,
  save,
  item,
  name,
  sockets,
}: {
  ch: Character;
  save: Save;
  item: CyberwareItem;
  name: string;
  sockets: HostSpot[];
}) {
  const [sel, setSel] = useState("");
  if (sockets.length === 0) return <span className="text-xs text-dim">sem soquete livre</span>;
  const target = sockets.find((s) => s.id === sel)?.id ?? sockets[0].id;
  return (
    <>
      <select
        className="field !w-auto min-w-0 max-w-full !px-2 !py-0.5 text-xs"
        aria-label={`soquete para ${name}`}
        value={target}
        onChange={(e) => setSel(e.target.value)}
      >
        {sockets.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
      <button className="btn !px-2 !py-0 text-xs" onClick={() => save(moveChip(ch, item.id, target))}>
        pôr no soquete
      </button>
    </>
  );
}
