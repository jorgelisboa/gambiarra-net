import type { FireMode } from "../../lib/rpg/attack";
import type { AmmoType } from "../../lib/rpg/gear/types";
import type { WeaponCategory } from "../../lib/rpg/gear/categories";

const canDodge = "quem tem REF 8+ pode esquivar";

/** Armas: cartão da arma, modos de ataque, pente, munição e os textos das rolagens de ataque. */
export const weapons = {
  /** Nome curto do modo de ataque (seletor de modo): arma de fogo (ranged) e arma branca (melee). */
  modes: {
    single: { ranged: "tiro", melee: "golpe" },
    double: { ranged: "2 tiros", melee: "2 golpes" },
    aimed: { ranged: "mirado", melee: "mirado" },
    autofire: { ranged: "rajada", melee: "rajada" },
    suppressive: { ranged: "supressão", melee: "supressão" },
    shell: { ranged: "cartucho", melee: "cartucho" },
  } satisfies Record<FireMode, { ranged: string; melee: string }>,

  /** Texto do botão principal por modo (a arma branca troca "atacar" por "golpear"). */
  actions: {
    single: { ranged: "atacar", melee: "golpear" },
    double: { ranged: "2 ataques", melee: "2 golpes" },
    aimed: { ranged: "atirar mirado", melee: "golpe mirado" },
    autofire: { ranged: "rajada", melee: "rajada" },
    suppressive: { ranged: "supressão", melee: "supressão" },
    shell: { ranged: "disparar cartucho", melee: "disparar cartucho" },
  } satisfies Record<FireMode, { ranged: string; melee: string }>,

  /** Categoria da arma (desenho na ficha e linha da tabela de DV). */
  categories: {
    lightMelee: "arma branca leve",
    mediumMelee: "arma branca média",
    heavyMelee: "arma branca pesada",
    veryHeavyMelee: "arma branca muito pesada",
    claws: "garras implantadas",
    mediumPistol: "pistola média",
    heavyPistol: "pistola pesada",
    veryHeavyPistol: "pistola muito pesada",
    smg: "submetralhadora",
    heavySmg: "submetralhadora pesada",
    shotgun: "escopeta",
    assaultRifle: "fuzil de assalto",
    sniperRifle: "rifle de precisão",
    bow: "arco e besta",
    grenadeLauncher: "lança-granadas",
    rocketLauncher: "lança-foguetes",
  } satisfies Record<WeaponCategory, string>,

  /** Tipo de munição que a arma usa (o "tipo" embaixo do pente na tabela do livro). */
  ammoTypes: {
    mPistol: "pistola média",
    hPistol: "pistola pesada",
    vhPistol: "pistola muito pesada",
    slug: "balote",
    rifle: "rifle",
    shell: "cartucho",
    arrow: "flecha",
    grenade: "granada",
    rocket: "foguete",
  } satisfies Record<AmmoType, string>,

  /** Faixas de distância das tabelas de DV (as 5 primeiras são as do autofire). */
  ranges: {
    bands: ["0–6 m", "7–12 m", "13–25 m", "26–50 m", "51–100 m", "101–200 m", "201–400 m", "401–800 m"],
    /** Opção do seletor de distância: "13–25 m · DV15". */
    option: (band: string, dv: number | null) => (dv === null ? `${band} · fora do alcance` : `${band} · DV${dv}`),
    none: "sem distância · o mestre diz a DV",
  },

  /** Tiro mirado: onde acertar e o que isso faz. */
  aim: {
    targets: {
      head: { label: "cabeça", effect: "o dano que passa da armadura da cabeça dobra" },
      hand: {
        label: "item na mão",
        effect: "se 1 ponto passar da armadura do corpo, o alvo larga um item da mão (à tua escolha), que cai na frente dele",
      },
      leg: {
        label: "perna",
        effect: "se 1 ponto passar da armadura do corpo, o alvo também sofre o ferimento crítico perna quebrada (se tiver perna inteira)",
      },
    },
    off: "sem mirar",
    option: (target: string, penalty: string) => `mirar: ${target} (${penalty})`,
  },

  /** Por que não dá pra atacar (lib/rpg/attack.ts). */
  blocked: {
    notWeapon: "não é arma",
    /** `body` já vem formatado ("BODY 11"). */
    needBody: (body: string) => `precisa de ${body}+ pra disparar`,
    needShell: "carregue cartucho de escopeta pra esse modo",
    noMode: "essa arma não tem esse modo",
    noArrow: "sem flecha no bolso",
    needRounds: (n: number) => `precisa de ${n} balas no pente`,
    noRound: "sem bala",
    autofireRange: "rajada só até 100m",
  },

  /** Textos das rolagens de ataque e dano (lib/rpg/attack.ts). */
  roll: {
    /** Rótulo curto da rolagem (dock e resultado). */
    labels: {
      attack: "ataque",
      nth: (n: number) => `${n}º ataque`,
      aimedRanged: "tiro mirado",
      aimedMelee: "golpe mirado",
      autofire: "rajada",
      autofireDamage: "dano da rajada",
      suppressive: "fogo de supressão",
      shell: "cartucho",
      shellDamage: "dano do cartucho",
    },
    /** Começo da conta no texto da rolagem. */
    formulaNames: { attack: "ataque", autofire: "rajada", suppressive: "supressão", shell: "cartucho" },
    /** "ataque: pistola 4 + REF 8 + 1d10". */
    formula: (name: string, parts: string[]) => `${name}: ${parts.join(" + ")} + 1d10`,
    precise: (n: number) => `ataque preciso ${n}`,
    wound: (n: number) => `ferimento ${n}`,
    fumbleIgnored: "falha crítica ignorada (recuperar falha)",
    critical: (n: number) => `ferimento crítico! +${n} direto no HP`,
    /** A defesa do alvo: `skill` é o nome da perícia Evasão. */
    dodgeCheck: (skill: string) => `DEX + ${skill} + 1d10`,
    dodge: (check: string) => `se o alvo tiver REF 8+, ele pode esquivar (${check}) no lugar da DV`,
    canDodge,
    meleeDefense: (check: string) => `o alvo se defende com ${check}`,
    outOfRange: (band: string) => `fora do alcance (${band})`,
    versus: (dv: number, band: string, hit: boolean) => `contra DV${dv} (${band}): ${hit ? "acertou" : "errou"}`,
    shellVersus: (dv: number, hit: boolean) => `contra DV${dv}: ${hit ? "acertou" : "errou"}`,
    hit: "acertou",
    miss: "errou",
    doubleNote: "ROF 2: dá pra dividir os dois ataques no movimento",
    aimedNote: (target: string, penalty: string, effect: string) => `mirado (${target}) ${penalty}: ${effect}`,
    autofireMiss: (dv: number, band: string) => `errou: precisava passar de ${dv} (${band})`,
    autofireHit: (dv: number, band: string, by: number) => `contra DV${dv} (${band}): acertou por ${by}`,
    autofireDamage: (times: number, by: number, max: number) => `2d6 × ${times} (passou por ${by}, máximo ×${max})`,
    /** `skill` é o nome da perícia Concentração. */
    suppressive: (skill: string, total: number) =>
      `todo mundo a pé a até 25m, fora de cobertura e na tua linha de visão rola WILL + ${skill} + 1d10 contra ${total}. quem não passar gasta o próximo movimento pra se proteger (e corre, se precisar).`,
    shellDamage: (damage: string) => `${damage} em todo alvo à frente a até 6m que você vê, rolado uma vez. a armadura reduz. ${canDodge}.`,
    explosive: `explosivo: área de 10×10m em volta do alvo, dano rolado uma vez pra todos; se errar, o mestre decide onde caiu. ${canDodge}.`,
    grenade: (name: string) => `granada: ${name} (efeito na pág. 344)`,
    basicArrow: "flecha básica dá pra recolher depois",
    spentArrows: (n: number, name: string) => `gastou ${n} ${name}`,
    magazine: (loaded: number, size: number) => `pente ${loaded}/${size}`,
  },

  /** Rolagem de dano (weaponDamage). */
  damage: {
    value: (damage: string) => `dano ${damage}`,
    noFixed: "sem dano fixo: veja a regra da arma",
    weakPoint: (bonus: number, total: number) => `se for o 1º acerto da rodada: +${bonus} ponto fraco = ${total}`,
    aimed: (target: string, effect: string) => `mirado (${target}): ${effect}`,
    area: "rolado uma vez pra todos na área",
  },

  /** Pente e recarga (ficha e cartão da arma). */
  magazine: {
    count: (loaded: number, size: number) => `${loaded}/${size}`,
    label: "pente",
    aria: (loaded: number, size: number) => `pente: ${loaded} de ${size} balas`,
    spends: (n: number) => `este modo gasta ${n}`,
    ammoOf: (weapon: string) => `munição do pente de ${weapon}`,
    noAmmo: "sem munição no bolso",
    reload: "recarregar",
    swap: "trocar munição",
    /** `action` é "recarregar" ou "trocar munição". */
    reloadAria: (action: string, weapon: string) => `${action} de ${weapon}`,
    note: "1 ação · não mistura munição no pente; o que sobra volta pro bolso",
  },

  /** Arma na aba equipamento (WeaponCard). */
  card: {
    precise: (n: number) => `preciso ${n}`,
    noSkill: "sem a perícia",
    ammoToReload: "munição pra recarregar",
    /** `types` já vem junto: "pistola pesada ou rifle". */
    noAmmo: (types: string) => `sem munição de ${types} no inventário`,
    aimedHint: (penalty: string) => `tiro mirado: ${penalty}, ataque único, gasta a ação inteira`,
    doubleHint: (rounds: number) => `ROF 2: dois ataques rolados separados, ${rounds} balas`,
    shotRange: "distância do tiro",
    shotRangeHint: "com distância o ataque já diz se acertou; sem, o mestre decide a DV",
    autofireRange: "distância da rajada",
    autofireButton: (max: number) => `rajada ×${max}`,
    autofireHint: (rounds: number, skill: string, max: number) => `1 ação e ${rounds} balas · perícia ${skill} · até ×${max}`,
    suppressiveHint: (rounds: number, skill: string, concentration: string) =>
      `1 ação e ${rounds} balas · REF + ${skill} vira a DV de quem está exposto a até 25m (WILL + ${concentration})`,
    nickname: "marca / apelido",
    nameOf: (weapon: string) => `nome de ${weapon}`,
  },

  /** Armas na ficha (WeaponsPanel). */
  panel: {
    title: "armas",
    empty: "sem armas no inventário.",
    gearLink: "loja e apelido da arma: aba equipamento",
    implant: "implante",
    seeBook: "ver livro",
    explosive: "explosivo",
    rof: "ROF",
    rofAria: (n: number) => `ROF ${n}`,
    modeGroup: (weapon: string) => `modo de ataque de ${weapon}`,
    shotRange: (weapon: string) => `distância do tiro de ${weapon}`,
    autofireRange: (weapon: string) => `distância da rajada de ${weapon}`,
    aimGroup: (weapon: string) => `onde mirar com ${weapon}`,
    autofireInfo: (rounds: number, max: number) => `${rounds} balas · 2d6 × quanto passar da DV, até ×${max}`,
    suppressiveInfo: (rounds: number) => `${rounds} balas · quem estiver exposto a até 25m rola contra você`,
    aimedSpends: "gasta a ação inteira",
    shellInfo: (dv: number, damage: string) => `contra DV${dv} · ${damage} em todo alvo à frente a até 6m`,
    actionWith: (action: string, weapon: string) => `${action} com ${weapon}`,
    damageOf: (weapon: string) => `dano de ${weapon}`,
    arrows: "flechas no bolso:",
  },
} as const;
