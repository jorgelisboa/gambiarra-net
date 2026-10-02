import { check } from "../dice";
import { skillLevel } from "../skills";
import type { RoleDef, Tier } from "../types";

const OPERATOR: Tier[] = [
  {
    from: 1,
    to: 2,
    lines: [
      "contatos: chefe local, líder de gangue, liderança do bairro",
      "alcance: sempre acha onde arrumar itens baratos e cotidianos pros clientes, peça por peça, mesmo quando estão em falta",
      "pechincha: se ganhar, 10% a mais ou a menos no preço de mercado ao comprar ou vender",
      "trânsito: conhece os costumes do teu bairro, inclusive de todas as gangues locais",
    ],
  },
  {
    from: 3,
    to: 4,
    lines: [
      "contatos: chefão de gangue da cidade, político menor, exec corporativo, gente conhecida no bairro",
      "alcance: sempre acha até itens caros pros clientes, peça por peça, mesmo quando estão em falta",
      "pechincha: se ganhar, comprando 5 ou mais do mesmo item, leva mais 1 de graça",
      "trânsito: se dá bem com pelo menos mais 1 cultura da região e ganha 1 idioma dela que você não sabia, no nível 4",
    ],
  },
  {
    from: 5,
    to: 6,
    lines: [
      "contatos: figurão da cidade, político da cidade, celebridade do bairro",
      "alcance: 1 vez por mês, com outros fixers do teu rank, monta um Night Market; nele, você sempre acha até itens super luxo",
      "pechincha: se ganhar, negocia até 20% a mais no pagamento por pessoa de um job",
      "trânsito: se dá perfeitamente com mais 2 culturas (3 no total) e ganha 1 idioma novo de cada, no nível 4",
    ],
  },
  {
    from: 7,
    to: 8,
    lines: [
      "contatos: presidente de Corp local, prefeito, celebridade local",
      "alcance: até itens muito caros, peça por peça",
      "pechincha: luxo e super luxo em 2× (50% agora, 50% em 1 mês)",
      "trânsito: +3 culturas (6 no total) e idiomas",
    ],
  },
  {
    from: 9,
    to: 9,
    lines: [
      "contatos: chefe de divisão de Corp, político estadual, celebridade",
      "alcance: até luxo; Midnight Market da liderança do crime",
      "pechincha: 20% a mais ou a menos no preço",
      "trânsito: se mistura com Corps e governo",
    ],
  },
  {
    from: 10,
    to: 10,
    lines: [
      "contatos: líder mundial, dono de Corp, celebridade mundial",
      "alcance: até super luxo, peça por peça",
      "pechincha: dobra o pagamento de jobs perigosos",
      "trânsito: se mistura com quase qualquer grupo",
    ],
  },
];

const dealAt = (rank: number) =>
  OPERATOR.find((t) => rank >= t.from && rank <= t.to)
    ?.lines.find((l) => l.startsWith("pechincha:"))
    ?.replace("pechincha: ", "")
    .replace("se ganhar, ", "");

export const fixer: RoleDef = {
  role: "Fixer",
  summary:
    "Intermediário que arruma o que for: arma, gente, favor, informação. Por um preço. Vive de contatos e de quem te deve.",
  ability: {
    name: "Operator",
    namePt: "operador",
    summary: "Rede de contatos, acesso ao mercado negro, pechincha e trânsito entre as culturas da rua.",
    about: [
      "O Fixer sabe arrumar coisa no mercado negro e transitar pelos costumes da rua, onde centenas de culturas e níveis de renda se cruzam. Mantém uma rede enorme de contatos e clientes.",
      "Contatos: a quem você recorre pra conseguir mercadoria, favor ou informação (pagando, claro). Alcance: a categoria de preço mais alta que você sempre consegue arrumar, e se dá pra juntar outros fixers num Night Market, que libera todas as categorias por pouco tempo. Trânsito: se misturar nas culturas de dentro e de fora da rua, com idioma, códigos sociais e símbolos de status.",
      "Pechinchar: frieza + Trading + rank de operador + 1d10, contra frieza + Trading + 1d10 de quem negocia contigo (mais o rank de operador dele, se for fixer). Ganhou: você faz 1 negócio do teu rank ou abaixo (tabela). Só 1 negócio de fixer por transação.",
    ],
    uses: [
      {
        id: "haggle",
        name: "pechinchar",
        formula: "frieza + Trading + operador + 1d10",
        desc: "contra frieza + Trading + 1d10 do outro lado (+ operador, se for fixer).",
        roll: ({ rank, stats, skills }) => {
          const trading = skillLevel(skills, "trading");
          const r = check(stats.COOL + trading + rank);
          return {
            ...r,
            text: `frieza ${stats.COOL} + Trading ${trading} + operador ${rank} + 1d10. ganhou: ${dealAt(rank)}`,
          };
        },
      },
    ],
    tables: [{ title: "operador por rank", tiers: OPERATOR }],
  },
};
