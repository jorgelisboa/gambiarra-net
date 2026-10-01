import { table, type RollTable } from "../tables";

export const FAMILY_BACKGROUND: RollTable = [
  {
    text: "Executivos corporativos",
    hint: "Ricos e poderosos: criados, casas de luxo, segurança particular, escola de elite.",
  },
  {
    text: "Gerentes corporativos",
    hint: "Bem de vida: casa grande, bairro seguro, carro bom. Escola particular e corporativa.",
  },
  {
    text: "Técnicos corporativos",
    hint: "Classe média: conapt confortável ou casa em Beaverville, escola técnica da Corp.",
  },
  {
    text: "Bando nômade",
    hint: "Trailers e kombis enormes. Aprendeu cedo a dirigir e brigar, com família por perto e comida fresca.",
  },
  {
    text: "\"Família\" de gangue",
    hint: "Lar violento onde a gangue conseguisse se enfiar. Fome, frio e medo; a gangue te ensinou a brigar e roubar.",
  },
  {
    text: "Combat Zoners",
    hint: "Prédio decadente e fortificado na Zona. Às vezes faltava comida, mas quase sempre tinha cama.",
  },
  {
    text: "Sem-teto urbanos",
    hint: "Carros, caçambas, contêineres abandonados. Fome e frio; escola da vida.",
  },
  {
    text: "Ratos de megaestrutura",
    hint: "Conapt minúsculo numa megaestrutura do pós-guerra: kibble, cama quente, escola improvisada.",
  },
  {
    text: "Reclaimers",
    hint: "Saiu da estrada pra reconstruir uma cidade fantasma. Vida de pioneiro: perigosa, mas com comida e abrigo.",
  },
  {
    text: "Edgerunners",
    hint: "A casa mudava conforme o trampo dos pais: de apê de luxo a caçamba, de banquete a kibble.",
  },
];

export const CHILDHOOD_ENVIRONMENT = table(
  "Correndo pela rua, sem nenhum adulto por perto.",
  "Numa zona corporativa segura, murada do resto da cidade.",
  "Num bando nômade, de lugar em lugar.",
  "Num bando nômade ligado a transporte (navios, aviões, caravanas).",
  "Num bairro antes chique, agora decadente, segurando os boosters.",
  "No coração da Combat Zone, num prédio destruído ou ocupação.",
  "Numa megaestrutura gigante controlada por uma Corp ou pela cidade.",
  "Nas ruínas de uma cidade abandonada, tomada por Reclaimers.",
  "Numa Drift Nation (cidade flutuante no mar), ponto de encontro de todo tipo de gente.",
  "Num arranha-céu corporativo de luxo, bem acima da ralé.",
);

export const FAMILY_CRISIS = table(
  "Sua família perdeu tudo por traição.",
  "Sua família perdeu tudo por má gestão.",
  "Sua família foi exilada ou expulsa do lar, nação ou Corp de origem.",
  "Sua família está presa e só você escapou.",
  "Sua família sumiu. Você é o único que restou.",
  "Sua família foi morta e só você sobreviveu.",
  "Sua família está metida numa conspiração ou organização antiga, tipo família do crime ou grupo revolucionário.",
  "Sua família se espalhou pelo mundo por azar.",
  "Sua família carrega uma rixa hereditária de gerações.",
  "Você herdou uma dívida de família e precisa pagar antes de seguir a vida.",
);
