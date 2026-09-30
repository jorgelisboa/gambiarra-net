import { Icon } from "./Pixel";

export function NetTab() {
  return (
    <div className="box mx-auto max-w-2xl p-10">
      <div className="flex items-center gap-3 text-net">
        <Icon name="net" size={32} />
        <h2 className="font-pixel text-2xl">netrunner</h2>
      </div>
      <p className="mt-3 text-dim">
        simulador de arquiteturas de net (andares, ice, programas) em breve.
      </p>
    </div>
  );
}
