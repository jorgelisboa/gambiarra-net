import type { RollTable } from "../tables";

/** Região cultural (1d10) e os idiomas mais falados nela. Vale escolher um idioma fora da lista. */
export const CULTURAL_REGIONS: readonly { region: string; languages: readonly string[] }[] = [
  {
    region: "Norte-americana",
    languages: ["Chinês", "Cree", "Crioulo", "Inglês", "Francês", "Navajo", "Espanhol"],
  },
  {
    region: "Sul/Centro-americana",
    languages: ["Crioulo", "Inglês", "Alemão", "Guarani", "Maia", "Português", "Quéchua", "Espanhol"],
  },
  {
    region: "Europa Ocidental",
    languages: ["Holandês", "Inglês", "Francês", "Alemão", "Italiano", "Norueguês", "Português", "Espanhol"],
  },
  {
    region: "Europa Oriental",
    languages: ["Inglês", "Finlandês", "Polonês", "Romeno", "Russo", "Ucraniano"],
  },
  {
    region: "Oriente Médio/Norte da África",
    languages: ["Árabe", "Berbere", "Inglês", "Farsi", "Francês", "Hebraico", "Turco"],
  },
  {
    region: "África Subsaariana",
    languages: ["Árabe", "Inglês", "Francês", "Hauçá", "Lingala", "Oromo", "Português", "Suaíli", "Twi", "Iorubá"],
  },
  {
    region: "Sul da Ásia",
    languages: ["Bengali", "Dari", "Inglês", "Hindi", "Nepali", "Cingalês", "Tâmil", "Urdu"],
  },
  {
    region: "Sudeste Asiático",
    languages: ["Árabe", "Birmanês", "Inglês", "Filipino", "Hindi", "Indonésio", "Khmer", "Malaio", "Vietnamita"],
  },
  {
    region: "Leste Asiático",
    languages: ["Cantonês", "Inglês", "Japonês", "Coreano", "Mandarim", "Mongol"],
  },
  {
    region: "Oceania/Ilhas do Pacífico",
    languages: ["Inglês", "Francês", "Havaiano", "Maori", "Pama-Nyungan", "Taitiano"],
  },
];

export const REGIONS: RollTable = CULTURAL_REGIONS.map((r) => ({
  text: r.region,
  hint: r.languages.join(", "),
}));

const ALL_LANGUAGES = [...new Set(CULTURAL_REGIONS.flatMap((r) => r.languages))].sort((a, b) =>
  a.localeCompare(b, "pt-BR"),
);

/** Idiomas da região escolhida; região escrita à mão (ou vazia) libera todos. */
export function languagesOf(region: string | undefined): RollTable {
  const found = CULTURAL_REGIONS.find((r) => r.region === region);
  return (found ? found.languages : ALL_LANGUAGES).map((text) => ({ text }));
}
