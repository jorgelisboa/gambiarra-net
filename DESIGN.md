# Design

Mundo visual: **terminal minimalista futurista em pixel art**.

- **Cores**: fundo quase preto; texto off-white; `--red` (#ff3b30) é o acento do jogo (Cyberpunk RED); `--net` (#3df0d8) só para tudo que é Net/Netrunner.
- **Tipo**: Pixelify Sans para nomes e títulos; Geist Mono para todo o resto. Números sempre em mono (na fonte pixel o 5 parece S).
- **Forma**: cantos retos, bordas de 2px, sem sombras. Botões em colchetes `[ assim ]`, hover invertido como seleção de terminal, com um glitch rápido (rgb split vermelho/ciano em passos; some com `prefers-reduced-motion`).
- **Cursor**: seta em pixel art clara; vermelha em tudo que é clicável.
- **Pixel art**: avatares são sprites 8x8 simétricos gerados pelo id do personagem (ou a foto da ficha, guardada em pé até 3:5, mostrada quadrada pelo topo com borda de 2px na cor do personagem e reduzida suave, sem pixelar; `src/components/Portrait.tsx`); ícones de ação (ação, movimento, net) desenhados em grade 8x8 (`src/components/Pixel.tsx`). Barras de HP em células.
- **Tela cheia de iniciativa**: carrossel de cartas na altura da tela, 4 por vez no desktop e a próxima vazando na borda quando tem mais. A foto em pé (ou o sprite) é o fundo da carta e o HUD (nome, HP, SP, condição, ações do turno) é uma camada sobre a base dela. Miniaturas no topo levam a cada carta.
- **Movimento**: sempre em passos (`steps()`), como frames de sprite. No começo do turno o carrossel desliza em passos até quem está no turno ficar na primeira vaga, a foto pisca 3 vezes na cor do estado e o traço de um batimento corre por cima dela e some, uma vez só (`src/components/TurnPulse.tsx`; vale também pro retrato na lista do combate); o ícone "salta" ao ser usado.
- **Estado de ferimento**: uma cor por estado, na barra de HP, no rótulo e no piscar do começo do turno: verde ileso, âmbar ferido, laranja grave, vermelho mortal.
- **Sem emoji como ícone.**
- **Arquitetura de net**: diagrama de infraestrutura num terminal sobre grade de pontos. Cada andar é um nó com cabeçalho `F03 · CONTROL`, ícone 8x8 (cadeado, arquivo, engrenagem, caveira pro black ICE) e o nome; o tronco desce na primeira coluna e os galhos abrem à direita, com conexões em ângulo reto. Black ICE em vermelho, o resto em `--net`. No console, andar oculto da mesa fica tracejado; o caminho do netrunner corre em traço animado (em passos) até a etiqueta `◆ NETRUNNER`. O telão (`/tela`) usa o mesmo desenho maior, escalado pra caber na TV, com linhas de varredura.
