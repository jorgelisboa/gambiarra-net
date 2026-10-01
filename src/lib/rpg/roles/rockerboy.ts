import { check, vsDvs } from "../dice";
import type { RoleDef } from "../types";

const GROUPS = [
  { label: "1 fã", dv: 8 },
  { label: "grupo até 6", dv: 10 },
  { label: "multidão", dv: 12 },
];

export const rockerboy: RoleDef = {
  role: "Rockerboy",
  summary:
    "Músico, poeta ou agitador de rua. Usa a própria presença pra virar o público contra quem manda na cidade.",
  ability: {
    name: "Charismatic Impact",
    namePt: "impacto carismático",
    summary:
      "Influencia fãs só com a presença: música, arte, discurso. O rank define o tamanho do público e o peso do favor.",
    uses: [
      {
        id: "fans",
        name: "virar fã / pedir favor",
        formula: "impacto + 1d10",
        desc: "fora de combate. não funciona em quem já te detesta. o favor tem que caber no teu rank.",
        roll: ({ rank }) => {
          const r = check(rank);
          const groups = rank >= 3 ? GROUPS : GROUPS.slice(0, 2);
          const locked = rank >= 3 ? "" : " · multidão só no rank 3+";
          return { ...r, text: vsDvs(r.total, groups) + locked };
        },
      },
    ],
    tables: [
      {
        title: "o que o rank alcança",
        tiers: [
          {
            from: 1,
            to: 2,
            lines: [
              "palco: clube local",
              "1 fã: favor pequeno (bebida, carona)",
              "grupo: autógrafo, te reconhecem na rua",
              "multidão: ainda não",
            ],
          },
          {
            from: 3,
            to: 4,
            lines: [
              "palco: clubes conhecidos",
              "1 fã: favor grande, te indica pra gente",
              "grupo: te recebem e bancam a festa",
              "multidão: seguidores locais compram teu som",
            ],
          },
          {
            from: 5,
            to: 6,
            lines: [
              "palco: clubes grandes",
              "1 fã: crime pequeno por você (furto, briga)",
              "grupo: um bando te acompanha sempre",
              "multidão: lealdade em várias cidades",
            ],
          },
          {
            from: 7,
            to: 8,
            lines: [
              "palco: casas de show, vídeo local",
              "1 fã: arrisca a vida por você",
              "grupo: crime pequeno por você",
              "multidão: lealdade fanática e organizada",
            ],
          },
          {
            from: 9,
            to: 9,
            lines: [
              "palco: casas de show, vídeo nacional",
              "1 fã: crime grave (roubo, agressão)",
              "grupo: crime grave em bando",
              "multidão: seita: tumulto e destruição",
            ],
          },
          {
            from: 10,
            to: 10,
            lines: [
              "palco: estádios, mundo todo",
              "1 fã: se sacrifica sem perguntar",
              "grupo: guarda-costas que arriscam a vida",
              "multidão: exército particular no mundo todo",
            ],
          },
        ],
      },
    ],
  },
};
