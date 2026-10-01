import { pointsIn } from "../ability";
import { beats, check, skillMods } from "../dice";
import type { RoleDef } from "../types";

const cryoGear = (p: number) =>
  p >= 4 ? "cryotank próprio, mais capacidade" : p === 3 ? "cryotank próprio" : p === 2 ? "acesso a instalação de crio" : "cryopump";

export const medtech: RoleDef = {
  role: "Medtech",
  summary:
    "Médico de rua, ripperdoc ou paramédico do Trauma Team. Mantém vivo quem já devia estar morto e instala o cromo.",
  ability: {
    name: "Medicine",
    namePt: "medicina",
    summary:
      "A cada rank ganha 1 ponto em uma especialidade: cirurgia, farmacêutica ou criossistemas.",
    alloc: {
      title: "especialidades",
      budget: (rank) => rank,
      options: [
        {
          id: "surgery",
          name: "cirurgia",
          rule: "+2 na perícia cirurgia por ponto (máx 10). trata ferimento crítico e instala cyberware",
          max: 5,
          effect: (p) => `cirurgia ${p * 2}`,
        },
        {
          id: "pharma",
          name: "farmacêutica",
          rule: "+1 em medical tech por ponto (máx 5). sintetiza fármacos",
          max: 5,
          effect: (p) => `+${p} medical tech · sintetiza fármacos`,
        },
        {
          id: "cryo",
          name: "criossistemas",
          rule: "+1 em medical tech por ponto (máx 5). libera equipamento de crio",
          max: 5,
          effect: (p) => `+${p} medical tech · ${cryoGear(p)}`,
        },
      ],
    },
    uses: [
      {
        id: "synthesize",
        name: "sintetizar fármaco",
        formula: "tech + medical tech + 1d10 vs DV13",
        desc: "Antibiotic, Rapidetox, Speedheal, Stim ou Surge.",
        mods: skillMods("medical tech"),
        locked: ({ state }) => (pointsIn(state, "pharma") > 0 ? null : "sem pontos em farmacêutica"),
        roll: ({ stats }, skill) => {
          const r = check(stats.TECH + skill);
          const ok = beats(r.total, 13);
          return { ...r, ok, text: ok ? "dose pronta" : "não saiu (precisa passar de 13)" };
        },
      },
    ],
  },
};
