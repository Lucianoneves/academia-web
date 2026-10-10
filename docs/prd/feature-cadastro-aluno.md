# PRD — Cadastro de aluno pelo administrador

> Tipo: PRD de feature · Data: 2026-10-09
> **Status:** Implementada
>
> <!-- Valores possíveis: "Aguardando implementação" | "Implementada". Atualize para "Implementada" quando todas as specs estiverem concluídas. -->

Este documento é o recorte já entregue. O mapa do produto inteiro continua em [painel-administrador.md](./painel-administrador.md). Onde os dois divergirem neste recorte, vale este arquivo. A área de planos, pagamentos, agenda e avaliação médica seguem no PRD geral. O cadastro grava a altura e a escolha do plano; isso não abre preço nem pagamento.

## 1. Visão geral

O administrador da academia passa a entrar de verdade no painel e a cadastrar um aluno a partir do botão **Novo Aluno**. O aluno fica gravado e nasce ativo. A tela confirma o salvamento, limpa o formulário e permanece aberta para o próximo cadastro. Quem não entrou não vê o painel nem consegue gravar aluno.

## 2. Problema que resolve

Hoje o painel é uma tela de demonstração. O login abre o dashboard sem conferir senha, o cabeçalho mostra um nome fixo e o botão **Novo Aluno** não leva a lugar nenhum. O cadastro do primeiro administrador também não grava a conta. A recepção não tem como registrar a pessoa que chega na academia e ter certeza de que esse registro continua lá depois.

## 3. Público-alvo

O administrador da academia, dono ou recepção, numa única academia. É o único papel. Não há gestor com menos poder, nem aluno entrando no sistema.

## 4. Objetivo do recorte atual

Entregar o acesso do administrador, o cadastro de aluno e a área para listar, buscar, abrir a ficha, editar e inativar quem já foi gravado. **Novo Aluno** permanece na mesma página depois de salvar.

## 5. Funcionalidades

**Essenciais:**

- Criar o primeiro administrador com nome, e-mail, senha e confirmação, e entrar no painel em seguida.
- Fechar o cadastro público depois que o primeiro administrador existe.
- Entrar com e-mail e senha, permanecer ao recarregar e sair encerrando a sessão.
- Exigir sessão para o painel e para o cadastro de aluno. Sem sessão, a pessoa vê o login e não os dados do painel.
- Mostrar no cabeçalho o nome de quem entrou.
- Abrir o cadastro de aluno pelo botão **Novo Aluno**, dentro do mesmo menu e cabeçalho do painel.
- Gravar aluno com nome, data de nascimento, telefone, peso, altura, plano escolhido e restrições médicas. O aluno nasce ativo.
- Validar no servidor, recusar telefone repetido, confirmar o sucesso na própria página e limpar os campos para outro cadastro.
- Abrir a lista em **Alunos Ativos / Inativos**, buscar por nome ou telefone, abrir a ficha, editar e inativar com confirmação. Reativar devolve o aluno. Não há apagar.
- Mostrar no dashboard o total de alunos, os ativos, a porcentagem da base ativa e quantos entraram no mês.

**Desejáveis:**

Não há desejáveis neste recorte. O que ficou para a entrega seguinte está em Fora do escopo.

## 6. Fora do escopo

- Pagamento, agenda e avaliação com dados reais. Na ficha, esses blocos só dizem que ainda não há registros.
- **Nova Matrícula**, a área de planos (preço, ativar ou desligar), pagamentos, horários, agenda, categorias e avaliação médica.
- Incluir outro administrador depois do primeiro.
- Trocar o menu lateral para a ordem Início, Alunos, Planos, Pagamentos, Horários, Agenda, Categorias e Avaliação médica.
- Tornar reais o faturamento, os pagamentos pendentes, as aulas, as avaliações, as catracas e **Nova Matrícula**.
- Fazer o controle de recolher o menu funcionar, se hoje ele só aparece.
- O controle de "lembrar" no login não cria um modo extra de sessão.
- Acesso do aluno, senha do aluno, foto, Pix, cartão, recuperar senha, convite por e-mail, login com rede social e envio de arquivo.

## 7. Regras de negócio

- Regra 1 — **Confirmado:** só o administrador autenticado acessa o painel e cadastra aluno. Quem não entrou vê o login.
- Regra 2 — **Confirmado:** existe um único papel, o administrador. Dono e recepção usam o mesmo acesso.
- Regra 3 — **Confirmado:** o primeiro administrador se cadastra com nome, e-mail, senha e confirmação. Ao salvar, entra no painel. Depois disso o cadastro público não aparece mais.
- Regra 4 — **Confirmado:** e-mail de administrador não se repete. A senha não volta a ser exibida.
- Regra 5 — **Confirmado:** dois cadastros do primeiro administrador ao mesmo tempo não criam duas contas. Um conclui; o outro é informado de que já existe administrador e segue para o login.
- Regra 6 — **Confirmado:** login recusado não diz se o erro foi o e-mail ou a senha. Sair encerra a sessão. Recarregar com sessão válida não pede senha de novo.
- Regra 7 — **Confirmado:** pessoa autenticada que não é administrador da academia não vê o painel e não grava aluno.
- Regra 8 — **Confirmado:** o aluno reúne nome, data de nascimento, telefone, peso em kg, altura em cm, o plano escolhido no cadastro e restrições médicas. Nasce ativo. Não é apagado neste recorte. O plano escolhido não é o plano vigente: esse continua nascendo do pagamento, quando essa área existir, e os dois podem ser diferentes.
- Regra 9 — **Confirmado:** nome, data de nascimento, telefone, peso, altura e plano são obrigatórios nos cadastros novos. Restrições podem ficar vazias. Aluno gravado antes destes campos permanece sem altura e sem plano.
- Regra 10 — **Confirmado:** telefone não se repete entre alunos. A comparação usa só os números, ignorando espaços e pontuação.
- Regra 11 — **Confirmado:** a data de "hoje" para a data de nascimento é a da academia, no fuso de São Paulo. Data de hoje ou futura não salva.
- Regra 12 — **Confirmado:** o aluno gravado permanece depois de recarregar a página e num novo acesso, mesmo sem lista nesta entrega.
- Regra 13 — **Confirmado:** falha ao salvar não cria aluno e não apaga o que foi digitado. Dois cliques em salvar gravam um aluno só.
- Regra 14 — **Confirmado:** o painel mantém a linguagem visual já existente: tema escuro, barra lateral, cabeçalho e ação principal em destaque. Carregamento, sucesso e erro usam essa mesma linguagem.

## 8. Fluxos principais

### Fluxo 1 — Criar a primeira conta e entrar

1. Se ainda não existe administrador, a pessoa abre o sistema e vê o cadastro: nome, e-mail, senha e confirmação.
2. Preenche e salva.
3. A conta passa a existir e o painel abre, já com a sessão dela.
4. O cabeçalho mostra o nome informado.
5. Ao sair, a sessão acaba e a próxima visita mostra o login, não o cadastro público.

### Fluxo 2 — Entrar de novo

1. A pessoa informa e-mail e senha na tela de login.
2. Se os dados conferem e ela é administradora, o painel abre.
3. Se não conferem, permanece no login, com o e-mail ainda preenchido e uma mensagem de que não entrou.
4. Recarregar o painel não pede a senha outra vez.
5. Sair volta ao login.

### Fluxo 3 — Cadastrar um aluno

1. Com sessão válida, o administrador aciona **Novo Aluno** no cabeçalho.
2. O formulário abre no mesmo menu e cabeçalho do painel.
3. Informa nome, data de nascimento, telefone, peso, altura, um dos cinco planos e, se quiser, restrições médicas.
4. Salva.
5. Vê a mensagem de sucesso, os campos vazios e a mesma página pronta para outro aluno.
6. O aluno fica gravado como ativo.

## 9. Critérios de aceite

- Sem nenhum administrador, quem abre o sistema vê o cadastro da primeira conta.
- Com o primeiro cadastro válido, a pessoa entra no painel e, ao sair, a visita seguinte mostra login.
- Com e-mail e senha corretos de um administrador, o painel abre e o cabeçalho mostra o nome dessa pessoa.
- Com senha incorreta, a pessoa permanece fora do painel, sem saber se o e-mail ou a senha falhou.
- Sem sessão, o painel e o cadastro de aluno não aparecem: a pessoa vê o login.
- Com sessão válida, recarregar mantém a pessoa no painel, na área em que estava.
- **Novo Aluno** abre o formulário dentro do painel. **Nova Matrícula** e o menu lateral não ganham destino novo.
- O administrador consegue gravar um aluno com nome, data de nascimento, telefone, peso, altura, plano e restrições médicas.
- O sistema recusa nome curto, data de hoje ou futura, telefone com letras ou fora de 10 ou 11 dígitos, peso ou altura zero ou negativo, plano fora dos cinco tipos, e telefone já usado.
- Restrições em branco não impedem salvar.
- Depois do sucesso, a mensagem aparece, os campos ficam vazios e a página continua no cadastro.
- Se o salvamento falha, os campos continuam preenchidos e não há mensagem de sucesso.
- O mesmo telefone, depois de sair e entrar de novo, continua recusado.
- O sistema não oferece lista, ficha, busca, edição, inativação nem tela para o aluno entrar.
- O sistema não cadastra um segundo administrador por esta entrega.

## 10. Stack

A stack já escolhida no projeto e no PRD do painel:

- TypeScript
- Next.js
- React
- Tailwind CSS
- Supabase para autenticação e banco de dados
- Zod para validar no servidor o que chega de fora

TanStack Query permanece a escolha do PRD geral para áreas com lista e atualização depois de salvar. Este recorte não tem lista. O formulário distingue salvando, sucesso e erro sem depender de uma lista em cache.

## 11. Justificativa da stack

O painel já é Next.js com React, TypeScript e Tailwind. A conta do administrador e o aluno precisam sobreviver ao recarregar, e só quem entrou pode gravar. Supabase já é a base de acesso e de dados deste produto. Zod já é a regra do projeto para não confiar no que o navegador enviou. Trocar isso neste recorte criaria um segundo jeito de entrar e de guardar aluno.

## 12. Fases de construção

### Fase 1 — Acesso

Objetivo: existir um administrador real e uma sessão que começa no login e acaba ao sair.

Specs:

- Spec 01 — Primeiro administrador
- Spec 02 — Entrar, permanecer e sair

### Fase 2 — Painel protegido

Objetivo: o dashboard que já existe só abre com sessão e mostra quem entrou, sem redesenhar o menu nem os números.

Specs:

- Spec 03 — Painel só com sessão

### Fase 3 — Cadastro do aluno

Objetivo: o administrador grava o aluno pelo botão **Novo Aluno** e recebe confirmação na própria página.

Specs:

- Spec 04 — Incluir aluno

## 13. Specs funcionais detalhadas

> Cada spec deve ser autossuficiente: um agente de codificação vai ler SÓ esta spec (mais as dependências) para montar o plano técnico e implementar. Preencha todos os campos; se um não se aplica, escreva "Não se aplica" e o porquê.

### Spec 01 — Primeiro administrador

- **Fase:** 1
- **Objetivo (o quê):** A primeira pessoa cria a conta de administrador e entra no painel. O cadastro público fecha em seguida.
- **Intenção (por quê):** Sem essa conta, o login da Spec 02 não tem quem autenticar e o cadastro de aluno não tem quem o faça. O painel guarda dados de alunos; a porta não pode ficar aberta para qualquer visita.
- **Contexto:** A tela de cadastro do administrador já existe e coleta nome, e-mail, senha e confirmação, mas o envio não grava nada. A tela de login já existe em separado. O modelo do produto já prevê o administrador com nome e e-mail, senha guardada pelo acesso, e uma trava para só o primeiro cadastro público passar. Esta spec liga a tela a esse comportamento. Não inclui outro administrador.
- **Atores:** Pessoa que cria a primeira conta. Depois dela, ninguém mais usa esta tela.
- **Descrição do comportamento:** Se não existe administrador, a entrada do sistema é o cadastro, com nome, e-mail, senha e confirmação da senha. Ao salvar com dados válidos, a conta passa a existir, a pessoa entra no painel já autenticada e o cadastro público deixa de ser oferecido. Se já existe administrador, quem abre a entrada vê o login, não o formulário de criar conta. Se duas pessoas tentam criar a primeira conta ao mesmo tempo, só uma conclui. A outra recebe o aviso de que já existe administrador e é encaminhada ao login, sem uma segunda conta. A senha não aparece em lugar nenhum depois de salva. O aluno não usa esta tela.
- **Entradas e saídas:** Entradas: nome, e-mail, senha e confirmação. Saídas: conta do administrador, sessão já aberta, entrada no painel, ou mensagem no campo inválido. Se a conta não pôde ser criada, o formulário permanece preenchido.
- **Dados/entidades envolvidos (conceitual):** Administrador: nome, e-mail e senha. A senha só serve para entrar; não é um dado exibido no painel. Não há entidade de aluno nesta spec.
- **Estados e transições:** Nenhum administrador → tela de cadastro. Cadastro válido concluído → sessão aberta e painel. Administrador já existente → login na entrada pública. Tentativa simultânea perdida → login, sem conta nova. Falha ao gravar → continua na tela de cadastro, sem sessão.
- **Regras de negócio:** Regras 3, 4 e 5. O cadastro público só existe enquanto não há administrador. E-mail não se repete.
- **Validações:** Nome com pelo menos 2 caracteres, sem contar espaços nas pontas. E-mail em formato válido. Senha com pelo menos 8 caracteres. Confirmação igual à senha. E-mail já usado não salva. A validação que decide se gravou acontece no servidor, não só no navegador.
- **Fluxo do usuário (passo a passo):**
  1. A pessoa abre o sistema e vê o cadastro do administrador.
  2. Preenche nome, e-mail, senha e confirmação.
  3. Salva.
  4. Cai no painel, autenticada.
  5. Se sair, a próxima visita encontra o login.
- **Casos de borda e erros:** Confirmação diferente da senha: não salva e indica o campo. Senha curta, e-mail inválido ou nome curto: não salva e indica o campo. E-mail já usado: não salva. Falha de rede ou falha ao gravar: nenhum administrador é criado, os campos continuam preenchidos e dá para tentar de novo. Vários cliques: uma conta só. Cadastro aberto quando já existe administrador: a pessoa vê o login. A segunda pessoa numa corrida pelo primeiro cadastro não fica sem explicação: entende que a conta inicial já existe e segue para o login.
- **Impacto no existente:** A tela de cadastro deixa de ignorar o envio. A entrada do sistema passa a depender de já existir ou não um administrador. O link para o login que já aparece nessa tela continua válido.
- **Critérios de aceite (Dado/Quando/Então):**
  - Dado nenhum administrador, Quando a pessoa abre o sistema, Então vê o cadastro com nome, e-mail, senha e confirmação.
  - Dado dados válidos e nenhum administrador, Quando salva, Então a conta existe, o painel abre e a pessoa já está autenticada.
  - Dado a primeira conta já criada, Quando alguém abre a entrada do sistema, Então vê o login e não o cadastro público.
  - Dado confirmação diferente da senha, Quando tenta salvar, Então nenhuma conta é criada e o campo de confirmação explica o erro.
  - Dado duas pessoas salvando a primeira conta ao mesmo tempo, Quando as duas terminam, Então existe um administrador e a outra pessoa é levada ao login.
  - Dado uma falha ao gravar, Quando a pessoa olha o formulário, Então os dados continuam lá e não há sessão aberta.
- **Definição de pronto:** Dá para criar exatamente o primeiro administrador pela tela de entrada, entrar no painel em seguida e não ver mais o cadastro público.
- **Dependências:** Nenhuma.
- **Fora do escopo desta spec:** Login do dia a dia, sair, proteger cada área, cadastrar aluno e incluir outro administrador.

### Spec 02 — Entrar, permanecer e sair

- **Fase:** 1
- **Objetivo (o quê):** O administrador entra com e-mail e senha, continua no painel ao recarregar e encerra a sessão ao sair.
- **Intenção (por quê):** A conta da Spec 01 só protege o painel se a visita seguinte exigir a senha de novo e se sair encerrar de fato o acesso.
- **Contexto:** A tela de login já existe. Hoje o envio abre o painel sem conferir e-mail nem senha. O cabeçalho do painel já tem uma ação de sair que apenas abre o login. Esta spec faz o login conferir a conta criada na Spec 01 e faz o sair encerrar a sessão. O controle visual de "lembrar" que já está no login não muda a regra.
- **Atores:** Administrador que já possui conta.
- **Descrição do comportamento:** A pessoa informa e-mail e senha. Se conferem e ela é administradora, o painel abre. Se não conferem, permanece no login: o e-mail continua preenchido e a mensagem diz que não entrou, sem apontar se o e-mail ou a senha está errado. Campos vazios não tentam entrar. Com sessão válida, recarregar a página mantém a pessoa no painel, na área em que estava, sem pedir senha. Sair encerra a sessão e volta ao login. Uma sessão que deixa de valer, na próxima navegação, volta ao login sem mostrar dados do painel. Vários cliques em entrar concluem a entrada uma vez. Quem tem acesso autenticado mas não é administrador da academia não entra no painel.
- **Entradas e saídas:** Entradas: e-mail e senha; a ação de sair. Saídas: sessão do administrador e abertura do painel, ou permanência no login com mensagem de recusa. Ao sair: ausência de sessão e tela de login.
- **Dados/entidades envolvidos (conceitual):** Administrador já criado: e-mail e senha conferidos na entrada. Sessão: administrador autenticado, válida até sair. A senha não é exibida.
- **Estados e transições:** Sem sessão → login. Credenciais aceitas de um administrador → sessão válida e painel. Credenciais recusadas → sem sessão, permanece no login. Sair → sem sessão. Recarregar com sessão válida → mesma área, ainda autenticado. Sessão inválida no meio do uso → login na próxima navegação.
- **Regras de negócio:** Regras 1, 6 e 7. A sessão não depende do controle de "lembrar".
- **Validações:** E-mail e senha preenchidos antes de tentar entrar. A conferência da senha acontece no servidor. Login não revela qual dos dois campos falhou.
- **Fluxo do usuário (passo a passo):**
  1. A pessoa abre o login.
  2. Informa e-mail e senha e entra.
  3. O painel abre.
  4. Recarrega e continua lá.
  5. Sai e volta à tela de login.
  6. Sem senha correta, não chega ao painel.
- **Casos de borda e erros:** Senha errada ou e-mail desconhecido: mesma mensagem genérica, e-mail preservado, senha não precisa permanecer visível. Conta que existe no acesso mas não é administrador: não abre o painel. Falha de rede ao entrar: permanece no login, sem sessão, e pode tentar de novo. Vários cliques: uma entrada só. Sessão encerrada e botão de voltar do navegador: não reexibe dados do painel como se ainda estivesse dentro.
- **Impacto no existente:** O envio do login deixa de abrir o painel sem conferir. A ação de sair do cabeçalho passa a encerrar a sessão, não só a trocar de tela. O cadastro público não é reaberto por este fluxo.
- **Critérios de aceite (Dado/Quando/Então):**
  - Dado e-mail e senha corretos de um administrador, Quando entra, Então o painel abre.
  - Dado senha incorreta, Quando tenta entrar, Então permanece no login, o e-mail continua preenchido e a mensagem não diz qual campo falhou.
  - Dado campos vazios, Quando tenta entrar, Então o sistema não abre o painel.
  - Dado uma sessão válida, Quando a página é recarregada, Então a pessoa continua no painel, na mesma área, sem digitar a senha de novo.
  - Dado uma sessão válida, Quando sai, Então a visita seguinte ao painel pede login.
  - Dado alguém autenticado que não é administrador, Quando tenta abrir o painel, Então não vê o painel.
- **Definição de pronto:** Dá para entrar, recarregar sem perder a sessão e sair de um jeito que o painel feche de verdade.
- **Dependências:** Spec 01 — precisa existir a primeira conta.
- **Fora do escopo desta spec:** Trocar o visual do login, recuperar senha, incluir outro administrador, cadastrar aluno e alterar o que o dashboard mostra além do efeito da sessão.

### Spec 03 — Painel só com sessão

- **Fase:** 2
- **Objetivo (o quê):** O dashboard atual só aparece com sessão de administrador e o cabeçalho mostra o nome de quem entrou. **Novo Aluno** fica pronto para abrir o cadastro.
- **Intenção (por quê):** O painel de demonstração hoje se abre sozinho e apresenta um administrador fictício. Com a sessão da Spec 02, esse comportamento mostraria a operação da academia para quem não entrou e um nome que não é o da conta.
- **Contexto:** O dashboard já tem menu lateral, cabeçalho, métricas, aulas, avaliações e ações rápidas, com dados fixos de demonstração. O botão **Novo Aluno** está no cabeçalho e não navega. **Nova Matrícula** está nas ações rápidas e também não navega. O nome exibido é fixo. Esta spec não troca o menu, não calcula os números e não liga **Nova Matrícula**. O destino de **Novo Aluno** é a Spec 04; aqui o botão passa a levar a essa página, dentro da mesma casca.
- **Atores:** Administrador autenticado. Quem não tem sessão é afastado para o login.
- **Descrição do comportamento:** Sem sessão, abrir o painel ou a página de cadastro de aluno mostra o login, sem menu, sem métricas e sem formulário. Com sessão válida, o administrador vê a casca que já existe: menu lateral e cabeçalho. O cabeçalho mostra o nome do administrador que entrou, no lugar do nome fixo. A ação de sair é a da Spec 02. **Novo Aluno** abre a página de cadastro da Spec 04 sem perder menu e cabeçalho. **Nova Matrícula** continua sem destino. Os itens do menu continuam com os mesmos rótulos e destinos de hoje. Abrir o cadastro não cria item novo no menu nem marca um item "Alunos". As métricas, aulas e avaliações continuam ilustrativas. Recarregar mantém a sessão e a área atual. Em tela estreita, o menu permanece utilizável como já está; esta spec não promete um recolher novo.
- **Entradas e saídas:** Entrada: abrir o painel, acionar **Novo Aluno**, ou sair. Saída: dashboard, página de cadastro na mesma casca, ou login se não houver sessão. O nome exibido é o do administrador autenticado.
- **Dados/entidades envolvidos (conceitual):** Sessão do administrador e o nome dele. Nenhum aluno é gravado nesta spec. Os números do dashboard não passam a vir dos alunos cadastrados.
- **Estados e transições:** Sem sessão → login, sem casca. Sessão válida → casca visível e nome real no cabeçalho. **Novo Aluno** → página de cadastro com a mesma casca. Sair → login, casca some.
- **Regras de negócio:** Regras 1, 7 e 14. O menu e **Nova Matrícula** não mudam de função. Os números ilustrativos não são contagem de alunos.
- **Validações:** Não se aplica a campos de formulário. A única verificação é haver sessão de administrador antes de mostrar a casca ou o cadastro.
- **Fluxo do usuário (passo a passo):**
  1. O administrador entra.
  2. Vê o dashboard e o próprio nome no cabeçalho.
  3. Aciona **Novo Aluno**.
  4. O cadastro abre com o mesmo menu e o mesmo cabeçalho.
  5. Se a sessão não existe, qualquer uma dessas telas mostra o login.
- **Casos de borda e erros:** Sessão encerrada no meio do uso: a próxima abertura do painel ou do cadastro volta ao login, sem flash de métricas ou de formulário. Nome longo: o cabeçalho continua legível, sem empurrar a ação de sair para fora. Recarregar na página de cadastro: a sessão continua e a página de cadastro continua aberta. **Nova Matrícula** não abre o formulário de aluno.
- **Impacto no existente:** O dashboard deixa de ser público. O nome fixo do cabeçalho sai. **Novo Aluno** passa a navegar. O restante visual do dashboard permanece.
- **Critérios de aceite (Dado/Quando/Então):**
  - Dado alguém sem sessão, Quando abre o painel, Então vê o login e não as métricas.
  - Dado alguém sem sessão, Quando abre o cadastro de aluno, Então vê o login e não o formulário.
  - Dado um administrador autenticado, Quando o painel abre, Então o cabeçalho mostra o nome dessa pessoa.
  - Dado o dashboard aberto, Quando o administrador olha o menu e **Nova Matrícula**, Então eles continuam como antes, sem destino novo.
  - Dado o dashboard aberto, Quando aciona **Novo Aluno**, Então o formulário aparece com o mesmo menu e o mesmo cabeçalho.
  - Dado a página de cadastro aberta, Quando recarrega, Então continua nessa página, autenticado.
- **Definição de pronto:** Sem sessão não há painel. Com sessão, o nome é o de quem entrou e **Novo Aluno** abre o cadastro na mesma casca, sem mexer no menu nem nas métricas.
- **Dependências:** Spec 02 — a sessão que esta spec exige. Spec 04 — a página que **Novo Aluno** abre; até ela existir, o botão pode levar ao lugar certo e a página ainda mostrar que o formulário entra na Spec 04, sem inventar aluno.
- **Fora do escopo desta spec:** Campos e gravação do aluno, lista de alunos, números reais do dashboard, novo item de menu e incluir outro administrador.

### Spec 04 — Incluir aluno

- **Fase:** 3
- **Objetivo (o quê):** O administrador autenticado grava um aluno ativo e pode cadastrar outro em seguida na mesma página.
- **Intenção (por quê):** A recepção precisa registrar a pessoa antes de existir lista e ficha. O registro tem de nascer completo e ativo para a entrega seguinte não recomeçar do zero.
- **Contexto:** O aluno já está definido no produto: nome, data de nascimento, telefone, peso em kg, restrições médicas e situação cadastral. Este recorte também grava altura em cm e o plano escolhido no cadastro, entre avulso, mensal, trimestral, semestral e anual. Nasce ativo. Telefone não se repete. Não há exclusão. A página é aberta por **Novo Aluno**, na casca da Spec 03. Não há lista nesta spec: o sucesso é a mensagem na própria página. A entrega seguinte é que mostra o aluno, busca, edita e inativa. A escolha do plano não cria pagamento nem marca o aluno como em dia.
- **Atores:** Administrador autenticado.
- **Descrição do comportamento:** A página mostra o formulário com nome, data de nascimento, telefone, peso, altura, plano e restrições médicas. Restrições são opcionais. O plano é uma lista dos cinco tipos, sem opção pré-escolhida. Ao salvar, o sistema valida no servidor. Se os dados são válidos e o telefone ainda não existe, grava um aluno ativo com a altura e o plano escolhido. A página mostra sucesso, esvazia os campos e continua no cadastro. Se um campo é inválido, a mensagem fica junto desse campo e o restante digitado permanece. Se a gravação falha, não há sucesso, os campos permanecem e nenhum aluno novo conta como criado. Enquanto salva, o envio não pode ser concluído de novo. Sem sessão de administrador, a página não aparece e nada é gravado. O aluno não escolhe senha e não ganha acesso ao sistema. Aluno gravado antes da altura e do plano permanece sem esses dados.
- **Entradas e saídas:** Entradas: nome, data de nascimento, telefone, peso em kg, altura em cm, plano escolhido e restrições médicas, vindas do formulário. Saídas: aluno ativo gravado, mensagem de sucesso com formulário limpo, ou mensagem de erro no campo com o formulário preservado. Em falha geral de gravação: mensagem de que não salvou, campos preservados, sem aluno novo.
- **Dados/entidades envolvidos (conceitual):** Aluno: nome, data de nascimento, telefone, peso em kg, altura em cm, plano escolhido no cadastro, restrições médicas e situação cadastral. Neste recorte a situação gravada é sempre ativo. Restrições vazias significam que não há restrição informada. O telefone é único pelos seus dígitos. O plano escolhido é um dos cinco tipos e fica no aluno. Não há tabela de preços neste recorte. O plano vigente, quando o pagamento existir, é outro dado.
- **Estados e transições:** Formulário pronto → salvando → sucesso, com campos limpos e aluno ativo gravado. Formulário pronto → salvando → erro de campo, campos preservados, sem aluno. Formulário pronto → salvando → falha de gravação, campos preservados, sem aluno. Sem sessão → login, sem passar por esses estados.
- **Regras de negócio:** Regras 1, 8, 9, 10, 11, 12 e 13. O aluno nasce ativo. Não há ação de inativar aqui.
- **Validações:** Nome com pelo menos 2 caracteres, sem contar espaços nas pontas. Data de nascimento preenchida e anterior a hoje na data da academia, em São Paulo. Telefone com DDD e número, sem letras, totalizando 10 ou 11 dígitos; espaços e pontuação podem aparecer na digitação e não entram na contagem nem na unicidade. Peso maior que zero, em kg, com no máximo uma casa decimal. Altura maior que zero, em cm, com no máximo uma casa decimal. Plano preenchido com avulso, mensal, trimestral, semestral ou anual. Restrições opcionais. Telefone já usado por outro aluno impede salvar e aponta o campo de telefone. A validação que autoriza gravar acontece no servidor.
- **Fluxo do usuário (passo a passo):**
  1. O administrador aciona **Novo Aluno**.
  2. Preenche os campos obrigatórios e, se houver, as restrições.
  3. Salva e espera a confirmação.
  4. Lê a mensagem de sucesso e vê o formulário vazio.
  5. Pode cadastrar outra pessoa na mesma página.
- **Casos de borda e erros:** Data de hoje ou futura: o campo explica e não salva. Peso ou altura zero, negativo ou com mais de uma casa decimal: não salva. Plano vazio ou fora dos cinco tipos: não salva e indica o plano. Telefone com letra, curto demais ou longo demais: não salva. Telefone igual ao de um aluno já gravado, mesmo com máscara diferente: não salva e indica o telefone. Restrições em branco: salva. Dois cliques: um aluno só. Falha no meio do envio: os dados continuam na tela, a mensagem não é de sucesso e um novo envio do mesmo telefone ainda pode gravar, porque o anterior não criou o aluno. Sessão que acaba durante o salvamento: não grava e a pessoa volta ao login. Nome só com espaços: tratado como vazio e recusado. Aluno antigo sem altura e sem plano permanece gravado; este formulário não o edita.
- **Impacto no existente:** **Novo Aluno** deixa de ser um botão sem efeito. O dashboard, o menu e **Nova Matrícula** permanecem como a Spec 03 definiu. Nenhum contador do dashboard passa a incluir o aluno recém-gravado.
- **Critérios de aceite (Dado/Quando/Então):**
  - Dado um administrador no cadastro, Quando preenche nome, data de nascimento anterior a hoje, telefone válido, peso válido, altura válida e um dos cinco planos e salva, Então vê sucesso, os campos ficam vazios e o aluno fica gravado como ativo, com essa altura e esse plano escolhido.
  - Dado restrições em branco, Quando salva o restante válido, Então o aluno é gravado.
  - Dado um telefone já cadastrado, Quando tenta salvar outro aluno com esse telefone, mesmo com pontuação diferente, Então o sistema recusa e indica o telefone.
  - Dado data de nascimento hoje ou no futuro, Quando tenta salvar, Então não grava e explica no campo.
  - Dado peso ou altura zero ou negativo, Quando tenta salvar, Então não grava.
  - Dado o plano sem escolha, Quando tenta salvar, Então não grava e indica o plano.
  - Dado um plano escolhido, Quando o aluno é gravado, Então não nasce pagamento e a situação de pagamento não passa a em dia.
  - Dado um salvamento que falhou, Quando o administrador olha o formulário, Então os campos continuam preenchidos e não há mensagem de sucesso.
  - Dado um aluno já gravado, Quando o administrador sai, entra de novo e tenta o mesmo telefone, Então o sistema ainda recusa.
  - Dado dois cliques em salvar, Quando a gravação termina, Então existe um aluno, não dois.
  - Dado alguém sem sessão, Quando tenta gravar, Então nenhum aluno é criado.
- **Definição de pronto:** Um administrador autenticado cadastra alunos seguidos por **Novo Aluno**, recebe erro no campo certo sem perder o que digitou, e o aluno ativo continua gravado na visita seguinte. A página não lista esses alunos.
- **Dependências:** Spec 03 — a casca e o botão **Novo Aluno**. Spec 02 — a sessão de administrador. Spec 01 — a primeira conta, para que essa sessão exista.
- **Fora do escopo desta spec:** Lista, ficha, busca, edição, inativação, reativação, pagamento, agenda, avaliação, e-mail do aluno, tabela de preços dos planos e qualquer acesso do aluno ao sistema.

## 14. Ordem recomendada de implementação

1. Spec 01 — Primeiro administrador
2. Spec 02 — Entrar, permanecer e sair
3. Spec 03 — Painel só com sessão
4. Spec 04 — Incluir aluno

Seguir essa ordem evita cadastrar aluno sem sessão e evita proteger o painel antes de existir quem possa entrar. A Spec 04 depende da casca e do botão entregues na Spec 03.
