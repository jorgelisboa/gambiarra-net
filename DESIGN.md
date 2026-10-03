# Design

Mundo visual: **terminal minimalista futurista em pixel art**.

- **Cores**: fundo quase preto; texto off-white; `--red` (#ff3b30) é o acento do jogo (Cyberpunk RED); `--net` (#3df0d8) só para tudo que é Net/Netrunner.
- **Tipo**: Pixelify Sans para nomes e títulos; Geist Mono para todo o resto. Números sempre em mono (na fonte pixel o 5 parece S).
- **Forma**: cantos retos, bordas de 2px, sem sombras. Botões em colchetes `[ assim ]`, hover invertido como seleção de terminal, com um glitch rápido (rgb split vermelho/ciano em passos; some com `prefers-reduced-motion`).
- **Cursor**: seta em pixel art clara; vermelha em tudo que é clicável.
- **Pixel art**: avatares são sprites 8x8 simétricos gerados pelo id do personagem (ou a foto da ficha, guardada em pé até 3:5, mostrada quadrada pelo topo com borda de 2px na cor do personagem e reduzida suave, sem pixelar; `src/components/Portrait.tsx`); ícones de ação (ação, movimento, net) desenhados em grade 8x8 (`src/components/Pixel.tsx`). Barras de HP em células.
- **Tela cheia de iniciativa**: carrossel de cartas na altura da tela, 4 por vez no desktop e a próxima vazando na borda quando tem mais. A foto em pé (ou o sprite) é o fundo da carta e o HUD (nome, HP, SP, condição, monitor cardíaco, ações do turno) é uma camada sobre a base dela. Miniaturas no topo levam a cada carta.
- **Movimento**: sempre em passos (`steps()`), como frames de sprite. No começo do turno o carrossel desliza em passos até quem está no turno ficar na primeira vaga, a arte da carta dá um glitch e o monitor cardíaco varre o traço, uma vez cada (`src/components/HeartMonitor.tsx`); o ícone "salta" ao ser usado.
- **Estado de ferimento**: uma cor por estado, na barra de HP, no rótulo e no monitor: verde ileso, âmbar ferido, laranja grave, vermelho mortal.
- **Sem emoji como ícone.**
