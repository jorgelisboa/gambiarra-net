import type { RoleDef } from "../types";

/** Perícias em que o rank de moto soma. */
export const VEHICLE_SKILLS = [
  "driveLandVehicle",
  "pilotAirVehicle",
  "pilotSeaVehicle",
  "airVehicleTech",
  "landVehicleTech",
  "seaVehicleTech",
];

export const nomad: RoleDef = {
  role: "Nomad",
  summary:
    "Da família na estrada. Leva carga e gente entre as zonas seguras com veículo, arma e um clã inteiro atrás.",
  ability: {
    name: "Moto",
    namePt: "moto",
    summary: "Pilota qualquer veículo. A cada rank, a família libera um veículo novo ou uma melhoria.",
    about: [
      "A diferença entre a maioria das pessoas e os Nomads é que Nomads têm carros melhores.",
      "Familiaridade com veículos: a vida inteira no volante e debaixo do capô. O Nomad soma o rank de moto em todo teste de Drive Land Vehicle, Pilot Air Vehicle, Pilot Sea Vehicle, Air Vehicle Tech, Land Vehicle Tech e Sea Vehicle Tech (no app já entra na aba perícias).",
      "Motorpool da família: a cada rank que sobe, escolhe entre pôr na lista um veículo de série do teu rank ou abaixo, ou dar a um veículo da família que você já pode usar uma melhoria do teu rank ou abaixo.",
      "Só 1 veículo da família na rua por vez. Dá pra pedir à família a troca por outro da tua lista; com a família por perto, ele chega na manhã seguinte. Destruído, a família conserta tudo em uma semana e você paga 500eb (até chefes de família pagam, por honra; se estiver sem grana, perdoam, mas a reputação sofre). Conserto do dia a dia, tipo tirar bala da lataria, é contigo.",
      "No rank 10 você vira liderança da família: pode ter todos os veículos na rua ao mesmo tempo, compra veículos novos a preço de mercado e melhorias a 1.000eb cada.",
      "Melhorias valem 1 vez por veículo, salvo quando dito. Raramente estão à venda: as de rank 1 custam muito caro, as outras, luxo.",
    ],
    passives: (rank) => [
      `+${rank} em dirigir, pilotar e tech de veículos`,
      rank >= 10 ? "todos os veículos da família na rua" : "1 veículo da família na rua por vez",
    ],
    skillBonus: (rank) => VEHICLE_SKILLS.map((skill) => ({ skill, value: rank, source: "moto" })),
    lists: [
      {
        id: "motorpool",
        title: "motorpool da família",
        max: (rank) => rank,
        tags: ["veículo", "melhoria"],
        placeholder: "ex.: roadbike / vidro à prova de bala na roadbike",
      },
    ],
    tables: [
      {
        title: "veículos de série (do teu rank ou abaixo)",
        cumulative: true,
        tiers: [
          { from: 1, to: 4, lines: ["Compact Groundcar, Gyrocopter, Jetski, Roadbike"] },
          { from: 5, to: 6, lines: ["Helicopter, High Performance Groundcar, Speedboat"] },
          { from: 7, to: 8, lines: ["AV-4, Cabin Cruiser, Superbike"] },
          { from: 9, to: 10, lines: ["Aerozep, AV-9, Super Groundcar, Yacht"] },
        ],
      },
    ],
    refs: [
      {
        title: "melhorias (todos os veículos)",
        head: ["rank"],
        rows: [
          ["Armored Chassis", "5", "blinda o veículo com SP13 (não vale pros vidros)"],
          ["Bulletproof Glass", "1", "os vidros viram cobertura: vidro fino à prova de bala (15 HP); de novo, vidro grosso (30 HP). cada janela leva dano separado"],
          ["Communications Center", "1", "console touchscreen com Agent embutido e tecnologia removível: 6 Radio Communicators, 6 Scrambler/Descramblers, Radio Scanner/Music Player, Homing Tracer com 6 rastreadores do tamanho de botão e Audio Recorder"],
          ["NOS", "1", "dirigindo, usa a ação pra uma ação de movimento a mais. cada tanque, 1 vez por dia; cada melhoria a mais é mais um tanque. se recarrega sozinho"],
          ["Onboard Flamethrower", "1", "lança-chamas montado na frente, no lado ou atrás; o motorista dispara com a ação. não recarrega dirigindo, não sai e não aceita acessório. pode ter vários"],
          ["Onboard Machine gun", "1", "fuzil de assalto de 30 balas, só autofire, montado de frente; o motorista dispara com a ação. não recarrega dirigindo, não sai e não aceita acessório. pode ter vários"],
          ["Seating Upgrade", "1", "+2 lugares (pode ser um sidecar fechado). os assentos podem ser ejetáveis, 10m pra cima por um alçapão (pá de helicóptero no caminho = golpe de arma branca muito pesada). vários, menos em moto, jetski e gyrocopter"],
          ["Security Upgrade", "5", "trancas por DNA ou outra biometria; sem a chave, DV17 Electronics/Security Tech. chave errada ou falha a 2m do veículo: leva como um golpe de stun baton no corpo. camuflagem: parado, só Perception DV17 acha (1 minuto pra ligar)"],
          ["Smuggling Upgrade", "1", "2 coldres escondidos (motorista e passageiro) e um compartimento grande escondido; achar exige DV17 Conceal/Reveal Object. vários, menos em moto, jetski e gyrocopter"],
        ],
      },
    ],
  },
};
