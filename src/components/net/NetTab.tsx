import { Icon } from "../Pixel";

/** Aba de net do mestre: onde ele vai montar arquiteturas e mostrar em tela cheia pro netrunner. */
export function NetTab() {
  return (
    <div className="box mx-auto max-w-2xl p-10">
      <div className="flex items-center gap-3 text-net">
        <Icon name="net" size={32} />
        <h2 className="font-pixel text-2xl">netrunner</h2>
      </div>
      <p className="mt-3 text-dim">
        aqui você vai montar arquiteturas (andares, ice, dados) e mostrar em tela cheia pro netrunner.
        chega conforme as regras do capítulo da net entrarem.
      </p>
    </div>
  );
}
