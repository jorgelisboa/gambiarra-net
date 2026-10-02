# Gambiarra.net

VTT **não oficial** pra Cyberpunk RED: fichas, iniciativa em tela cheia e (em breve) simulador de netrunning.

> Projeto de fã, gratuito e sem fins lucrativos. Não é afiliado nem endossado pela R. Talsorian Games.
> Cyberpunk e Cyberpunk RED são marcas da R. Talsorian Games. Este repositório não contém arte do livro; regras e tabelas aparecem resumidas em pt-BR, pra uso na mesa.

## Abas

- **Personagens** — criação em passos (método Streetrat): nome → role → lore (lifepath com cada tabela rolável, escolhível ou escrita à mão) → stats (1d10 na tabela do role) → perícias (o template Streetrat do role, mais 4 níveis no idioma da origem cultural). A ficha é dividida em abas: **stats** (stats, HP, Humanidade), **perícias** (as 66 do livro pelas 9 categorias, cada uma ligada à sua stat: base = stat + nível, com rolagem de 1d10 e penalidade de ferimento), **habilidade** (rank, limites, botões de rolar e tabela do rank), **lore** e **notas**. Um personagem pode ser marcado como "na sessão".
- **Combate** — iniciativa (1d10 + REF), HP ligado à ficha, ações de Carne (Ação/Movimento) e ações de Net para Netrunners. Modo **tela cheia** com avatares saltando no turno ativo (Espaço/→ passa o turno).
- **Netrunner** — placeholder.

## Design

Terminal minimalista em pixel art. Detalhes em [DESIGN.md](DESIGN.md).

## Dados

Com Supabase configurado, o login é por email e senha e as fichas ficam salvas no perfil (tabela `characters`, uma linha por personagem, protegida por RLS). Combate e personagem da sessão ficam no navegador por enquanto. Sem as variáveis de ambiente, o app roda no modo local: login por username e tudo no `localStorage`.
A camada de persistência está em [`src/lib/store.ts`](src/lib/store.ts); o schema, em [`supabase/migrations/`](supabase/migrations/).

No login a pessoa escolhe **mestre** (combate, net e fichas) ou **jogador** (só criar e ver os próprios personagens).

### Configurando o Supabase

1. Copie `.env.example` pra `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
2. Aplique a migration de `supabase/migrations/`.
3. Em Authentication → Sign In / Providers → Email, desligue **Confirm email**. Sem SMTP próprio, o Supabase só envia email pros membros da org, então quem não é da equipe não conseguiria confirmar a conta.
4. Em Authentication → URL Configuration, coloque a URL do app (e `http://localhost:3000`) em Site URL / Redirect URLs.

## Sistema de regras

[`src/lib/rpg/`](src/lib/rpg/) guarda as regras do RED usadas pelo app, separadas da interface:

- `roles/` — um arquivo por role: resumo em pt-BR e a habilidade (pontos a distribuir, listas com limite, usos que rolam, tabelas por rank).
- `ability.ts` — limites: orçamento de pontos, tetos, corte quando o rank cai, listas.
- `dice.ts` — d6/d10, teste com crítico, comparação com DV.
- `derived.ts` — stats derivados: HP, limiar de ferimento grave, death save, humanidade, EMP em uso, estado de ferimento.
- `character.ts` — o que a habilidade muda fora da ficha (bônus de iniciativa, ações de net).
- `tables.ts` — tabela de rolagem genérica (1d10 por padrão; linhas podem ocupar várias faces).
- `lifepath/` — as tabelas do lifepath em arrays (`origins`, `personal`, `motivations`, `family`, `relations`, `goals`) e a ordem delas em `sections.ts`.
- `skills.ts` — as 66 perícias (categoria, stat ligada, básica, x2, especialização) e os templates Streetrat por role. Os ids são as chaves salvas na ficha, então não renomeie.
- `creation.ts` — métodos de criação e seus passos (Edgerunner aparece como "em breve").
- `stats.ts` — templates de stats por role: uma matriz 10×10 por role (linha = face do 1d10, colunas na ordem de `STAT_KEYS`), com a rolagem Streetrat (linha inteira) e Edgerunner (1d10 por stat).

Pra ajustar uma regra, mexa só no arquivo do role. Pra uma tabela nova de lifepath, crie o array e adicione um campo em `lifepath/sections.ts`; o id do campo é a chave salva na ficha, então não renomeie depois.

## Rodando

```bash
npm install
npm run dev
```

Deploy: importar o repo na Vercel (Next.js, sem configuração extra).

## Regras usadas

- HP = 10 + 5 × ⌈(BODY + WILL) / 2⌉ (bate com a tabela do livro). Gravemente ferido abaixo de ⌈HP / 2⌉; Death Save = BODY.
- Ferimentos: levemente (sem penalidade), gravemente (−2 em todas as ações), mortalmente abaixo de 1 HP (−4 nas ações, −6 MOVE, death save todo turno). Penalidades da pág. 186: conferir com o livro.
- Humanidade = EMP × 10. O EMP em uso cai junto com a dezena da humanidade (44 → 4, 39 → 3) e nunca passa do EMP da ficha; abaixo de 0 é ciberpsicose.
- Testes: base + 1d10; 10 natural rola de novo e soma, 1 natural rola de novo e subtrai. Precisa **passar** da DV (empate falha).
- Habilidade de role começa no rank 4.
- Ações de Net por Interface: 1–3 → 2, 4–6 → 3, 7–9 → 4, 10 → 5
- Solo: pontos = rank. Desvio de dano 2 pts por −1 (máx 10), recuperar falha 4 pts, iniciativa +1/pt (entra na iniciativa do combate), ataque preciso 3 pts por +1 (máx 9), ponto fraco +1/pt, detectar ameaça +1/pt.
- Tech: 2 pontos por rank em especialidades diferentes (cada uma ≤ rank). DV por preço: 9 / 13 / 17 / 21 / 24 / 29.
- Medtech: 1 ponto por rank; cirurgia, farmacêutica e criossistemas até 5 cada. Sintetizar fármaco: DV13.
- Exec: equipe de 1 / 2 / 3 membros nos ranks 3 / 5 / 9.
- Nomad: 1 veículo ou melhoria por rank; +rank em dirigir/pilotar.
- Lawman: 1d10 ≥ rank pra alguém atender; chega em 1d6 rounds (6 = reforço de cima).
- Media: chance de acreditarem 2–7 em 10 conforme o rank; rumores DV 7/9/11/13.
- Rockerboy: DV 8 (1 fã), 10 (grupo até 6), 12 (multidão, só do rank 3 em diante).

- Stats (Streetrat): 1d10 escolhe uma linha inteira da tabela do role (ou escolha a linha). Edgerunner, quando entrar: 1d10 por stat, lido na coluna dele.
- Lifepath: 1d10 por tabela (ou escolha); amigos, inimigos e amores trágicos: 1d10 − 7 (mínimo 0) e uma rolagem por item. Idioma: 4 pontos na perícia.

Tabelas conferidas no compêndio do Roll20 e em wikis de fãs. Na dúvida, vale o livro.
