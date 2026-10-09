# Visão geral do produto

> Última atualização: 2026-10-09

## O que é

**academia-web** é o front-end web do console **APEX.FIT** (marca exibida na UI como FITADMIN / APEX.FIT ENGINE): gestão operacional de uma academia para **administradores** (dono ou recepção). Interface em português (pt-BR), tema escuro e identidade visual Material-inspired.

## O que o código entrega hoje

Recorte **UI estática / protótipo navegável**, sem persistência nem API:

| Rota      | Função                                                                                                                |
| --------- | --------------------------------------------------------------------------------------------------------------------- |
| `/`       | Formulário de cadastro do primeiro administrador (campos validados no HTML; submit não persiste dados).               |
| `/login`  | Login com e-mail e senha; ao enviar, redireciona para `/painel` sem validar credenciais.                              |
| `/painel` | Dashboard com menu lateral, métricas, aulas do dia e atalhos — **dados fixos no componente**, não vindos de servidor. |

Itens de menu do painel (alunos, pagamentos, agenda, etc.) apontam para âncoras (`#alunos`, `#pagamentos`, …) ou permanecem como layout; **não há páginas separadas** para essas áreas no App Router.

## Visão de produto (referência)

O escopo completo de negócio (alunos, planos, pagamentos em dinheiro, horários, agenda, categorias, avaliação médica, persistência entre sessões) está descrito em [docs/prd/painel-administrador.md](./prd/painel-administrador.md). Esse PRD marca status **Implementado** no documento; no repositório atual, apenas as telas de acesso e o dashboard visual correspondem a essa visão — integração com backend e demais fluxos ainda não existem no código.

## Público da documentação

Desenvolvedores que vão evoluir o painel a partir deste front-end Next.js. Para decisões de produto e regras de negócio detalhadas, use o PRD acima; para stack e pastas, veja [architecture.md](./architecture.md).
