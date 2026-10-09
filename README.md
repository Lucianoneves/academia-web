# academia-web (APEX.FIT — Admin Console)

Front-end Next.js do painel administrativo da academia (**APEX.FIT** / FITADMIN). Hoje inclui cadastro e login de administrador (UI) e um dashboard com layout completo e dados de demonstração.

Documentação mantida pela skill `/documentation-writer`:

- [Visão do produto](docs/project-overview.md) — o que existe no código vs PRD
- [Arquitetura](docs/architecture.md) — stack, pastas, rotas, camadas
- [PRD do painel](docs/prd/painel-administrador.md) — escopo de negócio completo

## Pré-requisitos

- Node.js compatível com Next.js 16
- npm (ou pnpm/yarn/bun)

## Desenvolvimento local

```bash
cd academia-web
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

| URL       | Tela                                                     |
| --------- | -------------------------------------------------------- |
| `/`       | Cadastro do administrador                                |
| `/login`  | Login (redireciona para o painel ao enviar o formulário) |
| `/painel` | Dashboard                                                |

## Scripts

| Comando         | Descrição                               |
| --------------- | --------------------------------------- |
| `npm run dev`   | Servidor de desenvolvimento (Turbopack) |
| `npm run build` | Build de produção                       |
| `npm run start` | Servir build                            |

## Estrutura rápida

- `src/app/` — rotas App Router
- `src/components/acesso/` — formulários de cadastro e login
- `src/components/painel/` — dashboard e utilitários de UI
- `docs/` — documentação e PRDs

Import alias: `@/*` → `src/*` (ver `tsconfig.json`).

## Agentes / Next.js 16

O arquivo [AGENTS.md](./AGENTS.md) na raiz contém avisos gerados pelo `next dev` sobre APIs do Next.js 16; consulte `node_modules/next/dist/docs/` antes de alterar convenções do framework.

## Estado atual (importante)

Não há backend integrado, banco de dados nem autenticação real. Formulários não persistem dados; o painel usa conteúdo estático no componente `Dashboard`. Evoluir funcionalidades deve seguir o [PRD](docs/prd/painel-administrador.md) e atualizar a documentação em `docs/` quando o comportamento mudar.
