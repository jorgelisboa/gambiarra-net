/** Nome de coisa do livro (arma, perícia, cyberware, programa): `name` é o do livro (en), `namePt` o nosso. */
interface Named {
  name: string;
  namePt?: string;
}

/** Nome pra mostrar: o pt-BR. */
export const gameName = (d: Named): string => d.namePt || d.name;

/** Nome do livro (en) pra mostrar pequeno; null quando é o mesmo do pt-BR (Solo, Netrunner...). */
export const bookName = (d: Named): string | null =>
  d.namePt && d.namePt.toLowerCase() !== d.name.toLowerCase() ? d.name : null;
