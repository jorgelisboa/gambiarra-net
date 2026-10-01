import { pointsIn } from "../ability";
import { check, skillMods, vsDvs, type Dv } from "../dice";
import type { RoleDef, UseDef } from "../types";

/** DV e tempo de trabalho por categoria de preço do item. */
const CRAFT: Dv[] = [
  { label: "barato/comum, 1h", dv: 9 },
  { label: "custoso, 6h", dv: 13 },
  { label: "premium, 1 dia", dv: 17 },
  { label: "caro, 1 semana", dv: 21 },
  { label: "muito caro, 2 semanas", dv: 24 },
  { label: "luxo, 1 mês", dv: 29 },
];

const craft = (id: string, name: string, desc: string, dvs: Dv[]): UseDef => ({
  id,
  name,
  formula: "tech + perícia + especialidade + 1d10",
  desc,
  mods: skillMods("perícia"),
  locked: ({ state }) => (pointsIn(state, id) > 0 ? null : `sem pontos em ${name}`),
  roll: ({ stats, state }, skill) => {
    const r = check(stats.TECH + skill + pointsIn(state, id));
    return { ...r, text: dvs.length ? vsDvs(r.total, dvs) : "compare com a DV do conserto" };
  },
});

export const tech: RoleDef = {
  role: "Tech",
  summary:
    "Conserta, melhora e inventa qualquer coisa. Numa cidade sem cadeia de suprimentos, todo mundo depende de você.",
  ability: {
    name: "Maker",
    namePt: "criador",
    summary:
      "Conserta, melhora, fabrica e inventa. A cada rank ganha 1 ponto em duas especialidades diferentes.",
    alloc: {
      title: "especialidades",
      budget: (rank) => rank * 2,
      capByRank: (rank) => rank,
      options: [
        {
          id: "field",
          name: "campo",
          rule: "soma nos consertos; gambiarra temporária dura 10 min por ponto",
          effect: (p) => `+${p} conserto · gambiarra de ${p * 10} min`,
        },
        {
          id: "upgrade",
          name: "melhoria",
          rule: "melhora um item: menos perda de humanidade, mais slots, arma escondida...",
          effect: (p) => `+${p} pra melhorar`,
        },
        {
          id: "fabrication",
          name: "fabricação",
          rule: "fabrica um item que existe com material de uma categoria de preço abaixo",
          effect: (p) => `+${p} pra fabricar`,
        },
        {
          id: "invention",
          name: "invenção",
          rule: "cria item ou melhoria nova, com aval do mestre (mínimo: caro)",
          effect: (p) => `+${p} pra inventar`,
        },
      ],
    },
    uses: [
      craft("field", "campo", "conserto ou gambiarra na hora.", []),
      craft("upgrade", "melhoria", "DV pela categoria de preço do item.", CRAFT),
      craft("fabrication", "fabricação", "DV pela categoria de preço do item.", CRAFT),
      craft("invention", "invenção", "só de caro pra cima.", CRAFT.slice(3)),
    ],
    notes: ["super luxo: DV 29, 1 mês a cada 10.000eb de custo."],
  },
};
