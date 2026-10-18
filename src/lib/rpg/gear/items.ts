import type { GearDef } from "./types";

const g = (id: string, name: string, namePt: string, cost: number, desc: string): GearDef => ({
  id,
  kind: "gear",
  name,
  namePt,
  cost,
  desc,
});

/** Equipamento (gear list do livro). Lista completa e detalhes na pág. 352. */
export const ITEMS: GearDef[] = [
  g("agent", "Agent", "agente", 100, "smartphone com IA que se adapta a você. +2 em pesquisa; +2 em moda e estilo em alguns casos (pág. 352)."),
  g("airhypo", "Airhypo", "injetor hipodérmico", 50, "aplica drogas com facilidade."),
  g("antiSmogMask", "Anti-Smog Breathing Mask", "máscara anti-smog", 20, "filtra toxinas do ar."),
  g("audioRecorder", "Audio Recorder", "gravador de áudio", 100, "grava 24h de som num chip de memória."),
  g("earProtectors", "Auto Level Dampening Ear Protectors", "protetor auricular", 1000, "deixa imune a efeitos de som muito alto."),
  g("binoculars", "Binoculars", "binóculo", 50, "aumento de 2x ou 3x."),
  g("braindanceViewer", "Braindance Viewer", "visor de braindance", 1000, "pra assistir braindance."),
  g("bugDetector", "Bug Detector", "detector de escuta", 500, "apita a até 2m de uma escuta."),
  g("carryall", "Carryall", "bolsa", 20, "bolsa pra carregar coisas."),
  g("chemicalAnalyzer", "Chemical Analyzer", "analisador químico", 1000, "compara uma substância com um banco de amostras."),
  g("computer", "Computer", "computador", 50, "notebook ou desktop."),
  g("disposablePhone", "Disposable Cell Phone", "celular descartável", 50, "faz ligações. fácil de jogar fora."),
  g("drumSynth", "Drum Synthesizer", "bateria eletrônica", 500, "simula quase qualquer bateria. precisa de amp."),
  g("ductTape", "Duct Tape", "silver tape", 20, "várias cores, inclusive uma que brilha no escuro."),
  g("instrument", "Electric Guitar/Other Instrument", "guitarra ou outro instrumento", 500, "pra tocar. os elétricos precisam de amp."),
  g("flashlight", "Flashlight", "lanterna", 20, "facho de 100m, 10h de bateria."),
  g("foodStick", "Food Stick", "barra de comida", 10, "uma refeição horrível em barra."),
  g("glowPaint", "Glow Paint", "tinta neon", 20, "spray que brilha no escuro."),
  g("glowStick", "Glow Stick", "bastão de luz", 10, "ilumina 4m por 10h."),
  g("grappleGun", "Grapple Gun", "arpão de escalada", 100, "dispara um cabo de até 30m. não serve de arma."),
  g("handcuffs", "Handcuffs", "algema", 50, "precisa de BODY acima de 10 pra quebrar."),
  g("homingTracer", "Homing Tracer", "rastreador", 500, "segue um rastreador ligado a até 1 milha."),
  g("inflatableBed", "Inflatable Bed & Sleep-bag", "colchão inflável e saco de dormir", 20, "colchão que se infla sozinho, com saco de dormir."),
  g("kibblePack", "Kibble Pack", "pacote de kibble", 10, "uma refeição de kibble."),
  g("lockPickingSet", "Lock Picking Set", "kit de arrombamento", 20, "abre fechaduras mecânicas."),
  g("medscanner", "Medscanner", "escâner médico", 1000, "ajuda a diagnosticar doença e ferimento. +2 em primeiros socorros e paramédico."),
  g("medtechBag", "Medtech Bag", "bolsa de medtech", 100, "kit médico completo numa bolsa."),
  g("memoryChip", "Memory Chip", "chip de memória", 10, "armazenamento de dados padrão."),
  g("mre", "MRE", "ração MRE", 10, "refeição que se aquece sozinha."),
  g("carePak", "Personal CarePak", "kit de higiene", 20, "tudo pra se limpar."),
  g("pocketAmp", "Pocket Amplifier", "amplificador de bolso", 50, "aguenta até dois instrumentos. 6h por carga."),
  g("radarDetector", "Radar Detector", "detector de radar", 500, "apita a até 100m de um radar ativo."),
  g("radiationSuit", "Radiation Suit", "roupa antirradiação", 1000, "protege de radiação."),
  g("radioCommunicator", "Radio Communicator", "comunicador de rádio", 100, "ponto no ouvido, alcance de 1 milha."),
  g("radioScanner", "Radio Scanner/Music Player", "rádio scanner / tocador", 50, "música e rádio num raio de 1 milha."),
  g("roadFlare", "Road Flare", "sinalizador", 10, "ilumina 100m por 1 hora."),
  g("rope", "Rope (60m/yd)", "corda (60m)", 20, "corda de náilon."),
  g("scrambler", "Scrambler/Descrambler", "embaralhador", 500, "embaralha e desembaralha comunicações."),
  g("smartGlasses", "Smart Glasses", "óculos inteligentes", 500, "óculos com 2 slots de opção de olho cibernético."),
  g("techBag", "Tech Bag", "bolsa de tech", 500, "bolsa pequena de ferramentas."),
  g("techscanner", "Techscanner", "escâner técnico", 1000, "ajuda a diagnosticar tecnologia. +2 em várias perícias de TECH."),
  g("techtool", "Techtool", "multiferramenta", 100, "uma ferramenta que faz tudo."),
  g("tent", "Tent and Camping Equipment", "barraca e camping", 50, "acampamento pra uma pessoa."),
  g("biotoxin", "Vial of Biotoxin", "frasco de biotoxina", 500, "3d6 de dano. teste de resistir a tortura/drogas. armadura não protege."),
  g("poison", "Vial of Poison", "frasco de veneno", 100, "2d6 de dano. teste de resistir a tortura/drogas. armadura não protege."),
  g("videoCamera", "Video Camera", "câmera de vídeo", 100, "grava 12h de áudio e vídeo num chip de memória."),
  g("virtualityGoggles", "Virtuality Goggles", "óculos de virtualidade", 100, "projeta o ciberespaço por cima do que você vê: você enxerga o ICE e não tropeça no mundo real (pág. 196)."),
];

/** Programas de netrunning que vêm no kit do Netrunner. Regras no capítulo da net. */
/** Programas do livro: [nome do livro, nome em pt-BR]. O id sai do nome do livro: não mude. */
const PROGRAM_NAMES: [string, string][] = [
  ["Armor", "armadura"],
  ["Sword", "espada"],
  ["See Ya", "até mais"],
  ["Eraser", "apagador"],
  ["Vrizzbolt", "vrizzbolt"],
  ["Worm", "verme"],
];

export const PROGRAMS: GearDef[] = PROGRAM_NAMES.map(([name, pt]) => ({
  id: `program-${name.toLowerCase().replace(/\s/g, "")}`,
  kind: "program",
  name: `Program: ${name}`,
  namePt: `programa ${pt}`,
  desc: "programa de netrunning. regras no capítulo da net.",
  cost: null,
}));
