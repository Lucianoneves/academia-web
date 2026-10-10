# Visão geral do produto

> Última atualização: 2026-10-09

## O que é

**academia-web** é o front-end web do console **APEX.FIT** (marca exibida na UI como FITADMIN / APEX.FIT ENGINE): gestão operacional de uma academia para **administradores** (dono ou recepção). Interface em português (pt-BR), tema escuro e identidade visual Material-inspired.

## O que o código entrega hoje

O acesso do administrador, o cadastro de aluno e a lista com ficha já gravam no Supabase. O aluno leva nome, nascimento, telefone, peso, altura, plano escolhido e restrições. No dashboard, total, ativos, porcentagem e entradas do mês vêm dos alunos. Faturamento, pagamentos pendentes, aulas, avaliações e catracas continuam ilustrativos.

| Rota                  | Função                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| `/`                   | Cadastro do primeiro administrador. Depois que a conta existe, abre o login.                            |
| `/login`              | Login com e-mail e senha. Sem sessão válida, o painel não abre.                                         |
| `/painel`             | Dashboard. Total, ativos, porcentagem e entradas do mês vêm dos alunos. O cabeçalho mostra quem entrou. |
| `/painel/alunos`      | Lista aberta por **Alunos Ativos / Inativos**. Busca por nome ou telefone.                              |
| `/painel/alunos/novo` | Formulário de novo aluno. Grava, avisa e permanece na página.                                           |
| `/painel/alunos/[id]` | Ficha para editar, inativar e reativar.                                                                 |

**Novo Aluno** e **Alunos Ativos / Inativos** navegam. Os outros itens do menu continuam âncoras da própria tela. **Nova Matrícula** ainda não navega.

## Visão de produto (referência)

O escopo completo de negócio está em [docs/prd/painel-administrador.md](./prd/painel-administrador.md). O recorte já entregue está em [docs/prd/feature-cadastro-aluno.md](./prd/feature-cadastro-aluno.md): acesso, inclusão, lista, ficha, edição e inativação.

## Público da documentação

Desenvolvedores que vão evoluir o painel a partir deste front-end Next.js. Para decisões de produto e regras de negócio detalhadas, use o PRD acima; para stack e pastas, veja [architecture.md](./architecture.md).
