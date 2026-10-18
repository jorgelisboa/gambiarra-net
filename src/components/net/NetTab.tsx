"use client";

import { useState } from "react";
import { t } from "@/i18n";
import { deleteArchitecture, saveArchitecture, showOnScreen, useApp } from "@/lib/store";
import {
  BLACK_ICE,
  DEMONS,
  FLOOR_KINDS,
  MAX_FLOORS,
  NET_DIFFICULTIES,
  addFloor,
  childrenOf,
  depthOf,
  difficultyOf,
  floorKind,
  hasDv,
  moveRunner,
  newArchitecture,
  patchFloor,
  removeFloor,
  revealAll,
  setRevealed,
} from "@/lib/rpg";
import type { NetArchitecture, NetDifficulty, NetFloor } from "@/lib/types";
import { Icon } from "../Pixel";
import { NetMap } from "./NetMap";

/** Abre (ou traz de volta) a janela do telão: o mestre arrasta pra TV e põe em tela cheia. */
const openScreen = () => window.open("/tela", "gambiarra-telao");

const B = t.net.builder;

/** Aba de net do mestre: monta arquiteturas andar por andar e escolhe o que vai pro telão. */
export function NetTab({ focusId = null }: { focusId?: string | null }) {
  const { data } = useApp();
  const { architectures, shownId } = data.net;
  const [archId, setArchId] = useState<string | null>(focusId);
  const arch = architectures.find((a) => a.id === archId) ?? architectures[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <div className="flex items-center gap-2 text-net">
          <Icon name="net" size={24} />
          <h2 className="font-pixel text-xl">{B.list.heading}</h2>
        </div>
        {architectures.length > 0 && (
          <ul className="space-y-1">
            {architectures.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => setArchId(a.id)}
                  aria-current={a.id === arch?.id ? "true" : undefined}
                  className={`flex w-full items-center justify-between gap-2 border-2 px-2 py-1.5 text-left ${
                    a.id === arch?.id ? "border-net" : "border-line hover:border-fg"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate">{a.name}</span>
                    <span className="text-xs text-dim">{B.list.summary(a.floors.length, difficultyOf(a.difficulty).label)}</span>
                  </span>
                  {a.id === shownId && (
                    <span className="shrink-0 bg-red px-1 text-[10px] font-bold uppercase text-black">{B.list.onAir}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
        <NewArchitecture onCreate={setArchId} />
      </aside>

      {arch ? (
        <ArchitectureEditor key={arch.id} arch={arch} onAir={arch.id === shownId} />
      ) : (
        <div className="box p-8">
          <p className="font-pixel text-xl text-net">{B.empty.title}</p>
          <p className="mt-2 max-w-prose text-dim">{B.empty.help}</p>
          <p className="mt-2 text-dim">{B.empty.rule}</p>
        </div>
      )}
    </div>
  );
}

function NewArchitecture({ onCreate }: { onCreate: (id: string) => void }) {
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState<NetDifficulty>("standard");
  return (
    <form
      className="box space-y-2 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        const a = newArchitecture(name, difficulty);
        saveArchitecture(a);
        onCreate(a.id);
        setName("");
      }}
    >
      <div className="label">{B.create.title}</div>
      <input
        className="field"
        placeholder={B.create.namePlaceholder}
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label={B.nameAria}
      />
      <DifficultySelect value={difficulty} onChange={setDifficulty} />
      <button className="btn btn-primary w-full">{t.common.actions.create}</button>
    </form>
  );
}

function DifficultySelect({ value, onChange }: { value: NetDifficulty; onChange: (d: NetDifficulty) => void }) {
  return (
    <select
      className="field"
      value={value}
      onChange={(e) => onChange(e.target.value as NetDifficulty)}
      aria-label={B.difficultyAria}
    >
      {NET_DIFFICULTIES.map((d) => (
        <option key={d.id} value={d.id}>
          {B.difficultyOption(d.label, d.dv)}
        </option>
      ))}
    </select>
  );
}

function ArchitectureEditor({ arch, onAir }: { arch: NetArchitecture; onAir: boolean }) {
  const [selectedId, setSelectedId] = useState<string | null>(arch.floors[0]?.id ?? null);
  const selected = arch.floors.find((f) => f.id === selectedId) ?? null;
  const revealed = arch.floors.filter((f) => f.revealed).length;
  const save = (next: NetArchitecture) => saveArchitecture(next);

  // trocar a dificuldade leva junto as DVs que ainda estavam no padrão antigo
  const setDifficulty = (difficulty: NetDifficulty) => {
    const from = difficultyOf(arch.difficulty).dv;
    const to = difficultyOf(difficulty).dv;
    save({ ...arch, difficulty, floors: arch.floors.map((f) => (f.dv === from ? { ...f, dv: to } : f)) });
  };

  const add = (parent: string | null) => {
    const r = addFloor(arch, parent);
    if (!r.id) return;
    save(r.arch);
    setSelectedId(r.id);
  };

  return (
    <section className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="field font-pixel max-w-xs text-lg"
          value={arch.name}
          onChange={(e) => save({ ...arch, name: e.target.value })}
          aria-label={B.nameAria}
        />
        <div className="w-44">
          <DifficultySelect value={arch.difficulty} onChange={setDifficulty} />
        </div>
        <span className="text-xs text-dim">{B.editor.counts(arch.floors.length, revealed)}</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            className={`btn ${onAir ? "btn-danger" : "btn-primary"}`}
            onClick={() => showOnScreen(onAir ? null : arch.id)}
            title={B.editor.showOnScreenTitle}
          >
            {onAir ? B.editor.hideFromScreen : B.editor.showOnScreen}
          </button>
          <button className="btn" onClick={openScreen} title={B.editor.openScreenTitle}>
            {B.editor.openScreen}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button className="btn" onClick={() => save(revealAll(arch, true))}>
          {B.editor.revealAll}
        </button>
        <button className="btn" onClick={() => save(revealAll(arch, false))}>
          {B.editor.hideAll}
        </button>
        {arch.runnerAt && (
          <button className="btn" onClick={() => save(moveRunner(arch, null))}>
            {B.editor.runnerLeft}
          </button>
        )}
        <button
          className="btn btn-danger ml-auto"
          onClick={() => {
            if (confirm(B.editor.confirmDelete(arch.name))) deleteArchitecture(arch.id);
          }}
        >
          {B.editor.deleteArchitecture}
        </button>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="net-grid min-h-[360px] overflow-auto border-2 border-line p-4">
          {arch.floors.length ? (
            <NetMap arch={arch} mode="gm" selectedId={selectedId} onSelect={setSelectedId} />
          ) : (
            <button className="btn btn-primary" onClick={() => add(null)}>
              {B.editor.firstFloor}
            </button>
          )}
        </div>

        {selected ? (
          <FloorInspector
            key={selected.id}
            arch={arch}
            floor={selected}
            save={save}
            onAdd={() => add(selected.id)}
            onRemove={() => {
              save(removeFloor(arch, selected.id));
              setSelectedId(selected.parent);
            }}
          />
        ) : (
          <p className="box p-4 text-dim">{B.editor.pickFloor}</p>
        )}
      </div>

      <p className="text-xs text-dim">{B.editor.legend}</p>
    </section>
  );
}

function FloorInspector({
  arch,
  floor,
  save,
  onAdd,
  onRemove,
}: {
  arch: NetArchitecture;
  floor: NetFloor;
  save: (a: NetArchitecture) => void;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const depth = depthOf(arch, floor.id);
  const kids = childrenOf(arch, floor.id).length;
  const below = arch.floors.length - removeFloor(arch, floor.id).floors.length - 1;
  const patch = (p: Partial<NetFloor>) => save(patchFloor(arch, floor.id, p));
  const runnerHere = arch.runnerAt === floor.id;

  return (
    <div className="box space-y-3 p-3">
      <div className="flex items-baseline justify-between">
        <span className="font-pixel text-lg">
          {B.floor.title} <span className="font-mono">{String(depth).padStart(2, "0")}</span>
        </span>
        <span className={`text-xs ${floor.revealed ? "text-net" : "text-dim"}`}>
          {floor.revealed ? B.floor.revealed : B.floor.hidden}
        </span>
      </div>

      <div>
        <div className="label mb-1">{B.floor.contents}</div>
        <div className="grid grid-cols-2 gap-1">
          {FLOOR_KINDS.map((k) => (
            <button
              key={k.id}
              onClick={() => patch({ kind: k.id })}
              aria-pressed={floor.kind === k.id}
              className={`border-2 px-2 py-1 text-left text-xs ${
                floor.kind === k.id
                  ? k.id === "ice"
                    ? "border-red bg-red text-black"
                    : "border-net bg-net text-black"
                  : "border-line hover:border-fg"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-dim">{floorKind(floor.kind).against}</p>
      </div>

      {hasDv(floor) ? (
        <div>
          <div className="label mb-1">{B.floor.dv}</div>
          <div className="flex gap-1">
            <input
              type="number"
              className="field font-mono"
              style={{ width: 64 }}
              value={floor.dv}
              min={1}
              max={30}
              onChange={(e) => patch({ dv: Math.max(1, Math.min(30, Number(e.target.value) || 0)) })}
              aria-label={B.floor.dvAria}
            />
            {NET_DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                className={`border-2 px-2 font-mono ${floor.dv === d.dv ? "border-net text-net" : "border-line hover:border-fg"}`}
                onClick={() => patch({ dv: d.dv })}
                title={d.label}
              >
                {d.dv}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="label mb-1">{B.floor.iceOrDemon}</div>
          <select className="field" value={floor.ice} onChange={(e) => patch({ ice: e.target.value })} aria-label={B.floor.iceOrDemon}>
            <optgroup label={B.floor.blackIce}>
              {BLACK_ICE.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </optgroup>
            <optgroup label={B.floor.demon}>
              {DEMONS.map((d) => (
                <option key={d.name}>{d.name}</option>
              ))}
            </optgroup>
          </select>
        </div>
      )}

      <label className="block">
        <span className="label">{B.floor.screenName}</span>
        <input
          className="field mt-1"
          placeholder={B.floor.screenNameHint[floor.kind]}
          value={floor.label}
          onChange={(e) => patch({ label: e.target.value })}
        />
      </label>

      <label className="block">
        <span className="label">{B.floor.masterNote}</span>
        <textarea
          className="field mt-1 min-h-16"
          placeholder={B.floor.masterNoteHint}
          value={floor.note}
          onChange={(e) => patch({ note: e.target.value })}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button className={`btn ${floor.revealed ? "" : "btn-primary"}`} onClick={() => save(setRevealed(arch, floor.id, !floor.revealed))}>
          {floor.revealed ? B.floor.hide : B.floor.reveal}
        </button>
        <button className="btn" disabled={runnerHere} onClick={() => save(moveRunner(arch, floor.id))}>
          {B.floor.runnerHere}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-t-2 border-line pt-3">
        <button className="btn btn-primary" disabled={depth >= MAX_FLOORS} onClick={onAdd} title={kids ? B.floor.branchTitle : undefined}>
          {kids ? B.floor.addBranch : B.floor.addBelow}
        </button>
        <button
          className="btn btn-danger"
          onClick={() => {
            if (below === 0 || confirm(B.floor.confirmRemove(depth, below))) onRemove();
          }}
        >
          {B.floor.remove(below)}
        </button>
      </div>
    </div>
  );
}
