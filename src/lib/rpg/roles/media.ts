import { beats, check, d10 } from "../dice";
import type { RoleDef } from "../types";

/** Chance em 10 de o público acreditar na matéria. */
const believability = (rank: number) =>
  rank >= 10 ? 7 : rank >= 9 ? 6 : rank >= 7 ? 5 : rank >= 5 ? 4 : rank >= 3 ? 3 : 2;

const RUMORS = [
  { label: "vago", dv: 7 },
  { label: "típico", dv: 9 },
  { label: "substancial", dv: 11 },
  { label: "detalhado", dv: 13 },
];

export const media: RoleDef = {
  role: "Media",
  summary:
    "Repórter independente que cava a sujeira dos poderosos e publica. Vive de fontes, público e reputação.",
  ability: {
    name: "Credibility",
    namePt: "credibilidade",
    summary:
      "Faz o público acreditar no que você publica e traz rumores sem precisar sair procurando.",
    passives: (rank) => [`chance de acreditarem: ${believability(rank)}/10`],
    uses: [
      {
        id: "publish",
        name: "publicar matéria",
        formula: "1d10 ≤ chance",
        desc: "sorte não vale aqui. não dá pra republicar o mesmo assunto sem novidade.",
        mods: [
          { label: "sem provas", value: 0 },
          { label: "1 prova verificável (+1)", value: 1 },
          { label: "mais de 4 provas (+3)", value: 3 },
        ],
        roll: ({ rank }, bonus) => {
          const d = d10();
          const chance = Math.min(10, believability(rank) + bonus);
          const ok = d <= chance;
          return {
            dice: [d],
            total: d,
            ok,
            text: ok ? `o público comprou (${d} ≤ ${chance})` : `não colou (${d} > ${chance})`,
          };
        },
      },
      {
        id: "rumor",
        name: "rumor passivo",
        formula: "credibilidade + 1d10",
        desc: "o mestre rola em segredo pelo menos 2× por semana.",
        roll: ({ rank }) => {
          const r = check(rank);
          const best = RUMORS.filter((x) => beats(r.total, x.dv)).at(-1);
          return {
            ...r,
            ok: Boolean(best),
            text: best ? `chega um rumor ${best.label} (DV${best.dv})` : "nada chegou",
          };
        },
      },
    ],
    tables: [
      {
        title: "público por rank",
        tiers: [
          { from: 1, to: 2, lines: ["alcance: o bairro", "chance: 2/10"] },
          { from: 3, to: 4, lines: ["alcance: screamsheet e Data Pool locais", "chance: 3/10"] },
          { from: 5, to: 6, lines: ["alcance: a cidade toda", "chance: 4/10"] },
          { from: 7, to: 8, lines: ["alcance: o estado", "chance: 5/10"] },
          { from: 9, to: 9, lines: ["alcance: boa parte do país", "chance: 6/10"] },
          { from: 10, to: 10, lines: ["alcance: o mundo", "chance: 7/10"] },
        ],
      },
    ],
  },
};
