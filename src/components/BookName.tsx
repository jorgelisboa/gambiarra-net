import { bookName } from "@/i18n";

/** Nome do livro (en), pequeno, embaixo do nome em pt-BR: ajuda a achar no livro. Some quando é igual. */
export function BookName({ def, className = "" }: { def: { name: string; namePt?: string }; className?: string }) {
  const en = bookName(def);
  if (!en) return null;
  return (
    <span lang="en" className={`block text-xs text-dim ${className}`}>
      {en}
    </span>
  );
}
