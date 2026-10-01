import { CHILDHOOD_ENVIRONMENT, FAMILY_BACKGROUND, FAMILY_CRISIS } from "./family";
import { LIFE_GOALS } from "./goals";
import { FEEL_ABOUT_PEOPLE, VALUE_MOST, VALUED_PERSON, VALUED_POSSESSION } from "./motivations";
import { REGIONS, languagesOf } from "./origins";
import { AFFECTATION, CLOTHING_STYLE, HAIRSTYLE, PERSONALITY } from "./personal";
import {
  ENEMY_CAUSE,
  ENEMY_RESOURCES,
  ENEMY_WHO,
  ENEMY_WRONGED,
  FRIEND_RELATIONSHIP,
  LOVE_AFFAIR,
  SWEET_REVENGE,
  rollMinus7,
} from "./relations";
import type { LifepathSection } from "./types";

const count = { label: "1d10 − 7", roll: rollMinus7 };

/**
 * O lifepath na ordem do livro. Pra crescer: crie a tabela num arquivo desta pasta
 * e adicione um campo aqui. Os ids são as chaves salvas na ficha.
 */
export const LIFEPATH: LifepathSection[] = [
  {
    id: "origins",
    title: "origem cultural",
    note: "todo mundo fala streetslang. você começa com 4 pontos na perícia do idioma escolhido.",
    picks: [
      { id: "region", label: "região", table: REGIONS },
      {
        id: "language",
        label: "idioma",
        table: (picks) => languagesOf(picks.region),
        dependsOn: "region",
        dice: "sortear",
      },
    ],
  },
  {
    id: "personality",
    title: "personalidade",
    picks: [{ id: "personality", label: "como você é", table: PERSONALITY }],
  },
  {
    id: "style",
    title: "estilo",
    picks: [
      { id: "clothing", label: "roupa", table: CLOTHING_STYLE },
      { id: "hairstyle", label: "cabelo", table: HAIRSTYLE },
      { id: "affectation", label: "nunca sai sem", table: AFFECTATION },
    ],
  },
  {
    id: "motivations",
    title: "motivações",
    picks: [
      { id: "valueMost", label: "o que mais valoriza", table: VALUE_MOST },
      { id: "feelAboutPeople", label: "o que acha das pessoas", table: FEEL_ABOUT_PEOPLE },
      { id: "valuedPerson", label: "pessoa mais importante", table: VALUED_PERSON },
      { id: "valuedPossession", label: "bem mais valioso", table: VALUED_POSSESSION },
    ],
  },
  {
    id: "family",
    title: "origem familiar",
    picks: [
      { id: "family", label: "família de origem", table: FAMILY_BACKGROUND },
      { id: "environment", label: "onde cresceu", table: CHILDHOOD_ENVIRONMENT },
      { id: "crisis", label: "crise da família", table: FAMILY_CRISIS },
    ],
  },
  {
    id: "friends",
    title: "amigos",
    list: {
      id: "friends",
      itemLabel: "amigo",
      count,
      notePlaceholder: "nome / detalhe",
      fields: [{ id: "relationship", label: "quem é pra você", table: FRIEND_RELATIONSHIP }],
    },
  },
  {
    id: "enemies",
    title: "inimigos",
    list: {
      id: "enemies",
      itemLabel: "inimigo",
      count,
      notePlaceholder: "nome / detalhe",
      fields: [
        { id: "who", label: "quem é", table: ENEMY_WHO },
        { id: "cause", label: "o que aconteceu", table: ENEMY_CAUSE },
        { id: "wronged", label: "quem saiu prejudicado", table: ENEMY_WRONGED, dice: "sortear" },
        { id: "resources", label: "o que pode jogar contra você", table: ENEMY_RESOURCES },
        { id: "revenge", label: "quando se encontrarem", table: SWEET_REVENGE },
      ],
    },
  },
  {
    id: "loves",
    title: "amores trágicos",
    list: {
      id: "loves",
      itemLabel: "amor",
      count,
      notePlaceholder: "nome / detalhe",
      fields: [{ id: "ending", label: "como acabou", table: LOVE_AFFAIR }],
    },
  },
  {
    id: "goals",
    title: "objetivo de vida",
    picks: [{ id: "goal", label: "o que você quer da vida", table: LIFE_GOALS }],
  },
];
