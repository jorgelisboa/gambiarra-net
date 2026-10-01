/** Linha de uma tabela do livro ("role 1d10 ou escolha uma"). */
export interface RollEntry {
  text: string;
  /** Detalhe curto mostrado junto da escolha. */
  hint?: string;
  /** Quantas faces do dado caem nesta linha (Sweet Revenge: "1–2"). Padrão 1. */
  weight?: number;
}

export type RollTable = readonly RollEntry[];

/** Atalho pra tabela simples: uma linha por face. */
export const table = (...texts: string[]): RollTable => texts.map((text) => ({ text }));

/** Lados do dado: 10 numa tabela de 1d10; cresce sozinho se a tabela ganhar linhas. */
export const sides = (t: RollTable) => t.reduce((sum, e) => sum + (e.weight ?? 1), 0);

/** Faces de cada linha: ["1–2", "3–4", "5", ...]. */
export function faces(t: RollTable) {
  let next = 1;
  return t.map((e) => {
    const from = next;
    next += e.weight ?? 1;
    return from === next - 1 ? `${from}` : `${from}–${next - 1}`;
  });
}

/** Rola o dado da tabela. A tabela não pode estar vazia. */
export function rollOn(t: RollTable) {
  const face = Math.floor(Math.random() * sides(t)) + 1;
  let acc = 0;
  const entry = t.find((e) => (acc += e.weight ?? 1) >= face) ?? t[t.length - 1];
  return { face, entry };
}
