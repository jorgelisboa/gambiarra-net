"use client";

import { useState } from "react";
import { deleteArchitecture, saveArchitecture, showOnScreen, useApp } from "@/lib/store";
import {
  BLACK_ICE,
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

/** Aba de net do mestre: monta arquiteturas andar por andar e escolhe o que vai pro telão. */
export function NetTab() {
  const { data } = useApp();
  const { architectures, shownId } = data.net;
  const [archId, setArchId] = useState<string | null>(null);
  const arch = architectures.find((a) => a.id === archId) ?? architectures[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <div className="flex items-center gap-2 text-net">
          <Icon name="net" size={24} />
          <h2 className="font-pixel text-xl">arquiteturas</h2>
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
                    <span className="text-xs text-dim">
                      {a.floors.length} andares · {difficultyOf(a.difficulty).label}
                    </span>
                  </span>
                  {a.id === shownId && <span className="shrink-0 bg-red px-1 text-[10px] font-bold uppercase text-black">no ar</span>}
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
          <p className="font-pixel text-xl text-net">nenhuma arquitetura</p>
          <p className="mt-2 max-w-prose text-dim">
            crie uma ao lado e monte andar por andar: senhas, arquivos, nós de controle e black ICE. o tronco
            desce do andar 1; um andar com mais de um filho abre um galho. o telão mostra só o que você revelar.
          </p>
          <p className="mt-2 text-dim">
            no livro, uma arquitetura tem de 3 a 18 andares (3d6), e os 2 primeiros são o lobby.
          </p>
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
      <div className="label">nova arquitetura</div>
      <input
        className="field"
        placeholder="arasaka · torre 3"
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="nome da arquitetura"
      />
      <DifficultySelect value={difficulty} onChange={setDifficulty} />
      <button className="btn btn-primary w-full">criar</button>
    </form>
  );
}

function DifficultySelect({ value, onChange }: { value: NetDifficulty; onChange: (d: NetDifficulty) => void }) {
  return (
    <select
      className="field"
      value={value}
      onChange={(e) => onChange(e.target.value as NetDifficulty)}
      aria-label="dificuldade"
    >
      {NET_DIFFICULTIES.map((d) => (
        <option key={d.id} value={d.id}>
          {d.label} · DV{d.dv}
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
          aria-label="nome da arquitetura"
        />
        <div className="w-44">
          <DifficultySelect value={arch.difficulty} onChange={setDifficulty} />
        </div>
        <span className="text-xs text-dim">
          {arch.floors.length} andares · {revealed} revelados
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            className={`btn ${onAir ? "btn-danger" : "btn-primary"}`}
            onClick={() => showOnScreen(onAir ? null : arch.id)}
            title="o telão mostra só os andares revelados"
          >
            {onAir ? "tirar do telão" : "mandar pro telão"}
          </button>
          <button className="btn" onClick={openScreen} title="abre /tela numa janela: arraste pra TV e aperte F11">
            abrir telão
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button className="btn" onClick={() => save(revealAll(arch, true))}>
          revelar tudo
        </button>
        <button className="btn" onClick={() => save(revealAll(arch, false))}>
          esconder tudo
        </button>
        {arch.runnerAt && (
          <button className="btn" onClick={() => save(moveRunner(arch, null))}>
            netrunner saiu
          </button>
        )}
        <button
          className="btn btn-danger ml-auto"
          onClick={() => {
            if (confirm(`apagar a arquitetura "${arch.name}"?`)) deleteArchitecture(arch.id);
          }}
        >
          apagar arquitetura
        </button>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="net-grid min-h-[360px] overflow-auto border-2 border-line p-4">
          {arch.floors.length ? (
            <NetMap arch={arch} mode="gm" selectedId={selectedId} onSelect={setSelectedId} />
          ) : (
            <button className="btn btn-primary" onClick={() => add(null)}>
              + andar 1
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
          <p className="box p-4 text-dim">clique num andar pra editar.</p>
        )}
      </div>

      <p className="text-xs text-dim">
        tracejado = oculto da mesa. revelar um andar revela o caminho até ele; esconder leva junto o que está abaixo.
        pôr o netrunner num andar já revela.
      </p>
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
          andar <span className="font-mono">{String(depth).padStart(2, "0")}</span>
        </span>
        <span className={`text-xs ${floor.revealed ? "text-net" : "text-dim"}`}>
          {floor.revealed ? "revelado" : "oculto"}
        </span>
      </div>

      <div>
        <div className="label mb-1">o que tem</div>
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
          <div className="label mb-1">DV</div>
          <div className="flex gap-1">
            <input
              type="number"
              className="field font-mono"
              style={{ width: 64 }}
              value={floor.dv}
              min={1}
              max={30}
              onChange={(e) => patch({ dv: Math.max(1, Math.min(30, Number(e.target.value) || 0)) })}
              aria-label="DV do andar"
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
          <div className="label mb-1">black ICE</div>
          <select className="field" value={floor.ice} onChange={(e) => patch({ ice: e.target.value })} aria-label="black ICE">
            {BLACK_ICE.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </div>
      )}

      <label className="block">
        <span className="label">nome no telão</span>
        <input
          className="field mt-1"
          placeholder={floor.kind === "control" ? "câmeras do saguão" : floor.kind === "file" ? "folha de pagamento" : ""}
          value={floor.label}
          onChange={(e) => patch({ label: e.target.value })}
        />
      </label>

      <label className="block">
        <span className="label">nota do mestre</span>
        <textarea
          className="field mt-1 min-h-16"
          placeholder="só você vê"
          value={floor.note}
          onChange={(e) => patch({ note: e.target.value })}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button className={`btn ${floor.revealed ? "" : "btn-primary"}`} onClick={() => save(setRevealed(arch, floor.id, !floor.revealed))}>
          {floor.revealed ? "esconder" : "revelar"}
        </button>
        <button className="btn" disabled={runnerHere} onClick={() => save(moveRunner(arch, floor.id))}>
          netrunner aqui
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-t-2 border-line pt-3">
        <button className="btn btn-primary" disabled={depth >= MAX_FLOORS} onClick={onAdd} title={kids ? "esse andar já tem filho: o novo abre um galho" : undefined}>
          {kids ? "+ galho" : "+ andar abaixo"}
        </button>
        <button
          className="btn btn-danger"
          onClick={() => {
            if (below === 0 || confirm(`apagar o andar ${depth} e os ${below} abaixo dele?`)) onRemove();
          }}
        >
          apagar{below > 0 ? ` (+${below})` : ""}
        </button>
      </div>
    </div>
  );
}
