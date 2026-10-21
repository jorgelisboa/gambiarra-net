"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { t } from "@/i18n";
import {
  deleteCharacter,
  setSessionCharacter,
  upsertCharacter,
  useApp,
} from "@/lib/store";
import {
  currentEmp,
  effectiveStats,
  roleSkillsOf,
  skillBonusesOf,
  cyberpsychosis,
  deathSaveOf,
  fitToRank,
  hpMaxOf,
  humanityCap,
  maxHumanity,
  roleDef,
  seriousThreshold,
  woundOf,
  woundPenaltyOf,
} from "@/lib/rpg";
import { colorFor } from "@/lib/rules";
import {
  ROLES,
  STAT_KEYS,
  type Character,
  type CharacterNotes,
  type Role,
} from "@/lib/types";
import { CreationWizard } from "./CreationWizard";
import { CyberSheet, psychosisTone } from "./cyber/CyberSheet";
import { LifepathEditor } from "./LifepathEditor";
import { NetSheet } from "./net/NetSheet";
import { Bar } from "./Pixel";
import { PhotoPicker, Portrait } from "./Portrait";
import { RoleAbility } from "./RoleAbility";
import { GearSheet } from "./GearSheet";
import { SkillSheet } from "./SkillSheet";
import { SheetView } from "./sheet/SheetView";
import { linkedCharacterId } from "@/lib/link";

/** `role`: a aba só aparece pra esse role. */
const SHEET_TABS = [
  { id: "sheet", label: t.characters.tabs.sheet },
  { id: "stats", label: t.characters.tabs.stats },
  { id: "skills", label: t.characters.tabs.skills },
  { id: "gear", label: t.characters.tabs.gear },
  { id: "cyber", label: t.characters.tabs.cyber },
  { id: "ability", label: t.characters.tabs.ability },
  { id: "net", label: t.characters.tabs.net, role: "Netrunner" },
  { id: "lore", label: t.characters.tabs.lore },
  { id: "notes", label: t.characters.tabs.notes },
] as const satisfies readonly { id: string; label: string; role?: Role }[];

type SheetTab = (typeof SHEET_TABS)[number]["id"];
type SheetTabDef = (typeof SHEET_TABS)[number];

const tabsFor = (role: Role): SheetTabDef[] => SHEET_TABS.filter((tab) => !("role" in tab) || tab.role === role);

/** Mesmo corte do `sm:` do Tailwind. No servidor (e na hidratação) vale celular. */
const WIDE = "(min-width: 640px)";
function subscribeWide(notify: () => void) {
  const mq = matchMedia(WIDE);
  mq.addEventListener("change", notify);
  return () => mq.removeEventListener("change", notify);
}
const useWide = () =>
  useSyncExternalStore(subscribeWide, () => matchMedia(WIDE).matches, () => false);

const NOTE_FIELDS: { key: keyof CharacterNotes; label: string; area?: boolean }[] = [
  { key: "alias", label: t.characters.notes.alias },
  { key: "age", label: t.characters.notes.age },
  { key: "goal", label: t.characters.notes.goal, area: true },
  { key: "appearance", label: t.characters.notes.appearance, area: true },
  { key: "personality", label: t.characters.notes.personality, area: true },
  { key: "history", label: t.characters.notes.history, area: true },
  { key: "extra", label: t.characters.notes.extra, area: true },
];

export function Characters() {
  const { data } = useApp();
  const { characters, sessionCharacterId } = data;
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const linked = linkedCharacterId();
    if (linked && characters.some((c) => c.id === linked)) return linked;
    return sessionCharacterId ?? characters[0]?.id ?? null;
  });
  const [creating, setCreating] = useState(false);
  // fica aqui (e não no Editor) pra aba não voltar pro início ao trocar de personagem
  const [tab, setTab] = useState<SheetTab>("sheet");
  const selected = characters.find((c) => c.id === selectedId) ?? null;

  function create(ch: Character) {
    upsertCharacter(ch);
    setSelectedId(ch.id);
    setCreating(false);
    setTab("sheet");
  }

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-[260px_minmax(0,1fr)]">
      <aside>
        {selected && (
          // celular: uma linha só, pra ficha começar logo no topo
          <div className="flex gap-2 md:hidden">
            <select
              className="field min-h-10 min-w-0 flex-1"
              aria-label={t.characters.list.selectAria}
              value={selected.id}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setCreating(false);
              }}
            >
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {t.characters.list.option(c.name, c.role.toLowerCase())}
                </option>
              ))}
            </select>
            <button
              className="btn btn-primary min-h-10 shrink-0"
              aria-label={t.characters.list.new}
              onClick={() => setCreating(true)}
            >
              {t.characters.list.newShort}
            </button>
          </div>
        )}
        <div className={`space-y-2 ${selected ? "max-md:hidden" : ""}`}>
          <button className="btn btn-primary w-full" onClick={() => setCreating(true)}>
            {t.characters.list.new}
          </button>
          {characters.length === 0 && (
            <p className="pt-4 text-dim">{t.characters.list.empty}</p>
          )}
          {characters.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedId(c.id);
                setCreating(false);
              }}
              className={`box flex w-full items-center gap-3 p-3 text-left ${
                c.id === selectedId ? "box-active" : "hover:border-dim"
              }`}
            >
              <Portrait photo={c.photo} seed={c.id} color={colorFor(c.id)} size={36} />
              <span className="min-w-0 flex-1">
                <span className="font-pixel block truncate text-base">{c.name}</span>
                <span className="block text-xs text-dim">
                  {t.characters.list.roleRank(c.role.toLowerCase(), c.roleRank)}
                </span>
              </span>
              {c.id === sessionCharacterId && (
                <span className="text-xs text-red">{t.characters.list.session}</span>
              )}
            </button>
          ))}
        </div>
      </aside>

      {creating ? (
        <CreationWizard onDone={create} onCancel={() => setCreating(false)} />
      ) : selected ? (
        <Editor
          key={selected.id}
          ch={selected}
          inSession={selected.id === sessionCharacterId}
          tab={tab}
          onTab={setTab}
          onDelete={() => {
            deleteCharacter(selected.id);
            setSelectedId(null);
          }}
        />
      ) : (
        <div className="box p-10 text-center text-dim">
          {t.characters.list.pickOrCreate}
        </div>
      )}
    </div>
  );
}

function Editor({
  ch,
  inSession,
  tab,
  onTab,
  onDelete,
}: {
  ch: Character;
  inSession: boolean;
  tab: SheetTab;
  onTab: (tab: SheetTab) => void;
  onDelete: () => void;
}) {
  const save = (patch: Partial<Character>) => upsertCharacter({ ...ch, ...patch });
  const tabs = tabsFor(ch.role);
  // a aba escolhida pode não existir pra este role (netrun só pro Netrunner)
  const shown: SheetTab = tabs.some((x) => x.id === tab) ? tab : "sheet";
  const changeRole = (role: Role) =>
    save({ role, ability: fitToRank(roleDef(role).ability, ch.ability, ch.roleRank) });
  const hpMax = hpMaxOf(ch);
  const humMax = maxHumanity(ch.stats);
  const wound = woundOf(ch.hp, hpMax);
  const emp = currentEmp(ch.stats, ch.humanity);
  const cap = humanityCap(ch);
  const psy = cyberpsychosis(ch);
  const eff = effectiveStats(ch);
  const [photoError, setPhotoError] = useState<string | null>(null);
  // role, sessão e apagar ficam atrás de "opções": nada de mexer neles sem querer
  const [optionsOpen, setOptionsOpen] = useState(false);
  const wide = useWide();

  return (
    <section className="box min-w-0 space-y-5 p-3 sm:p-5">
      <div className="space-y-3">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* o "pôr foto" não quebra em duas linhas sob o avatar de 48px */}
          <div className="shrink-0 [&_span]:whitespace-nowrap">
            <PhotoPicker ch={ch} size={wide ? 72 : 48} onFail={setPhotoError} />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start gap-2">
              <input
                className="field font-pixel min-h-10 min-w-0 flex-1 text-xl sm:min-h-0 sm:max-w-sm sm:text-2xl"
                aria-label={t.characters.editor.nameAria}
                value={ch.name}
                onChange={(e) => save({ name: e.target.value })}
              />
              <button
                className={`btn ml-auto min-h-10 shrink-0 sm:min-h-0 ${optionsOpen ? "btn-primary" : ""}`}
                aria-expanded={optionsOpen}
                aria-controls="ficha-opcoes"
                onClick={() => setOptionsOpen((o) => !o)}
              >
                {t.characters.editor.options}
              </button>
            </div>
            <p className="text-dim">
              {t.characters.list.roleRank(ch.role.toLowerCase(), ch.roleRank)}
              {inSession && (
                <>
                  {" "}
                  <span className="whitespace-nowrap text-red">{t.characters.editor.inSessionTag}</span>
                </>
              )}
            </p>
            {(shown === "stats" || shown === "ability") && (
              <p className="hidden text-dim sm:block">{roleDef(ch.role).summary}</p>
            )}
          </div>
        </div>
        {optionsOpen && (
          <div id="ficha-opcoes" className="flex flex-wrap items-center gap-2">
            <select
              className="field min-h-10 !w-auto sm:min-h-0"
              value={ch.role}
              aria-label={t.characters.editor.roleAria}
              onChange={(e) => changeRole(e.target.value as Role)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.toLowerCase()}</option>
              ))}
            </select>
            <button
              className={`btn min-h-10 sm:min-h-0 ${inSession ? "btn-primary" : ""}`}
              onClick={() => setSessionCharacter(inSession ? null : ch.id)}
            >
              {inSession ? t.characters.editor.inSession : t.characters.editor.useInSession}
            </button>
            <button
              className="btn btn-danger min-h-10 sm:min-h-0"
              onClick={() => confirm(t.characters.editor.confirmDelete(ch.name)) && onDelete()}
            >
              {t.characters.editor.delete}
            </button>
          </div>
        )}
        {photoError && (
          <p role="alert" className="text-red">
            {photoError}
          </p>
        )}
      </div>

      <SheetTabs tabs={tabs} tab={shown} onTab={onTab} />

      <div
        role="tabpanel"
        id={`ficha-${shown}`}
        aria-labelledby={`ficha-tab-${shown}`}
        className="space-y-5"
      >
        {shown === "sheet" && <SheetView ch={ch} save={save} onTab={onTab} />}

        {shown === "stats" && (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {STAT_KEYS.map((k) => (
                <label key={k} className="box bg-raise p-2 text-center">
                  <span className="block text-xs text-dim" title={t.stats.long[k]}>
                    {t.stats.short[k]}
                  </span>
                  <NumberInput
                    className="w-full bg-transparent text-center text-3xl font-bold text-red outline-none"
                    value={ch.stats[k]}
                    min={1}
                    max={10}
                    onChange={(v) => save({ stats: { ...ch.stats, [k]: v } })}
                  />
                  {k === "EMP" && emp < ch.stats.EMP && (
                    <span className="block text-xs text-net" title={t.characters.stats.empDroppedTitle}>
                      {t.characters.stats.inUse(emp)}
                    </span>
                  )}
                  {k !== "EMP" && eff[k] < ch.stats[k] && (
                    <span className="block text-xs text-net" title={t.characters.stats.armorTitle}>
                      {t.characters.stats.withArmor(eff[k])}
                    </span>
                  )}
                  {k !== "EMP" && eff[k] > ch.stats[k] && (
                    <span className="block text-xs text-net" title={t.characters.stats.cyberTitle}>
                      {t.characters.stats.withCyber(eff[k])}
                    </span>
                  )}
                </label>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Meter
                label={t.characters.stats.hp}
                color="var(--red)"
                value={ch.hp}
                max={hpMax}
                onChange={(v) => save({ hp: v })}
              >
                <p>
                  <span className={wound.id === "serious" || wound.id === "mortal" ? "text-red" : ""}>
                    {wound.label}
                  </span>
                  {wound.effect && <span className="text-dim"> · {wound.effect}</span>}
                </p>
                <p className="text-dim">
                  {t.characters.stats.seriousDeath(seriousThreshold(hpMax), deathSaveOf(ch))}
                  {wound.stabilize && t.characters.stats.stabilize(wound.stabilize)}
                </p>
                {ch.deathSavePenalty > 0 && (
                  <p className="text-red">
                    {t.characters.stats.deathPenalty(ch.deathSavePenalty)}{" "}
                    <button
                      className="btn btn-bare !p-0 text-dim underline"
                      onClick={() => save({ deathSavePenalty: 0 })}
                    >
                      {t.characters.stats.resetPenalty}
                    </button>
                  </p>
                )}
              </Meter>
              <Meter
                label={t.characters.stats.humanity}
                color="var(--net)"
                value={Math.min(ch.humanity, humMax)}
                min={-humMax}
                max={humMax}
                onChange={(v) => save({ humanity: v })}
              >
                <p>
                  {t.characters.stats.empInUse} <span className="font-bold">{emp}</span>
                  <span className="text-dim">/{ch.stats.EMP}</span>
                </p>
                {cap < humMax && <p className="text-dim">{t.characters.stats.cyberCap(cap)}</p>}
                {psy.level > 0 && (
                  <p>
                    <span className={psychosisTone(psy.level)}>{psy.label}</span>{" "}
                    <span className="text-dim">{psy.text}</span>
                  </p>
                )}
                <p className="text-dim">{t.characters.stats.empDrops}</p>
              </Meter>
            </div>
          </>
        )}

        {shown === "skills" && (
          <SkillSheet
            skills={ch.skills}
            onChange={(skills) => save({ skills })}
            stats={eff}
            role={ch.role}
            originLanguage={ch.lifepath.picks.language}
            penalty={woundPenaltyOf(ch)}
            bonuses={skillBonusesOf(ch)}
            roleSkills={roleSkillsOf(ch)}
            canRoll
          />
        )}

        {shown === "gear" && <GearSheet ch={ch} save={save} />}

        {shown === "cyber" && <CyberSheet ch={ch} save={save} />}

        {shown === "ability" && <RoleAbility ch={ch} save={save} />}

        {shown === "net" && <NetSheet ch={ch} save={save} />}

        {shown === "lore" && (
          <LifepathEditor value={ch.lifepath} onChange={(lifepath) => save({ lifepath })} />
        )}

        {shown === "notes" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {NOTE_FIELDS.map((f) => (
              <label key={f.key} className={f.area ? "sm:col-span-2" : ""}>
                <span className="label">{f.label}</span>
                {f.area ? (
                  <textarea
                    className="field mt-1 min-h-20 resize-y"
                    value={ch.notes[f.key]}
                    onChange={(e) => save({ notes: { ...ch.notes, [f.key]: e.target.value } })}
                  />
                ) : (
                  <input
                    className="field mt-1"
                    value={ch.notes[f.key]}
                    onChange={(e) => save({ notes: { ...ch.notes, [f.key]: e.target.value } })}
                  />
                )}
              </label>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** Abas da ficha. Setas ←/→ trocam de aba (padrão de tablist). */
function SheetTabs({
  tabs,
  tab,
  onTab,
}: {
  tabs: SheetTabDef[];
  tab: SheetTab;
  onTab: (tab: SheetTab) => void;
}) {
  function go(i: number) {
    const next = tabs[(i + tabs.length) % tabs.length];
    onTab(next.id);
    document.getElementById(`ficha-tab-${next.id}`)?.focus();
  }
  // a faixa rola de lado em vez de quebrar linha: a aba ativa tem que estar à vista
  useEffect(() => {
    document
      .getElementById(`ficha-tab-${tab}`)
      ?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [tab]);
  return (
    <div
      role="tablist"
      aria-label={t.characters.tabs.aria}
      // a linha de baixo é sombra interna: a borda ficaria fora da área que rola e cortaria o sublinhado da aba
      style={{ scrollbarWidth: "none", boxShadow: "inset 0 -2px 0 var(--line)" }}
      className="flex flex-nowrap gap-x-1 overflow-x-auto [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((def, i) => {
        const on = def.id === tab;
        return (
          <button
            key={def.id}
            role="tab"
            id={`ficha-tab-${def.id}`}
            aria-selected={on}
            aria-controls={`ficha-${def.id}`}
            tabIndex={on ? 0 : -1}
            onClick={() => onTab(def.id)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") go(i + 1);
              else if (e.key === "ArrowLeft") go(i - 1);
              else return;
              e.preventDefault();
            }}
            className={`min-h-10 shrink-0 whitespace-nowrap border-b-2 px-3 py-1.5 focus-visible:!-outline-offset-2 sm:min-h-0 ${
              on ? "border-red text-red" : "border-transparent text-dim hover:text-fg"
            }`}
          >
            {def.label}
          </button>
        );
      })}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  className?: string;
}) {
  return (
    <input
      type="number"
      className={className}
      value={value}
      min={min}
      max={max}
      onChange={(e) => {
        const n = Number(e.target.value);
        if (!Number.isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
      }}
    />
  );
}

function Meter({
  label,
  color,
  value,
  min = 0,
  max,
  onChange,
  children,
}: {
  label: string;
  color: string;
  value: number;
  /** Humanidade pode ficar negativa (ciberpsicose). */
  min?: number;
  max: number;
  onChange: (v: number) => void;
  children?: React.ReactNode;
}) {
  const set = (v: number) => onChange(Math.max(min, Math.min(max, v)));
  return (
    <div className="box bg-raise p-3">
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        <span className="text-lg font-bold">
          {value}/{max}
        </span>
      </div>
      <div className="my-2">
        <Bar value={value} max={max} color={color} />
      </div>
      <div className="flex gap-1">
        {[-5, -1, 1, 5].map((d) => (
          <button
            key={d}
            className="btn btn-bare flex-1 !px-0"
            onClick={() => set(value + d)}
          >
            {d > 0 ? `+${d}` : d}
          </button>
        ))}
      </div>
      {children && <div className="mt-2 space-y-0.5 text-xs">{children}</div>}
    </div>
  );
}
