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
      "Cirurgia: cada ponto dá 2 na perícia Surgery (máx 10), a perícia de TECH pra tratar os ferimentos críticos mais graves e implantar cyberware. Só medtech tem, e só por aqui.",
      "Medical Tech: a perícia de TECH pra operar, entender e consertar maquinário médico (outras perícias de tech não servem pra isso). O nível é a soma dos pontos em farmacêutica e criossistemas (máx 10); cada uma aceita no máximo 5 pontos. Só medtech tem.",
      "Farmacêutica: cada ponto libera um fármaco da tabela, que você sintetiza com um teste de Medical Tech DV13 (falhou: perde o material). Com 200eb de material, faz em 1 hora um número de doses igual ao teu nível em Medical Tech. Não serve pra drogas de rua.",
      "Aplicar uma dose leva uma ação. Se o alvo não quiser, você pode usar a ação pra um ataque corpo a corpo (Melee Weapon) com o airhypo: acertou, aplica a dose em vez de causar dano. Quem não é medtech não sabe dosar esses fármacos.",
      "Criossistemas: cada ponto soma em Medical Tech e libera o equipamento da tabela.",
      "Surgery e Medical Tech aparecem na aba perícias, com o nível já calculado e prontas pra rolar.",
    ],
    alloc: {
      title: "especialidades",
      budget: (rank) => rank,
      options: [
        {
          id: "surgery",
          name: "cirurgia",
          rule: "+2 em Surgery por ponto (máx 10). trata ferimento crítico grave e implanta cyberware",
          max: 5,
          effect: (p) => `Surgery ${Math.min(MAX_SKILL, p * 2)}`,
        },
        {
          id: "pharma",
          name: "medical tech (farmacêutica)",
          rule: "+1 em Medical Tech e 1 fármaco por ponto (máx 5)",
          max: 5,
          effect: (p) => `+${p} Medical Tech · ${p} fármaco${p > 1 ? "s" : ""}`,
        },
        {
          id: "cryo",
          name: "medical tech (criossistemas)",
          rule: "+1 em Medical Tech por ponto (máx 5) e equipamento de crio",
          max: 5,
          effect: (p) => `+${p} Medical Tech`,
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
        name: "sintetizar fármaco",
        formula: "tech + medical tech + 1d10 vs DV13",
        desc: "200eb de material rendem, em 1 hora, doses iguais ao nível em Medical Tech. falhou: perde o material.",
        locked: ({ state }) => (pointsIn(state, "pharma") > 0 ? null : "sem pontos em farmacêutica"),
        roll: ({ stats, state }) => {
          const lvl = medtechSkills(state)[1].level;
          const r = check(stats.TECH + lvl);
          const ok = beats(r.total, 13);
          return { ...r, ok, text: ok ? `doses prontas (até ${lvl})` : "não saiu: perdeu o material (precisava passar de 13)" };
        },
      },
    ],
    tables: [
      {
        title: "criossistemas (pelos pontos)",
        cumulative: true,
        level: (_rank, state) => pointsIn(state, "cryo"),
        tiers: [
          { from: 1, to: 1, lines: ["equipamento: 1 cryopump"] },
          {
            from: 2,
            to: 2,
            lines: ["registro: técnico de cryotank, com acesso 24/7 a 1 cryotank por vez em qualquer instalação de crio de corps médicas ou do governo"],
          },
          { from: 3, to: 3, lines: ["cryotank: 1 próprio, instalado num cômodo à tua escolha"] },
          { from: 4, to: 4, lines: ["cryotanks: +2 no mesmo cômodo; o cryopump passa a ter 2 cargas e levar 2 pessoas em stasis"] },
          { from: 5, to: 5, lines: ["cryotanks: +3 no mesmo cômodo; o cryopump tem 3 cargas e leva 3 pessoas em stasis"] },
        ],
      },
    ],
    refs: [{ title: "fármacos", rows: PHARMA.map(([n, e]) => [n, e]) }],
  },
};
