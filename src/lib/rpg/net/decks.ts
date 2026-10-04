import type { CyberdeckDef } from "./types";

/**
 * Tipos de cyberdeck (pág. 196). Só dados: o catálogo de equipamento importa daqui.
 * O que separa um deck bom de um barato é o número de slots.
 */
export const CYBERDECKS: CyberdeckDef[] = [
  {
    id: "cyberdeckPoor",
    kind: "cyberdeck",
    name: "Poor Quality Cyberdeck",
    namePt: "cyberdeck de baixa qualidade",
    cost: 100,
    slots: 5,
    desc: "5 slots pra programas e hardware.",
  },
  {
    // id antigo, salvo nas fichas: não renomeie
    id: "cyberdeck",
    kind: "cyberdeck",
    name: "Cyberdeck",
    namePt: "cyberdeck",
    cost: 500,
    slots: 7,
    desc: "o deck padrão: 7 slots pra programas e hardware.",
  },
  {
    id: "cyberdeckExcellent",
    kind: "cyberdeck",
    name: "Excellent Quality Cyberdeck",
    namePt: "cyberdeck de excelente qualidade",
    cost: 1000,
    slots: 9,
    desc: "9 slots pra programas e hardware.",
  },
];
