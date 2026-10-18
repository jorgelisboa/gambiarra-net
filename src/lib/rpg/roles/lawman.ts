import { t } from "../../../i18n";
import { d10, d6 } from "../dice";
import type { RoleDef, Tier } from "../types";

const BACKUP: (Tier & { who: string })[] = [
  {
    from: 1,
    to: 2,
    who: "4 seguranças de aluguel",
    lines: [
      "quem: 4 seguranças de aluguel da região, chegam a pé",
      "ficha: número de combate 8 · SP 7 · HP 20 · MOVE e BODY 4",
      "equipamento: pistolas pesadas e kevlar",
    ],
  },
  {
    from: 3,
    to: 4,
    who: "4 policiais de ronda",
    lines: [
      "quem: 4 policiais de ronda em 2 carros compactos",
      "ficha: número de combate 10 · SP 7 · HP 25 · MOVE e BODY 5",
      "equipamento: pistolas pesadas e kevlar",
    ],
  },
  {
    from: 5,
    to: 7,
    who: "2 xerifes do condado",
    lines: [
      "quem: 2 xerifes do condado que patrulham os subúrbios e as estradas, num carro de alto desempenho",
      "ficha: número de combate 14 · SP 13 · HP 35 · MOVE e BODY 4",
      "equipamento: pistolas pesadas, fuzis de assalto e armorjack pesado",
    ],
  },
  {
    from: 8,
    to: 8,
    who: "1 marshal da recovery zone",
    lines: [
      "quem: 1 marshal da recovery zone, um xerife solitário das recovery zones e cidades novas, numa superbike",
      "ficha: número de combate 16 · SP 15 · HP 50 · MOVE e BODY 6",
      "equipamento: pistola muito pesada, fuzil de assalto, lança-granadas e flak",
    ],
  },
  {
    from: 9,
    to: 9,
    who: "2 da C-SWAT",
    lines: [
      "quem: C-SWAT, 2 pesos-pesados do Psycho Squad, chegam pelo ar num AV-4",
      "ficha: número de combate 15 · SP 18 · HP 35 · MOVE e BODY 4",
      "equipamento: fuzis de assalto, lança-foguetes e metalgear",
    ],
  },
  {
    from: 10,
    to: 10,
    who: "2 agentes federais",
    lines: [
      "quem: força nacional / Interpol / FBI / Netwatch, 2 agentes num AV-4",
      "ficha: número de combate 14 · SP 11 · HP 35 · MOVE e BODY 6",
      "equipamento: pistolas muito pesadas, fuzis de assalto e armorjack leve",
      "extra: ficam pra investigar depois do conflito; da 2ª vez em diante, os mesmos 2 atendem as chamadas do caso até ele fechar (ou eles caírem); usam o número de combate também em contabilidade, atuação, ocultar/revelar objeto, criminologia, criptografia, dedução, educação, falsificação, interrogatório, paramédico, percepção, cuidados pessoais, resistir a tortura/drogas, furtividade e rastrear",
    ],
  },
];

const C = t.roles.lawman.call;

const tierAt = (rank: number) => BACKUP.findIndex((t) => rank >= t.from && rank <= t.to);

export const lawman: RoleDef = {
  role: "Lawman",
  summary:
    "Policial, xerife ou segurança corporativa segurando as pontas numa cidade em pedaços. Nunca fica sozinho por muito tempo.",
  ability: {
    name: "Backup",
    namePt: "reforço",
    summary:
      "Chama colegas da lei. Quanto maior o rank, mais pesado o reforço que pode vir.",
    about: [
      "O Lawman chama outros agentes da lei pra ajudar, conforme o rank e as condições da chamada. O reforço chega armado e blindado (tabela abaixo) e é jogado pelo mestre. Subindo de rank, você tende a ser promovido ou recrutado por agências maiores, das quais pode chamar reforço.",
      "Em perigo, você chama reforço do teu rank ou abaixo: como uma ação, rola 1d10 e precisa tirar o teu rank ou menos pra alguém atender. Atendeu: rola 1d6 pra saber em quantas rodadas o reforço chega. Se sair 6, chega o reforço do nível de cima (no rank 10, chegam dois grupos). Ninguém atendeu: tenta de novo no próximo turno. Se abusar, o chefe te tira da força ou te multa.",
      "Número de combate: a base (stat e perícia já somadas) que o reforço usa pra atacar e se defender, somando 1d10. Reforço não esquiva de bala. O SP vale pra cabeça e corpo; MOVE e BODY importam pra movimento e efeitos como o teste de morte.",
    ],
    uses: [
      {
        id: "call",
        name: C.name,
        formula: C.formula,
        desc: C.desc,
        cost: C.cost,
        roll: ({ rank }) => {
          const d = d10();
          if (d > rank) return { dice: [d], total: d, ok: false, text: C.nobody(d, rank) };
          const eta = d6();
          const i = tierAt(rank);
          const who =
            eta < 6
              ? BACKUP[i].who
              : i === BACKUP.length - 1
                ? C.twoGroups(BACKUP[i].who)
                : C.bumped(BACKUP[i + 1].who);
          return { dice: [d], total: d, ok: true, text: C.answered(d, rank, eta, who) };
        },
      },
    ],
    tables: [{ title: "quem chega", tiers: BACKUP }],
  },
};
