/**
 * Link direto pra uma ficha: `/?ficha=<id do personagem>` abre a aba personagens com ela selecionada
 * (se for da conta logada). Só no navegador: o Shell só monta depois do login.
 */
export const LINK_PARAM = "ficha";

export function linkedCharacterId(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(LINK_PARAM);
}
