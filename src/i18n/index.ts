/**
 * Textos da interface, separados por setor (src/i18n/pt-BR/<setor>.ts). Por enquanto só pt-BR.
 *
 * Como usar:
 *   import { t } from "@/i18n";            // componentes
 *   import { t } from "../../i18n";        // dentro de src/lib/rpg (imports relativos)
 *   t.weapons.modes.autofire                // "rajada"
 *   t.weapons.magazine.count(6, 8)          // texto com valor: função
 *
 * Regras dos textos (vale pra todo setor):
 * - pt-BR em minúsculas, frases curtas; nunca travessão (—): use "·" ou ":".
 * - siglas dos stats como no livro, em maiúsculas: INT REF DEX TECH COOL WILL LUCK MOVE BODY EMP (t.stats.short).
 * - nomes de role ficam como no livro: Solo, Netrunner, Tech, Medtech, Media, Exec, Lawman, Fixer, Nomad, Rockerboy.
 * - nome de coisa do livro (arma, perícia, cyberware, programa): mostra o pt-BR (gameName) e, em lista ou cartão,
 *   o nome do livro em inglês pequeno embaixo (<BookName />). Em texto corrido e rolagem, só o pt-BR.
 * - texto que já existe em `common` não se repete no setor.
 *
 * Conteúdo de regra (descrições do catálogo, tabelas do lifepath, resumos de habilidade) mora nos dados
 * em src/lib/rpg, já em pt-BR; aqui fica o texto da interface e das rolagens.
 */
import { ptBR } from "./pt-BR";

/** Forma que todo idioma segue: as chaves do pt-BR, com qualquer texto no lugar. */
type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => infer R
    ? (...args: A) => Widen<R>
    : T extends readonly (infer U)[]
      ? readonly Widen<U>[]
      : { readonly [K in keyof T]: Widen<T[K]> };

export type Messages = Widen<typeof ptBR>;

/** Idioma atual. */
export const t: Messages = ptBR;

export { bookName, gameName } from "./names";
