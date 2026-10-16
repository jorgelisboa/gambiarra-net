"use client";

import { useState } from "react";
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
  defenseOf,
  demonOf,
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

/** O âmbar do app (ferimento leve), pra aviso. */
const AMBER = "text-[#ffb000]";

const KIND_ICON: Record<SecurityFloorKind, IconName> = {
  password: "lock",
  file: "file",
  control: "control",
  demon: "ice",
};

const LABEL_PLACEHOLDER: Record<SecurityFloorKind, string> = {
  password: "portaria",
  file: "folha de pagamento",
  control: "câmeras do saguão",
  demon: "segurança do prédio",
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
          <h2 className="font-pixel text-xl">infraestrutura</h2>
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
                    <span className="text-xs text-dim">
                      {p.floors.length} andares · {fmtEb(planCost(p).total)}
                    </span>
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
          <p className="font-pixel text-xl text-net">nenhuma infraestrutura</p>
          <p className="mt-2 max-w-prose text-dim">
            compre uma arquitetura, encha os andares com senha, arquivo, nó de controle e demon, e pendure as defesas do
            mundo real nos nós. os custos seguem as regras de Home Security 2045 do livro (pág. 217); black ICE fica de fora.
          </p>
        </div>
      )}
    </div>
  );
}

function NewPlan({ onCreate }: { onCreate: (id: string) => void }) {
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const template = PLAN_TEMPLATES.find((t) => t.id === templateId);
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
      <div className="label">nova infraestrutura</div>
      <input
        className="field"
        placeholder="depósito da tlb"
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="nome da infraestrutura"
      />
      <label className="block">
        <span className="label">começar de</span>
        <select className="field mt-1" value={templateId} onChange={(e) => setTemplateId(e.target.value)} aria-label="começar de">
          <option value="">em branco · 3 andares</option>
          {PLAN_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      {template && <p className="text-xs text-dim">{template.description}</p>}
      <button className="btn btn-primary w-full">criar</button>
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
          aria-label="nome da infraestrutura"
        />
        <input
          className="field max-w-xs"
          placeholder="onde fica no mundo real"
          value={plan.location}
          onChange={(e) => save({ ...plan, location: e.target.value })}
          aria-label="onde fica no mundo real"
        />
        {tier ? (
          <span className="text-xs text-dim">
            {plan.floors.length} andares · {fmtEb(tier.perFloor)}/andar · {tier.portable ? "portátil" : "fixo"} ·{" "}
            {tier.maxControlNodes === null ? "nós sem limite" : `até ${tier.maxControlNodes} nós de controle`}
            {/* no celular o resumo fica lá embaixo; o total aparece aqui também */}
            <span className="xl:hidden">
              {" "}
              · total <span className="font-mono text-fg">{fmtEb(cost.total)}</span>
            </span>
          </span>
        ) : (
          <span className="text-xs text-red">
            uma arquitetura tem de {MIN_SECURITY_FLOORS} a {MAX_FLOORS} andares
          </span>
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
            + andar no fim
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
            aria-label="subir andar"
            disabled={index === 0}
            onClick={() => save(moveSecurityFloor(plan, floor.id, -1))}
          >
            ↑
          </button>
          <button
            className="btn"
            aria-label="descer andar"
            disabled={index === count - 1}
            onClick={() => save(moveSecurityFloor(plan, floor.id, 1))}
          >
            ↓
          </button>
          <button
            className="btn"
            aria-label="andar novo abaixo"
            title={atMax ? `uma arquitetura tem no máximo ${MAX_FLOORS} andares` : "andar novo abaixo"}
            disabled={atMax}
            onClick={() => save(addSecurityFloor(plan, floor.id))}
          >
            +
          </button>
          <button
            className="btn btn-danger"
            disabled={atMin}
            title={atMin ? `uma arquitetura tem no mínimo ${MIN_SECURITY_FLOORS} andares` : undefined}
            onClick={() => save(removeSecurityFloor(plan, floor.id))}
          >
            apagar
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
          <div className="label mb-1">demon</div>
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
                {d.name} · {fmtEb(d.cost)}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-dim">
            REZ {demon.rez} · Interface {demon.interface} · {demon.netActions} NET actions · Combat Number{" "}
            {demon.combatNumber}
          </p>
        </div>
      ) : (
        <div>
          <div className="label mb-1">DV</div>
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
                DV{dv} · {fmtEb(FEATURE_COST[dv])}
              </button>
            ))}
          </div>
        </div>
      )}

      {floor.kind === "control" && (
        <div>
          <div className="label mb-1">defesa</div>
          <select
            className="field"
            value={defense ? defense.id : ""}
            onChange={(e) => patch({ defense: e.target.value || null })}
            aria-label="defesa do nó de controle"
          >
            <option value="">outra coisa · sem defesa, sem custo</option>
            {DEFENSE_CATEGORIES.map((c) => (
              <optgroup key={c.id} label={c.label}>
                {DEFENSES.filter((d) => d.category === c.id).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} · DV{d.counterDv} · {fmtEb(defenseCost(d))}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {defense ? (
            <div className="mt-1 space-y-0.5 text-xs">
              <p className="text-dim">{defense.data}</p>
              <p>{defense.summary}</p>
              <p className="text-dim">
                desarmar: Electronics/Security Tech DV{defense.counterDv}, {defense.counterTime}
              </p>
            </div>
          ) : (
            <p className="mt-1 text-xs text-dim">
              porta, sprinkler, sirene, telão, ar-condicionado: escreva no nome o que o nó controla
            </p>
          )}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block min-w-0">
          <span className="label">nome no telão</span>
          <input
            className="field mt-1"
            placeholder={LABEL_PLACEHOLDER[floor.kind]}
            value={floor.label}
            onChange={(e) => patch({ label: e.target.value })}
            aria-label="nome no telão"
          />
        </label>
        <label className="block min-w-0">
          <span className="label">nota do mestre</span>
          <textarea
            className="field mt-1 min-h-16"
            placeholder="quem sabe a senha, o que tem no arquivo..."
            value={floor.note}
            onChange={(e) => patch({ note: e.target.value })}
            aria-label="nota do mestre"
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
        {used}/{max ?? "sem limite"}
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

  const floorCount = [
    floorErrors > 0 ? `${floorErrors} ${floorErrors === 1 ? "erro" : "erros"}` : null,
    floorWarnings > 0 ? `${floorWarnings} ${floorWarnings === 1 ? "aviso" : "avisos"}` : null,
  ]
    .filter(Boolean)
    .join(" e ");

  const send = () => {
    if (linked && !confirm(`substituir os andares de "${linked.name}"? o que estava revelado no telão zera.`)) return;
    const arch = planToArchitecture(plan, linked);
    saveArchitecture(arch);
    savePlan({ ...plan, architectureId: arch.id });
    onSent(arch.id);
  };

  return (
    <div className="box min-w-0 space-y-3 self-start p-3 xl:sticky xl:top-3">
      <h3 className="font-pixel text-lg">custo</h3>

      <div className="space-y-1">
        <Row
          label={cost.tier ? `arquitetura · ${cost.floors} × ${fmtEb(cost.tier.perFloor)}` : "arquitetura"}
          value={cost.base}
        />
        <Row label="senhas" value={cost.passwords} />
        <Row label="arquivos" value={cost.files} />
        <Row label="nós de controle" value={cost.controlNodes} />
        <Row label="demons" value={cost.demons} />
        <Row label="defesas" value={cost.defenses} />
      </div>

      <div className="border-t-2 border-line pt-3">
        <div className="font-mono text-2xl">{fmtEb(cost.total)}</div>
        <div className="text-xs text-dim">{priceCategory(cost.total)}</div>
      </div>

      <div className="space-y-1 border-t-2 border-line pt-3">
        <Limit label="nós de controle" used={limits.controlNodes.used} max={limits.controlNodes.max} />
        <Limit label="demons" used={limits.demons.used} max={limits.demons.max} />
      </div>

      {(planIssuesOnly.length > 0 || floorIssues.length > 0) && (
        <ul className="space-y-0.5 border-t-2 border-line pt-3">
          {planIssuesOnly.map((x, i) => (
            <IssueLine key={i} issue={x} />
          ))}
          {floorIssues.length > 0 && (
            <li className={`text-xs ${floorErrors > 0 ? "text-red" : AMBER}`}>
              {floorCount} {floorIssues.length === 1 ? "no andar" : "nos andares"}
            </li>
          )}
        </ul>
      )}

      <p className="text-xs text-dim">onde comprar: {WHERE_TO_BUY}</p>

      <div className="space-y-2 border-t-2 border-line pt-3">
        <button
          className="btn btn-primary w-full"
          disabled={hasErrors}
          title={hasErrors ? "resolva os erros primeiro" : undefined}
          onClick={send}
        >
          {linked ? "atualizar no construtor" : "mandar pro construtor"}
        </button>
        {sent ? (
          <div className="space-y-1">
            <p className="text-xs text-net">pronto: está na aba netrunner</p>
            <button className="btn w-full" onClick={() => onOpenArchitecture(sent)}>
              abrir no construtor
            </button>
          </div>
        ) : (
          linked && (
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-xs text-dim">ligada a: {linked.name}</span>
              <button className="btn shrink-0 text-xs" onClick={() => onOpenArchitecture(linked.id)}>
                abrir
              </button>
            </div>
          )
        )}
      </div>

      <button
        className="btn btn-danger w-full"
        onClick={() => {
          if (confirm(`apagar a infraestrutura "${plan.name}"? a arquitetura no construtor fica.`)) deletePlan(plan.id);
        }}
      >
        apagar infraestrutura
      </button>
    </div>
  );
}
