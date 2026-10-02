import type { RoleDef } from "../types";
import { LOYALTY_GAIN, LOYALTY_LOSS } from "./team";

export const teamSize = (rank: number) => (rank >= 9 ? 3 : rank >= 5 ? 2 : rank >= 3 ? 1 : 0);

const fmt = (v: number) => (v > 0 ? `+${v}` : `${v}`);

export const exec: RoleDef = {
  role: "Exec",
  summary:
    "Executivo júnior subindo na Corp. Tem equipe, casa e roupa pagas pela empresa, e inimigos lá dentro.",
  ability: {
    name: "Teamwork",
    namePt: "trabalho em equipe",
    summary:
      "Como um executivo de verdade, monta uma equipe que ajuda a cumprir os objetivos dele, legais ou não, se o moral deixar. A Corp ainda dá roupa, moradia e plano de saúde.",
    about: [
      "Benefícios da Corp (tabela abaixo, acumulam): presente de contratação no rank 1, moradia corporativa nos ranks 2, 7 e 10, e plano do Trauma Team nos ranks 6 e 8.",
      "Equipe: no rank 3 vem o 1º membro; nos ranks 5 e 9, mais um (máximo 3). Você escolhe a classe, e o 1d6 na tabela da classe decide as stats que o RH contratou. Eles são feitos como personagens, mas não melhoram perícias; têm HP e curam como personagens; são jogados pelo mestre; e só usam armadura armorjack leve (política da empresa).",
      "Perder um membro: o RH recolhe o equipamento e manda um substituto na próxima sessão, com stats novas e lealdade 1 (eles ficaram sabendo). Custa mais 200eb de taxa de contratação (leia-se suborno) ao RH. Achou que o RH contratava assassino de graça?",
      "Lealdade: membros não são drones; cumprem as tarefas conforme a lealdade ao chefe (ou ao salário). Ela sobe e desce com o que você faz (tabelas abaixo), e é teu trabalho mantê-la toda sessão. Entre sessões, o máximo é 10; durante a sessão, não tem limite.",
      "Teste de lealdade: quando você dá uma tarefa, o mestre rola 1d6 e precisa tirar menos que a lealdade atual. Falhou: o membro recusa, faz mal feito ou se vira contra você. Com lealdade 0 ou menos, ele tenta te trair pros teus inimigos. Se terminar a sessão abaixo de 0, reclama no RH e é transferido ou se demite: some de qualquer jeito.",
    ],
    team: { max: teamSize },
    tables: [
      {
        title: "benefícios (acumulam)",
        cumulative: true,
        tiers: [
          {
            from: 1,
            to: 1,
            lines: ["presente: terno Businesswear (jaqueta, blusa, calça e calçado) que te marca como elite dos negócios. revender levanta suspeita"],
          },
          {
            from: 2,
            to: 2,
            lines: ["moradia: conapt corporativo, sem aluguel nem taxa enquanto você estiver na Corp (o estilo de vida você paga). se mudar de Corp, a nova oferece igual e paga a mudança"],
          },
          { from: 3, to: 3, lines: ["equipe: 1º membro"] },
          { from: 5, to: 5, lines: ["equipe: 2º membro"] },
          { from: 6, to: 6, lines: ["saúde: Trauma Team Silver, pago pela Corp todo mês (e pela próxima, se você mudar)"] },
          { from: 7, to: 7, lines: ["moradia: Beaverville House, na zona executiva"] },
          { from: 8, to: 8, lines: ["saúde: Trauma Team Executive"] },
          { from: 9, to: 9, lines: ["equipe: 3º membro (máximo)"] },
          { from: 10, to: 10, lines: ["moradia: McMansion em Beaverville, na zona executiva, ou cobertura de luxo na zona corporativa"] },
        ],
      },
    ],
    refs: [
      { title: "ganhar lealdade", rows: LOYALTY_GAIN.map(([l, v]) => [fmt(v), l]) },
      { title: "perder lealdade", rows: LOYALTY_LOSS.map(([l, v]) => [fmt(v), l]) },
    ],
  },
};
