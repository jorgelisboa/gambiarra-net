import type { CyberCategory, CyberwareDef, HlDice, HostKind, InstallPlace } from "./types";

const cw = (
  id: string,
  name: string,
  namePt: string,
  category: CyberCategory,
  install: InstallPlace | null,
  cost: number,
  hl: number,
  hlDice: HlDice,
  fits: HostKind[],
  page: number,
  summary: string,
  extra: Partial<CyberwareDef> = {},
): CyberwareDef => ({ id, name, namePt, category, install, cost, hl, hlDice, fits, page, summary, ...extra });

/* atalhos pros grupos do livro */
const fashion = (id: string, name: string, namePt: string, cost: number, page: number, summary: string, extra: Partial<CyberwareDef> = {}) =>
  cw(id, name, namePt, "fashionware", "mall", cost, 0, "0", ["fashion"], page, summary, extra);

const neural = (id: string, name: string, namePt: string, hl: number, dice: HlDice, summary: string, extra: Partial<CyberwareDef> = {}) =>
  cw(id, name, namePt, "neuralware", "clinic", 500, hl, dice, ["neural"], 359, summary, extra);

const chip = (id: string, name: string, namePt: string, cost: number, hl: number, dice: HlDice, page: number, summary: string, extra: Partial<CyberwareDef> = {}) =>
  cw(id, name, namePt, "chipware", null, cost, hl, dice, ["socket"], page, summary, extra);

const eye = (
  id: string,
  name: string,
  namePt: string,
  install: InstallPlace,
  cost: number,
  hl: number,
  dice: HlDice,
  page: number,
  summary: string,
  extra: Partial<CyberwareDef> = {},
) => cw(id, name, namePt, "cyberoptics", install, cost, hl, dice, ["eye"], page, summary, extra);

const audio = (
  id: string,
  name: string,
  namePt: string,
  install: InstallPlace,
  cost: number,
  hl: number,
  dice: HlDice,
  page: number,
  summary: string,
  extra: Partial<CyberwareDef> = {},
) => cw(id, name, namePt, "cyberaudio", install, cost, hl, dice, ["audio"], page, summary, extra);

const internal = (
  id: string,
  name: string,
  namePt: string,
  install: InstallPlace,
  cost: number,
  hl: number,
  dice: HlDice,
  page: number,
  summary: string,
  extra: Partial<CyberwareDef> = {},
) => cw(id, name, namePt, "internal", install, cost, hl, dice, ["internal"], page, summary, extra);

const external = (id: string, name: string, namePt: string, install: InstallPlace, cost: number, hl: number, dice: HlDice, summary: string, extra: Partial<CyberwareDef> = {}) =>
  cw(id, name, namePt, "external", install, cost, hl, dice, ["external"], 364, summary, extra);

const limb = (
  id: string,
  name: string,
  namePt: string,
  install: InstallPlace,
  cost: number,
  hl: number,
  dice: HlDice,
  fits: HostKind[],
  page: number,
  summary: string,
  extra: Partial<CyberwareDef> = {},
) => cw(id, name, namePt, "cyberlimb", install, cost, hl, dice, fits, page, summary, extra);

const borg = (id: string, name: string, namePt: string, install: InstallPlace, cost: number, summary: string, extra: Partial<CyberwareDef> = {}) =>
  cw(id, name, namePt, "borgware", install, cost, 14, "4d6", ["body"], 367, summary, { unique: id, ...extra });

const plus2 = (when: string | undefined, ...skills: string[]) =>
  skills.map((skill) => (when ? { skill, value: 2, when } : { skill, value: 2 }));

/** O catálogo de cyberware do livro (Night Market, págs. 358-367). */
export const CYBERWARE: CyberwareDef[] = [
  /* ---------- fashionware: 7 slots, sem peça de base ---------- */
  fashion("biomonitor", "Biomonitor", "monitor de sinais vitais", 100, 358, "implante sob a pele que mostra pulso, temperatura, respiração e glicose. liga no agent."),
  fashion("chemskin", "Chemskin", "pele tingida", 100, 358, "pigmento na pele que muda a cor de vez. com techhair: +2 em Personal Grooming (uma vez só)."),
  fashion("empThreading", "EMP Threading", "fios anti-EMP", 10, 358, "linhas prateadas em circuito pelo corpo. dizem que protegem de EMP; não protegem. é moda."),
  fashion("lightTattoo", "Light Tattoo", "tatuagem de luz", 100, 358, "tatuagem colorida projetada sob a pele. com 3 ou mais: +2 em Wardrobe & Style (uma vez só)."),
  fashion("shiftTacts", "Shift Tacts", "lentes de cor", 100, 358, "lentes implantadas que mudam de cor. desliga quando quiser, sem ação."),
  fashion("skinwatch", "Skinwatch", "relógio de pele", 100, 359, "relógio de LED sob a pele com hora e data."),
  fashion("techhair", "Techhair", "cabelo de luz", 100, 359, "cabelo artificial que emite luz e cor. com chemskin: +2 em Personal Grooming (uma vez só)."),

  /* ---------- neuralware: neural link com 5 slots ---------- */
  cw("neuralLink", "Neural Link", "neural link", "neuralware", "clinic", 500, 7, "2d6", ["body"], 359, "sistema nervoso artificial. base do neuralware e do subdermal grip, com 5 slots.", {
    provides: { kind: "neural", slots: 5 },
    unique: "neuralLink",
    effects: { netrun: "neuralLink" },
  }),
  neural("braindanceRecorder", "Braindance Recorder", "gravador de braindance", 7, "2d6", "grava a tua experiência em braindance num memory chip ou no agent."),
  neural("chipwareSocket", "Chipware Socket", "soquete de chip", 7, "2d6", "soquete na nuca pra um chip. trocar o chip é uma ação, e o chip não ocupa slot do neural link.", {
    provides: { kind: "socket", slots: 1 },
  }),
  neural("interfacePlugs", "Interface Plugs", "interface plugs", 7, "2d6", "plugues no pulso ou na cabeça: smartgun, cyberdeck, máquina pesada e veículo sem usar as mãos.", {
    effects: { netrun: "plugs" },
  }),
  neural("kerenzikov", "Kerenzikov", "kerenzikov", 14, "4d6", "speedware sempre ligado: +2 na iniciativa. só um speedware por vez.", {
    unique: "speedware",
    effects: { initiative: 2 },
  }),
  neural("sandevistan", "Sandevistan", "sandevistan", 7, "2d6", "speedware: ligar é uma ação e dá +3 nas rolagens de iniciativa por 1 minuto. depois, 1 hora pra ligar de novo. só um speedware por vez.", {
    unique: "speedware",
    effects: { activeInitiative: 3 },
  }),

  /* ---------- chipware: vai num chipware socket ---------- */
  chip("chemicalAnalyzer", "Chemical Analyzer", "analisador químico", 500, 3, "1d6", 359, "testa uma substância numa ação e diz a composição exata."),
  chip("memoryChip", "Memory Chip", "memory chip", 10, 0, "0", 359, "chip de dados padrão: o teu cyberware guarda e lê dados nele."),
  chip("olfactoryBoost", "Olfactory Boost", "olfato turbinado", 100, 7, "2d6", 359, "olfato turbinado: dá pra rastrear pelo cheiro com Tracking."),
  chip("painEditor", "Pain Editor", "editor de dor", 1000, 14, "4d6", 360, "desliga a dor: ignora a penalidade de gravemente ferido.", {
    effects: { ignoreSerious: true },
  }),
  chip("skillChip", "Skill Chip", "chip de perícia", 500, 7, "2d6", 360, "a perícia do chip conta como nível 3, se a tua for menor. chip de perícia x2 custa 1.000eb."),
  chip("tactileBoost", "Tactile Boost", "tato turbinado", 100, 7, "2d6", 360, "com a mão numa superfície, sente movimento a até 20m. essa mão não faz mais nada."),

  /* ---------- cyberoptics: cybereye com 3 slots ---------- */
  cw("cybereye", "Cybereye", "olho cibernético", "cyberoptics", "clinic", 100, 7, "2d6", ["body"], 360, "olho artificial com 3 slots. algumas opções vão em par: uma em cada olho, com a HL de cada.", {
    provides: { kind: "eye", slots: 3 },
    max: { base: 2, plus: { ref: "multiOpticMount", add: 5 } },
  }),
  eye("antiDazzle", "Anti-Dazzle", "anti-ofuscamento", "mall", 100, 2, "1d6/2", 360, "imune a cegueira por clarão, como o de uma flashbang. vai em par.", { paired: true }),
  eye("chyron", "Chyron", "chyron", "mall", 100, 2, "1d6/2", 360, "projeta uma telinha no canto da visão com mensagens e vídeo do teu cyberware."),
  eye("colorShift", "Color Shift", "olho de cor", "mall", 100, 2, "1d6/2", 360, "muda a cor e o padrão do olho numa ação."),
  eye("eyeDartgun", "Dartgun", "lança-dardos no olho", "clinic", 500, 2, "1d6/2", 360, "lança-dardos de um tiro só, escondido no olho. ocupa os 3 slots.", {
    slots: 3,
    effects: { weapon: "dartgun" },
  }),
  eye("imageEnhance", "Image Enhance", "realce de imagem", "mall", 500, 3, "1d6", 360, "+2 em Perception, Lip Reading e Conceal/Reveal Object quando o teste envolve visão. vai em par.", {
    paired: true,
    effects: { skills: plus2("envolver visão", "perception", "lipReading", "concealRevealObject") },
  }),
  eye("lowLightIrUv", "Low Light/Infrared/UV", "visão noturna e térmica", "mall", 500, 3, "1d6", 360, "zera a penalidade de escuridão, fumaça e neblina e separa carne quente de metal frio. vai em par, 2 slots em cada olho.", {
    paired: true,
    slots: 2,
  }),
  eye("microOptics", "MicroOptics", "microscópio", "clinic", 100, 2, "1d6/2", 361, "microscópio no olho, até 400x."),
  eye("microVideo", "MicroVideo", "câmera no olho", "clinic", 500, 2, "1d6/2", 361, "câmera no olho que grava vídeo e áudio num memory chip ou no agent. ocupa 2 slots.", { slots: 2 }),
  eye("radiationDetector", "Radiation Detector", "detector de radiação", "clinic", 1000, 3, "1d6", 361, "mostra a radiação a até 100m como um brilho azul em cima da fonte."),
  eye("targetingScope", "Targeting Scope", "mira no olho", "clinic", 500, 3, "1d6", 361, "+1 no tiro mirado. outra cópia não soma."),
  eye("teleOptics", "TeleOptics", "teleobjetiva", "clinic", 500, 3, "1d6", 361, "enxerga detalhe a até 800m. +1 no tiro único ou mirado contra alvo a 51m ou mais. não soma com mira de sniper."),
  eye("virtuality", "Virtuality", "virtualidade no olho", "mall", 100, 2, "1d6/2", 361, "projeta o ciberespaço por cima da visão: os óculos de virtualidade sempre no rosto. vai em par.", {
    paired: true,
    effects: { netrun: "virtuality" },
  }),

  /* ---------- cyberaudio: suite com 3 slots ---------- */
  cw("cyberaudioSuite", "Cyberaudio Suite", "cyberaudio suite", "cyberaudio", "clinic", 500, 7, "2d6", ["body"], 361, "instalada dentro do crânio, sem aparecer. 3 slots (8 com sensor array). só uma.", {
    provides: { kind: "audio", slots: 3 },
    unique: "cyberaudioSuite",
  }),
  audio("amplifiedHearing", "Amplified Hearing", "audição amplificada", "mall", 100, 3, "1d6", 361, "+2 em Perception quando o teste envolve audição. outra cópia não soma.", {
    effects: { skills: plus2("envolver audição", "perception") },
  }),
  audio("audioRecorder", "Audio Recorder", "gravador de áudio", "clinic", 100, 2, "1d6/2", 361, "grava áudio num memory chip ou no agent."),
  audio("bugDetector", "Bug Detector", "detector de escuta", "mall", 100, 2, "1d6/2", 361, "apita quando você chega a até 2m de grampo ou escuta."),
  audio("homingTracer", "Homing Tracer", "rastreador", "clinic", 100, 2, "1d6/2", 361, "segue um rastreador a até 1 milha. vem com um do tamanho de um botão; reposição 50eb."),
  audio("internalAgent", "Internal Agent", "agent interno", "mall", 100, 3, "1d6", 362, "agent completo por comando de voz (imagem só com chyron ou numa tela). +2 em Library Search, e em Wardrobe & Style vestindo o que ele sugere.", {
    effects: { skills: [{ skill: "librarySearch", value: 2 }, ...plus2("vestir o que o agent sugere", "wardrobeStyle")] },
  }),
  audio("levelDamper", "Level Damper", "amortecedor de som", "mall", 100, 2, "1d6/2", 362, "imune a surdez por barulho, como o de uma flashbang."),
  audio("radioCommunicator", "Radio Communicator", "rádio", "mall", 100, 2, "1d6/2", 362, "rádio com alcance de 1 milha."),
  audio("radioScanner", "Radio Scanner/Music Player", "scanner de rádio", "clinic", 50, 2, "1d6/2", 362, "numa ação, varre as bandas de rádio em uso a 1 milha. toca música do data pool ou de um memory chip."),
  audio("radarDetector", "Radar Detector", "detector de radar", "clinic", 500, 2, "1d6/2", 362, "apita com radar ativo a até 100m."),
  audio("scrambler", "Scrambler/Descrambler", "embaralhador", "mall", 100, 2, "1d6/2", 362, "embaralha o que você transmite; o descrambler vem junto."),
  audio("voiceStressAnalyzer", "Voice Stress Analyzer", "analisador de voz", "mall", 100, 3, "1d6", 362, "+2 em Human Perception e Interrogation. numa ação liga o detector de mentira por 1 minuto (o mestre rola escondido e ele apita). outra cópia não soma.", {
    effects: { skills: plus2(undefined, "humanPerception", "interrogation") },
  }),

  /* ---------- internal body: 7 slots ---------- */
  internal("audioVox", "AudioVox", "sintetizador de voz", "clinic", 500, 3, "1d6", 362, "+2 em Acting, e em Play Instrument cantando. outra cópia não soma.", {
    effects: { skills: [{ skill: "acting", value: 2 }, ...plus2("cantar", "playInstrument")] },
  }),
  internal("contraceptiveImplant", "Contraceptive Implant", "implante contraceptivo", "mall", 10, 0, "0", 362, "evita gravidez indesejada."),
  internal("enhancedAntibodies", "Enhanced Antibodies", "anticorpos turbinados", "mall", 500, 2, "1d6/2", 362, "depois de estabilizado, cura o dobro do BODY por dia de descanso."),
  internal("cybersnake", "Cybersnake", "cybersnake", "hospital", 1000, 14, "4d6", 363, "tentáculo na garganta: arma branca muito pesada (4d6, ROF 1), escondida sem teste.", {
    effects: { weapon: "veryHeavyMelee" },
  }),
  internal("gills", "Gills", "guelras", "hospital", 1000, 7, "2d6", 363, "respira debaixo d'água."),
  internal("graftedMuscle", "Grafted Muscle and Bone Lace", "músculo enxertado", "hospital", 1000, 14, "4d6", 363, "BODY +2, até 10. muda o HP e o death save.", {
    effects: { body: { add: 2, max: 10 } },
  }),
  internal("independentAirSupply", "Independent Air Supply", "ar independente", "hospital", 1000, 2, "1d6/2", 363, "30 minutos de ar. recarrega em 1 hora no ar ambiente, ou troca o tanque (50eb) numa ação."),
  internal("midnightLady", "Midnight Lady Sexual Implant", "implante sexual", "clinic", 100, 7, "2d6", 363, "implante sexual."),
  internal("mrStudd", "Mr. Studd Sexual Implant", "implante sexual", "clinic", 100, 7, "2d6", 363, "implante sexual."),
  internal("nasalFilters", "Nasal Filters", "filtros nasais", "clinic", 100, 2, "1d6/2", 363, "imune a gás tóxico, fumaça e tudo que se respira. desliga quando quiser, sem ação."),
  internal("radarSonar", "Radar/Sonar Implant", "radar e sonar", "clinic", 1000, 7, "2d6", 363, "varre 50m em volta, debaixo d'água também, e avisa de cada coisa nova se mexendo. não vê atrás de cobertura."),
  internal("toxinBinders", "Toxin Binders", "ligantes de toxina", "clinic", 100, 2, "1d6/2", 363, "+2 em Resist Torture/Drugs. outra cópia não soma.", {
    effects: { skills: plus2(undefined, "resistTortureDrugs") },
  }),
  internal("vampyres", "Vampyres", "vampyres", "clinic", 500, 14, "4d6", 363, "presas: arma branca leve de qualidade excelente (1d6, ROF 2), escondida sem teste. guarda um frasco de veneno ou biotoxina no céu da boca.", {
    effects: { weapon: "lightMelee" },
  }),

  /* ---------- external body: 7 slots ---------- */
  external("hiddenHolster", "Hidden Holster", "coldre escondido", "clinic", 500, 7, "2d6", "coldre dentro do corpo pra uma arma que já dá pra esconder: escondida sem teste, e sacar não gasta ação."),
  external("skinWeave", "Skin Weave", "pele tecida", "hospital", 500, 7, "2d6", "SP7 na cabeça e no corpo. vale a maior SP do local e tudo abla junto. recupera 1 SP por dia de cura natural.", {
    effects: { armor: "skinWeave" },
  }),
  external("subdermalArmor", "Subdermal Armor", "armadura subdérmica", "hospital", 1000, 14, "4d6", "SP11 na cabeça e no corpo. vale a maior SP do local e tudo abla junto. recupera 1 SP por dia de cura natural.", {
    effects: { armor: "subdermalArmor" },
  }),
  external("subdermalPocket", "Subdermal Pocket", "bolso subdérmico", "clinic", 100, 3, "1d6", "bolso de 5×10cm sob a pele com zíper realskinn. esconde sem teste."),

  /* ---------- cyberlimbs: cyberarm (4 slots) e cyberleg (3 slots) ---------- */
  limb("cyberarm", "Cyberarm", "braço cibernético", "hospital", 500, 7, "2d6", ["body"], 364, "braço artificial com 4 slots. vem com mão padrão, que não ocupa slot. não precisa de par.", {
    provides: { kind: "arm", slots: 4 },
    max: { base: 2, plus: { ref: "artificialShoulderMount", add: 2 } },
  }),
  limb("standardHand", "Standard Hand", "mão padrão", "clinic", 100, 2, "1d6/2", ["meatArm"], 364, "mão cibernética comum. num braço de carne não conta como peça.", { slots: 0 }),
  limb("bigKnucks", "Big Knucks", "soco blindado", "clinic", 100, 3, "1d6", ["arm", "meatArm"], 364, "nós dos dedos blindados: arma branca média (2d6, ROF 2), escondida sem teste. pode ir sozinha num braço de carne.", {
    effects: { weapon: "mediumMelee" },
  }),
  limb("armCyberdeck", "Cyberdeck", "cyberdeck no braço", "clinic", 500, 3, "1d6", ["arm"], 364, "o teu cyberdeck dentro do braço, com +1 slot. o deck é teu, entregue na instalação. ainda pede neural link e interface plugs. ocupa 3 slots.", {
    slots: 3,
  }),
  limb("grappleHand", "Grapple Hand", "mão gancho", "clinic", 100, 3, "1d6", ["arm"], 365, "numa ação, dispara um gancho que prende em cobertura grossa a até 30m. aguenta 2× o teu peso."),
  limb("armMedscanner", "Medscanner", "medscanner no braço", "clinic", 500, 7, "2d6", ["arm"], 365, "+2 em First Aid e Paramedic. ocupa 2 slots. outra cópia não soma.", {
    slots: 2,
    effects: { skills: plus2(undefined, "firstAid", "paramedic") },
  }),
  limb("popupGrenadeLauncher", "Popup Grenade Launcher", "lança-granadas no braço", "clinic", 500, 7, "2d6", ["arm"], 365, "lança-granadas de uma mão com 1 granada no pente, escondido. sacar e guardar não gastam ação. ocupa 2 slots.", {
    slots: 2,
    effects: { weapon: "grenadeLauncher" },
  }),
  limb("popupMelee", "Popup Melee Weapon", "arma branca no braço", "clinic", 500, 7, "2d6", ["arm"], 365, "arma branca leve, média ou pesada no braço, escondida. sacar e guardar não gastam ação. ocupa 2 slots.", {
    slots: 2,
    effects: { weapon: "popupMelee" },
  }),
  limb("popupShield", "Popup Shield", "escudo no braço", "clinic", 500, 7, "2d6", ["arm"], 365, "escudo à prova de balas dobrado no braço. sacar e guardar não gastam ação enquanto ele tiver HP. ocupa 3 slots.", {
    slots: 3,
    effects: { shield: true },
  }),
  limb("popupRanged", "Popup Ranged Weapon", "arma de fogo no braço", "clinic", 500, 7, "2d6", ["arm"], 365, "uma arma de fogo de uma mão (tua) instalada no braço, escondida. sacar e guardar não gastam ação. ocupa 2 slots.", {
    slots: 2,
    effects: { weapon: "popupRanged" },
  }),
  limb("quickChangeMount", "Quick Change Mount", "encaixe rápido", "clinic", 100, 7, "2d6", ["arm"], 365, "tira ou põe o cyberarm numa ação. reencaixar um braço que já foi usado não perde humanidade."),
  limb("rippers", "Rippers", "rippers", "clinic", 500, 3, "1d6", ["arm", "meatArm"], 365, "unhas de carbovidro: arma branca média (2d6, ROF 2), escondida sem teste. pode ir sozinha num braço de carne.", {
    effects: { weapon: "mediumMelee" },
  }),
  limb("scratchers", "Scratchers", "scratchers", "mall", 100, 2, "1d6/2", ["arm", "meatArm"], 366, "unhas artificiais que cortam: arma branca leve (1d6, ROF 2), escondida sem teste. pode ir sozinha num braço de carne.", {
    effects: { weapon: "lightMelee" },
  }),
  limb("shoulderCam", "Shoulder Cam", "câmera no ombro", "clinic", 500, 7, "2d6", ["arm"], 366, "câmera que sai do ombro, mira sozinha e grava num memory chip ou no agent. ocupa 2 slots.", { slots: 2 }),
  limb("sliceNDice", "Slice 'N Dice", "slice 'n dice", "clinic", 500, 3, "1d6", ["arm", "meatArm"], 366, "chicote de monofilamento no polegar: arma branca média (2d6, ROF 2), escondida sem teste. pode ir sozinho num braço de carne.", {
    effects: { weapon: "mediumMelee" },
  }),
  limb("subdermalGrip", "Subdermal Grip", "placa de smartgun", "clinic", 100, 3, "1d6", ["arm", "meatArm"], 366, "placa na palma pra usar smartgun sem interface plugs. pede neural link e ocupa um slot dele. pode ir sozinha num braço de carne.", {
    requires: ["neuralLink"],
    alsoTakes: "neural",
  }),
  limb("techscannerArm", "Techscanner", "techscanner no braço", "clinic", 500, 7, "2d6", ["arm"], 366, "+2 em Basic Tech, Cybertech, Electronics/Security Tech, Weaponstech e nas Vehicle Tech. ocupa 2 slots. outra cópia não soma.", {
    slots: 2,
    effects: {
      skills: plus2(undefined, "basicTech", "cybertech", "landVehicleTech", "seaVehicleTech", "airVehicleTech", "electronicsSecurityTech", "weaponstech"),
    },
  }),
  limb("toolHand", "Tool Hand", "mão de ferramentas", "clinic", 100, 3, "1d6", ["arm", "meatArm"], 366, "dedos com chave de fenda, chave inglesa e furadeira: o techtool sempre na mão. pode ir sozinha num braço de carne."),
  limb("wolvers", "Wolvers", "wolvers", "clinic", 500, 7, "2d6", ["arm", "meatArm"], 366, "garras de carbovidro nos nós dos dedos: arma branca pesada (3d6, ROF 2), escondida sem teste. pode ir sozinha num braço de carne.", {
    effects: { weapon: "heavyMelee" },
  }),
  limb("cyberleg", "Cyberleg", "perna cibernética", "hospital", 100, 3, "1d6", ["body"], 366, "perna artificial com 3 slots. vem com pé padrão, que não ocupa slot. a maioria das opções vai em par.", {
    provides: { kind: "leg", slots: 3 },
    max: { base: 2 },
  }),
  limb("standardFoot", "Standard Foot", "pé padrão", "clinic", 100, 2, "1d6/2", ["meatLeg"], 366, "pé cibernético comum. numa perna de carne não conta como peça.", { slots: 0 }),
  limb("gripFoot", "Grip Foot", "pé aderente", "clinic", 500, 3, "1d6", ["leg"], 366, "sem penalidade de movimento escalando. vai em par.", { paired: true }),
  limb("jumpBooster", "Jump Booster", "impulso de salto", "clinic", 500, 3, "1d6", ["leg"], 366, "hidráulica nas pernas: sem penalidade de movimento pulando. vai em par, 2 slots em cada perna.", {
    paired: true,
    slots: 2,
  }),
  limb("skateFoot", "Skate Foot", "pé de patins", "clinic", 500, 3, "1d6", ["leg"], 366, "patins escondidos nos pés: +6m na ação de correr. vai em par.", { paired: true }),
  limb("talonFoot", "Talon Foot", "lâmina no pé", "clinic", 500, 3, "1d6", ["leg", "meatLeg"], 367, "lâmina no pé: arma branca leve, escondida sem teste. pode ir sozinha numa perna de carne.", {
    effects: { weapon: "lightMelee" },
  }),
  limb("webFoot", "Web Foot", "pé de pato", "clinic", 500, 3, "1d6", ["leg"], 367, "membrana entre os dedos: sem penalidade de movimento nadando. vai em par.", { paired: true }),
  limb("hardenedShielding", "Hardened Shielding", "blindagem", "clinic", 1000, 3, "1d6", ["arm", "leg"], 367, "o membro e as opções dele não caem com EMP nem com programa que não é black ICE."),
  limb("plasticCovering", "Plastic Covering", "capa plástica", "mall", 100, 0, "0", ["arm", "leg"], 367, "capa de plástico pro membro, em várias cores e padrões. não ocupa slot.", { slots: 0 }),
  limb("realskinnCovering", "Realskinn Covering", "capa realskinn", "mall", 500, 0, "0", ["arm", "leg"], 367, "pele artificial por cima do membro. não ocupa slot.", { slots: 0 }),
  limb("superchromeCovering", "Superchrome Covering", "capa superchrome", "mall", 1000, 0, "0", ["arm", "leg"], 367, "cromado brilhante: +2 em Wardrobe & Style (uma vez só). não ocupa slot.", {
    slots: 0,
    effects: { skills: plus2(undefined, "wardrobeStyle") },
  }),

  /* ---------- borgware: perde 4 de humanidade máxima em vez de 2 ---------- */
  borg("artificialShoulderMount", "Artificial Shoulder Mount", "ombro extra", "hospital", 1000, "mais 2 cyberarms embaixo do primeiro par (vendidos à parte)."),
  borg("linearFrameSigma", "Implanted Linear Frame Sigma", "linear frame σ", "hospital", 1000, "esqueleto reforçado: BODY vira 12, e muda o HP e o death save. pede BODY 6 e um grafted muscle.", {
    requires: ["graftedMuscle"],
    minBody: 6,
    unique: "linearFrame",
    effects: { body: { set: 12, max: 12 } },
  }),
  borg("linearFrameBeta", "Implanted Linear Frame Beta", "linear frame β", "hospital", 5000, "esqueleto muito reforçado: BODY vira 14, e muda o HP e o death save. pede BODY 8 e dois grafted muscle.", {
    requires: ["graftedMuscle"],
    requiresCount: 2,
    minBody: 8,
    unique: "linearFrame",
    effects: { body: { set: 14, max: 14 } },
  }),
  borg("multiOpticMount", "MultiOptic Mount", "suporte multióptico", "hospital", 1000, "mais 5 cybereyes (vendidos e instalados à parte)."),
  borg("sensorArray", "Sensor Array", "antenas", "clinic", 1000, "antenas na cabeça: +5 slots na cyberaudio suite. não ocupa slot dela.", {
    requires: ["cyberaudioSuite"],
  }),
];

const BY_ID = new Map(CYBERWARE.map((c) => [c.id, c]));

export const cyberDef = (id: string | null | undefined) => (id ? BY_ID.get(id) : undefined);

export const CYBER_CATEGORIES: { id: CyberCategory; label: string; base: string }[] = [
  { id: "fashionware", label: "fashionware", base: "7 slots, sem peça de base" },
  { id: "neuralware", label: "neuralware", base: "neural link: 5 slots" },
  { id: "chipware", label: "chipware", base: "um chip por chipware socket" },
  { id: "cyberoptics", label: "cyberoptics", base: "cybereye: 3 slots cada" },
  { id: "cyberaudio", label: "cyberaudio", base: "cyberaudio suite: 3 slots" },
  { id: "internal", label: "corpo · interno", base: "7 slots, sem peça de base" },
  { id: "external", label: "corpo · externo", base: "7 slots, sem peça de base" },
  { id: "cyberlimb", label: "cyberlimbs", base: "cyberarm: 4 slots · cyberleg: 3 slots" },
  { id: "borgware", label: "borgware", base: "substitui boa parte do corpo" },
];
