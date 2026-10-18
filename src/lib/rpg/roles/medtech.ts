import { t } from "../../../i18n";
import { pointsIn } from "../ability";
import { beats, check } from "../dice";
import type { RoleDef, RoleSkill } from "../types";
import type { AbilityState } from "../../types";

const PHARMA: [name: string, effect: string][] = [
  ["Antibiotic", "quem já começou a curar naturalmente recupera +2 HP por dia durante uma semana. 1 antibiótico por vez"],
  ["Rapidetox", "purga na hora o efeito de droga, veneno ou intoxicante"],
  ["Speedheal", "quem não está mortalmente ferido recupera na hora HP igual a BODY + WILL. 1 por dia"],
  ["Stim", "ignora todas as penalidades de gravemente ferido por 1 hora. 1 por dia"],
  ["Surge", "funciona normal sem dormir por 24 horas. 1 por semana"],
];

const MAX_SKILL = 10;

const M = t.roles.medtech.synthesize;

/** Surgery = 2 por ponto; Medical Tech = farmacêutica + criossistemas. */
export const medtechSkills = (state: AbilityState): RoleSkill[] => [
  {
    id: "surgery",
    name: "Surgery",
    namePt: "cirurgia",
    stat: "TECH",
    level: Math.min(MAX_SKILL, pointsIn(state, "surgery") * 2),
    desc: "trata os ferimentos críticos mais graves e implanta cyberware. só medtech tem.",
  },
  {
    id: "medicalTech",
    name: "Medical Tech",
    namePt: "tecnologia médica",
    stat: "TECH",
    level: Math.min(MAX_SKILL, pointsIn(state, "pharma") + pointsIn(state, "cryo")),
    desc: "opera, entende e conserta maquinário médico. só medtech tem.",
  },
];

export const medtech: RoleDef = {
  role: "Medtech",
  summary:
    "Médico de rua, ripperdoc ou paramédico do Trauma Team. Mantém vivo quem já devia estar morto e instala o cromo.",
  ability: {
    name: "Medicine",
    namePt: "medicina",
    summary:
      "A cada rank ganha 1 ponto em uma especialidade: cirurgia, farmacêutica ou criossistemas.",
    about: [
      "Medtechs mantêm vivo quem já devia ter morrido. Hoje são tão mecânicos quanto médicos: cuidam de gente que muitas vezes é mais máquina do que humano. A cada rank em medicina, põem 1 ponto em uma das três especialidades.",
      "Cirurgia: cada ponto dá 2 na perícia de mesmo nome (máx 10), uma perícia de TECH pra tratar os ferimentos críticos mais graves e implantar cyberware. Só medtech tem, e só por aqui.",
      "Tecnologia médica: a perícia de TECH pra operar, entender e consertar maquinário médico (outras perícias de TECH não servem pra isso). O nível é a soma dos pontos em farmacêutica e criossistemas (máx 10); cada uma aceita no máximo 5 pontos. Só medtech tem.",
      "Farmacêutica: cada ponto libera um fármaco da tabela, que você sintetiza com um teste de tecnologia médica DV13 (falhou: perde o material). Com 200eb de material, faz em 1 hora um número de doses igual ao teu nível em tecnologia médica. Não serve pra drogas de rua.",
      "Aplicar uma dose leva uma ação. Se o alvo não quiser, você pode usar a ação pra um ataque corpo a corpo (arma branca) com o airhypo: acertou, aplica a dose em vez de causar dano. Quem não é medtech não sabe dosar esses fármacos.",
      "Criossistemas: cada ponto soma em tecnologia médica e libera o equipamento da tabela.",
      "Cirurgia e tecnologia médica aparecem na aba perícias, com o nível já calculado e prontas pra rolar.",
    ],
    alloc: {
      title: "especialidades",
      budget: (rank) => rank,
      options: [
        {
          id: "surgery",
          name: "cirurgia",
          rule: "+2 em cirurgia por ponto (máx 10). trata ferimento crítico grave e implanta cyberware",
          max: 5,
          effect: (p) => `nível ${Math.min(MAX_SKILL, p * 2)}`,
        },
        {
          id: "pharma",
          name: "tecnologia médica (farmacêutica)",
          rule: "+1 em tecnologia médica e 1 fármaco por ponto (máx 5)",
          max: 5,
          effect: (p) => `+${p} tecnologia médica · ${p} fármaco${p > 1 ? "s" : ""}`,
        },
        {
          id: "cryo",
          name: "tecnologia médica (criossistemas)",
          rule: "+1 em tecnologia médica por ponto (máx 5) e equipamento de crio",
          max: 5,
          effect: (p) => `+${p} tecnologia médica`,
        },
      ],
    },
    roleSkills: (_rank, state) => medtechSkills(state),
    lists: [
      {
        id: "pharma",
        title: "fármacos que você sintetiza",
        max: (_rank, state) => pointsIn(state, "pharma"),
        tags: PHARMA.map(([n]) => n),
        placeholder: "doses prontas / notas",
      },
    ],
    uses: [
      {
        id: "synthesize",
        name: M.name,
        formula: M.formula,
        desc: M.desc,
        locked: ({ state }) => (pointsIn(state, "pharma") > 0 ? null : M.locked),
        roll: ({ stats, state }) => {
          const lvl = medtechSkills(state)[1].level;
          const r = check(stats.TECH + lvl);
          const ok = beats(r.total, 13);
          return { ...r, ok, text: ok ? M.ok(lvl) : M.fail };
        },
      },
    ],
    tables: [
      {
        title: "criossistemas (pelos pontos)",
        cumulative: true,
        level: (_rank, state) => pointsIn(state, "cryo"),
        tiers: [
          { from: 1, to: 1, lines: ["equipamento: 1 bomba criogênica"] },
          {
            from: 2,
            to: 2,
            lines: ["registro: técnico de tanque criogênico, com acesso 24/7 a 1 tanque por vez em qualquer instalação de crio de corps médicas ou do governo"],
          },
          { from: 3, to: 3, lines: ["tanque criogênico: 1 próprio, instalado num cômodo à tua escolha"] },
          { from: 4, to: 4, lines: ["tanques criogênicos: +2 no mesmo cômodo; a bomba criogênica passa a ter 2 cargas e levar 2 pessoas em estase"] },
          { from: 5, to: 5, lines: ["tanques criogênicos: +3 no mesmo cômodo; a bomba criogênica tem 3 cargas e leva 3 pessoas em estase"] },
        ],
      },
    ],
    refs: [{ title: "fármacos", rows: PHARMA.map(([n, e]) => [n, e]) }],
  },
};
