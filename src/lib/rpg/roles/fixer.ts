import { check, skillMods } from "../dice";
import type { RoleDef } from "../types";

export const fixer: RoleDef = {
  role: "Fixer",
  summary:
    "Intermediário que arruma o que for: arma, gente, favor, informação. Por um preço. Vive de contatos e de quem te deve.",
  ability: {
    name: "Operator",
    namePt: "operador",
    summary:
      "Rede de contatos, acesso ao mercado negro, pechincha e trânsito entre culturas da rua.",
    uses: [
      {
        id: "haggle",
        name: "pechinchar",
        formula: "frieza + trading + operador + 1d10",
        desc: "contra frieza + trading + 1d10 do outro lado (+ operador se for fixer). empate: quem defende ganha.",
        mods: skillMods("trading"),
        roll: ({ rank, stats }, skill) => {
          const r = check(stats.COOL + skill + rank);
          return { ...r, text: "se ganhar, fecha 1 negócio do teu rank ou abaixo" };
        },
      },
    ],
    tables: [
      {
        title: "rede por rank",
        tiers: [
          {
            from: 1,
            to: 2,
            lines: [
              "contatos: chefe local, líder de gangue, liderança do bairro",
              "alcance: itens baratos e comuns, peça por peça",
              "pechincha: 10% a mais ou a menos no preço",
              "cultura: o teu bairro e as gangues locais",
            ],
          },
          {
            from: 3,
            to: 4,
            lines: [
              "contatos: chefão de gangue, político menor, exec corporativo",
              "alcance: até itens caros, peça por peça",
              "pechincha: comprando 5+ do mesmo, 1 sai de graça",
              "cultura: +1 cultura e o idioma dela (nível 4)",
            ],
          },
          {
            from: 5,
            to: 6,
            lines: [
              "contatos: figurão da cidade, político, celebridade do bairro",
              "alcance: monta um Night Market 1×/mês com fixers do teu rank",
              "pechincha: sobe o pagamento de um job em 20%",
              "cultura: +2 culturas (3 no total) e idiomas",
            ],
          },
          {
            from: 7,
            to: 8,
            lines: [
              "contatos: presidente de Corp local, prefeito, celebridade local",
              "alcance: até itens muito caros, peça por peça",
              "pechincha: luxo e super luxo em 2× (50% agora, 50% em 1 mês)",
              "cultura: +3 culturas (6 no total) e idiomas",
            ],
          },
          {
            from: 9,
            to: 9,
            lines: [
              "contatos: chefe de divisão de Corp, político estadual, celebridade",
              "alcance: até luxo; Midnight Market da liderança do crime",
              "pechincha: 20% a mais ou a menos no preço",
              "cultura: se mistura com Corps e governo",
            ],
          },
          {
            from: 10,
            to: 10,
            lines: [
              "contatos: líder mundial, dono de Corp, celebridade mundial",
              "alcance: até super luxo, peça por peça",
              "pechincha: dobra o pagamento de jobs perigosos",
              "cultura: se mistura com quase qualquer grupo",
            ],
          },
        ],
      },
    ],
  },
};
