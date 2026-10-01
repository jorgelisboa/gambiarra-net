import type { RoleDef } from "../types";

export const nomad: RoleDef = {
  role: "Nomad",
  summary:
    "Da família na estrada. Leva carga e gente entre as zonas seguras com veículo, arma e um clã inteiro atrás.",
  ability: {
    name: "Moto",
    namePt: "moto",
    summary:
      "Pilota qualquer veículo. A cada rank, a família libera um veículo novo ou uma melhoria.",
    passives: (rank) => [
      `+${rank} em dirigir, pilotar e tech de veículos`,
      rank >= 10 ? "vários veículos da família ao mesmo tempo" : "1 veículo da família em uso por vez",
    ],
    lists: [
      {
        id: "motorpool",
        title: "motorpool da família",
        max: (rank) => rank,
        tags: ["veículo", "melhoria"],
        placeholder: "ex.: roadbike / vidro à prova de bala",
      },
    ],
    tables: [
      {
        title: "veículos liberados (do teu rank ou abaixo)",
        cumulative: true,
        tiers: [
          { from: 1, to: 4, lines: ["Compact Groundcar, Gyrocopter, Jetski, Roadbike"] },
          { from: 5, to: 6, lines: ["Helicopter, High Performance Groundcar, Speedboat"] },
          { from: 7, to: 8, lines: ["AV-4, Cabin Cruiser, Superbike"] },
          { from: 9, to: 10, lines: ["Aerozep, AV-9, Super Groundcar, Yacht"] },
        ],
      },
    ],
    notes: ["melhorias também têm rank: só as do teu rank ou abaixo."],
  },
};
