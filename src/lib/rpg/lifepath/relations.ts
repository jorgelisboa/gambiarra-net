import { d10 } from "../dice";
import { table, type RollTable } from "../tables";

/** Quantos amigos, inimigos ou amores trágicos: 1d10 − 7, mínimo 0. */
export const rollMinus7 = () => {
  const d = d10();
  return { dice: [d], total: Math.max(0, d - 7) };
};

export const FRIEND_RELATIONSHIP = table(
  "Como um irmão mais velho.",
  "Como um irmão mais novo.",
  "Um professor ou mentor.",
  "Um parceiro ou colega de trabalho.",
  "Um ex-amor.",
  "Um antigo inimigo.",
  "Como um pai ou mãe pra você.",
  "Um amigo de infância.",
  "Alguém que você conhece da rua.",
  "Alguém com um interesse ou objetivo em comum.",
);

export const ENEMY_WHO = table(
  "Ex-amigo",
  "Ex-amor",
  "Parente afastado",
  "Inimigo de infância",
  "Alguém que trabalha pra você",
  "Alguém pra quem você trabalha",
  "Parceiro ou colega",
  "Executivo corporativo",
  "Funcionário do governo",
  "Boosterganger",
);

export const ENEMY_CAUSE = table(
  "Um fez o outro perder prestígio ou status.",
  "Um causou a perda de um amor, amigo ou parente do outro.",
  "Uma grande humilhação pública.",
  "Um acusou o outro de covardia ou outro defeito grave.",
  "Um abandonou ou traiu o outro.",
  "Um recusou uma oferta de emprego ou de romance do outro.",
  "Vocês simplesmente não se suportam.",
  "Vocês eram rivais no amor.",
  "Vocês eram rivais nos negócios.",
  "Um armou pro outro levar a culpa por um crime.",
);

/** No livro é escolha, não rolagem. */
export const ENEMY_WRONGED = table("Você", "O inimigo");

export const ENEMY_RESOURCES = table(
  "Só a própria pessoa, e nem ela vai se esforçar.",
  "Só a própria pessoa.",
  "A pessoa e um amigo próximo.",
  "A pessoa e alguns amigos (1d6/2).",
  "A pessoa e alguns amigos (1d10/2).",
  "Uma gangue inteira (pelo menos 1d10 + 5 pessoas).",
  "A polícia local ou outros Lawmen.",
  "Um chefão de gangue poderoso ou uma Corp pequena.",
  "Uma Corp poderosa.",
  "Uma cidade inteira, governo ou agência.",
);

/** Sweet Revenge: o que acontece quando vocês se encontrarem de novo. */
export const SWEET_REVENGE: RollTable = [
  { text: "Evita a escória.", weight: 2 },
  { text: "Entra em fúria assassina e tenta arrancar a cara do outro.", weight: 2 },
  { text: "Apunhala pelas costas, de forma indireta.", weight: 2 },
  { text: "Ataca com palavras.", weight: 2 },
  { text: "Arma pro outro levar a culpa por um crime." },
  { text: "Parte pra matar ou mutilar." },
];

export const LOVE_AFFAIR = table(
  "Seu amor morreu num acidente.",
  "Seu amor sumiu misteriosamente.",
  "Simplesmente não deu certo.",
  "Um objetivo pessoal ou vingança ficou entre vocês.",
  "Seu amor foi sequestrado.",
  "Seu amor enlouqueceu ou virou ciberpsicopata.",
  "Seu amor se suicidou.",
  "Seu amor foi morto numa briga.",
  "Um rival te tirou da jogada.",
  "Seu amor está preso ou exilado.",
);
