/** Telão (/tela): o que aparece na TV da mesa. */
export const telao = {
  meta: { title: "Gambiarra.net · telão" },
  noSignal: "sem sinal",
  signedOut: "entre como mestre no console, neste mesmo navegador, e abra o telão por lá.",
  nothingOnAir: "nada no ar. no console, aba netrunner: mandar pro telão.",
  fullscreen: "tela cheia",
  /** Ao lado do nome da arquitetura: "3 andares descobertos". */
  floorsFound: (n: number) => (n === 1 ? "1 andar descoberto" : `${n} andares descobertos`),
  nothingFound: "nada descoberto ainda",
  connectingArch: "conectando à arquitetura",
} as const;
