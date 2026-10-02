"use client";

import { useState } from "react";
import {
  CREATION_METHODS,
  CREATION_STEPS,
  STARTING_MONEY,
  STREETRAT_KITS,
  addGear,
  emptyLifepath,
  gearFromKit,
  streetratSkills,
  templateRow,
  type CreationMethod,
  type CreationStepId,
} from "@/lib/rpg";
import { emptyStats, newCharacter } from "@/lib/rules";
import type { Character, Lifepath, Role, SkillEntry } from "@/lib/types";
import { LifepathEditor } from "./LifepathEditor";
import { RolePicker } from "./RolePicker";
import { SkillSheet } from "./SkillSheet";
import { StarterKit, spentOn, type Purchase } from "./StarterKit";
import { StatTemplatePicker } from "./StatTemplatePicker";

type Step = "method" | CreationStepId;

interface Draft {
  name: string;
  handle: string;
  role: Role | null;
  lifepath: Lifepath;
  /** Linha da tabela de stats do role (1–10). */
  statsRow: number | null;
  /** Null = ainda é o template do role (refeito se o role ou o idioma da origem mudar). */
  skills: SkillEntry[] | null;
  /** Opção escolhida em cada linha "isto ou aquilo" do kit (w0, o3...). */
  kitPicks: Record<string, number>;
  /** Compras com os 500eb iniciais. */
  bought: Purchase[];
}

const METHOD_STEP = { label: "método", title: "como criar", hint: "escolha o método de criação." };

/** Criação de personagem em passos. Os passos vêm do método escolhido (`src/lib/rpg/creation.ts`). */
export function CreationWizard({
  onDone,
  onCancel,
}: {
  onDone: (ch: Character) => void;
  onCancel: () => void;
}) {
  const [method, setMethod] = useState<CreationMethod | null>(null);
  const [step, setStep] = useState<Step>("method");
  const [draft, setDraft] = useState<Draft>({
    name: "",
    handle: "",
    role: null,
    lifepath: emptyLifepath(),
    statsRow: null,
    skills: null,
    kitPicks: {},
    bought: [],
  });

  const steps: Step[] = ["method", ...(method ?? CREATION_METHODS[0]).steps];
  const stats = draft.role && draft.statsRow ? templateRow(draft.role, draft.statsRow) : undefined;
  const skills =
    draft.skills ?? (draft.role ? streetratSkills(draft.role, draft.lifepath.picks.language) : []);
  const at = steps.indexOf(step);
  const info = step === "method" ? METHOD_STEP : CREATION_STEPS[step];
  const isLast = step !== "method" && at === steps.length - 1;
  const ready =
    step === "name"
      ? draft.name.trim() !== ""
      : step === "role"
        ? draft.role !== null
        : step === "stats"
          ? draft.statsRow !== null
          : true;

  function next() {
    if (!ready) return;
    if (isLast) return finish();
    setStep(steps[at + 1]);
  }

  function finish() {
    if (!draft.role) return setStep("role");
    const base = newCharacter(draft.role, stats);
    onDone({
      ...base,
      name: draft.name.trim() || base.name,
      notes: { ...base.notes, alias: draft.handle.trim() },
      lifepath: draft.lifepath,
      skills: method?.steps.includes("skills") ? skills : [],
      ...(method?.steps.includes("gear") && {
        gear: draft.bought.reduce(
          (g, p) => addGear(g, p.ref, p.qty, p.slot),
          gearFromKit(STREETRAT_KITS[draft.role], draft.kitPicks),
        ),
        money: STARTING_MONEY - spentOn(draft.bought),
      }),
    });
  }

  return (
    <section className="box space-y-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ol className="flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="passos">
          {steps.map((s, i) => {
            const label = s === "method" ? METHOD_STEP.label : CREATION_STEPS[s].label;
            return (
              <li key={s}>
                <button
                  className={i === at ? "text-red" : i < at ? "text-fg hover:text-red" : "text-dim"}
                  disabled={i > at}
                  aria-current={i === at ? "step" : undefined}
                  onClick={() => setStep(s)}
                >
                  <span className="font-bold">{String(i + 1).padStart(2, "0")}</span> {label}
                </button>
              </li>
            );
          })}
        </ol>
        <button className="btn" onClick={onCancel}>
          cancelar
        </button>
      </div>

      <div>
        <h2 className="font-pixel text-2xl">{info.title}</h2>
        <p className="text-dim">{info.hint}</p>
      </div>

      {step === "method" && (
        <div className="grid gap-2 sm:grid-cols-2">
          {CREATION_METHODS.map((m) => (
            <button
              key={m.id}
              disabled={m.soon}
              className={`box group flex flex-col gap-2 p-4 text-left disabled:cursor-not-allowed disabled:opacity-50 ${method?.id === m.id ? "box-active" : "enabled:hover:border-dim"}`}
              onClick={() => {
                setMethod(m);
                setStep(m.steps[0]);
              }}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-pixel text-xl group-enabled:group-hover:text-red">{m.name}</span>
                {m.soon && <span className="text-xs text-dim">em breve</span>}
              </span>
              <span className="text-xs text-dim">{m.summary}</span>
              <span className="text-xs">
                {m.steps.map((s) => CREATION_STEPS[s].label).join(" → ")}
              </span>
              {m.upcoming.length > 0 && (
                <span className="text-xs text-dim">depois: {m.upcoming.join(", ")}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {step === "name" && (
        <form
          className="grid max-w-xl gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            next();
          }}
        >
          <label>
            <span className="label">nome</span>
            <input
              autoFocus
              className="field font-pixel mt-1 text-xl"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <label>
            <span className="label">handle (opcional)</span>
            <input
              className="field mt-1"
              placeholder="como te chamam na rua"
              value={draft.handle}
              onChange={(e) => setDraft({ ...draft, handle: e.target.value })}
            />
          </label>
          <button type="submit" hidden />
        </form>
      )}

      {step === "role" && (
        <RolePicker
          selected={draft.role}
          onPick={(role) => {
            // linha de stats e perícias são do role: trocou de role, refaz
            if (role !== draft.role) setDraft({ ...draft, role, statsRow: null, skills: null, kitPicks: {} });
          }}
        />
      )}

      {step === "lifepath" && (
        <LifepathEditor
          value={draft.lifepath}
          onChange={(lifepath) =>
            setDraft({
              ...draft,
              lifepath,
              // o idioma da origem entra no template de perícias
              skills: lifepath.picks.language === draft.lifepath.picks.language ? draft.skills : null,
            })
          }
        />
      )}

      {step === "stats" && draft.role && (
        <StatTemplatePicker
          role={draft.role}
          face={draft.statsRow}
          onPick={(statsRow) => setDraft({ ...draft, statsRow })}
        />
      )}

      {step === "skills" && draft.role && (
        <SkillSheet
          skills={skills}
          onChange={(s) => setDraft({ ...draft, skills: s })}
          stats={stats ?? emptyStats()}
          role={draft.role}
          originLanguage={draft.lifepath.picks.language}
        />
      )}

      {step === "gear" && draft.role && (
        <StarterKit
          role={draft.role}
          picks={draft.kitPicks}
          onPicks={(kitPicks) => setDraft({ ...draft, kitPicks })}
          bought={draft.bought}
          onBought={(bought) => setDraft({ ...draft, bought })}
        />
      )}

      {step !== "method" && (
        <div className="flex items-center justify-between gap-3 border-t-2 border-line pt-4">
          <button className="btn" onClick={() => setStep(steps[at - 1])}>
            voltar
          </button>
          <button className="btn btn-primary" disabled={!ready} onClick={next}>
            {isLast ? "criar personagem" : "próximo"}
          </button>
        </div>
      )}
    </section>
  );
}
