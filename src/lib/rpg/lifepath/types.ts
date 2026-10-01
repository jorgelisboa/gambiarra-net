import type { RollTable } from "../tables";

export type Picks = Record<string, string>;

/** Uma tabela do lifepath: vira um campo com select, texto livre e botão de rolar. */
export interface LifepathPick {
  /** Chave em `Lifepath.picks`. Não mude depois de publicado, ou fichas antigas perdem o valor. */
  id: string;
  label: string;
  /** Opções; pode depender de outra escolha (idioma depende da região). */
  table: RollTable | ((picks: Picks) => RollTable);
  /** Escolha da qual este campo depende: se ela mudar, o valor que veio da tabela antiga é limpo. */
  dependsOn?: string;
  /** Texto do botão quando não é um dado do livro, ex.: "sortear". Padrão: "1d<lados>". */
  dice?: string;
}

/** Tabela de quantidade + uma linha por item (amigos, inimigos, amores trágicos). */
export interface LifepathList {
  /** Chave em `Lifepath.lists`. */
  id: string;
  /** Singular, pra cada item: "amigo". */
  itemLabel: string;
  count: { label: string; roll: () => { dice: number[]; total: number } };
  fields: LifepathPick[];
  notePlaceholder: string;
}

export interface LifepathSection {
  id: string;
  title: string;
  note?: string;
  picks?: LifepathPick[];
  list?: LifepathList;
}
