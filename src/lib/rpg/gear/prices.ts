/** Categorias de preço do livro (Buying and Selling). O nome vem do valor. */
const CATEGORIES: [max: number, name: string][] = [
  [10, "barato"],
  [20, "cotidiano"],
  [50, "custoso"],
  [100, "premium"],
  [500, "caro"],
  [1000, "muito caro"],
  [5000, "luxo"],
  [Infinity, "super luxo"],
];

export const priceCategory = (cost: number) => CATEGORIES.find(([max]) => cost <= max)![1];

export const fmtEb = (n: number) => `${n.toLocaleString("pt-BR")}eb`;

/** Eurobucks de Streetrat e Edgerunner pra gastar ou guardar. */
export const STARTING_MONEY = 500;

/** O livro recomenda não liberar luxo pra cima na criação. */
export const isLuxury = (cost: number) => cost >= 5000;
