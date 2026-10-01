import { table, type RollTable } from "../tables";

export const VALUE_MOST = table(
  "Dinheiro",
  "Honra",
  "Sua palavra",
  "Honestidade",
  "Conhecimento",
  "Vingança",
  "Amor",
  "Poder",
  "Família",
  "Amizade",
);

export const FEEL_ABOUT_PEOPLE: RollTable = [
  { text: "Fico neutro.", weight: 2 },
  { text: "Gosto de quase todo mundo." },
  { text: "Odeio quase todo mundo." },
  { text: "Pessoas são ferramentas: uso e descarto." },
  { text: "Cada pessoa tem seu valor." },
  { text: "Pessoas são obstáculos: se cruzarem meu caminho, destruo." },
  { text: "Ninguém é confiável. Não dependa de ninguém." },
  { text: "Acaba com todo mundo e deixa as baratas herdarem." },
  { text: "As pessoas são maravilhosas!" },
];

export const VALUED_PERSON = table(
  "Um pai ou mãe",
  "Um irmão ou irmã",
  "Um amor",
  "Um amigo",
  "Você mesmo",
  "Um bicho de estimação",
  "Um professor ou mentor",
  "Uma figura pública",
  "Um herói pessoal",
  "Ninguém",
);

export const VALUED_POSSESSION = table(
  "Uma arma",
  "Uma ferramenta",
  "Uma peça de roupa",
  "Uma foto",
  "Um livro ou diário",
  "Uma gravação",
  "Um instrumento musical",
  "Uma joia",
  "Um brinquedo",
  "Uma carta",
);
