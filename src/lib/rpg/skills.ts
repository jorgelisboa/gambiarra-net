import { uid } from "../id";
import type { Role, SkillEntry, StatKey, Stats } from "../types";

/** As 9 categorias do livro, na ordem da lista de perícias. */
export const SKILL_CATEGORIES = [
  { id: "awareness", name: "atenção", en: "awareness", summary: "perceber o ambiente e notar pistas." },
  { id: "body", name: "corpo", en: "body", summary: "tarefas físicas, força e resistência." },
  { id: "control", name: "controle", en: "control", summary: "pilotar veículos e montar animais." },
  { id: "education", name: "educação", en: "education", summary: "conhecimento de estudo formal." },
  { id: "fighting", name: "luta", en: "fighting", summary: "briga e combate com arma branca." },
  { id: "performance", name: "performance", en: "performance", summary: "atuação, música e artes de palco." },
  { id: "ranged", name: "armas à distância", en: "ranged weapon", summary: "armas de fogo, arco e afins." },
  { id: "social", name: "social", en: "social", summary: "se misturar, ter estilo e convencer os outros." },
  { id: "technique", name: "técnica", en: "technique", summary: "ofícios aprendidos na prática." },
] as const;

export type SkillCategoryId = (typeof SKILL_CATEGORIES)[number]["id"];

export interface SkillDef {
  /** Chave salva na ficha: não renomeie. */
  id: string;
  /** Nome do livro (en). */
  name: string;
  namePt: string;
  stat: StatKey;
  category: SkillCategoryId;
  /** Perícia básica (negrito no livro): todo personagem tem. */
  basic?: boolean;
  /** Custa o dobro pra comprar. */
  x2?: boolean;
  /** Pede especialização e pode aparecer várias vezes (idioma, ciência...). O texto é o placeholder. */
  spec?: string;
}

const s = (
  id: string,
  name: string,
  namePt: string,
  stat: StatKey,
  category: SkillCategoryId,
  extra: Pick<SkillDef, "basic" | "x2" | "spec"> = {},
): SkillDef => ({ id, name, namePt, stat, category, ...extra });

const basic = { basic: true };
const x2 = { x2: true };

/** As 66 perícias do Cyberpunk RED, por categoria. */
export const SKILLS: readonly SkillDef[] = [
  s("concentration", "Concentration", "concentração", "WILL", "awareness", basic),
  s("concealRevealObject", "Conceal/Reveal Object", "ocultar/revelar objeto", "INT", "awareness"),
  s("lipReading", "Lip Reading", "leitura labial", "INT", "awareness"),
  s("perception", "Perception", "percepção", "INT", "awareness", basic),
  s("tracking", "Tracking", "rastrear", "INT", "awareness"),

  s("athletics", "Athletics", "atletismo", "DEX", "body", basic),
  s("contortionist", "Contortionist", "contorcionismo", "DEX", "body"),
  s("dance", "Dance", "dança", "DEX", "body"),
  s("endurance", "Endurance", "resistência física", "WILL", "body"),
  s("resistTortureDrugs", "Resist Torture/Drugs", "resistir a tortura/drogas", "WILL", "body"),
  s("stealth", "Stealth", "furtividade", "DEX", "body", basic),

  s("driveLandVehicle", "Drive Land Vehicle", "dirigir veículo terrestre", "REF", "control"),
  s("pilotAirVehicle", "Pilot Air Vehicle", "pilotar veículo aéreo", "REF", "control", x2),
  s("pilotSeaVehicle", "Pilot Sea Vehicle", "pilotar embarcação", "REF", "control"),
  s("riding", "Riding", "montaria", "REF", "control"),

  s("accounting", "Accounting", "contabilidade", "INT", "education"),
  s("animalHandling", "Animal Handling", "lidar com animais", "INT", "education"),
  s("bureaucracy", "Bureaucracy", "burocracia", "INT", "education"),
  s("business", "Business", "negócios", "INT", "education"),
  s("composition", "Composition", "composição", "INT", "education"),
  s("criminology", "Criminology", "criminologia", "INT", "education"),
  s("cryptography", "Cryptography", "criptografia", "INT", "education"),
  s("deduction", "Deduction", "dedução", "INT", "education"),
  s("education", "Education", "educação", "INT", "education", basic),
  s("gamble", "Gamble", "jogos de azar", "INT", "education"),
  s("language", "Language", "idioma", "INT", "education", { ...basic, spec: "idioma" }),
  s("librarySearch", "Library Search", "pesquisa", "INT", "education"),
  s("localExpert", "Local Expert", "especialista local", "INT", "education", { ...basic, spec: "região" }),
  s("science", "Science", "ciência", "INT", "education", { spec: "qual ciência" }),
  s("tactics", "Tactics", "tática", "INT", "education"),
  s("wildernessSurvival", "Wilderness Survival", "sobrevivência", "INT", "education"),

  s("brawling", "Brawling", "briga", "DEX", "fighting", basic),
  s("evasion", "Evasion", "evasão", "DEX", "fighting", basic),
  s("martialArts", "Martial Arts", "artes marciais", "DEX", "fighting", { x2: true, spec: "estilo" }),
  s("meleeWeapon", "Melee Weapon", "arma branca", "DEX", "fighting"),

  s("acting", "Acting", "atuação", "COOL", "performance"),
  s("playInstrument", "Play Instrument", "tocar instrumento", "TECH", "performance", { spec: "instrumento" }),

  s("archery", "Archery", "arco e flecha", "REF", "ranged"),
  s("autofire", "Autofire", "fogo automático", "REF", "ranged", x2),
  s("handgun", "Handgun", "pistola", "REF", "ranged"),
  s("heavyWeapons", "Heavy Weapons", "armas pesadas", "REF", "ranged", x2),
  s("shoulderArms", "Shoulder Arms", "armas longas", "REF", "ranged"),

  s("bribery", "Bribery", "suborno", "COOL", "social"),
  s("conversation", "Conversation", "conversação", "EMP", "social", basic),
  s("humanPerception", "Human Perception", "percepção humana", "EMP", "social", basic),
  s("interrogation", "Interrogation", "interrogatório", "COOL", "social"),
  s("persuasion", "Persuasion", "persuasão", "COOL", "social", basic),
  s("personalGrooming", "Personal Grooming", "cuidados pessoais", "COOL", "social"),
  s("streetwise", "Streetwise", "malandragem", "COOL", "social"),
  s("trading", "Trading", "comércio", "COOL", "social"),
  s("wardrobeStyle", "Wardrobe & Style", "moda e estilo", "COOL", "social"),

  s("airVehicleTech", "Air Vehicle Tech", "mecânica de veículo aéreo", "TECH", "technique"),
  s("basicTech", "Basic Tech", "técnica básica", "TECH", "technique"),
  s("cybertech", "Cybertech", "cibertecnologia", "TECH", "technique"),
  s("demolitions", "Demolitions", "demolição", "TECH", "technique", x2),
  s("electronicsSecurityTech", "Electronics/Security Tech", "eletrônica/segurança", "TECH", "technique", x2),
  s("firstAid", "First Aid", "primeiros socorros", "TECH", "technique", basic),
  s("forgery", "Forgery", "falsificação", "TECH", "technique"),
  s("landVehicleTech", "Land Vehicle Tech", "mecânica de veículo terrestre", "TECH", "technique"),
  s("paintDrawSculpt", "Paint/Draw/Sculpt", "pintura/desenho/escultura", "TECH", "technique"),
  s("paramedic", "Paramedic", "paramédico", "TECH", "technique", x2),
  s("photographyFilm", "Photography/Film", "fotografia/cinema", "TECH", "technique"),
  s("pickLock", "Pick Lock", "arrombar fechadura", "TECH", "technique"),
  s("pickPocket", "Pick Pocket", "bater carteira", "TECH", "technique"),
  s("seaVehicleTech", "Sea Vehicle Tech", "mecânica de embarcação", "TECH", "technique"),
  s("weaponstech", "Weaponstech", "armeiro", "TECH", "technique"),
];

const BY_ID = new Map(SKILLS.map((d) => [d.id, d]));

export const skillDef = (id: string) => BY_ID.get(id);

export const MAX_SKILL_LEVEL = 10;

/** Stat ligada + nível: o que soma no 1d10 de um teste de perícia. */
export const skillBase = (stats: Stats, e: SkillEntry) => {
  const def = skillDef(e.skill);
  return (def ? stats[def.stat] : 0) + e.level;
};

/** Perícia sem especialização: uma entrada só, com o id da própria perícia. */
export function setSkillLevel(skills: SkillEntry[], skill: string, level: number): SkillEntry[] {
  const lvl = Math.max(0, Math.min(MAX_SKILL_LEVEL, level));
  const rest = skills.filter((e) => e.id !== skill);
  return lvl === 0 ? rest : [...rest, { id: skill, skill, spec: "", level: lvl }];
}

export const newSpecEntry = (skill: string): SkillEntry => ({
  id: `${skill}-${uid()}`,
  skill,
  spec: "",
  level: 0,
});

/* ---------- Streetrat: perícias prontas por role ---------- */

/** As 13 básicas, na ordem das tabelas do livro. */
const BASIC_ORDER = [
  "athletics",
  "brawling",
  "concentration",
  "conversation",
  "education",
  "evasion",
  "firstAid",
  "humanPerception",
  "language",
  "localExpert",
  "perception",
  "persuasion",
  "stealth",
] as const;

interface Template {
  /** Níveis das básicas, na ordem de BASIC_ORDER. */
  basic: number[];
  role: [skill: string, level: number][];
}

/** Tabelas "Streetrat Skills" do livro (cap. de criação, método #1). */
const STREETRAT: Record<Role, Template> = {
  Rockerboy: {
    basic: [2, 6, 2, 2, 2, 6, 6, 6, 2, 4, 2, 6, 2],
    role: [["composition", 6], ["handgun", 6], ["meleeWeapon", 6], ["personalGrooming", 4], ["playInstrument", 6], ["streetwise", 6], ["wardrobeStyle", 4]],
  },
  Solo: {
    basic: [2, 2, 2, 2, 2, 6, 6, 2, 2, 2, 6, 2, 2],
    role: [["autofire", 6], ["handgun", 6], ["interrogation", 6], ["meleeWeapon", 6], ["resistTortureDrugs", 6], ["shoulderArms", 6], ["tactics", 6]],
  },
  Netrunner: {
    basic: [2, 2, 2, 2, 6, 6, 2, 2, 2, 2, 2, 2, 6],
    role: [["basicTech", 6], ["concealRevealObject", 6], ["cryptography", 6], ["cybertech", 6], ["electronicsSecurityTech", 6], ["handgun", 6], ["librarySearch", 6]],
  },
  Tech: {
    basic: [2, 2, 2, 2, 6, 6, 6, 2, 2, 2, 2, 2, 2],
    role: [["basicTech", 6], ["cybertech", 6], ["electronicsSecurityTech", 6], ["landVehicleTech", 6], ["shoulderArms", 6], ["science", 6], ["weaponstech", 6]],
  },
  Medtech: {
    basic: [2, 2, 2, 6, 6, 6, 2, 6, 2, 2, 2, 2, 2],
    role: [["basicTech", 6], ["cybertech", 4], ["deduction", 6], ["paramedic", 6], ["resistTortureDrugs", 4], ["science", 6], ["shoulderArms", 6]],
  },
  Media: {
    basic: [2, 2, 2, 6, 2, 6, 2, 6, 2, 6, 6, 6, 2],
    role: [["bribery", 6], ["composition", 6], ["deduction", 6], ["handgun", 6], ["librarySearch", 4], ["lipReading", 4], ["photographyFilm", 4]],
  },
  Lawman: {
    basic: [2, 6, 2, 6, 2, 6, 2, 2, 2, 2, 2, 2, 2],
    role: [["autofire", 6], ["criminology", 6], ["deduction", 6], ["handgun", 6], ["interrogation", 6], ["shoulderArms", 6], ["tracking", 6]],
  },
  Exec: {
    basic: [2, 2, 2, 6, 6, 6, 2, 6, 2, 2, 2, 6, 2],
    role: [["accounting", 6], ["bureaucracy", 6], ["business", 6], ["deduction", 6], ["handgun", 6], ["lipReading", 6], ["personalGrooming", 4]],
  },
  Fixer: {
    basic: [2, 2, 2, 6, 2, 6, 2, 6, 4, 6, 2, 4, 2],
    role: [["bribery", 6], ["business", 6], ["forgery", 6], ["handgun", 6], ["pickLock", 4], ["streetwise", 6], ["trading", 6]],
  },
  Nomad: {
    basic: [2, 6, 2, 2, 2, 6, 6, 2, 2, 2, 4, 2, 6],
    role: [["animalHandling", 6], ["driveLandVehicle", 6], ["handgun", 6], ["meleeWeapon", 6], ["tracking", 6], ["trading", 6], ["wildernessSurvival", 6]],
  },
};

/** Nível no idioma da origem cultural (lifepath). */
export const ORIGIN_LANGUAGE_LEVEL = 4;

/**
 * Perícias do Streetrat pro role, mais o idioma da origem cultural.
 * Idioma começa em Streetslang; região, ciência e instrumento ficam pra preencher.
 */
export function streetratSkills(role: Role, originLanguage?: string): SkillEntry[] {
  const t = STREETRAT[role];
  const entry = (skill: string, level: number): SkillEntry => {
    if (skill === "language") return { id: "language-streetslang", skill, spec: "Streetslang", level };
    if (skill === "localExpert") return { id: "localExpert-home", skill, spec: "", level };
    if (skillDef(skill)?.spec) return { id: `${skill}-1`, skill, spec: "", level };
    return { id: skill, skill, spec: "", level };
  };
  return [
    ...BASIC_ORDER.map((skill, i) => entry(skill, t.basic[i])),
    ...t.role.map(([skill, level]) => entry(skill, level)),
    {
      id: "language-origin",
      skill: "language",
      spec: originLanguage?.trim() ?? "",
      level: ORIGIN_LANGUAGE_LEVEL,
    },
  ];
}
