import type { Role } from "../../types";

/** Uma linha da tabela do livro: uma peça, ou "isto **ou** aquilo". */
export interface CyberKitLine {
  /** Ids no catálogo de cyberware. Uma opção = peça fixa. */
  options: string[];
}

const fixed = (ref: string): CyberKitLine => ({ options: [ref] });
const or = (...refs: string[]): CyberKitLine => ({ options: refs });

/**
 * Cyberware inicial do Streetrat e do Edgerunner (pág. 118). A ordem importa: a peça de base vem
 * antes das opções que vão nela. Na criação a perda de humanidade é a fixa do catálogo.
 * Livro: Rockerboy 9, Solo 14, Netrunner 14, Tech 12, Medtech 12, Media 10, Lawman 10, Exec 12,
 * Fixer 16 e Nomad 14 de humanidade perdida.
 */
export const STREETRAT_CYBERWARE: Record<Role, CyberKitLine[]> = {
  Rockerboy: [fixed("cyberaudioSuite"), fixed("audioRecorder"), fixed("chemskin"), fixed("techhair")],
  Solo: [fixed("biomonitor"), fixed("neuralLink"), or("sandevistan", "wolvers")],
  Netrunner: [fixed("neuralLink"), fixed("interfacePlugs"), fixed("shiftTacts")],
  Tech: [fixed("cybereye"), fixed("microOptics"), fixed("skinwatch"), fixed("toolHand")],
  Medtech: [fixed("biomonitor"), fixed("cybereye"), or("nasalFilters", "toxinBinders"), fixed("teleOptics")],
  Media: [fixed("cyberaudioSuite"), or("amplifiedHearing", "voiceStressAnalyzer"), fixed("lightTattoo")],
  Lawman: [fixed("hiddenHolster"), fixed("subdermalPocket")],
  Exec: [or("biomonitor", "techhair"), fixed("cyberaudioSuite"), fixed("internalAgent"), or("toxinBinders", "nasalFilters")],
  Fixer: [fixed("cyberaudioSuite"), fixed("internalAgent"), fixed("subdermalPocket"), or("voiceStressAnalyzer", "amplifiedHearing")],
  Nomad: [fixed("neuralLink"), or("interfacePlugs", "wolvers")],
};

/** As peças do kit com as escolhas feitas (`picks["c2"] = 1`: a 2ª opção da 3ª linha), na ordem de instalar. */
export const kitRefs = (role: Role, picks: Record<string, number>): string[] =>
  STREETRAT_CYBERWARE[role].map((line, i) => line.options[Math.min(picks[`c${i}`] ?? 0, line.options.length - 1)]);
