import { uid } from "../../id";
import type { Stats, TeamMember } from "../../types";
import { d6 } from "../dice";
import { maxHp } from "../derived";

/** Ordem das colunas nas tabelas de equipe do livro (sem LUCK). */
export const TEAM_STATS = ["INT", "REF", "DEX", "TECH", "COOL", "WILL", "MOVE", "BODY", "EMP"] as const;

export interface TeamClass {
  id: string;
  name: string;
  namePt: string;
  covers: string[];
  /** Função de verdade. */
  job: string;
  /** 6 linhas (1d6) na ordem de TEAM_STATS. */
  rows: number[][];
  /** Perícias por nível. Ids de src/lib/rpg/skills.ts; "interface" é a habilidade do Netrunner. */
  skills: [level: number, ids: string[]][];
  cyberware: string[];
  gear: string[];
}

const BASICS_EXCEPT = (...out: string[]) =>
  ["concentration", "conversation", "education", "firstAid", "humanPerception", "language", "localExpert", "persuasion", "stealth", "athletics", "brawling", "evasion", "perception"].filter(
    (s) => !out.includes(s),
  );

/** Classes de membro da equipe (tabelas "Creating Your Team Members"). */
export const TEAM_CLASSES: TeamClass[] = [
  {
    id: "bodyguard",
    name: "Company Bodyguard",
    namePt: "guarda-costas",
    covers: ["acompanhante", "personal trainer"],
    job: "proteger o Exec em situações perigosas",
    rows: [
      [3, 7, 7, 4, 7, 6, 4, 8, 4],
      [5, 8, 6, 2, 7, 8, 4, 8, 2],
      [4, 8, 5, 3, 7, 8, 6, 6, 3],
      [4, 7, 8, 4, 7, 7, 4, 7, 2],
      [3, 8, 5, 2, 8, 7, 4, 6, 7],
      [5, 7, 7, 2, 7, 6, 5, 7, 4],
    ],
    skills: [
      [2, ["concentration", "conversation", "education", "firstAid", "humanPerception", "language", "localExpert", "persuasion", "stealth"]],
      [4, ["athletics", "evasion", "interrogation", "perception", "resistTortureDrugs", "tactics"]],
      [6, ["handgun", "brawling"]],
    ],
    cyberware: ["Enhanced Antibodies", "Subdermal Armor (SP11)", "Cyberaudio Suite", "Internal Agent", "Homing Tracer"],
    gear: ["Agent", "Light Armorjack (SP11)", "Very Heavy Pistol", "Basic VH Pistol Ammo x50"],
  },
  {
    id: "covert",
    name: "Company Covert Operative",
    namePt: "agente secreto",
    covers: ["assistente pessoal", "estilista"],
    job: "fazer o trabalho sujo pro Exec não sujar as mãos",
    rows: [
      [4, 8, 5, 4, 6, 8, 5, 7, 3],
      [3, 8, 6, 2, 8, 6, 6, 6, 5],
      [6, 7, 5, 5, 7, 6, 3, 7, 4],
      [5, 6, 5, 3, 6, 8, 7, 6, 4],
      [3, 8, 4, 4, 8, 7, 4, 8, 4],
      [5, 8, 3, 7, 7, 8, 3, 6, 3],
    ],
    skills: [
      [2, ["athletics", "brawling", "concentration", "conversation", "education", "firstAid", "language", "localExpert", "perception", "persuasion"]],
      [4, ["bribery", "bureaucracy", "business", "evasion", "humanPerception", "pickLock", "streetwise", "trading", "wardrobeStyle"]],
      [6, ["handgun", "stealth"]],
    ],
    cyberware: [
      "Cybereyes com Low Light/Infrared/UV e Color Shift",
      "Cyberarm com Grapple Hand",
      "Popup Ranged Weapon (Very Heavy Pistol)",
      "Realskinn Covering",
    ],
    gear: ["Agent", "Light Armorjack (SP11)", "Very Heavy Pistol", "Basic VH Pistol Ammo x50"],
  },
  {
    id: "driver",
    name: "Company Driver",
    namePt: "motorista",
    covers: ["manobrista", "motorista particular"],
    job: "dirige, pilota e cuida dos veículos da equipe",
    rows: [
      [5, 8, 6, 4, 6, 5, 6, 5, 5],
      [5, 7, 7, 5, 5, 7, 4, 7, 3],
      [6, 8, 8, 4, 7, 4, 5, 6, 2],
      [8, 7, 4, 5, 4, 7, 5, 6, 4],
      [7, 8, 3, 5, 7, 6, 4, 6, 4],
      [6, 8, 6, 6, 8, 5, 3, 5, 3],
    ],
    skills: [
      [2, ["athletics", "concentration", "conversation", "education", "firstAid", "humanPerception", "language", "localExpert", "perception", "persuasion"]],
      [4, ["brawling", "endurance", "evasion", "landVehicleTech", "pilotAirVehicle", "pilotSeaVehicle", "seaVehicleTech", "stealth", "tracking"]],
      [6, ["driveLandVehicle", "handgun"]],
    ],
    cyberware: ["Radar/Sonar Implant", "Cyberaudio Suite", "Internal Agent", "Homing Tracer", "Radar Detector"],
    gear: ["Light Armorjack (SP11)", "Very Heavy Pistol", "Compact Groundcar com Seating Upgrade", "Basic VH Pistol Ammo x50"],
  },
  {
    id: "netrunner",
    name: "Company Netrunner",
    namePt: "netrunner",
    covers: ["engenheiro de TI", "pesquisador"],
    job: "netrunning e coleta de informação",
    rows: [
      [6, 7, 8, 7, 5, 4, 5, 5, 3],
      [7, 8, 4, 6, 8, 3, 4, 6, 4],
      [5, 6, 8, 8, 6, 6, 4, 4, 3],
      [7, 8, 5, 6, 4, 4, 6, 5, 5],
      [5, 8, 8, 5, 5, 3, 6, 4, 6],
      [8, 7, 6, 6, 4, 7, 4, 4, 4],
    ],
    skills: [
      [2, ["interface", ...BASICS_EXCEPT("education", "stealth")]],
      [4, ["basicTech", "cryptography", "cybertech", "education", "electronicsSecurityTech", "forgery", "librarySearch", "handgun", "stealth"]],
    ],
    cyberware: ["Neural Link", "Chipware Socket", "Pain Editor", "Interface Plugs", "Cybereyes com Virtuality"],
    gear: [
      "Agent",
      "Light Armorjack (SP11)",
      "Cyberdeck (7 slots: Sword, Sword, Killer, Worm, Worm, Armor)",
      "Very Heavy Pistol",
      "Basic VH Pistol Ammo x50",
    ],
  },
  {
    id: "technician",
    name: "Company Technician",
    namePt: "técnico",
    covers: ["engenheiro de TI", "estagiário"],
    job: "conserta o equipamento e as armas da equipe",
    rows: [
      [8, 8, 5, 7, 3, 4, 4, 5, 6],
      [8, 7, 6, 8, 3, 5, 5, 4, 4],
      [8, 6, 5, 8, 4, 3, 3, 7, 6],
      [8, 8, 5, 7, 4, 4, 4, 5, 5],
      [7, 7, 3, 7, 5, 3, 6, 6, 3],
      [7, 8, 5, 8, 6, 3, 3, 5, 5],
    ],
    skills: [
      [2, BASICS_EXCEPT("education")],
      [4, ["education", "handgun", "weaponstech"]],
      [6, ["basicTech", "cybertech", "electronicsSecurityTech"]],
    ],
    cyberware: ["Tool Hand", "Cyberaudio Suite", "Internal Agent", "Bug Detector", "Audio Recorder"],
    gear: ["Light Armorjack (SP11)", "Very Heavy Pistol", "Basic VH Pistol Ammo x50"],
  },
];

export const teamClass = (id: string) => TEAM_CLASSES.find((c) => c.id === id);

/** Stats da linha (LUCK fica 0: membros não têm). */
export function teamStats(cls: TeamClass, row: number): Stats {
  const r = cls.rows[Math.max(1, Math.min(6, row)) - 1];
  const s = Object.fromEntries(TEAM_STATS.map((k, i) => [k, r[i]])) as Omit<Stats, "LUCK">;
  return { ...s, LUCK: 0 };
}

export const teamMaxHp = (cls: TeamClass, row: number) => maxHp(teamStats(cls, row));

/** Lealdade inicial: 1d6 + 1. */
export const startingLoyalty = () => d6() + 1;

/** Contratar: stats na linha do 1d6, lealdade 1d6 + 1, HP cheio. */
export function hire(cls: TeamClass, name: string, cover: string): TeamMember {
  const row = d6();
  return { id: uid(), job: cls.id, name, cover, row, hp: teamMaxHp(cls, row), loyalty: startingLoyalty() };
}

/** Substituto do RH: stats novas e lealdade 1 (eles ficaram sabendo). */
export function replaceMember(m: TeamMember): TeamMember {
  const cls = teamClass(m.job)!;
  const row = d6();
  return { ...m, name: "", row, hp: teamMaxHp(cls, row), loyalty: 1 };
}

export const HIRING_FEE = 200;

/** Lealdade entre sessões: no máximo 10. */
export const LOYALTY_CAP = 10;

/** Teste de lealdade: 1d6 abaixo da lealdade atual. */
export function loyaltySave(loyalty: number) {
  const d = d6();
  return { d, ok: d < loyalty };
}

export const LOYALTY_GAIN: [label: string, value: number][] = [
  ["elogiar o trabalho (se exagerar na semana, para de render)", 1],
  ["bônus ou mimo de pelo menos 200eb", 4],
  ["defender o membro contra a diretoria", 4],
  ["dar 20% do teu ganho num job", 6],
  ["folga paga (uma sessão inteira)", 6],
  ["arriscar o próprio corpo pelo membro", 8],
];

export const LOYALTY_LOSS: [label: string, value: number][] = [
  ["passar uma sessão inteira sem ganhar lealdade", -1],
  ["dar bronca ou humilhar pelo trabalho", -2],
  ["ignorar a contribuição num job / esquecer o aniversário", -4],
  ["não cumprir bônus ou mimo prometido", -6],
  ["jogar o membro pra diretoria", -6],
  ["abandonar o membro sob fogo", -8],
];
