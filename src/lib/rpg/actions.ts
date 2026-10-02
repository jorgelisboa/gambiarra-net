/** Ações de combate (tabela "Combat Actions in Brief"), resumidas em pt-BR. */
export const COMBAT_ACTIONS: [name: string, en: string, desc: string][] = [
  ["movimento", "Move Action", "anda até MOVE × 2 m/yd no turno (ou MOVE quadrados no grid, diagonal vale; não dá pra parar no meio de um quadrado)."],
  ["atacar", "Attack", "um ataque corpo a corpo ou à distância."],
  ["estrangular", "Choke", "estrangula quem você está agarrando."],
  ["pegar/largar escudo", "Equip/Drop Shield", "pegar ou largar um escudo gasta a ação."],
  ["entrar no veículo", "Get into a Vehicle", "entra num veículo."],
  ["levantar", "Get Up", "levanta do chão. caído, você não usa a ação de movimento até levantar."],
  ["agarrar", "Grab", "agarra e segura alguém, ou tira um objeto da mão dele."],
  ["segurar a ação", "Hold Action", "guarda a ação pra depois na fila: diga o gatilho (um evento ou um número da iniciativa), a ação e o alvo."],
  ["escudo humano", "Human Shield", "usa quem você agarrou como escudo."],
  ["recarregar", "Reload", "recarrega a arma e troca o pente, com um tipo de munição só."],
  ["correr", "Run", "uma ação de movimento a mais, só se você já usou a ação de movimento no turno."],
  ["ligar o veículo", "Start a Vehicle", "liga o veículo: ganha o MOVE dele e pula pro topo da fila de iniciativa."],
  ["estabilizar", "Stabilize", "estabiliza alguém pra começar a cura natural ou tirar do mortalmente ferido."],
  ["arremessar", "Throw", "joga no chão quem você agarrou, ou arremessa um objeto."],
  ["ações de net", "Use NET Actions", "faz as ações de net dentro da NET."],
  ["usar objeto", "Use an Object", "mexe num objeto sem precisar de perícia. sacar arma de fácil acesso ou largar arma (não escudo) no chão não gasta ação; guardar a arma no corpo gasta."],
  ["usar perícia", "Use a Skill", "usa uma perícia numa tarefa rápida. tarefa longa leva várias ações em vários turnos, e só se rola quando o tempo todo foi pago (em blocos de 3 segundos)."],
  ["manobra", "Vehicle Maneuver", "dirigindo, gasta a ação numa manobra perigosa."],
];

/** Regras de turno e de ataque que valem pra todo mundo. */
export const COMBAT_RULES: [title: string, text: string][] = [
  ["turno", "cada turno dura uns 3 segundos, e um round inteiro também (as ações acontecem quase ao mesmo tempo). no teu turno: 1 ação de movimento + 1 ação."],
  ["iniciativa", "REF + 1d10, em ordem decrescente. empate: rolam de novo até alguém ganhar. chegou no fim da fila, começa um round novo do topo."],
  ["dividir", "dá pra fazer a ação no meio do movimento e continuar andando depois. ataques de ROF 2 também se dividem (anda, atira, anda, atira), e dá até pra dar um ataque com cada uma de duas armas de ROF 2. ataque de ROF 1 gasta a ação de ataque inteira, mas dá pra andar antes e depois."],
  ["limite", "nunca mais que 2 testes de ataque numa ação, com quantas armas for. duas armas de ROF 1 não atacam na mesma ação, nem empunhando as duas."],
  ["outros movimentos", "nadar, escalar e pular com impulso custam 2 m/yd por metro (ou 2 quadrados por 1). pulo parado: metade da distância."],
  ["tiro mirado", "no máximo ROF 1: gasta a ação inteira e dá −8 no teste. cabeça: o dano que passa da armadura dobra. item na mão: se passar 1 ponto da armadura do corpo, o alvo larga um item à tua escolha. perna: se passar 1 ponto da armadura do corpo, o alvo sofre o ferimento crítico perna quebrada."],
  ["sacar e guardar", "sacar arma de fácil acesso pra mão livre não é ação; largar a arma no chão também não; guardar no corpo é. pegar ou largar escudo é ação."],
  ["recarregar", "1 ação recarrega a arma inteira com um tipo de munição só; não dá pra misturar no pente."],
  ["autofire", "gasta a ação e 10 balas (com menos de 10 no pente, não dá). usa a perícia Autofire e a tabela de DV do autofire, e não dá pra mirar. alvo com REF 8+ pode tentar esquivar. acertou: 2d6 de dano × o quanto passou da DV, até ×3 (SMG) ou ×4 (fuzil); dois 6 é ferimento crítico. a armadura reduz normalmente."],
];
