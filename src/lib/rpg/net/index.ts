/**
 * Netrunning (capítulo da NET, pág. 196 em diante). O módulo é grande e entra por partes:
 * - cyberdeck: tipos, slots, conectar e instalar (`decks.ts`, `cyberdeck.ts`)
 * - o que precisa pra fazer netrun (`requirements.ts`)
 * - arquiteturas montadas pelo mestre: andares, galhos, o que foi revelado (`architecture.ts`)
 * - a fazer: programas (pág. 201), hardware (pág. 208), fichas de ICE e ações de net
 */
export * from "./architecture";
export * from "./cyberdeck";
export * from "./decks";
export * from "./requirements";
export type * from "./types";
