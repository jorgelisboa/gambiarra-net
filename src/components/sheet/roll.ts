import type { RollResult } from "@/lib/rpg";

/** Uma rolagem guardada no dock da ficha. */
export interface SheetRoll {
  /** Contador crescente: é a chave que reinicia a animação dos dados. */
  n: number;
  /** Ficha que rolou, pra não misturar rolagens se a página trocar de personagem. */
  chId: string;
  label: string;
  r: RollResult;
  /** Veredito em destaque ao lado do total ("vive", "morre: falhou o teste de morte"). */
  headline?: string;
}

export type PushRoll = (label: string, r: RollResult, headline?: string) => void;
