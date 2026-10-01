import { d10, d6 } from "../dice";
import type { RoleDef, Tier } from "../types";

const BACKUP: (Tier & { who: string })[] = [
  {
    from: 1,
    to: 2,
    who: "4 seguranças corporativos",
    lines: ["quem: 4 seguranças corporativos", "ficha: combate 8 · SP 7 · HP 20", "equipamento: pistola pesada, kevlar"],
  },
  {
    from: 3,
    to: 4,
    who: "4 policiais de ronda",
    lines: [
      "quem: 4 policiais de ronda",
      "ficha: combate 10 · SP 7 · HP 25",
      "equipamento: pistola pesada, kevlar, 2 carros compactos",
    ],
  },
  {
    from: 5,
    to: 7,
    who: "2 do departamento do xerife",
    lines: [
      "quem: 2 do departamento do xerife",
      "ficha: combate 14 · SP 13 · HP 35",
      "equipamento: fuzil de assalto, armorjack pesado, carro de alto desempenho",
    ],
  },
  {
    from: 8,
    to: 8,
    who: "1 marshal da recovery zone",
    lines: [
      "quem: 1 marshal da recovery zone",
      "ficha: combate 16 · SP 15 · HP 50",
      "equipamento: fuzil, lança-granadas, flak, superbike",
    ],
  },
  {
    from: 9,
    to: 9,
    who: "2 da C-SWAT",
    lines: [
      "quem: 2 da C-SWAT",
      "ficha: combate 15 · SP 18 · HP 35",
      "equipamento: fuzis, lança-foguetes, metalgear, AV-4",
    ],
  },
  {
    from: 10,
    to: 10,
    who: "2 agentes federais",
    lines: [
      "quem: 2 agentes federais",
      "ficha: combate 14 · SP 11 · HP 35",
      "equipamento: fuzis, armorjack leve, AV-4. ficam pra investigar",
    ],
  },
];

const tierAt = (rank: number) => BACKUP.findIndex((t) => rank >= t.from && rank <= t.to);

export const lawman: RoleDef = {
  role: "Lawman",
  summary:
    "Policial, xerife ou segurança corporativa segurando as pontas numa cidade em pedaços. Nunca fica sozinho por muito tempo.",
  ability: {
    name: "Backup",
    namePt: "reforço",
    summary:
      "Chama colegas armados. Quanto maior o rank, mais pesado o reforço, e mais difícil alguém atender.",
    uses: [
      {
        id: "call",
        name: "chamar reforço",
        formula: "1d10 ≥ rank, depois 1d6 rounds",
        desc: "se ninguém atender, tenta de novo no próximo turno.",
        cost: "1 ação",
        roll: ({ rank }) => {
          const d = d10();
          if (d < rank) {
            return { dice: [d], total: d, ok: false, text: `ninguém atendeu (${d} < ${rank})` };
          }
          const eta = d6();
          const i = tierAt(rank);
          const who =
            eta < 6
              ? BACKUP[i].who
              : i === BACKUP.length - 1
                ? `dois grupos de ${BACKUP[i].who}`
                : `${BACKUP[i + 1].who} (veio o reforço de cima)`;
          return { dice: [d], total: d, ok: true, text: `atenderam: em ${eta} rounds (1d6) chegam ${who}` };
        },
      },
    ],
    tables: [{ title: "quem chega", tiers: BACKUP }],
    notes: ["abusar do reforço: o chefe te multa ou te tira da força."],
  },
};
