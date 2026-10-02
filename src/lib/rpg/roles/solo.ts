import { pointsIn } from "../ability";
import type { RoleDef } from "../types";

export const solo: RoleDef = {
  role: "Solo",
  summary:
    "Guarda-costas, mercenário ou ex-soldado corporativo. Troca carne por cromo pra continuar sendo o melhor.",
  ability: {
    name: "Combat Awareness",
    namePt: "consciência de combate",
    summary: "Divide pontos iguais ao rank entre bônus de combate.",
    about: [
      "Quando o combate começa (antes de rolar iniciativa), a qualquer hora fora de combate ou gastando 1 ação durante o combate, o Solo divide os pontos de consciência de combate entre as opções abaixo. Se não mexer, a divisão anterior continua valendo. Algumas opções custam mais pontos que outras.",
      "No app, tudo já entra sozinho: reação de iniciativa na rolagem de iniciativa; ataque preciso e recuperar falha no botão atacar das armas; ponto fraco no dano; detectar ameaça na perícia Perception; desvio de dano no 1º dano que você leva no round, no combate.",
    ],
    alloc: {
      title: "pontos de combate",
      budget: (rank) => rank,
      options: [
        {
          id: "deflection",
          name: "desvio de dano",
          rule: "você aprendeu a rolar com o golpe: a cada 2 pts, −1 no 1º dano que você levar no round (até −5 com 10 pts)",
          step: 2,
          max: 10,
          effect: (p) => `−${p / 2} no 1º dano do round`,
        },
        {
          id: "fumble",
          name: "recuperar falha",
          rule: "4 pts: ignora falhas críticas (1) ao atacar. o dado ainda conta como 1",
          step: 4,
          max: 4,
          effect: () => "ignora falha crítica ao atacar",
        },
        {
          id: "initiative",
          name: "reação de iniciativa",
          rule: "reflexo treinado pro começo do tiroteio: +1 nas rolagens de iniciativa por ponto",
          effect: (p) => `+${p} iniciativa`,
        },
        {
          id: "precision",
          name: "ataque preciso",
          rule: "mira treinada: 3 pts dão +1 em todo ataque, 6 dão +2, 9 dão +3",
          step: 3,
          max: 9,
          effect: (p) => `+${p / 3} nos ataques`,
        },
        {
          id: "weakness",
          name: "ponto fraco",
          rule: "acha brecha até em alvo blindado: +1 de dano (antes da armadura) no 1º ataque que acertar no round, por ponto",
          effect: (p) => `+${p} dano no 1º acerto do round`,
        },
        {
          id: "threat",
          name: "detectar ameaça",
          rule: "consciência do ambiente: +1 nos testes de Perception por ponto",
          effect: (p) => `+${p} em Perception`,
        },
      ],
    },
    initiative: (_rank, state) => pointsIn(state, "initiative"),
    skillBonus: (_rank, state) => [
      { skill: "perception", value: pointsIn(state, "threat"), source: "detectar ameaça" },
    ],
    combat: (_rank, state) => ({
      attack: Math.floor(pointsIn(state, "precision") / 3),
      firstHitDamage: pointsIn(state, "weakness"),
      ignoreFumble: pointsIn(state, "fumble") >= 4,
      deflection: Math.floor(pointsIn(state, "deflection") / 2),
    }),
  },
};
