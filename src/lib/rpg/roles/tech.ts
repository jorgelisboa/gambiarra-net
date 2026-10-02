import { pointsIn } from "../ability";
import { check, vsDvs, type Dv } from "../dice";
import type { RoleDef, UseDef } from "../types";
import { sheetSkills } from "./shared";

/** Perícias de TECH usadas pra consertar (e em que o rank de campo soma). */
export const REPAIR_SKILLS = [
  "basicTech",
  "cybertech",
  "electronicsSecurityTech",
  "weaponstech",
  "landVehicleTech",
  "seaVehicleTech",
  "airVehicleTech",
];

/** DV e tempo de melhoria, fabricação e invenção, pela categoria de preço do item. */
const CRAFT: (Dv & { time: string })[] = [
  { label: "barato/cotidiano", dv: 9, time: "1 hora" },
  { label: "custoso", dv: 13, time: "6 horas" },
  { label: "premium", dv: 17, time: "1 dia" },
  { label: "caro", dv: 21, time: "1 semana" },
  { label: "muito caro", dv: 24, time: "2 semanas" },
  { label: "luxo", dv: 29, time: "1 mês" },
];

const craft = (id: string, name: string, desc: string, dvs: Dv[]): UseDef => ({
  id,
  name,
  formula: `tech + perícia do conserto + ${name} + 1d10`,
  desc,
  mods: sheetSkills(REPAIR_SKILLS),
  locked: ({ state }) => (pointsIn(state, id) > 0 ? null : `sem pontos em ${name}`),
  roll: ({ stats, state }, skill) => {
    const r = check(stats.TECH + skill + pointsIn(state, id));
    return { ...r, text: vsDvs(r.total, dvs) };
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
      "Conserta, melhora, modifica, fabrica e inventa. A cada rank ganha 1 ponto em duas especialidades diferentes.",
    about: [
      "A cada rank de maker, o Tech ganha 1 rank em duas especialidades diferentes, à escolha: campo, melhoria, fabricação ou invenção.",
      "Campo: soma o rank em todo teste de Basic Tech, Cybertech, Electronics/Security Tech, Weaponstech e Land/Sea/Air Vehicle Tech que não seja pra outra especialidade de maker (no app já entra na aba perícias). Com 1 ponto ou mais, dá pra fazer uma gambiarra no lugar do conserto completo: como uma ação, com a mesma DV do conserto normal, o item fica perfeito (SP e HP cheios) por 10 minutos a cada ponto. Depois volta ao estado de antes e só aceita outra gambiarra depois de um conserto completo.",
      "Melhoria: tech + perícia de conserto do item + rank em melhoria + 1d10. Os materiais custam a mesma categoria de preço do item e são gastos na instalação. Cada item só aceita 1 melhoria desta especialidade (opções na tabela). Falhou: na metade do trabalho você percebe que vai ter que começar do zero; materiais e item ficam inteiros.",
      "Fabricação: faz um item que existe (ou um que um Tech inventou) a partir de materiais: tech + perícia de conserto + rank em fabricação + 1d10. Os materiais custam uma categoria de preço abaixo do item (super luxo: metade do preço). Falhou: começa de novo, materiais inteiros.",
      "Invenção: inventa uma melhoria ou um item novo. Você descreve pro mestre a função e como funciona, com a tecnologia do cenário (um esquema ajuda). Se o mestre topar, ele escreve as regras sem desequilibrar o jogo e define a categoria de preço (no mínimo caro). Tech + perícia ligada ao conserto + rank em invenção + 1d10; falhou: volta pra prancheta. Inventado, você (ou outro Tech com a planta) faz de verdade com fabricação ou melhoria. É a habilidade que mais pode desequilibrar o jogo: o mestre pode precisar ajustar a invenção depois.",
      "A DV e o tempo de melhoria, fabricação e invenção vêm da categoria de preço do item (tabela).",
    ],
    alloc: {
      title: "especialidades",
      budget: (rank) => rank * 2,
      capByRank: (rank) => rank,
      options: [
        {
          id: "field",
          name: "campo",
          rule: "soma nas perícias de conserto; gambiarra de 10 min por ponto",
          effect: (p) => `+${p} nas perícias de conserto · gambiarra de ${p * 10} min`,
        },
        {
          id: "upgrade",
          name: "melhoria",
          rule: "melhora um item (1 melhoria desta especialidade por item)",
          effect: (p) => `+${p} pra melhorar`,
        },
        {
          id: "fabrication",
          name: "fabricação",
          rule: "fabrica um item com material de uma categoria de preço abaixo",
          effect: (p) => `+${p} pra fabricar`,
        },
        {
          id: "invention",
          name: "invenção",
          rule: "cria item ou melhoria nova, com aval do mestre (no mínimo caro)",
          effect: (p) => `+${p} pra inventar`,
        },
      ],
    },
    skillBonus: (_rank, state) =>
      REPAIR_SKILLS.map((skill) => ({ skill, value: pointsIn(state, "field"), source: "campo (maker)" })),
    uses: [
      {
        id: "jury",
        name: "gambiarra",
        formula: "tech + perícia do conserto + campo + 1d10",
        desc: "como ação, contra a DV do conserto normal: o item fica perfeito por um tempo.",
        cost: "1 ação",
        mods: sheetSkills(REPAIR_SKILLS),
        locked: ({ state }) => (pointsIn(state, "field") > 0 ? null : "sem pontos em campo"),
        roll: ({ stats, state }, skill) => {
          const field = pointsIn(state, "field");
          const r = check(stats.TECH + skill + field);
          return { ...r, text: `compare com a DV do conserto · se passar, dura ${field * 10} minutos` };
        },
      },
      craft("upgrade", "melhoria", "materiais da mesma categoria de preço do item, gastos na instalação.", CRAFT),
      craft("fabrication", "fabricação", "materiais de uma categoria de preço abaixo do item.", CRAFT),
      craft("invention", "invenção", "o mestre define a categoria de preço (no mínimo caro).", CRAFT.slice(3)),
    ],
    refs: [
      {
        title: "DV e tempo (melhoria, fabricação, invenção)",
        head: ["DV", "tempo"],
        rows: [
          ...CRAFT.map((c) => [c.label, `${c.dv}`, c.time]),
          ["super luxo", "29", "1 mês a cada 10.000eb do custo"],
        ],
      },
      {
        title: "melhorias possíveis (1 por item)",
        rows: [
          ["humanidade", "−1d6 na perda de humanidade de cyberware que não seja borgware, se a perda normal for 2d6 ou mais"],
          ["slot", "+1 slot de um tipo que o item já tem (opções, acessórios, programas/hardware...)"],
          ["simplificar", "o conserto completo do item passa a levar metade do tempo"],
          ["ocultável", "arma de uma mão que normalmente não se esconde passa a poder ser escondida"],
          ["qualidade", "arma de qualidade média vira de qualidade excelente"],
          ["slot em exótica", "dá um slot de acessório a uma arma exótica"],
          ["munição em exótica", "a arma exótica passa a disparar um tipo de munição não básica do tipo dela"],
          ["SP", "+1 no SP do item, só se ele já tinha SP"],
          ["veículo", "uma melhoria de veículo que exija só moto rank 1 do Nomad"],
          ["invenção", "instala uma melhoria inventada por um Tech; precisa de material a mais na categoria de preço que o mestre deu"],
        ],
      },
    ],
  },
};
