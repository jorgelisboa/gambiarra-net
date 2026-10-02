import { beats, check, d10, vsDvs } from "../dice";
import type { RoleDef } from "../types";
import { sheetSkills } from "./shared";

/** Chance em 10 de o público acreditar na matéria. */
const believability = (rank: number) =>
  rank >= 10 ? 7 : rank >= 9 ? 6 : rank >= 7 ? 5 : rank >= 5 ? 4 : rank >= 3 ? 3 : 2;

const RUMORS: { label: string; desc: string; passive: number; active: number }[] = [
  { label: "vago", desc: "nebuloso: só o mínimo pra começar a caçar a verdade por trás dele", passive: 7, active: 13 },
  { label: "típico", desc: "dá pra saber onde ir depois na investigação e ter um vislumbre da suposta verdade", passive: 9, active: 15 },
  { label: "substancial", desc: "como o típico, mais informação concreta útil: nomes, lugares, horários", passive: 11, active: 17 },
  { label: "detalhado", desc: "como o substancial, mais algo que, se verificado, vira prova pra uma matéria", passive: 13, active: 21 },
];

export const media: RoleDef = {
  role: "Media",
  summary:
    "Repórter independente que cava a sujeira dos poderosos e publica. Vive de fontes, público e reputação.",
  ability: {
    name: "Credibility",
    namePt: "credibilidade",
    summary:
      "Faz o público acreditar no que você publica, alcança mais gente e traz rumores sem precisar sair procurando.",
    about: [
      "O Media convence o público do que publica e, quanto mais crível, maior o público. Também tem mais acesso a fontes e informação, e fica sabendo de rumores sem procurar.",
      "Rumores: pelo menos 2 vezes por semana (se você não estiver totalmente fora da rede), o mestre rola em segredo credibilidade + 1d10. Se passar de alguma DV passiva da tabela, ele te conta o rumor de maior DV que você passou. São os mesmos rumores que dá pra achar na rua com Library Search, Conversation ou Interrogation: procurando ativamente, você rola stat + perícia + 1d10 contra a DV ativa que o mestre der pelo nível de detalhe.",
      "Publicar: acesso/fontes é com quem você consegue falar ou entrevistar; público é quantas pessoas a matéria alcança; credibilidade é a chance em 10 de acreditarem, rolada em 1d10 quando você publica (ou quando quer saber se alguém acreditou). Uma prova verificável fácil de entender dá +1; mais de 4 provas concretas e distintas dão +2; os dois somam. Sorte (LUCK) nunca vale nesse teste.",
      "Impacto é quanto a matéria muda as coisas; quem cuida disso é o mestre. Depois de publicar, não dá pra publicar de novo sobre o mesmo assunto sem informação nova.",
      "Rumores raramente são verdade inteira, e nunca são a história toda. Achar o resto é teu trabalho. E alguns fios são perigosos de puxar.",
    ],
    passives: (rank) => [`chance de acreditarem: ${believability(rank)}/10`],
    uses: [
      {
        id: "publish",
        name: "publicar matéria",
        formula: "1d10 ≤ chance",
        desc: "sorte não vale aqui. não dá pra republicar o mesmo assunto sem novidade.",
        mods: [
          { label: "sem provas", value: 0 },
          { label: "1 prova fácil de entender (+1)", value: 1 },
          { label: "mais de 4 provas concretas (+2)", value: 2 },
          { label: "as duas coisas (+3)", value: 3 },
        ],
        roll: ({ rank }, bonus) => {
          const d = d10();
          const chance = Math.min(10, believability(rank) + bonus);
          const ok = d <= chance;
          return {
            dice: [d],
            total: d,
            ok,
            text: ok ? `o público comprou (${d} ≤ ${chance})` : `não colou (${d} > ${chance})`,
          };
        },
      },
      {
        id: "rumor",
        name: "rumor passivo",
        formula: "credibilidade + 1d10",
        desc: "o mestre rola em segredo pelo menos 2× por semana.",
        roll: ({ rank }) => {
          const r = check(rank);
          const best = RUMORS.filter((x) => beats(r.total, x.passive)).at(-1);
          return {
            ...r,
            ok: Boolean(best),
            text: best ? `chega um rumor ${best.label} (DV${best.passive})` : "nada chegou",
          };
        },
      },
      {
        id: "rumorActive",
        name: "caçar rumor",
        formula: "stat + perícia + 1d10",
        desc: "procurando ativamente. o mestre diz a DV pelo detalhe do rumor.",
        mods: sheetSkills(["librarySearch", "conversation", "interrogation", "humanPerception"], true),
        roll: (_ctx, base) => {
          const r = check(base);
          return { ...r, text: vsDvs(r.total, RUMORS.map((x) => ({ label: x.label, dv: x.active }))) };
        },
      },
    ],
    tables: [
      {
        title: "credibilidade por rank",
        tiers: [
          {
            from: 1,
            to: 2,
            lines: [
              "acesso/fontes: chefe local, líder de gangue, liderança do bairro",
              "público: o bairro",
              "credibilidade: 2 em 10",
              "impacto: pequeno e gradual; vilões pequenos se assustam e talvez mudem um pouco",
            ],
          },
          {
            from: 3,
            to: 4,
            lines: [
              "acesso/fontes: chefão de gangue da cidade, político menor, exec corporativo, gente conhecida no bairro",
              "público: colaborador conhecido de screamsheet ou Data Pool local",
              "credibilidade: 3 em 10",
              "impacto: efeito direto; vilões pequenos locais são presos ou perdem o poder, a justiça é feita",
            ],
          },
          { from: 5, to: 6, lines: ["público: a cidade toda", "credibilidade: 4 em 10"] },
          { from: 7, to: 8, lines: ["público: o estado", "credibilidade: 5 em 10"] },
          {
            from: 9,
            to: 9,
            lines: [
              "público: boa parte do país",
              "credibilidade: 6 em 10",
              "impacto: muda as coisas numa área enorme, como um país; grandes corps ou governos locais podem cair; leis podem passar",
            ],
          },
          {
            from: 10,
            to: 10,
            lines: [
              "acesso/fontes: grande líder mundial, chefe de megacorp, celebridade mundial",
              "público: o mundo todo; te param pra pedir autógrafo, e gente importante te usa pra vazar coisas",
              "credibilidade: 7 em 10",
              "impacto: muda as coisas no mundo todo; megacorps e governos podem cair, leis internacionais podem surgir; afeta milhões",
            ],
          },
        ],
      },
    ],
    refs: [
      {
        title: "rumores",
        head: ["", "DV passiva", "DV ativa"],
        rows: RUMORS.map((x) => [x.label, x.desc, `${x.passive}`, `${x.active}`]),
      },
    ],
  },
};
