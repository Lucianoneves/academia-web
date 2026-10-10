# academia-web (APEX.FIT — Admin Console)

Front-end Next.js do painel administrativo da academia (**APEX.FIT** / FITADMIN). O administrador entra, cadastra aluno e abre a lista com ficha. No dashboard, total e ativos vêm dos alunos; faturamento, aulas e avaliações continuam de demonstração.

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

| URL                   | Tela                                                |
| --------------------- | --------------------------------------------------- |
| `/`                   | Cadastro do primeiro administrador                  |
| `/login`              | Login do administrador                              |
| `/painel`             | Dashboard com sessão; total e ativos vêm dos alunos |
| `/painel/alunos`      | Lista: busca e filtro de ativos ou inativos         |
| `/painel/alunos/novo` | Cadastro de aluno                                   |
| `/painel/alunos/[id]` | Ficha: edita, inativa e reativa                     |

## Scripts

| Comando         | Descrição                               |
| --------------- | --------------------------------------- |
| `npm run dev`   | Servidor de desenvolvimento (Turbopack) |
| `npm run build` | Build de produção                       |
| `npm run start` | Servir build                            |

## Estrutura rápida

- `src/app/` — rotas App Router
- `src/proxy.ts` — exige sessão para abrir o painel
- `src/components/acesso/` — formulários de cadastro e login
- `src/components/painel/` — dashboard e casca do painel
- `supabase/` — SQL das tabelas, funções e RLS
- `docs/` — documentação e PRDs

Import alias: `@/*` → `src/*` (ver `tsconfig.json`).

## Agentes / Next.js 16

O arquivo [AGENTS.md](./AGENTS.md) na raiz contém avisos gerados pelo `next dev` sobre APIs do Next.js 16; consulte `node_modules/next/dist/docs/` antes de alterar convenções do framework.

## Estado atual (importante)

Autenticação e alunos usam o Supabase configurado no ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` só no servidor). O SQL está em `supabase/`. Se a ficha não gravar altura e plano, aplique `supabase/11_students_altura_plano.sql` no editor SQL. Faturamento, pagamentos pendentes, aulas, avaliações, catracas e **Nova Matrícula** continuam ilustrativos. O comportamento deste recorte está em [docs/prd/feature-cadastro-aluno.md](docs/prd/feature-cadastro-aluno.md).
