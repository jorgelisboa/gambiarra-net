import type { AbilityState, Role, Stats } from "../types";

/** O que uma rolagem precisa saber do personagem. */
export interface RollCtx {
  rank: number;
  stats: Stats;
  state: AbilityState;
}

export interface RollResult {
  /** Dados que entram no total, na ordem. Dados extras (dano, tempo) vão no texto. */
  dice: number[];
  total: number;
  /** Linha de resultado em pt-BR. */
  text: string;
  /** true/false quando há alvo fixo; sem valor quando o mestre decide. */
  ok?: boolean;
  crit?: "sucesso" | "falha";
}

/** Um jeito de usar a habilidade: vira um botão que rola. */
export interface UseDef {
  id: string;
  name: string;
  /** Fórmula mostrada, ex.: "interface + 1d10". */
  formula: string;
  desc?: string;
  /** Custo em combate, ex.: "1 ação de net". */
  cost?: string;
  /** Modificador escolhido num select antes de rolar (perícia, provas...). */
  mods?: { label: string; value: number }[];
  /** Motivo do bloqueio, ou null se pode usar. */
  locked?: (ctx: RollCtx) => string | null;
  roll: (ctx: RollCtx, mod: number) => RollResult;
}

/** Uma opção onde o jogador põe pontos. */
export interface AllocOption {
  id: string;
  name: string;
  /** Regra curta. */
  rule: string;
  /** Pontos por degrau: Precision Attack só anda de 3 em 3. Padrão 1. */
  step?: number;
  /** Teto de pontos nesta opção. */
  max?: number;
  /** Efeito com N pontos (N > 0). */
  effect: (points: number) => string;
}

export interface AllocDef {
  title: string;
  budget: (rank: number) => number;
  /** Teto por opção que cresce com o rank (Tech: 1 ponto por especialidade a cada rank). */
  capByRank?: (rank: number) => number;
  options: AllocOption[];
}

/** Lista nomeada com limite de itens pelo rank. */
export interface ListDef {
  id: string;
  title: string;
  max: (rank: number) => number;
  placeholder: string;
  /** Etiquetas que um item pode ter (Nomad: veículo ou melhoria). */
  tags?: string[];
}

/** Faixa de ranks e o que ela libera. Linhas "rótulo: texto" ganham rótulo apagado. */
export interface Tier {
  from: number;
  to: number;
  lines: string[];
}

export interface TierTable {
  title: string;
  /** Benefícios acumulam (Exec, veículos do Nomad) em vez de valer só a faixa atual. */
  cumulative?: boolean;
  tiers: Tier[];
}

export interface AbilityDef {
  /** Nome no livro. */
  name: string;
  namePt: string;
  summary: string;
  alloc?: AllocDef;
  lists?: ListDef[];
  uses?: UseDef[];
  tables?: TierTable[];
  /** Efeitos sempre ativos no rank atual. */
  passives?: (rank: number, state: AbilityState) => string[];
  /** Regras curtas que não viram botão. */
  notes?: string[];
  /** Bônus somado à iniciativa no combate. */
  initiative?: (rank: number, state: AbilityState) => number;
  /** Ações de net por turno no combate. */
  netActions?: (rank: number) => number;
}

export interface RoleDef {
  role: Role;
  /** Uma ou duas frases, em pt-BR. */
  summary: string;
  ability: AbilityDef;
}
