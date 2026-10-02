# Design

Mundo visual: **terminal minimalista futurista em pixel art**.

- **Cores**: fundo quase preto; texto off-white; `--red` (#ff3b30) é o acento do jogo (Cyberpunk RED); `--net` (#3df0d8) só para tudo que é Net/Netrunner.
- **Tipo**: Pixelify Sans para nomes e títulos; Geist Mono para todo o resto. Números sempre em mono (na fonte pixel o 5 parece S).
- **Forma**: cantos retos, bordas de 2px, sem sombras. Botões em colchetes `[ assim ]`, hover invertido como seleção de terminal, com um glitch rápido (rgb split vermelho/ciano em passos; some com `prefers-reduced-motion`).
- **Cursor**: seta em pixel art clara; vermelha em tudo que é clicável.
- **Pixel art**: avatares são sprites 8x8 simétricos gerados pelo id do personagem; ícones de ação (ação, movimento, net) desenhados em grade 8x8 (`src/components/Pixel.tsx`). Barras de HP em células.
- **Movimento**: sempre em passos (`steps()`), como frames de sprite. O personagem do turno pula; o ícone "salta" ao ser usado.
- **Sem emoji como ícone.**
