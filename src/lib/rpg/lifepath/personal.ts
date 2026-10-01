import { table, type RollTable } from "../tables";

export const PERSONALITY = table(
  "Tímido e reservado",
  "Rebelde, antissocial e violento",
  "Arrogante, orgulhoso e distante",
  "Temperamental, impulsivo e teimoso",
  "Exigente, chato e nervoso",
  "Estável e sério",
  "Bobo e avoado",
  "Sorrateiro e enganador",
  "Intelectual e desapegado",
  "Amigável e extrovertido",
);

/** Estilo de roupa: o nome fica em inglês porque é como o livro chama a linha de moda. */
export const CLOTHING_STYLE: RollTable = [
  { text: "Generic Chic", hint: "padrão, colorido, modular" },
  { text: "Leisurewear", hint: "conforto, agilidade, atletismo" },
  { text: "Urban Flash", hint: "chamativo, tecnológico, streetwear" },
  { text: "Businesswear", hint: "liderança, presença, autoridade" },
  { text: "High Fashion", hint: "exclusivo, de grife, alta-costura" },
  { text: "Bohemian", hint: "folk, retrô, espírito livre" },
  { text: "Bag Lady Chic", hint: "sem-teto, esfarrapado, andarilho" },
  { text: "Gang Colors", hint: "perigoso, violento, rebelde" },
  { text: "Nomad Leathers", hint: "faroeste, rústico, tribal" },
  { text: "Asia Pop", hint: "vibrante, tipo fantasia, jovial" },
];

export const HAIRSTYLE = table(
  "Moicano",
  "Comprido e desgrenhado",
  "Curto e espetado",
  "Bagunçado pra todo lado",
  "Careca",
  "Listrado",
  "Cores malucas",
  "Curto e arrumado",
  "Curto e cacheado",
  "Comprido e liso",
);

export const AFFECTATION = table(
  "Tatuagens",
  "Óculos espelhados",
  "Cicatrizes rituais",
  "Luvas com espinhos",
  "Piercing no nariz",
  "Piercing na língua ou outros",
  "Implantes estranhos nas unhas",
  "Botas ou saltos com espinhos",
  "Luvas sem dedos",
  "Lentes de contato estranhas",
);
