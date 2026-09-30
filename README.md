# Gambiarra.net

VTT **não oficial** pra Cyberpunk RED: fichas, iniciativa em tela cheia e (em breve) simulador de netrunning.

> Projeto de fã, gratuito e sem fins lucrativos. Não é afiliado nem endossado pela R. Talsorian Games.
> Cyberpunk e Cyberpunk RED são marcas da R. Talsorian Games. Este repositório não contém texto ou arte do livro.

## Abas

- **Personagens** — fichas (stats, HP, Humanidade, Interface) + anotações (idade, objetivo, história...). Um personagem pode ser marcado como "na sessão".
- **Combate** — iniciativa (1d10 + REF), HP ligado à ficha, ações de Carne (Ação/Movimento) e ações de Net para Netrunners. Modo **tela cheia** com avatares saltando no turno ativo (Espaço/→ passa o turno).
- **Netrunner** — placeholder.

## Design

Terminal minimalista em pixel art. Detalhes em [DESIGN.md](DESIGN.md).

## Dados

Tudo fica no `localStorage` do navegador, separado por username (login sem senha por enquanto).
A camada de persistência está isolada em [`src/lib/store.ts`](src/lib/store.ts) pra facilitar a troca por Supabase.

## Rodando

```bash
npm install
npm run dev
```

Deploy: importar o repo na Vercel (Next.js, sem configuração extra).

## Regras usadas

- HP = 10 + 5 × ⌈(BODY + WILL) / 2⌉
- Humanidade = EMP × 10
- Ações de Net por Interface: 1–3 → 2, 4–6 → 3, 7–9 → 4, 10 → 5 (conferir com o livro)
