import { uid } from "../../id";
import type {
  DemonKey,
  FeatureDv,
  NetArchitecture,
  NetDifficulty,
  NetFloor,
  SecurityFloor,
  SecurityFloorKind,
  SecurityPlan,
} from "../../types";
import { BLACK_ICE, MAX_FLOORS, difficultyOf, NET_DIFFICULTIES } from "./architecture";

/**
 * Infraestrutura de segurança: comprar uma arquitetura de net e encher de senha, arquivo, nó de controle,
 * demon e defesa no mundo real (Home Security 2045, livro págs. 217-218; defesas nas págs. 213-217).
 * Black ICE fica de fora por escolha da mesa. Tudo isso só se compra num Night Market com eletrônicos
 * pessoais, de um Fixer rank 4 ou mais.
 *
 * Os números vêm do livro; os textos são resumos próprios em pt-BR.
 */

export const WHERE_TO_BUY = "Night Market com eletrônicos pessoais, de Fixer rank 4+";

/* ---------- a arquitetura em si ---------- */

/** O tamanho decide o preço por andar, o teto de nós de controle e se o servidor é portátil. */
export interface ArchitectureTier {
  min: number;
  max: number;
  perFloor: number;
  /** null = sem limite. */
  maxControlNodes: number | null;
  /** Portátil = um servidor do tamanho de uma mochila grande. */
  portable: boolean;
}

export const ARCHITECTURE_TIERS: ArchitectureTier[] = [
  { min: 3, max: 6, perFloor: 1000, maxControlNodes: 2, portable: true },
  { min: 7, max: 12, perFloor: 5000, maxControlNodes: 3, portable: false },
  { min: 13, max: 18, perFloor: 10000, maxControlNodes: null, portable: false },
];

/** Ninguém vende arquitetura com menos de 3 andares; o teto (18) é `MAX_FLOORS`, de architecture.ts. */
export const MIN_SECURITY_FLOORS = 3;

/* ---------- o que ocupa um andar ---------- */

export const SECURITY_KINDS: { id: SecurityFloorKind; label: string; hint: string }[] = [
  { id: "password", label: "senha", hint: "trava a descida até alguém dar Backdoor" },
  { id: "file", label: "arquivo", hint: "o tesouro: dados que alguém quer" },
  { id: "control", label: "nó de controle", hint: "liga uma defesa (ou outra coisa) do mundo real" },
  { id: "demon", label: "demon", hint: "opera os nós de controle sozinho" },
];

export const FEATURE_DVS: FeatureDv[] = [6, 8, 10, 12];

/** Senha, arquivo e nó de controle custam pela DV. */
export const FEATURE_COST: Record<FeatureDv, number> = { 6: 500, 8: 1000, 10: 5000, 12: 10000 };

export interface DemonDef {
  id: DemonKey;
  name: string;
  cost: number;
  rez: number;
  interface: number;
  netActions: number;
  combatNumber: number;
}

export const DEMONS: DemonDef[] = [
  { id: "imp", name: "Imp", cost: 1000, rez: 15, interface: 3, netActions: 2, combatNumber: 14 },
  { id: "efreet", name: "Efreet", cost: 5000, rez: 25, interface: 4, netActions: 3, combatNumber: 14 },
  { id: "balron", name: "Balron", cost: 10000, rez: 30, interface: 7, netActions: 4, combatNumber: 14 },
];

export const demonOf = (id: DemonKey): DemonDef => DEMONS.find((d) => d.id === id) ?? DEMONS[0];

/**
 * O livro diz "um demon a cada seis andares". Lido com arredondamento pra cima: de 3 a 6 andares cabe 1,
 * de 7 a 12 cabem 2, de 13 a 18 cabem 3. Senão uma arquitetura pequena nunca teria defesa ativa.
 */
export const FLOORS_PER_DEMON = 6;

/* ---------- defesas (cada uma pendurada num nó de controle) ---------- */

export type DefenseCategory = "active" | "emplaced" | "environmental";

export const DEFENSE_CATEGORIES: { id: DefenseCategory; label: string; rule: string }[] = [
  {
    id: "active",
    label: "ativa",
    rule: "robôs que perseguem até o perímetro; só funcionam com um demon (ou netrunner) segurando o nó",
  },
  {
    id: "emplaced",
    label: "fixa",
    rule: "presa no lugar, dispara sozinha no gatilho com Combat Number + 1d10; não precisa de demon e não esquiva",
  },
  {
    id: "environmental",
    label: "ambiente",
    rule: "parte do piso, parede ou teto; mesmo controlada só liga e desliga, e sem demon alguém liga na mão",
  },
];

/** DV de Electronics/Security Tech pra desarmar a defesa. É ela que define o preço. */
export type CounterDv = 9 | 13 | 17 | 21;

export const COUNTER_DV_COST: Record<CounterDv, number> = { 9: 500, 13: 1000, 17: 5000, 21: 10000 };

export interface DefenseDef {
  id: string;
  name: string;
  category: DefenseCategory;
  counterDv: CounterDv;
  /** Quanto tempo leva pra desarmar. */
  counterTime: "1 min" | "5 min";
  /** MOVE, HP, Combat Number, percepção pra notar. */
  data: string;
  /** O que faz, em uma linha. */
  summary: string;
}

/** Gatilho padrão de quase todas: alguém entra na área sem o passe ou crachá certo. */
export const DEFENSES: DefenseDef[] = [
  // ativas (pág. 213)
  {
    id: "air-swarm",
    name: "nuvem de drones",
    category: "active",
    counterDv: 17,
    counterTime: "5 min",
    data: "MOVE 8 · 15 HP",
    summary: "enxame de drones do tamanho de mosquito com nanofio; ataca como arma branca muito pesada",
  },
  {
    id: "ground-drone",
    name: "drone terrestre",
    category: "active",
    counterDv: 21,
    counterTime: "5 min",
    data: "MOVE 4 · 30 HP",
    summary: "bola, esteira, rodas ou cobra; leva 2 entre pistola muito pesada (8 balas perfurantes), SMG (30 balas) e câmera",
  },
  {
    id: "large-air-drone",
    name: "drone aéreo grande",
    category: "active",
    counterDv: 21,
    counterTime: "5 min",
    data: "MOVE 6 · 20 HP",
    summary: "leva 2 entre lança-dardos (8 flechas envenenadas), pistola muito pesada (8 balas perfurantes) e câmera",
  },
  {
    id: "mini-air-drone",
    name: "mini drone aéreo",
    category: "active",
    counterDv: 17,
    counterTime: "5 min",
    data: "MOVE 6 · 15 HP",
    summary: "leva 1 entre lança-dardos (8 flechas envenenadas), pistola muito pesada (8 balas perfurantes) e câmera",
  },
  {
    id: "spider-drone",
    name: "drone aranha",
    category: "active",
    counterDv: 21,
    counterTime: "5 min",
    data: "MOVE 4 · 40 HP",
    summary: "anda pelas paredes; leva 2 entre lança-granadas (2 de gás lacrimogêneo), arma branca muito pesada, SMG pesada (40 balas) e câmera",
  },
  // fixas (pág. 214)
  {
    id: "blood-swarm",
    name: "névoa de nanitas",
    category: "emplaced",
    counterDv: 21,
    counterTime: "5 min",
    data: "um ataque em todos da área",
    summary: "névoa vermelha que coagula o sangue: Resist Torture/Drugs DV15 ou 3d6 direto no HP, sem ablar; filtro de gás bloqueia",
  },
  {
    id: "auto-melee",
    name: "arma branca automática",
    category: "emplaced",
    counterDv: 17,
    counterTime: "5 min",
    data: "Combat Number 14 · 25 HP",
    summary: "arma branca muito pesada num canto da sala (jato d'água industrial, monofio girando); bate até não sobrar alvo ou aparecer o crachá",
  },
  {
    id: "auto-turret",
    name: "torreta automática",
    category: "emplaced",
    counterDv: 17,
    counterTime: "5 min",
    data: "Combat Number 14 · 25 HP",
    summary: "no teto; leva 1 entre fuzil de assalto, lança-chamas (4 cartuchos incendiários), lança-dardos, pistola muito pesada e SMG pesada",
  },
  // ambiente (págs. 215-216)
  {
    id: "cameras",
    name: "câmeras de observação",
    category: "environmental",
    counterDv: 9,
    counterTime: "1 min",
    data: "5 HP · Percepção DV17 pra notar",
    summary: "veem a sala ou o corredor inteiro no escuro, infravermelho e UV; avisam o demon ou a segurança",
  },
  {
    id: "tanglefoot",
    name: "carpete tanglefoot",
    category: "environmental",
    counterDv: 13,
    counterTime: "1 min",
    data: "20 HP · Percepção DV17 pra notar",
    summary: "nanofio escondido no carpete enrola as pernas: MOVE −1d6 até sair do carpete ou ele ser destruído",
  },
  {
    id: "electrical-floor",
    name: "piso elétrico",
    category: "environmental",
    counterDv: 13,
    counterTime: "1 min",
    data: "20 HP · Percepção DV17 pra notar",
    summary: "6d6 no corpo, reduzido pela armadura sem ablar; repete no fim de cada turno até sair do piso",
  },
  {
    id: "laser-grid",
    name: "grade laser",
    category: "environmental",
    counterDv: 17,
    counterTime: "5 min",
    data: "Percepção DV17 pra notar",
    summary: "encostar num laser é levar arma branca muito pesada no corpo; Contortionist DV17 atravessa se ela foi notada",
  },
  {
    id: "tip-floor",
    name: "alçapão",
    category: "environmental",
    counterDv: 13,
    counterTime: "1 min",
    data: "Percepção DV17 pra notar",
    summary: "o piso tomba num poço: Athletics DV15 pra não cair; o fundo pode ter nanofio ou estacas de 6d6",
  },
  {
    id: "goop",
    name: "gosma",
    category: "environmental",
    counterDv: 13,
    counterTime: "1 min",
    data: "10 HP · Percepção DV17 pra notar",
    summary: "borrifa gosma nas pernas: MOVE −2d6 até sair da área ou a gosma ser destruída",
  },
  {
    id: "punchers",
    name: "barras de teto e parede",
    category: "environmental",
    counterDv: 13,
    counterTime: "5 min",
    data: "20 HP · Percepção DV17 pra notar",
    summary: "barras de aço descem do teto ou saem da parede: 6d6 no corpo, reduzido pela armadura",
  },
  {
    id: "slip-floor",
    name: "piso escorregadio",
    category: "environmental",
    counterDv: 13,
    counterTime: "1 min",
    data: "10 HP · Percepção DV17 pra notar",
    summary: "líquido liso no chão: quem se mover na área faz Athletics DV15 ou cai",
  },
  {
    id: "stun-panels",
    name: "painéis de atordoamento",
    category: "environmental",
    counterDv: 13,
    counterTime: "1 min",
    data: "5 HP · Percepção DV17 pra notar",
    summary: "disfarçados de quadro; clarão e estrondo numa área de 10×10m: Resist Torture/Drugs DV15 ou olho e ouvido danificados por 1 minuto",
  },
  {
    id: "sleep-gas-elevator",
    name: "elevador de gás",
    category: "environmental",
    counterDv: 17,
    counterTime: "5 min",
    data: "60 HP · Percepção DV17 pra notar",
    summary: "lacra o espaço e entra no topo da iniciativa; no turno dele, Resist Torture/Drugs DV13 ou inconsciente",
  },
];

export const defenseOf = (id: string | null): DefenseDef | null => DEFENSES.find((d) => d.id === id) ?? null;

export const defenseCost = (d: DefenseDef): number => COUNTER_DV_COST[d.counterDv];

/* ---------- modelos prontos ---------- */

export interface PlanTemplate {
  id: string;
  label: string;
  description: string;
  /** Sem id: `newPlan` gera os ids. */
  floors: Omit<SecurityFloor, "id">[];
}

const f = (
  kind: SecurityFloorKind,
  opts: Partial<Omit<SecurityFloor, "id" | "kind">> = {},
): Omit<SecurityFloor, "id"> => ({ kind, dv: 8, demon: "imp", defense: null, label: "", note: "", ...opts });

/** Modelos próprios, sem Black ICE. Um em cada faixa de tamanho. */
export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    id: "loja",
    label: "loja pequena",
    description: "4 andares num servidor portátil: câmera, livro-caixa e uma torreta no estoque",
    floors: [
      f("password", { dv: 6, label: "caixa" }),
      f("control", { dv: 6, defense: "cameras", label: "câmeras da loja" }),
      f("file", { dv: 8, label: "livro-caixa" }),
      f("control", { dv: 8, defense: "auto-turret", label: "torreta do estoque" }),
    ],
  },
  {
    id: "boate",
    label: "boate",
    description: "6 andares com um Imp cuidando das câmeras e de um drone no camarote",
    floors: [
      f("password", { dv: 6, label: "portaria" }),
      f("control", { dv: 6, defense: "cameras", label: "câmeras da pista" }),
      f("demon", { demon: "imp", label: "segurança da casa" }),
      f("file", { dv: 8, label: "lista VIP" }),
      f("password", { dv: 8, label: "escritório do dono" }),
      f("control", { dv: 8, defense: "mini-air-drone", label: "drone do camarote" }),
    ],
  },
  {
    id: "corporativo",
    label: "andar corporativo",
    description: "9 andares com um Efreet, grade laser no corredor do cofre e drone de patrulha",
    floors: [
      f("password", { dv: 8, label: "recepção" }),
      f("control", { dv: 8, defense: "cameras", label: "câmeras do saguão" }),
      f("file", { dv: 8, label: "agenda dos executivos" }),
      f("demon", { demon: "efreet", label: "segurança do prédio" }),
      f("password", { dv: 10, label: "andar da diretoria" }),
      f("control", { dv: 10, defense: "laser-grid", label: "corredor do cofre" }),
      f("file", { dv: 10, label: "contratos" }),
      f("password", { dv: 12, label: "cofre de dados" }),
      f("control", { dv: 10, defense: "ground-drone", label: "drone de patrulha" }),
    ],
  },
];

/* ---------- contas e regras ---------- */

export interface FloorCost {
  /** Senha, arquivo, nó de controle (pela DV) ou demon. */
  feature: number;
  /** A defesa pendurada no nó; 0 se não tem. */
  defense: number;
  total: number;
}

export interface PlanCost {
  floors: number;
  /** null quando o número de andares está fora de 3 a 18. */
  tier: ArchitectureTier | null;
  /** Andares × preço por andar (0 sem faixa). */
  base: number;
  passwords: number;
  files: number;
  controlNodes: number;
  demons: number;
  defenses: number;
  total: number;
}

export interface PlanLimits {
  controlNodes: { used: number; max: number | null };
  demons: { used: number; max: number };
}

export interface PlanIssue {
  /** "erro" quebra a regra do livro e bloqueia mandar pro construtor; "aviso" só chama atenção. */
  level: "erro" | "aviso";
  text: string;
  /** Andar ao qual o aviso se refere, quando é um andar específico. */
  floorId?: string;
}

/** Faixa de preço pelo número de andares; null fora de 3 a 18. */
export function tierFor(floors: number): ArchitectureTier | null {
  return ARCHITECTURE_TIERS.find((t) => floors >= t.min && floors <= t.max) ?? null;
}

/** Quantos demons cabem: um a cada 6 andares, arredondado pra cima (0 andares = 0). */
export function maxDemons(floors: number): number {
  return floors <= 0 ? 0 : Math.ceil(floors / FLOORS_PER_DEMON);
}

/** Andar novo. Padrão: senha DV8, Imp guardado pra se virar demon, sem defesa, sem textos. */
export function newSecurityFloor(kind: SecurityFloorKind = "password"): SecurityFloor {
  return { id: uid(), kind, dv: 8, demon: "imp", defense: null, label: "", note: "" };
}

/**
 * Infraestrutura nova. Sem modelo (ou id desconhecido): 3 andares, senha DV8, arquivo DV8 e nó de controle DV8
 * sem defesa. Com modelo: cópia dos andares do modelo, cada um com id novo. Nome vazio vira "infraestrutura".
 */
export function newPlan(name: string, templateId?: string): SecurityPlan {
  const template = PLAN_TEMPLATES.find((t) => t.id === templateId);
  const floors: SecurityFloor[] = template
    ? template.floors.map((fl) => ({ ...fl, id: uid() }))
    : (["password", "file", "control"] as const).map((kind) => ({ ...newSecurityFloor(kind), dv: 8 as const }));
  return {
    id: uid(),
    name: name.trim() || "infraestrutura",
    location: "",
    floors,
    architectureId: null,
    createdAt: Date.now(),
  };
}

export function floorCost(floor: SecurityFloor): FloorCost {
  // cada tipo só olha o campo que vale pra ele: dv (senha, arquivo, nó), demon (demon), defesa (nó)
  const feature = floor.kind === "demon" ? demonOf(floor.demon).cost : FEATURE_COST[floor.dv];
  const def = floor.kind === "control" ? defenseOf(floor.defense) : null;
  const defense = def ? defenseCost(def) : 0;
  return { feature, defense, total: feature + defense };
}

export function planCost(plan: SecurityPlan): PlanCost {
  const floors = plan.floors.length;
  const tier = tierFor(floors);
  const base = tier ? floors * tier.perFloor : 0;
  const featureOf = (kind: SecurityFloorKind) =>
    plan.floors.filter((fl) => fl.kind === kind).reduce((sum, fl) => sum + floorCost(fl).feature, 0);
  const passwords = featureOf("password");
  const files = featureOf("file");
  const controlNodes = featureOf("control");
  const demons = featureOf("demon");
  const defenses = plan.floors.reduce((sum, fl) => sum + floorCost(fl).defense, 0);
  return {
    floors,
    tier,
    base,
    passwords,
    files,
    controlNodes,
    demons,
    defenses,
    total: base + passwords + files + controlNodes + demons + defenses,
  };
}

const countKind = (plan: SecurityPlan, kind: SecurityFloorKind) =>
  plan.floors.filter((fl) => fl.kind === kind).length;

export function planLimits(plan: SecurityPlan): PlanLimits {
  const n = plan.floors.length;
  return {
    controlNodes: { used: countKind(plan, "control"), max: tierFor(n)?.maxControlNodes ?? null },
    demons: { used: countKind(plan, "demon"), max: maxDemons(n) },
  };
}

/** Erros primeiro, depois avisos, na ordem dos andares. */
export function planIssues(plan: SecurityPlan): PlanIssue[] {
  const n = plan.floors.length;
  const { controlNodes, demons } = planLimits(plan);
  const errors: PlanIssue[] = [];
  const warnings: PlanIssue[] = [];

  if (n < MIN_SECURITY_FLOORS) errors.push({ level: "erro", text: "uma arquitetura tem no mínimo 3 andares" });
  if (n > MAX_FLOORS) errors.push({ level: "erro", text: "uma arquitetura tem no máximo 18 andares" });

  // o teto de nós só existe nas faixas pequenas (a de 13 a 18 não tem limite)
  if (controlNodes.max !== null && controlNodes.used > controlNodes.max) {
    const dica =
      controlNodes.max === 2
        ? " (de 7 a 12 andares cabem 3; de 13 pra cima, sem limite)"
        : controlNodes.max === 3
          ? " (de 13 andares pra cima, sem limite)"
          : "";
    errors.push({
      level: "erro",
      text: `${controlNodes.used} nós de controle: com ${n} andares cabem ${controlNodes.max}${dica}`,
    });
  }

  if (demons.used > demons.max) {
    errors.push({
      level: "erro",
      text: `${demons.used} demons: com ${n} andares ${demons.max === 1 ? "cabe 1" : `cabem ${demons.max}`} (um a cada 6 andares)`,
    });
  }

  // defesa ativa e de ambiente dependem de alguém operando o nó; sem demon, tem de ser gente
  if (demons.used === 0) {
    for (const fl of plan.floors) {
      const def = fl.kind === "control" ? defenseOf(fl.defense) : null;
      if (!def) continue;
      if (def.category === "active") {
        warnings.push({
          level: "aviso",
          floorId: fl.id,
          text: `${def.name} é defesa ativa: sem demon, só funciona com um netrunner segurando o nó`,
        });
      } else if (def.category === "environmental") {
        warnings.push({
          level: "aviso",
          floorId: fl.id,
          text: `sem demon, alguém do lugar liga e desliga ${def.name} na mão`,
        });
      }
    }
  }

  if (demons.used > 0 && controlNodes.used === 0) {
    warnings.push({ level: "aviso", text: "o demon não tem nó de controle pra operar" });
  }

  return [...errors, ...warnings];
}

/** Andar novo logo depois de `afterId` (null: no fim). Não passa de MAX_FLOORS: devolve o plano igual. */
export function addSecurityFloor(plan: SecurityPlan, afterId: string | null, kind?: SecurityFloorKind): SecurityPlan {
  if (plan.floors.length >= MAX_FLOORS) return plan;
  const i = afterId === null ? -1 : plan.floors.findIndex((fl) => fl.id === afterId);
  const at = i < 0 ? plan.floors.length : i + 1;
  const floors = [...plan.floors.slice(0, at), newSecurityFloor(kind), ...plan.floors.slice(at)];
  return { ...plan, floors };
}

export function removeSecurityFloor(plan: SecurityPlan, id: string): SecurityPlan {
  return { ...plan, floors: plan.floors.filter((fl) => fl.id !== id) };
}

export function patchSecurityFloor(plan: SecurityPlan, id: string, patch: Partial<SecurityFloor>): SecurityPlan {
  // o id nunca muda, mesmo que o patch traga um
  return { ...plan, floors: plan.floors.map((fl) => (fl.id === id ? { ...fl, ...patch, id: fl.id } : fl)) };
}

/** Sobe (-1) ou desce (+1) o andar uma posição. Na ponta, devolve o plano igual. */
export function moveSecurityFloor(plan: SecurityPlan, id: string, dir: -1 | 1): SecurityPlan {
  const i = plan.floors.findIndex((fl) => fl.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= plan.floors.length) return plan;
  const floors = [...plan.floors];
  [floors[i], floors[j]] = [floors[j], floors[i]];
  return { ...plan, floors };
}

/** A dificuldade do construtor cuja DV mais aparece entre senhas, arquivos e nós (empate: a maior). Sem nenhum: padrão. */
export function difficultyForPlan(plan: SecurityPlan): NetDifficulty {
  const counts = new Map<number, number>();
  for (const fl of plan.floors) {
    if (fl.kind !== "demon") counts.set(fl.dv, (counts.get(fl.dv) ?? 0) + 1);
  }
  let best: number | null = null;
  for (const [dv, count] of counts) {
    const bestCount = best === null ? 0 : (counts.get(best) ?? 0);
    if (count > bestCount || (count === bestCount && best !== null && dv > best)) best = dv;
  }
  return NET_DIFFICULTIES.find((d) => d.dv === best)?.id ?? "standard";
}

/**
 * A infraestrutura como arquitetura do construtor (aba netrunner): um tronco só, andar 1 em cima.
 * Com `existing`, mantém o id e a data dela e troca os andares (o que estava revelado zera).
 * Demon vai no espaço do black ICE; a defesa e as fichas vão pra nota do mestre.
 */
export function planToArchitecture(plan: SecurityPlan, existing?: NetArchitecture | null): NetArchitecture {
  const difficulty = difficultyForPlan(plan);
  const floors: NetFloor[] = [];
  for (const fl of plan.floors) {
    const isDemon = fl.kind === "demon";
    const demon = isDemon ? demonOf(fl.demon) : null;
    const def = fl.kind === "control" ? defenseOf(fl.defense) : null;

    const label =
      fl.label.trim() ||
      (demon ? `demon ${demon.name}` : fl.kind === "control" ? (def?.name ?? "nó de controle") : "");

    const parts: string[] = [];
    if (def) {
      const categoria = DEFENSE_CATEGORIES.find((c) => c.id === def.category)?.label ?? def.category;
      parts.push(
        `${def.name} (defesa ${categoria}; desarmar: Electronics/Security Tech DV${def.counterDv}, ${def.counterTime}) · ${def.data}. ${def.summary}`,
      );
    }
    if (demon) {
      parts.push(
        `REZ ${demon.rez} · Interface ${demon.interface} · ${demon.netActions} NET actions · Combat Number ${demon.combatNumber}. usa só Zap e Control.`,
      );
    }
    if (fl.note.trim()) parts.push(fl.note.trim());

    floors.push({
      id: uid(),
      // tronco único: cada andar pendura no anterior
      parent: floors.length ? floors[floors.length - 1].id : null,
      // o construtor mostra o demon no espaço do black ICE
      kind: fl.kind === "demon" ? "ice" : fl.kind,
      dv: isDemon ? difficultyOf(difficulty).dv : fl.dv,
      ice: demon ? demon.name : BLACK_ICE[0],
      label,
      note: parts.join("\n"),
      revealed: false,
    });
  }
  return {
    id: existing?.id ?? uid(),
    name: plan.name.trim() || "infraestrutura",
    difficulty,
    floors,
    runnerAt: null,
    createdAt: existing?.createdAt ?? Date.now(),
  };
}
