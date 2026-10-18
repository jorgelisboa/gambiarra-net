import { uid } from "../../id";
import type { Character, PsychosisTrait } from "../../types";
import type { Cyberpsychosis } from "./rules";

/**
 * Traços de ciberpsicose (págs. 230-232): os sintomas de dissociação (despersonalização) e a
 * lista de psicopatia de Hare. O livro pede pelo menos 3 traços de Hare com EMP 1 e 5 com EMP 0;
 * o mestre escolhe, rola ou escreve os dele. As dicas de interpretação são nossas.
 */

export type TraitKind = "dissociation" | "psychopathy";

export interface TraitDef {
  /** Chave salva na ficha: não renomeie. */
  id: string;
  kind: TraitKind;
  /** Como está no livro (en). */
  name: string;
  namePt: string;
  /** Como interpretar, curto. */
  hint: string;
}

const trait = (id: string, kind: TraitKind, name: string, namePt: string, hint: string): TraitDef => ({
  id,
  kind,
  name,
  namePt,
  hint,
});

export const PSYCHOSIS_TRAITS: TraitDef[] = [
  // despersonalização (pág. 230), na ordem do livro
  trait("dis-detached", "dissociation", "Detached from one's life", "desligado da própria vida", "como se assistisse a um personagem num filme chato."),
  trait("dis-distant", "dissociation", "Emotionally unconnected to oneself", "distante de si mesmo", "não sente ligação com o que pensa e sente."),
  trait("dis-memory", "dissociation", "Problems with concentration and memory", "concentração e memória falhando", "perde o fio da conversa e esquece o que acabou de fazer."),
  trait("dis-spacey", "dissociation", "Feeling spacey or out of control", "aéreo, fora de controle", "parece que o corpo age sozinho."),
  trait("dis-time", "dissociation", "Time slows down", "o tempo se arrasta", "os segundos ficam longos demais; reage atrasado ou fica olhando o nada."),
  trait("dis-body", "dissociation", "Body feels a different shape or size", "o corpo parece outro", "sente o corpo de outro formato ou tamanho; estranha os próprios implantes."),
  trait("dis-mirror", "dissociation", "Can't recognize oneself in a mirror", "não se reconhece no espelho", "em casos graves, o reflexo parece de outra pessoa."),
  // lista de psicopatia de Hare (pág. 232), na ordem do livro
  trait("hare-grandiose", "psychopathy", "Grandiose sense of self", "ego inflado", "se acha acima dos outros e das regras."),
  trait("hare-stimulation", "psychopathy", "Need for stimulation", "precisa de adrenalina", "se entedia fácil e procura risco pra se sentir vivo."),
  trait("hare-manipulative", "psychopathy", "Cunning and manipulative", "astuto e manipulador", "usa as pessoas como ferramentas e mente sem esforço."),
  trait("hare-remorse", "psychopathy", "Lack of remorse or guilt", "sem remorso nem culpa", "o que fez, tá feito; não pensa duas vezes."),
  trait("hare-callous", "psychopathy", "Callousness and lack of empathy", "frio, sem empatia", "a dor dos outros não significa nada."),
  trait("hare-control", "psychopathy", "Poor behavioral controls", "pavio curto", "explode com pouca coisa e parte pra violência."),
  trait("hare-impulsive", "psychopathy", "Impulsivity", "impulsivo", "age antes de pensar, sem medir consequência."),
  trait("hare-blame", "psychopathy", "Failure to accept responsibility", "nunca é culpa dele", "joga a culpa em qualquer um, menos em si."),
  trait("hare-versatile", "psychopathy", "Criminal versatility", "pau pra toda obra no crime", "qualquer crime serve, desde que funcione."),
];

export const traitDef = (ref?: string) => (ref ? PSYCHOSIS_TRAITS.find((d) => d.id === ref) : undefined);

export const traitsOfKind = (kind: TraitKind) => PSYCHOSIS_TRAITS.filter((d) => d.kind === kind);

/** Nome pra mostrar: o pt do livro ou o que o mestre escreveu. */
export const traitName = (tr: PsychosisTrait) => traitDef(tr.ref)?.namePt ?? tr.text ?? "";

/** Traços de Hare que o livro pede no nível (dissociação 3, ciberpsicose 5); 0 abaixo disso. */
export const traitsNeeded = (psy: Cyberpsychosis) => (psy.level >= 3 ? 5 : psy.level === 2 ? 3 : 0);

/** Tabela que combina com o nível: sintomas de dissociação no limite, Hare a partir da dissociação. */
export const traitKindFor = (psy: Cyberpsychosis): TraitKind => (psy.level >= 2 ? "psychopathy" : "dissociation");

/** Quantos traços da lista de Hare a ficha tem (os escritos à mão contam: o mestre decide o que são). */
export const hareCount = (ch: Character) =>
  ch.psychosis.filter((tr) => !tr.ref || traitDef(tr.ref)?.kind === "psychopathy").length;

export function addTrait(ch: Character, tr: { ref: string } | { text: string }): Character {
  if ("ref" in tr && ch.psychosis.some((x) => x.ref === tr.ref)) return ch;
  if ("text" in tr && !tr.text.trim()) return ch;
  const item: PsychosisTrait = "ref" in tr ? { id: uid(), ref: tr.ref } : { id: uid(), text: tr.text.trim() };
  return { ...ch, psychosis: [...ch.psychosis, item] };
}

export const removeTrait = (ch: Character, id: string): Character => ({
  ...ch,
  psychosis: ch.psychosis.filter((x) => x.id !== id),
});

export interface TraitRoll {
  /** O dado que ficou (1dN na tabela inteira, rolando de novo o que a ficha já tem). */
  die: number;
  sides: number;
  def: TraitDef;
  ch: Character;
}

/** Rola na tabela do tipo e põe o traço; null se a ficha já tem todos. */
export function rollTrait(ch: Character, kind: TraitKind, rnd: () => number = Math.random): TraitRoll | null {
  const table = traitsOfKind(kind);
  const free = table.filter((d) => !ch.psychosis.some((x) => x.ref === d.id));
  if (!free.length) return null;
  for (let i = 0; i < 100; i++) {
    const die = Math.floor(rnd() * table.length) + 1;
    const def = table[die - 1];
    if (def && free.includes(def)) return { die, sides: table.length, def, ch: addTrait(ch, { ref: def.id }) };
  }
  const def = free[0];
  return { die: table.indexOf(def) + 1, sides: table.length, def, ch: addTrait(ch, { ref: def.id }) };
}
