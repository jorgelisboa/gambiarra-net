"use client";

import { useState } from "react";
import { t } from "@/i18n";
import { deletePlan, saveArchitecture, savePlan, useApp } from "@/lib/store";
import {
  DEFENSES,
  DEFENSE_CATEGORIES,
  DEMONS,
  FEATURE_COST,
  FEATURE_DVS,
  MAX_FLOORS,
  MIN_SECURITY_FLOORS,
  PLAN_TEMPLATES,
  SECURITY_KINDS,
  WHERE_TO_BUY,
  addSecurityFloor,
  defenseCost,
  defenseCounter,
  defenseOf,
  demonOf,
  demonStats,
  fmtEb,
  floorCost,
  moveSecurityFloor,
  newPlan,
  patchSecurityFloor,
  planCost,
  planIssues,
  planLimits,
  planToArchitecture,
  priceCategory,
  removeSecurityFloor,
} from "@/lib/rpg";
import type { PlanIssue } from "@/lib/rpg";
import type { NetArchitecture, SecurityFloor, SecurityFloorKind, SecurityPlan } from "@/lib/types";
import { Icon } from "../Pixel";
import type { IconName } from "../Pixel";

const F = t.infra.floor;
const SUMMARY = t.infra.summary;

/** O âmbar do app (ferimento leve), pra aviso. */
const AMBER = "text-[#ffb000]";

const KIND_ICON: Record<SecurityFloorKind, IconName> = {
  password: "lock",
  file: "file",
  control: "control",
  demon: "ice",
};


/** Aba de infraestrutura do mestre: compra a arquitetura, enche os andares, pendura as defesas e vê o custo. */
export function InfraTab({ onOpenArchitecture }: { onOpenArchitecture: (id: string) => void }) {
  const { data } = useApp();
  const { plans, architectures } = data.net;
  const [planId, setPlanId] = useState<string | null>(null);
  const plan = plans.find((p) => p.id === planId) ?? plans[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <div className="flex items-center gap-2 text-net">
          <Icon name="control" size={24} />
          <h2 className="font-pixel text-xl">{t.infra.list.heading}</h2>
        </div>
        {plans.length > 0 && (
          <ul className="space-y-1">
            {plans.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => setPlanId(p.id)}
                  aria-current={p.id === plan?.id ? "true" : undefined}
                  className={`flex w-full items-center justify-between gap-2 border-2 px-2 py-1.5 text-left ${
                    p.id === plan?.id ? "border-net" : "border-line hover:border-fg"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate">{p.name}</span>
                    <span className="text-xs text-dim">{t.infra.list.summary(p.floors.length, fmtEb(planCost(p).total))}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <NewPlan onCreate={setPlanId} />
      </aside>

      {plan ? (
        <PlanEditor key={plan.id} plan={plan} architectures={architectures} onOpenArchitecture={onOpenArchitecture} />
      ) : (
        <div className="box p-8">
          <p className="font-pixel text-xl text-net">{t.infra.list.emptyTitle}</p>
          <p className="mt-2 max-w-prose text-dim">{t.infra.list.emptyHelp}</p>
        </div>
      )}
    </div>
  );
}

function NewPlan({ onCreate }: { onCreate: (id: string) => void }) {
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const template = PLAN_TEMPLATES.find((tpl) => tpl.id === templateId);
  return (
    <form
      className="box space-y-2 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        const p = newPlan(name, templateId || undefined);
        savePlan(p);
        onCreate(p.id);
        setName("");
      }}
    >
      <div className="label">{t.infra.create.title}</div>
      <input
        className="field"
        placeholder={t.infra.create.namePlaceholder}
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label={t.infra.editor.nameAria}
      />
      <label className="block">
        <span className="label">{t.infra.create.startFrom}</span>
        <select
          className="field mt-1"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          aria-label={t.infra.create.startFrom}
        >
          <option value="">{t.infra.create.blank}</option>
          {PLAN_TEMPLATES.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>
              {tpl.label}
            </option>
          ))}
        </select>
      </label>
      {template && <p className="text-xs text-dim">{template.description}</p>}
      <button className="btn btn-primary w-full">{t.common.actions.create}</button>
    </form>
  );
}

function PlanEditor({
  plan,
  architectures,
  onOpenArchitecture,
}: {
  plan: SecurityPlan;
  architectures: NetArchitecture[];
  onOpenArchitecture: (id: string) => void;
}) {
  /** Id da arquitetura recém-enviada; some assim que os andares mudam (aí o construtor já está defasado). */
  const [sent, setSent] = useState<string | null>(null);
  const cost = planCost(plan);
  const limits = planLimits(plan);
  const issues = planIssues(plan);
  const { tier } = cost;
  const atMax = plan.floors.length >= MAX_FLOORS;

  const save = (next: SecurityPlan) => {
    if (next.floors !== plan.floors) setSent(null);
    savePlan(next);
  };

  return (
    <section className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="field font-pixel max-w-xs text-lg"
          value={plan.name}
          onChange={(e) => save({ ...plan, name: e.target.value })}
          aria-label={t.infra.editor.nameAria}
        />
        <input
          className="field max-w-xs"
          placeholder={t.infra.editor.locationHint}
          value={plan.location}
          onChange={(e) => save({ ...plan, location: e.target.value })}
          aria-label={t.infra.editor.locationHint}
        />
        {tier ? (
          <span className="text-xs text-dim">
            {t.infra.editor.tier(plan.floors.length, fmtEb(tier.perFloor), tier.portable, tier.maxControlNodes)}
            {/* no celular o resumo fica lá embaixo; o total aparece aqui também */}
            <span className="xl:hidden">
              {t.common.sep}
              {t.common.words.total} <span className="font-mono text-fg">{fmtEb(cost.total)}</span>
            </span>
          </span>
        ) : (
          <span className="text-xs text-red">{t.infra.editor.outOfRange(MIN_SECURITY_FLOORS, MAX_FLOORS)}</span>
        )}
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-3">
          {plan.floors.map((f, i) => (
            <FloorCard
              key={f.id}
              plan={plan}
              floor={f}
              index={i}
              issues={issues.filter((x) => x.floorId === f.id)}
              save={save}
            />
          ))}
          <button className="btn btn-primary" disabled={atMax} onClick={() => save(addSecurityFloor(plan, null))}>
            {t.infra.editor.addAtEnd}
          </button>
        </div>

        <Summary
          plan={plan}
          architectures={architectures}
          cost={cost}
          limits={limits}
          issues={issues}
          sent={sent}
          onSent={setSent}
          onOpenArchitecture={onOpenArchitecture}
        />
      </div>
    </section>
  );
}

function FloorCard({
  plan,
  floor,
  index,
  issues,
  save,
}: {
  plan: SecurityPlan;
  floor: SecurityFloor;
  index: number;
  issues: PlanIssue[];
  save: (p: SecurityPlan) => void;
}) {
  const count = plan.floors.length;
  const atMax = count >= MAX_FLOORS;
  const atMin = count <= MIN_SECURITY_FLOORS;
  const isDemon = floor.kind === "demon";
  const kind = SECURITY_KINDS.find((k) => k.id === floor.kind) ?? SECURITY_KINDS[0];
  const defense = floor.kind === "control" ? defenseOf(floor.defense) : null;
  const demon = demonOf(floor.demon);
  const patch = (p: Partial<SecurityFloor>) => save(patchSecurityFloor(plan, floor.id, p));

  return (
    <div className="box space-y-2 p-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        <span className="font-mono text-dim">F{String(index + 1).padStart(2, "0")}</span>
        <span className={`flex min-w-0 items-center gap-1.5 ${isDemon ? "text-red" : "text-net"}`}>
          <Icon name={KIND_ICON[floor.kind]} size={16} />
          <span className="truncate">{kind.label}</span>
        </span>
        <span className="ml-auto font-mono">{fmtEb(floorCost(floor).total)}</span>
        <div className="flex w-full flex-wrap gap-1 sm:w-auto">
          <button
            className="btn"
            aria-label={F.up}
            disabled={index === 0}
            onClick={() => save(moveSecurityFloor(plan, floor.id, -1))}
          >
            ↑
          </button>
          <button
            className="btn"
            aria-label={F.down}
            disabled={index === count - 1}
            onClick={() => save(moveSecurityFloor(plan, floor.id, 1))}
          >
            ↓
          </button>
          <button
            className="btn"
            aria-label={F.addBelow}
            title={atMax ? t.infra.issues.maxFloors(MAX_FLOORS) : F.addBelow}
            disabled={atMax}
            onClick={() => save(addSecurityFloor(plan, floor.id))}
          >
            +
          </button>
          <button
            className="btn btn-danger"
            disabled={atMin}
            title={atMin ? t.infra.issues.minFloors(MIN_SECURITY_FLOORS) : undefined}
            onClick={() => save(removeSecurityFloor(plan, floor.id))}
          >
            {F.remove}
          </button>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
          {SECURITY_KINDS.map((k) => (
            <button
              key={k.id}
              onClick={() => patch({ kind: k.id })}
              aria-pressed={floor.kind === k.id}
              className={`border-2 px-2 py-1 text-left text-xs ${
                floor.kind === k.id
                  ? k.id === "demon"
                    ? "border-red bg-red text-black"
                    : "border-net bg-net text-black"
                  : "border-line hover:border-fg"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-dim">{kind.hint}</p>
      </div>

      {isDemon ? (
        <div>
          <div className="label mb-1">{F.demon}</div>
          <div className="flex flex-wrap gap-1">
            {DEMONS.map((d) => (
              <button
                key={d.id}
                onClick={() => patch({ demon: d.id })}
                aria-pressed={floor.demon === d.id}
                className={`border-2 px-2 py-1 font-mono text-xs ${
                  floor.demon === d.id ? "border-red text-red" : "border-line hover:border-fg"
                }`}
              >
                {F.demonButton(d.name, fmtEb(d.cost))}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-dim">{demonStats(demon)}</p>
        </div>
      ) : (
        <div>
          <div className="label mb-1">{F.dv}</div>
          <div className="flex flex-wrap gap-1">
            {FEATURE_DVS.map((dv) => (
              <button
                key={dv}
                onClick={() => patch({ dv })}
                aria-pressed={floor.dv === dv}
                className={`border-2 px-2 py-1 font-mono text-xs ${
                  floor.dv === dv ? "border-net text-net" : "border-line hover:border-fg"
                }`}
              >
                {F.dvButton(dv, fmtEb(FEATURE_COST[dv]))}
              </button>
            ))}
          </div>
        </div>
      )}

      {floor.kind === "control" && (
        <div>
          <div className="label mb-1">{F.defense}</div>
          <select
            className="field"
            value={defense ? defense.id : ""}
            onChange={(e) => patch({ defense: e.target.value || null })}
            aria-label={F.defenseAria}
          >
            <option value="">{F.noDefense}</option>
            {DEFENSE_CATEGORIES.map((c) => (
              <optgroup key={c.id} label={c.label}>
                {DEFENSES.filter((d) => d.category === c.id).map((d) => (
                  <option key={d.id} value={d.id}>
                    {F.defenseOption(d.name, d.counterDv, fmtEb(defenseCost(d)))}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {defense ? (
            <div className="mt-1 space-y-0.5 text-xs">
              <p className="text-dim">{defense.data}</p>
              <p>{defense.summary}</p>
              <p className="text-dim">{F.disarm(defenseCounter(defense))}</p>
            </div>
          ) : (
            <p className="mt-1 text-xs text-dim">{F.otherThing}</p>
          )}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block min-w-0">
          <span className="label">{F.screenName}</span>
          <input
            className="field mt-1"
            placeholder={F.screenNameHint[floor.kind]}
            value={floor.label}
            onChange={(e) => patch({ label: e.target.value })}
            aria-label={F.screenName}
          />
        </label>
        <label className="block min-w-0">
          <span className="label">{F.masterNote}</span>
          <textarea
            className="field mt-1 min-h-16"
            placeholder={F.masterNoteHint}
            value={floor.note}
            onChange={(e) => patch({ note: e.target.value })}
            aria-label={F.masterNote}
          />
        </label>
      </div>

      {issues.length > 0 && (
        <ul className="space-y-0.5">
          {issues.map((x, i) => (
            <IssueLine key={i} issue={x} />
          ))}
        </ul>
      )}
    </div>
  );
}

function IssueLine({ issue }: { issue: PlanIssue }) {
  return (
    <li className={`text-xs ${issue.level === "erro" ? "text-red" : AMBER}`}>
      {issue.level}: {issue.text}
    </li>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className={`flex items-baseline justify-between gap-2 text-sm ${value === 0 ? "text-dim" : ""}`}>
      <span className="min-w-0">{label}</span>
      <span className="shrink-0 font-mono">{fmtEb(value)}</span>
    </div>
  );
}

function Limit({ label, used, max }: { label: string; used: number; max: number | null }) {
  const over = max !== null && used > max;
  return (
    <div className={`flex items-baseline justify-between gap-2 text-sm ${over ? "text-red" : ""}`}>
      <span className="min-w-0">{label}</span>
      <span className="shrink-0 font-mono">
        {used}/{max ?? SUMMARY.noLimit}
      </span>
    </div>
  );
}

function Summary({
  plan,
  architectures,
  cost,
  limits,
  issues,
  sent,
  onSent,
  onOpenArchitecture,
}: {
  plan: SecurityPlan;
  architectures: NetArchitecture[];
  cost: ReturnType<typeof planCost>;
  limits: ReturnType<typeof planLimits>;
  issues: PlanIssue[];
  sent: string | null;
  onSent: (id: string | null) => void;
  onOpenArchitecture: (id: string) => void;
}) {
  const linked = architectures.find((a) => a.id === plan.architectureId) ?? null;
  const planIssuesOnly = issues.filter((x) => !x.floorId);
  const floorIssues = issues.filter((x) => x.floorId);
  const floorErrors = floorIssues.filter((x) => x.level === "erro").length;
  const floorWarnings = floorIssues.length - floorErrors;
  const hasErrors = issues.some((x) => x.level === "erro");

  const send = () => {
    if (linked && !confirm(SUMMARY.confirmReplace(linked.name))) return;
    const arch = planToArchitecture(plan, linked);
    saveArchitecture(arch);
    savePlan({ ...plan, architectureId: arch.id });
    onSent(arch.id);
  };

  return (
    <div className="box min-w-0 space-y-3 self-start p-3 xl:sticky xl:top-3">
      <h3 className="font-pixel text-lg">{SUMMARY.title}</h3>

      <div className="space-y-1">
        <Row
          label={cost.tier ? SUMMARY.rows.architectureTier(cost.floors, fmtEb(cost.tier.perFloor)) : SUMMARY.rows.architecture}
          value={cost.base}
        />
        <Row label={SUMMARY.rows.passwords} value={cost.passwords} />
        <Row label={SUMMARY.rows.files} value={cost.files} />
        <Row label={SUMMARY.rows.controlNodes} value={cost.controlNodes} />
        <Row label={SUMMARY.rows.demons} value={cost.demons} />
        <Row label={SUMMARY.rows.defenses} value={cost.defenses} />
      </div>

      <div className="border-t-2 border-line pt-3">
        <div className="font-mono text-2xl">{fmtEb(cost.total)}</div>
        <div className="text-xs text-dim">{priceCategory(cost.total)}</div>
      </div>

      <div className="space-y-1 border-t-2 border-line pt-3">
        <Limit label={SUMMARY.rows.controlNodes} used={limits.controlNodes.used} max={limits.controlNodes.max} />
        <Limit label={SUMMARY.rows.demons} used={limits.demons.used} max={limits.demons.max} />
      </div>

      {(planIssuesOnly.length > 0 || floorIssues.length > 0) && (
        <ul className="space-y-0.5 border-t-2 border-line pt-3">
          {planIssuesOnly.map((x, i) => (
            <IssueLine key={i} issue={x} />
          ))}
          {floorIssues.length > 0 && (
            <li className={`text-xs ${floorErrors > 0 ? "text-red" : AMBER}`}>
              {SUMMARY.floorIssues(floorErrors, floorWarnings)}
            </li>
          )}
        </ul>
      )}

      <p className="text-xs text-dim">{SUMMARY.whereToBuy(WHERE_TO_BUY)}</p>

      <div className="space-y-2 border-t-2 border-line pt-3">
        <button
          className="btn btn-primary w-full"
          disabled={hasErrors}
          title={hasErrors ? SUMMARY.fixErrors : undefined}
          onClick={send}
        >
          {linked ? SUMMARY.update : SUMMARY.send}
        </button>
        {sent ? (
          <div className="space-y-1">
            <p className="text-xs text-net">{SUMMARY.sent}</p>
            <button className="btn w-full" onClick={() => onOpenArchitecture(sent)}>
              {SUMMARY.openBuilder}
            </button>
          </div>
        ) : (
          linked && (
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-xs text-dim">{SUMMARY.linkedTo(linked.name)}</span>
              <button className="btn shrink-0 text-xs" onClick={() => onOpenArchitecture(linked.id)}>
                {SUMMARY.open}
              </button>
            </div>
          )
        )}
      </div>

      <button
        className="btn btn-danger w-full"
        onClick={() => {
          if (confirm(SUMMARY.confirmDelete(plan.name))) deletePlan(plan.id);
        }}
      >
        {SUMMARY.delete}
      </button>
    </div>
  );
}
