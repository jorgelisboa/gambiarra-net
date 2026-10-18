import { t } from "../../../i18n";
import { beats, check } from "../dice";
import type { Mod, RoleDef } from "../types";

const R = t.roles.rockerboy;

const GROUPS: Mod[] = [
  { label: R.groups.one, value: 8 },
  { label: R.groups.six, value: 10 },
  { label: R.groups.crowd, value: 12 },
];

export const rockerboy: RoleDef = {
  role: "Rockerboy",
  summary:
    "Músico, poeta ou agitador de rua. Usa a própria presença pra virar o público contra quem manda na cidade.",
  ability: {
    name: "Charismatic Impact",
    namePt: "impacto carismático",
    summary:
      "Influencia os outros só com a presença. Não precisa ser músico: poesia, arte, dança ou só estar ali. Pode ser um astro do rock ou um líder de seita.",
    about: [
      "Só funciona em fãs. Quem decide se alguém que você encontra já é teu fã é o mestre.",
      "Fora de combate, dá pra transformar em fã quem ainda não é (a não ser que a pessoa te deteste de verdade): impacto carismático + 1d10 contra DV8 pra uma pessoa, DV10 pra um grupo de até 6 ou DV12 pra uma multidão.",
      "Pra pedir um favor a fãs, o mestre olha a tabela do teu rank: se o favor não cabe nele, você falha direto. Se cabe, o tamanho do grupo dá a DV (8, 10 ou 12). Passou: os fãs fazem o possível pelo favor. Falhou: você não pode pedir o mesmo favor a esses fãs por uma semana.",
    ],
    uses: [
      {
        id: "makeFans",
        name: R.makeFans.name,
        formula: R.makeFans.formula,
        desc: R.makeFans.desc,
        mods: GROUPS,
        roll: ({ rank }, dv) => {
          const r = check(rank);
          const ok = beats(r.total, dv);
          return { ...r, ok, text: ok ? R.makeFans.ok : R.makeFans.fail(dv) };
        },
      },
      {
        id: "favor",
        name: R.favor.name,
        formula: R.favor.formula,
        desc: R.favor.desc,
        mods: ({ rank }) => (rank >= 3 ? GROUPS : GROUPS.slice(0, 2)),
        roll: ({ rank }, dv) => {
          const r = check(rank);
          const ok = beats(r.total, dv);
          return { ...r, ok, text: ok ? R.favor.ok : R.favor.fail(dv) };
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
              "onde toca: clubes locais pequenos",
              "1 fã (DV8): um favor pequeno: te pagar uma bebida ou uma refeição, te dar uma carona",
              "grupo de até 6 (DV10): um grupo de até 6 fãs te pede autógrafo e lembrancinhas; te param na rua pra fazer amizade",
              "multidão (DV12): tá de brincadeira? você ainda não tem multidão de fãs",
            ],
          },
          {
            from: 3,
            to: 4,
            lines: [
              "onde toca: clubes conhecidos",
              "1 fã (DV8): um favor grande: ir pra cama com você, falar bem de você pra alguém etc.",
              "grupo de até 6 (DV10): um grupo de até 6 fãs anda contigo direto e banca bebida, drogas e outros mimos de festa",
              "multidão (DV12): seguidores fiéis na região, que compram tuas gravações e teu merch",
            ],
          },
          {
            from: 5,
            to: 6,
            lines: [
              "onde toca: clubes grandes",
              "1 fã (DV8): um crime pequeno por você (furto, briga)",
              "grupo de até 6 (DV10): um bando te acompanha sempre",
              "multidão (DV12): lealdade em várias cidades",
            ],
          },
          {
            from: 7,
            to: 8,
            lines: [
              "onde toca: casas de show, vídeo local",
              "1 fã (DV8): arrisca a vida por você",
              "grupo de até 6 (DV10): um crime pequeno por você",
              "multidão (DV12): lealdade fanática e organizada",
            ],
          },
          {
            from: 9,
            to: 9,
            lines: [
              "onde toca: casas de show, vídeo nacional",
              "1 fã (DV8): um crime grave (roubo, agressão)",
              "grupo de até 6 (DV10): um crime grave em bando",
              "multidão (DV12): seita: tumulto e destruição",
            ],
          },
          {
            from: 10,
            to: 10,
            lines: [
              "onde toca: estádios, no mundo todo",
              "1 fã (DV8): se sacrifica sem perguntar",
              "grupo de até 6 (DV10): guarda-costas que arriscam a vida",
              "multidão (DV12): exército particular no mundo todo",
            ],
          },
        ],
      },
    ],
  },
};
