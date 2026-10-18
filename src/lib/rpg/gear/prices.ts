import { t } from "../../../i18n";

const P = t.gear.priceCategories;

/** Categorias de preço do livro (Buying and Selling). O nome vem do valor. */
const CATEGORIES: [max: number, name: string][] = [
  [10, P[0]],
  [20, P[1]],
  [50, P[2]],
  [100, P[3]],
  [500, P[4]],
  [1000, P[5]],
  [5000, P[6]],
  [Infinity, P[7]],
];

export const priceCategory = (cost: number) => CATEGORIES.find(([max]) => cost <= max)![1];

export const fmtEb = (n: number) => t.common.eb(n);

/** Eurobucks de Streetrat e Edgerunner pra gastar ou guardar. */
export const STARTING_MONEY = 500;

/** O livro recomenda não liberar luxo pra cima na criação. */
export const isLuxury = (cost: number) => cost >= 5000;
