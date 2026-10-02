import type { FashionDef } from "./types";

export const FASHION_PIECES = [
  { id: "bottoms", name: "Bottoms", namePt: "calça" },
  { id: "top", name: "Top", namePt: "blusa" },
  { id: "jacket", name: "Jacket", namePt: "jaqueta" },
  { id: "footwear", name: "Footwear", namePt: "calçado" },
  { id: "jewelry", name: "Jewelry", namePt: "joia" },
  { id: "mirrorshades", name: "Mirrorshades", namePt: "óculos espelhado" },
  { id: "glasses", name: "Glasses", namePt: "óculos" },
  { id: "contacts", name: "Contact Lenses", namePt: "lentes de contato" },
  { id: "hat", name: "Hat", namePt: "chapéu" },
] as const;

/** Preço de cada peça, na ordem de FASHION_PIECES (tabela Fashion do livro). */
export const FASHION_STYLES: { id: string; name: string; vibe: string; prices: number[] }[] = [
  { id: "bagLadyChic", name: "Bag Lady Chic", vibe: "sem-teto, esfarrapado, vagabundo", prices: [20, 10, 20, 20, 20, 20, 10, 10, 10] },
  { id: "gangColors", name: "Gang Colors", vibe: "perigoso, violento, rebelde", prices: [50, 20, 50, 20, 50, 20, 20, 10, 10] },
  { id: "genericChic", name: "Generic Chic", vibe: "padrão, colorido, modular", prices: [50, 20, 50, 20, 50, 20, 20, 10, 10] },
  { id: "bohemian", name: "Bohemian", vibe: "folk, retrô, espírito livre", prices: [50, 20, 50, 50, 100, 50, 50, 10, 10] },
  { id: "leisurewear", name: "Leisurewear", vibe: "conforto, agilidade, atletismo", prices: [100, 20, 100, 50, 100, 50, 50, 20, 50] },
  { id: "nomadLeathers", name: "Nomad Leathers", vibe: "faroeste, rústico, tribal", prices: [100, 20, 100, 100, 100, 50, 50, 20, 100] },
  { id: "asiaPop", name: "Asia Pop", vibe: "chamativo, fantasia, jovem", prices: [100, 20, 100, 100, 100, 100, 100, 100, 100] },
  { id: "urbanFlash", name: "Urban Flash", vibe: "exibido, tecnológico, streetwear", prices: [100, 20, 100, 100, 100, 100, 100, 100, 100] },
  { id: "businesswear", name: "Businesswear", vibe: "liderança, presença, autoridade", prices: [500, 50, 500, 500, 5000, 500, 500, 100, 500] },
  { id: "highFashion", name: "High Fashion", vibe: "exclusivo, grife, alta-costura", prices: [1000, 500, 1000, 5000, 50000, 1000, 1000, 1000, 5000] },
];

export const fashionId = (style: string, piece: string) => `fashion-${style}-${piece}`;

/** Uma peça por estilo: "Generic Chic Jacket". */
export const FASHION: FashionDef[] = FASHION_STYLES.flatMap((s) =>
  FASHION_PIECES.map((p, i) => ({
    id: fashionId(s.id, p.id),
    kind: "fashion" as const,
    style: s.id,
    piece: p.id,
    name: `${s.name} ${p.name}`,
    namePt: `${p.namePt} ${s.name.toLowerCase()}`,
    desc: s.vibe,
    cost: s.prices[i],
  })),
);
