# Arquitetura

> Última atualização: 2026-10-09

## Stack (verificado em `package.json`)

| Camada           | Tecnologia                                                                | Versão (manifest) |
| ---------------- | ------------------------------------------------------------------------- | ----------------- |
| Framework        | [Next.js](https://nextjs.org) (App Router)                                | 16.4.0            |
| UI               | React / React DOM                                                         | 19.3.0            |
| Estilo           | Tailwind CSS v4 (`@import "tailwindcss"`)                                 | ^4                |
| Bundler (dev)    | Turbopack (`next dev`) + `@tailwindcss/turbopack` para CSS                | —                 |
| Linguagem        | TypeScript                                                                | ^5                |
| Compilador React | `babel-plugin-react-compiler` (`reactCompiler: true` em `next.config.ts`) | 1.0.0             |

Scripts: `npm run dev` | `build` | `start`.

## Configuração Next.js relevante

Arquivo `next.config.ts`:

- `reactCompiler: true`
- `cacheComponents: true`, `partialPrefetching: true`
- `experimental.agentFeedback: true`
- Regra Turbopack: arquivos `*.css` processados com `@tailwindcss/turbopack`

Não há variáveis de ambiente documentadas no repositório para APIs ou banco.

## Estrutura de pastas (código-fonte)

```
academia-web/
├── src/app/              # App Router: páginas e layout raiz
│   ├── layout.tsx        # Fontes Google, metadata, globals.css
│   ├── page.tsx          # / — cadastro administrador
│   ├── login/page.tsx
│   ├── painel/page.tsx
│   └── globals.css       # @theme tokens (cores, tipografia)
├── src/components/
│   ├── acesso/           # login-administrador, cadastro-administrador ("use client")
│   └── painel/           # dashboard (Server Component), data-atual (client)
├── docs/                 # Documentação e PRDs (fora do runtime)
├── next.config.ts
├── tsconfig.json         # alias @/* → ./src/*
└── package.json
```

Alias de import: `@/components/...`, `@/app/...`.

## Camadas e responsabilidades

```mermaid
flowchart TB
  Browser[Browser]
  AppRouter[src/app pages]
  ServerComp[Server Components ex. Dashboard shell]
  ClientComp[Client Components ex. forms, DataAtual]
  Browser --> AppRouter
  AppRouter --> ServerComp
  AppRouter --> ClientComp
```

- **Páginas** (`src/app/**/page.tsx`): composição fina; exportam `metadata` onde necessário.
- **Server Components**: `Dashboard` em `dashboard.tsx` (sem `"use client"`) — HTML estático com dados embutidos.
- **Client Components**: formulários de acesso (`useRouter`, estado local); `DataAtual` formata data no cliente com `Intl` e fuso `America/Sao_Paulo`.

Não existem:

- `src/app/api/**` (Route Handlers)
- `middleware.ts` / proteção de `/painel`
- Camada `lib/`, `services/`, hooks de dados ou schemas compartilhados

## Rotas e fluxos de navegação

| Path      | Componente principal    | Comportamento                           |
| --------- | ----------------------- | --------------------------------------- |
| `/`       | `CadastroAdministrador` | `onSubmit` → `preventDefault()` apenas  |
| `/login`  | `LoginAdministrador`    | `onSubmit` → `router.push("/painel")`   |
| `/painel` | `Dashboard`             | Render estático; logout link → `/login` |

Links cruzados: cadastro ↔ login via `next/link`.

## Design system (UI)

- **Tema**: classe `dark` no `<html>`; tokens CSS em `globals.css` (`@theme inline`) — superfícies, primary/secondary/error, escalas de texto (`font-headline-*`, `font-body-*`, `font-label-*`).
- **Fontes**: Space Grotesk (títulos/rótulos) e Plus Jakarta Sans (corpo), via `next/font/google` em `layout.tsx`.
- **Ícones**: Google Material Symbols Outlined (link externo no layout).
- **Espaçamento**: utilitários Tailwind custom (`space-lg`, `gutter`, etc., definidos no tema CSS).

Referências de layout Stitch/HTML ficam em `docs/prd/stitch_*` (design de referência, não runtime).

## Dependências externas em runtime

Apenas assets carregados pelo layout (Google Fonts / Material Symbols). **Nenhuma** chamada `fetch` ou SDK de backend no diretório `src/`.

## Documentação relacionada

- Produto e gap PRD vs código: [project-overview.md](./project-overview.md)
- Requisitos completos do painel: [prd/painel-administrador.md](./prd/painel-administrador.md)
- Onboarding local: [README.md](../README.md)

## Evolução arquitetural esperada (não implementada)

Quando o PRD for implementado de ponta a ponta, é provável introduzir: API ou BaaS, autenticação com sessão, middleware em `/painel`, módulos por domínio (alunos, planos, …) e estado assíncrono (loading/erro) nos formulários e listas. Nada disso está presente no código atual; tratar como direção de produto, não como desenho existente.
