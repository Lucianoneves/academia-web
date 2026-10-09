# PRD — Painel do administrador da academia

> Tipo: PRD inicial · Data: 2026-10-08
> **Status:** Implementado
>
> <!-- Valores possíveis: "Aguardando implementação" | "Implementada". Atualize para "Implementada" quando todas as specs estiverem concluídas. -->

## 1. Visão geral

Painel web para o administrador de uma academia operar o dia a dia: alunos, planos, pagamentos lançados na recepção, horários de aula, agenda, categorias e avaliação médica.

O administrador entra com e-mail e senha e trabalha nas áreas. Alunos, planos, pagamentos, horários, agenda, categorias e avaliações ficam gravados e continuam lá depois de recarregar a página ou entrar de novo. As telas que buscam ou salvam dados mostram carregamento e erro, e a lista atualiza sozinha quando algo é salvo.

Não há cobrança por Pix ou cartão neste recorte. O aluno ainda não entra no sistema.

## 2. Problema que resolve

**Suposição:** hoje a academia controla alunos, mensalidades, horários e avaliações em caderno, planilha ou conversa solta. O administrador não vê, num único lugar, quem está cadastrado, qual plano vale, quem está em dia, qual aula tem vaga e quem precisa de nova avaliação médica.

Este painel junta essa operação numa sequência clara: cadastrar a pessoa, definir o que a academia vende, lançar o pagamento recebido em dinheiro, montar a grade e marcar o aluno na aula.

## 3. Público-alvo

**Confirmado:** o administrador da academia (dono ou recepção), numa única academia.

**Suposição:** neste recorte não há professor, financeiro separado nem rede de unidades. O aluno ainda não entra no sistema.

## 4. Objetivo do recorte atual

Entregar o painel em que o administrador:

- cadastra e consulta alunos
- mantém os planos e os preços
- lança pagamento em dinheiro e enxerga histórico e status
- monta horários com vagas e categoria
- agenda o aluno num horário com vaga
- acompanha a avaliação médica e o alerta de nova avaliação
- vê no início um resumo do que precisa de atenção
- entra com e-mail e senha, e o primeiro administrador cria a própria conta
- vê as listas atualizadas depois de salvar, com estado de carregamento e de erro

## 5. Funcionalidades

**Essenciais:**

- Navegação fixa do painel entre as áreas
- Alunos: incluir, editar, listar, buscar, ver ficha e inativar
- Planos: avulso, mensal, trimestral, semestral e anual, com preço editável
- Pagamentos em dinheiro: lançamento, histórico por aluno e status atual
- Horários: dia, hora, categoria e quantidade de vagas, repetidos toda semana
- Agenda: o administrador marca e cancela o aluno no horário
- Categorias: hipertrofia, emagrecer, resistência e bem-estar
- Avaliação médica: histórico por aluno e alerta de nova avaliação
- Dashboard: atalhos e resumo (alunos, pagamentos, agenda de hoje, categorias e avaliações)
- Acesso do administrador: cadastro do primeiro, login, sair e inclusão de outros administradores
- Dados que permanecem entre sessões, com carregamento, erro recuperável e listas que atualizam depois de cada salvamento

**Desejáveis:**

- Nenhuma neste recorte.

## 6. Fora do escopo

- **Primeiro acesso do aluno.** O aluno não cria senha nem entra no sistema neste recorte. Quando isso existir, o administrador cadastra o aluno com e-mail e o aluno define a própria senha no primeiro acesso.
- **Pagamento online (Pix e cartão).** Sem provedor e sem atualização automática de status. Quando existir, o pagamento online entra no mesmo histórico e no mesmo status do pagamento em dinheiro.
- **Autoagendamento pelo aluno.** O aluno escolhe o horário; pode agendar mesmo com pagamento atrasado ou avaliação vencida; cancela até 2 horas antes da aula e a vaga volta. Neste PRD quem agenda e cancela é o administrador.
- **Envio de arquivo.** O armazenamento de arquivos faz parte da stack, e nenhuma tela deste recorte envia foto, exame ou anexo.
- Várias academias, perfil de professor e aplicativo.
- Aviso de avaliação por e-mail ou WhatsApp. O alerta aparece só no painel.
- Check-in, presença, treino e relatório exportável.
- Bloqueio de agenda por inadimplência ou por avaliação vencida.

## 7. Regras de negócio

Decisões confirmadas e suposições estão marcadas. Suposição é o que este PRD adota para a tela funcionar; não foi uma escolha explícita do produto.

- Regra 1 — **Confirmado:** o painel tem as áreas Alunos, Planos, Pagamentos, Horários, Agenda, Categorias e Avaliação médica, além do início com o resumo.
- Regra 2 — **Confirmado:** aluno reúne nome, data de nascimento, telefone, peso e restrições médicas.
- Regra 3 — **Confirmado:** os planos são avulso, mensal, trimestral, semestral e anual.
- Regra 4 — **Confirmado:** a academia define o preço de cada plano. Avulso vale 1 aula. Mensal vale 30 dias, trimestral 90, semestral 180 e anual 365, contados a partir da data em que o período começa.
- Regra 5 — **Confirmado:** o aluno tem um plano ativo por vez. O plano ativo é o do pagamento mais recente que ainda cobre hoje, ou o crédito avulso ainda disponível.
- Regra 6 — **Confirmado:** o pagamento deste recorte é em dinheiro, lançado pelo administrador. Cada lançamento guarda aluno, plano, valor, data e forma (dinheiro).
- Regra 7 — **Confirmado:** a situação de pagamento do aluno é visível. Planos com prazo ficam **em dia** enquanto a data de hoje está dentro do período pago e **atrasado** quando o período acabou e não há pagamento novo cobrindo hoje. Aluno sem nenhum pagamento fica **sem pagamento**.
- Regra 8 — **Suposição:** o avulso não usa "atrasado". O crédito fica **disponível** depois do lançamento e passa a **utilizado** quando o administrador agenda uma aula para aquele aluno consumindo esse crédito. Cancelar essa aula devolve o crédito para **disponível**.
- Regra 9 — **Suposição:** se o aluno está em dia e o novo pagamento é um plano com prazo, o período novo começa no fim do período atual. Se está atrasado ou sem pagamento, o período começa na data do pagamento. Se o novo pagamento troca o tipo do plano, o período novo começa na data do pagamento e o plano anterior deixa de ser o ativo; o lançamento antigo continua no histórico.
- Regra 10 — **Confirmado:** cada horário tem dia da semana, hora de início, hora de fim, categoria e quantidade de vagas, e vale toda semana.
- Regra 11 — **Confirmado:** horário lotado não recebe outro aluno naquela data.
- Regra 12 — **Confirmado:** pagamento atrasado e avaliação vencida não impedem o agendamento. O administrador ainda vê esses avisos na hora de agendar.
- Regra 13 — **Confirmado:** as categorias iniciais são hipertrofia, emagrecer, resistência e bem-estar.
- Regra 14 — **Suposição:** o administrador pode incluir outra categoria, editar o nome e inativar. Categoria inativa não entra em horário novo; horários já ligados a ela continuam mostrando o nome.
- Regra 15 — **Confirmado:** a avaliação médica guarda o histórico de cada aluno. A validade é 6 meses após a data da avaliação. O alerta aparece a partir de 15 dias antes do vencimento e continua depois de vencer.
- Regra 16 — **Suposição:** aluno sem nenhuma avaliação aparece como **sem avaliação**.
- Regra 17 — **Suposição:** aluno, plano, categoria e horário não são apagados quando já existem pagamentos, avaliações ou agendamentos ligados a eles. Eles são inativados e somem das escolhas novas, permanecendo no histórico.
- Regra 18 — **Confirmado:** o administrador cancela um agendamento a qualquer momento antes do horário de início. A vaga volta. A regra de "até 2 horas antes" fica reservada ao aluno, no recorte futuro.
- Regra 19 — **Suposição:** valores em reais. Peso em quilogramas. Textos da interface em português.
- Regra 20 — **Confirmado:** só o administrador autenticado com e-mail e senha acessa o painel. Quem não entrou vê a tela de acesso.
- Regra 21 — **Confirmado:** o primeiro administrador se cadastra com nome, e-mail e senha. Depois disso o cadastro público fecha. Outros administradores são criados por quem já entrou, também com nome, e-mail e senha.
- Regra 22 — **Confirmado:** alunos, planos, pagamentos, horários, agendamentos, categorias e avaliações permanecem gravados depois de recarregar a página e num novo acesso.
- Regra 23 — **Confirmado:** telas que leem ou gravam dados mostram carregamento e, se a leitura falhar, um erro com nova tentativa. Depois de salvar, as listas e o resumo ligados àquela informação atualizam sem o administrador recarregar a página. Ao voltar para uma lista, a tela pode mostrar o que já tinha e atualizar em seguida.
- Regra 24 — **Confirmado:** a interface segue a linguagem visual do produto — barra lateral, azul institucional nas ações principais, cartões, tabelas e status em pílula — inclusive nos estados de carregamento, vazio e erro.

## 8. Fluxos principais

### Fluxo 0 — Entrar no painel

1. Se ainda não existe administrador, a pessoa informa nome, e-mail e senha e cria a primeira conta.
2. Nas próximas visitas, informa e-mail e senha e entra.
3. O painel abre no Início, com o menu.
4. Ao sair, volta para a tela de acesso. As informações já salvas continuam gravadas.
5. Um administrador já autenticado pode incluir outro, com nome, e-mail e senha.

### Fluxo 1 — Cadastrar o aluno e abrir a ficha

1. O administrador abre Alunos e escolhe incluir.
2. Informa nome, data de nascimento, telefone, peso e restrições médicas.
3. Salva. O aluno aparece na lista como ativo e **sem pagamento**.
4. Abre a ficha e vê os dados, a situação de pagamento, os agendamentos e as avaliações.

### Fluxo 2 — Definir preço e lançar pagamento em dinheiro

1. O administrador abre Planos e confere os cinco tipos.
2. Ajusta o preço do plano que a academia vende e mantém o plano ativo.
3. Abre Pagamentos, escolhe o aluno, o plano, o valor e a data.
4. Confirma o lançamento em dinheiro.
5. O histórico daquele aluno ganha a linha nova e a situação passa a **em dia** ou, no avulso, a crédito **disponível**.

### Fluxo 3 — Montar a grade e agendar

1. O administrador abre Categorias e confere as quatro categorias iniciais.
2. Abre Horários e cria um horário com dia, início, fim, categoria e vagas.
3. Abre Agenda, escolhe a data, o horário daquele dia da semana e o aluno ativo.
4. O sistema mostra vagas restantes e os avisos de pagamento e de avaliação, sem impedir.
5. Confirma. A vaga daquela data diminui.
6. Se cancelar, a vaga volta. Se o agendamento tinha consumido crédito avulso, o crédito volta a **disponível**.

### Fluxo 4 — Registrar avaliação e acompanhar o alerta

1. Na ficha do aluno, o administrador registra a data da avaliação e as observações.
2. O sistema calcula a validade para 6 meses depois.
3. No início do painel e na ficha, o aluno aparece **em dia** até 15 dias antes do vencimento, **a vencer** nos 15 dias finais e **vencida** depois da validade.
4. Aluno sem registro permanece **sem avaliação**.

## 9. Critérios de aceite

- O administrador consegue incluir, editar, buscar e inativar um aluno com nome, data de nascimento, telefone, peso e restrições médicas.
- O administrador consegue ver e editar o preço dos cinco planos.
- O administrador consegue lançar um pagamento em dinheiro e ver o histórico daquele aluno.
- O sistema deve mostrar a situação **em dia**, **atrasado** ou **sem pagamento** para planos com prazo, e **disponível** ou **utilizado** para o crédito avulso.
- O administrador consegue criar um horário semanal com categoria e vagas.
- O administrador consegue agendar um aluno quando ainda há vaga e o sistema recusa quando a data está lotada.
- O sistema deve permitir agendar com pagamento atrasado ou avaliação vencida, e deve mostrar esses avisos.
- O administrador consegue registrar uma avaliação e ver o alerta **a vencer**, **vencida** ou **sem avaliação**.
- O início do painel deve resumir alunos, pagamentos em dia, pagamentos atrasados, agendamentos de hoje e avaliações que pedem atenção.
- Sem sessão válida, o sistema deve mostrar a tela de acesso e não as áreas do painel.
- O primeiro administrador consegue criar a conta com nome, e-mail e senha. Depois disso, o cadastro público não fica disponível.
- Um administrador autenticado consegue incluir outro administrador e consegue sair.
- Um aluno, plano, pagamento, horário, agendamento, categoria ou avaliação salvos continuam lá depois de recarregar a página e num novo acesso.
- Enquanto os dados carregam, a tela deve mostrar carregamento. Se a leitura falhar, deve mostrar erro e uma nova tentativa.
- Depois de salvar, a lista daquela área deve mostrar a mudança sem o administrador recarregar a página.
- O sistema não deve cobrar por Pix ou cartão.
- O sistema não deve oferecer tela para o aluno entrar ou agendar sozinho.
- O sistema não deve pedir envio de arquivo.

## 10. Stack

**Confirmado:**

- TypeScript
- Next.js
- React
- Tailwind CSS
- Supabase para autenticação, banco de dados e armazenamento de arquivos
- TanStack Query para leitura e gravação assíncronas, cache e revalidação

A interface segue a linguagem visual já definida para o produto: painel com barra lateral, azul institucional nas ações principais, cartões e tabelas com hierarquia clara, e indicadores de status em formato de pílula (sucesso, aviso e erro). Carregamento, vazio e erro usam a mesma linguagem.

O armazenamento de arquivos entra na stack. Nenhuma tela deste recorte envia arquivo. Pagamento online (Pix e cartão) não faz parte deste recorte.

## 11. Justificativa da stack

O projeto já é uma aplicação Next.js com React, TypeScript e Tailwind. Supabase cobre acesso, dados que permanecem e, quando houver arquivo, o armazenamento, sem abrir outro serviço para cada um. TanStack Query mantém a tela honesta com dados assíncronos: o administrador vê carregamento, não olha lista velha depois de salvar, e ao voltar numa área a informação aparece na hora e se atualiza em seguida. Isso é o que deixa o painel utilizável no dia a dia.

## 12. Fases de construção

### Fase 1 — Acesso e base das telas

Objetivo: só o administrador entra, os dados permanecem, e o painel tem um lugar para cada área.

Specs:

- Spec 10 — Acesso do administrador
- Spec 11 — Dados persistentes e interface
- Spec 01 — Navegação do painel

### Fase 2 — Cadastros

Objetivo: o administrador mantém as informações básicas da academia.

Specs:

- Spec 02 — Alunos
- Spec 03 — Planos
- Spec 04 — Categorias de aula

### Fase 3 — Rotina da academia

Objetivo: o administrador cobra em dinheiro, monta a grade e marca o aluno na aula.

Specs:

- Spec 05 — Horários de aula
- Spec 06 — Pagamentos em dinheiro
- Spec 07 — Agenda pelo administrador

### Fase 4 — Acompanhamento

Objetivo: o administrador vê a saúde do aluno e o resumo do que precisa de ação.

Specs:

- Spec 08 — Avaliação médica e alertas
- Spec 09 — Resumo do dashboard

## 13. Specs funcionais detalhadas

> Cada spec deve ser autossuficiente: um agente de codificação vai ler SÓ esta spec (mais as dependências) para montar o plano técnico e implementar. Preencha todos os campos; se um não se aplica, escreva "Não se aplica" e o porquê.

### Spec 10 — Acesso do administrador

- **Fase:** 1
- **Objetivo (o quê):** O administrador cria a primeira conta, entra com e-mail e senha, sai, e quem já entrou inclui outros administradores.
- **Intenção (por quê):** O painel guarda dados da academia e de alunos. Sem acesso, qualquer pessoa veria ficha, pagamento e avaliação. O cadastro público fecha depois do primeiro administrador para a recepção controlar quem entra.
- **Contexto:** O projeto ainda não tem telas da academia nem acesso. Esta spec é a porta do painel da Spec 01. Não cria aluno, plano nem pagamento.
- **Atores:** Pessoa que cria a primeira conta. Administrador autenticado, ao incluir outro ou ao sair.
- **Descrição do comportamento:** Se não existe nenhum administrador, a tela de entrada é o cadastro: nome, e-mail, senha e confirmação da senha. Ao salvar, a conta passa a existir, a pessoa entra no painel e o cadastro público deixa de aparecer. Se já existe administrador, a tela de entrada é o login: e-mail e senha. Acesso aceito abre o Início. Acesso recusado permanece na tela e explica que não entrou, sem dizer se o erro foi o e-mail ou a senha. Dentro do painel, quem está autenticado vê o próprio nome, pode sair e pode incluir outro administrador com nome, e-mail, senha e confirmação. O novo administrador entra depois, pelo login, com esse e-mail e essa senha. Sair encerra a sessão e volta para o login. Recarregar a página com sessão válida não pede senha de novo e não devolve a pessoa para o cadastro. Área do painel aberta sem sessão redireciona para o login, sem mostrar dados.
- **Entradas e saídas:** Entradas: nome, e-mail, senha e confirmação, no cadastro e na inclusão; e-mail e senha, no login. Saídas: sessão do administrador, entrada no painel, mensagem de recusa ou de campo inválido, e volta ao login ao sair.
- **Dados/entidades envolvidos (conceitual):** Administrador: nome, e-mail e senha. Sessão: administrador autenticado, válida até sair. A senha não é exibida depois de salva.
- **Estados e transições:** Sem administrador nenhum → tela de cadastro. Depois do primeiro cadastro → só login na entrada pública. Sem sessão → login. Sessão válida → painel. Sair → sem sessão. Inclusão de outro administrador não encerra a sessão de quem incluiu.
- **Regras de negócio:** Regras 20 e 21. E-mail de administrador não se repete. O cadastro público só existe enquanto não há administrador. Aluno não usa esta tela.
- **Validações:** Nome com pelo menos 2 caracteres. E-mail em formato válido. Senha com pelo menos 8 caracteres. Confirmação igual à senha. E-mail já usado por outro administrador não salva. Login com campos vazios não tenta entrar.
- **Fluxo do usuário (passo a passo):**
  1. Na primeira visita, a pessoa preenche nome, e-mail, senha e confirmação.
  2. Salva e cai no painel.
  3. Sai e volta pelo login, com e-mail e senha.
  4. Inclui outro administrador.
  5. Esse segundo administrador entra pelo login.
- **Casos de borda e erros:** Senha diferente da confirmação: não salva e indica o campo. E-mail repetido: não salva. Senha errada: permanece no login com a mensagem de recusa e o e-mail ainda preenchido. Vários cliques em entrar ou salvar: a ação conclui uma vez. Sessão que deixa de valer: a próxima ação volta ao login. Cadastro público com administrador já existente: a tela de cadastro não é oferecida.
- **Impacto no existente:** A entrada do produto passa a ser o acesso. A página genérica do projeto deixa de ser o destino de quem abre o sistema.
- **Critérios de aceite (Dado/Quando/Então):**
  - Dado nenhum administrador, Quando a pessoa abre o sistema, Então vê o cadastro com nome, e-mail e senha.
  - Dado o primeiro cadastro válido, Quando salva, Então entra no painel e, ao sair, a próxima visita mostra login e não o cadastro público.
  - Dado e-mail e senha corretos, Quando entra, Então o painel abre.
  - Dado senha incorreta, Quando tenta entrar, Então permanece fora do painel.
  - Dado um administrador autenticado, Quando inclui outro com dados válidos e sai, Então o novo administrador consegue entrar com aquele e-mail e aquela senha.
  - Dado uma sessão válida, Quando a página é recarregada, Então a pessoa continua no painel sem digitar a senha de novo.
- **Definição de pronto:** Dá para criar o primeiro administrador, entrar, sair, incluir outro e impedir o cadastro público e o acesso anônimo às áreas.
- **Dependências:** Nenhuma.
- **Fora do escopo desta spec:** Primeiro acesso do aluno, recuperar senha, e-mail de convite, login com rede social, Pix, cartão e envio de arquivo.

### Spec 11 — Dados persistentes e interface

- **Fase:** 1
- **Objetivo (o quê):** Tudo o que o administrador salva nas áreas do painel permanece, e a tela mostra carregamento, erro recuperável e a lista já atualizada depois de gravar.
- **Intenção (por quê):** Um painel que esquece o aluno ao recarregar ou que deixa a lista velha depois de salvar não serve a recepção. Cache e revalidação existem para a interface responder rápido e ainda assim mostrar o dado novo.
- **Contexto:** Vale para as specs 02 a 09. O acesso é a Spec 10. A stack já escolhida guarda os dados e faz a leitura assíncrona, o cache e a revalidação. Esta spec descreve o comportamento, não a forma interna de chamar isso.
- **Atores:** Administrador autenticado.
- **Descrição do comportamento:** Cada inclusão, edição, inativação, lançamento, estorno, agendamento, cancelamento e avaliação das specs seguintes fica gravado. Recarregar a página, sair e entrar de novo, ou outro administrador entrar, mostra os mesmos dados. Enquanto uma lista ou ficha carrega, a área mostra carregamento na linguagem visual do painel, sem tabela vazia fingindo que não há registros. Se a leitura falha, a área mostra o erro e uma ação de tentar de novo; o que a pessoa tinha digitado num formulário aberto não some. Se já existe dado em cache daquela lista, a tela pode mostrá-lo na hora e atualizar em seguida, sem piscar para vazio. Depois que um salvamento conclui, as listas, a ficha e o resumo que dependem daquela informação passam a mostrar o resultado sem o administrador recarregar a página. Se o salvamento falha, o formulário continua preenchido e explica o que houve. Dois cliques em salvar não criam dois registros.
- **Entradas e saídas:** Entradas: as ações de ler e gravar definidas nas specs 02 a 09. Saídas: dados ainda presentes na visita seguinte, estado de carregamento, estado de erro com nova tentativa, e telas dependentes já atualizadas após sucesso.
- **Dados/entidades envolvidos (conceitual):** Os mesmos das specs 02 a 09: aluno, plano, categoria, horário, pagamento, agendamento e avaliação. Esta spec não cria entidade nova. Arquivo não entra, porque nenhuma tela envia arquivo.
- **Estados e transições:** Leitura: carregando → pronta, ou carregando → erro. Erro → carregando de novo ao tentar outra vez. Gravação: salvando → salva, e as telas ligadas atualizam; ou salvando → erro, com o formulário intacto. Dado em cache → dado revalidado quando a leitura nova termina.
- **Regras de negócio:** Regras 22, 23 e 24. Só administrador autenticado lê e grava. Falha de leitura não apaga o que já estava gravado. Falha de gravação não conta como registro criado.
- **Validações:** As validações de cada campo continuam nas specs de cada área. Esta spec acrescenta: não concluir a gravação duas vezes no mesmo envio, e não tratar erro de rede como lista vazia.
- **Fluxo do usuário (passo a passo):**
  1. O administrador abre uma área e vê o carregamento até os dados aparecerem.
  2. Salva um registro válido.
  3. A lista da área mostra o registro sem recarregar a página.
  4. Recarrega a página ou entra de novo e o registro continua lá.
  5. Se a leitura falhar, usa tentar de novo.
- **Casos de borda e erros:** Primeira visita sem registros: o estado vazio da área (convite para incluir) aparece depois do carregamento, e é diferente do erro. Erro no meio do salvamento: nada novo aparece na lista. Voltar para uma lista já visitada: o conteúdo anterior pode aparecer na hora e ser substituído se a leitura nova trouxer mudança feita por outro administrador. Sessão encerrada durante o carregamento: volta para o login, sem exibir dados.
- **Impacto no existente:** As specs 02 a 09 passam a obedecer este comportamento. Sem esta spec, elas descreveriam a regra de negócio e poderiam esquecer permanência e atualização da tela.
- **Critérios de aceite (Dado/Quando/Então):**
  - Dado um aluno salvo, Quando o administrador recarrega a página e entra de novo, Então o aluno continua na lista.
  - Dado uma lista carregando, Quando a leitura ainda não terminou, Então a tela mostra carregamento e não uma lista vazia.
  - Dado uma leitura que falhou, Quando a área mostra o erro, Então existe uma ação de tentar de novo.
  - Dado um salvamento concluído, Quando a lista dessa área está visível, Então ela mostra a mudança sem recarregar a página.
  - Dado um salvamento que falhou, Quando o administrador olha o formulário, Então os campos continuam preenchidos e a lista não ganhou um registro novo.
- **Definição de pronto:** Um registro de qualquer área coberta pelas specs 02 a 09 sobrevive a recarregar e a um novo acesso, e a interface distingue carregamento, vazio, erro e lista atualizada.
- **Dependências:** Spec 10 — só quem entrou lê e grava. As entidades em si vêm das specs 02 a 09; o comportamento desta spec vale assim que a primeira delas existir.
- **Fora do escopo desta spec:** Pix, cartão, envio de arquivo, login do aluno e desenho de cada formulário, que fica na spec da área.

### Spec 01 — Navegação do painel

- **Fase:** 1
- **Objetivo (o quê):** Entregar a casca do painel, com menu fixo para todas as áreas e uma página inicial ainda sem números.
- **Intenção (por quê):** As próximas specs precisam de um lugar estável para morar. Sem isso, cada área vira uma tela solta e o administrador não reconhece o produto.
- **Contexto:** O projeto ainda não tem telas da academia. Esta spec cria a estrutura que as specs 02 a 09 preenchem. O resumo numérico fica na Spec 09. O acesso e a sessão vêm da Spec 10. Carregamento e erro das áreas seguem a Spec 11.
- **Atores:** Administrador autenticado.
- **Descrição do comportamento:** Com sessão válida, o administrador vê uma barra lateral persistente e uma área de conteúdo. O menu lista, nesta ordem: Início, Alunos, Planos, Pagamentos, Horários, Agenda, Categorias e Avaliação médica. A área ativa fica destacada. A barra mostra o nome de quem entrou, a ação de incluir outro administrador e a ação de sair — o comportamento dessas ações é o da Spec 10. Início, nesta spec, explica em uma frase que o resumo entra depois e oferece os mesmos atalhos do menu. As áreas ainda não construídas pelas specs seguintes abrem um estado vazio com o nome da área e a frase de que o conteúdo entra na spec correspondente. A barra funciona em desktop; em tela estreita o menu pode recolher, e o administrador consegue abri-lo de novo. Sem sessão, esta casca não aparece: a pessoa fica na tela de acesso da Spec 10.
- **Entradas e saídas:** Entrada: escolha de um item do menu, ou sair. Saída: a área correspondente, o estado vazio enquanto a spec daquela área não existir, ou a tela de acesso ao sair.
- **Dados/entidades envolvidos (conceitual):** Nenhum dado de negócio novo. A lista fixa de áreas do painel e o nome do administrador autenticado, vindo da Spec 10.
- **Estados e transições:** Item do menu inativo → ativo ao ser escolhido. Os demais voltam a inativo. Sem sessão → tela de acesso, sem menu.
- **Regras de negócio:** A ordem e os nomes do menu seguem a Regra 1. Sair encerra a sessão (Regra 20). Recarregar a página mantém a sessão e a área atual.
- **Validações:** Não se aplica. Não há formulário nesta spec.
- **Fluxo do usuário (passo a passo):**
  1. O administrador abre o painel.
  2. Vê o menu e o início.
  3. Escolhe uma área.
  4. A área abre e o item fica marcado.
- **Casos de borda e erros:** Tela estreita: o menu recolhe e continua alcançável. Área ainda vazia: mostra o nome da área, sem erro e sem dados inventados. Recarregar a página: a sessão continua e a área atual permanece. Sessão encerrada no meio do uso: a próxima navegação volta para a tela de acesso, sem mostrar dados do painel.
- **Impacto no existente:** Nenhum módulo da academia existe hoje. A página inicial genérica do projeto deixa de ser a experiência do produto; quem já entrou cai no painel.
- **Critérios de aceite (Dado/Quando/Então):**
  - Dado o painel aberto, Quando o administrador olha o menu, Então vê Início, Alunos, Planos, Pagamentos, Horários, Agenda, Categorias e Avaliação médica, nesta ordem, além de sair.
  - Dado um item escolhido, Quando a área abre, Então esse item fica destacado e os outros não.
  - Dado o Início desta spec, Quando a página carrega, Então não mostra contadores de alunos, pagamentos ou avaliações.
  - Dado uma sessão válida numa área, Quando a página é recarregada, Então a mesma área continua aberta.
  - Dado alguém sem sessão, Quando tenta abrir uma área do painel, Então vê a tela de acesso.
- **Definição de pronto:** O administrador autenticado percorre todas as áreas pelo menu, em desktop e em tela estreita, sempre sabe em qual área está, e quem não entrou não vê o menu.
- **Dependências:** Spec 10 — sessão do administrador. Spec 11 — estados de carregamento das áreas que já tiverem dados.
- **Fora do escopo desta spec:** Números do dashboard, conteúdo de cada área e pagamento online. O cadastro e o login em si estão na Spec 10.

### Spec 02 — Alunos

- **Fase:** 2
- **Objetivo (o quê):** O administrador inclui, edita, busca, consulta e inativa alunos.
- **Intenção (por quê):** Aluno é a peça que pagamento, agenda e avaliação usam. Sem a ficha, o resto do painel não tem sobre quem falar.
- **Contexto:** Usa a navegação da Spec 01. A ficha reserva espaço para situação de pagamento (Spec 06), agendamentos (Spec 07) e avaliações (Spec 08). Enquanto essas specs não existirem, esses blocos da ficha dizem que ainda não há registros.
- **Atores:** Administrador.
- **Descrição do comportamento:** A área Alunos lista nome, telefone e situação cadastral (ativo ou inativo). Dá para buscar por nome ou telefone. Incluir e editar usam os mesmos campos: nome, data de nascimento, telefone, peso e restrições médicas. Restrições podem ficar vazias e, nesse caso, a ficha mostra "nenhuma". Ao salvar um aluno novo, ele entra ativo, no topo da lista. A ficha mostra os dados e três blocos futuros: pagamento, agenda e avaliação. Inativar pede confirmação, tira o aluno das escolhas de agenda e de pagamento novo, e mantém a ficha consultável pelo filtro "inativos". Reativar devolve o aluno às escolhas. Não há exclusão definitiva.
- **Entradas e saídas:** Entradas: nome, data de nascimento, telefone, peso em kg, restrições médicas, e a ação ativar ou inativar. Saídas: lista filtrada, ficha do aluno e mensagem de sucesso ou de erro ao lado do campo inválido.
- **Dados/entidades envolvidos (conceitual):** Aluno: nome, data de nascimento, telefone, peso, restrições médicas, situação cadastral (ativo ou inativo).
- **Estados e transições:** Novo aluno nasce ativo. Ativo → inativo só com confirmação. Inativo → ativo ao reativar. A situação de pagamento não muda nesta spec; todo aluno novo é tratado como sem pagamento até a Spec 06.
- **Regras de negócio:** Campos obrigatórios são nome, data de nascimento, telefone e peso. Restrições são opcionais. Telefone não se repete entre alunos. Aluno inativo continua no histórico. Vale a Regra 17.
- **Validações:** Nome com pelo menos 2 caracteres. Data de nascimento preenchida e anterior a hoje. Telefone com DDD e número, sem letras. Peso maior que zero, em kg, aceitando uma casa decimal. Telefone já usado por outro aluno impede salvar e aponta o campo.
- **Fluxo do usuário (passo a passo):**
  1. O administrador abre Alunos.
  2. Escolhe incluir e preenche os campos.
  3. Salva e vê o aluno na lista.
  4. Abre a ficha para conferir.
  5. Edita peso ou restrições e salva de novo.
  6. Se a pessoa sair da academia, inativa e confirma.
- **Casos de borda e erros:** Lista vazia: convite para incluir o primeiro aluno, sem tabela vazia quebrada. Busca sem resultado: mensagem clara e a lista some só enquanto o termo não encontra ninguém. Limpar a busca restaura a lista. Data de hoje ou futura na nascimento: o campo explica e não salva. Peso zero ou negativo: não salva. Dois cliques em salvar: grava uma vez só. Inativar é reversível; não existe desfazer apagando o histórico porque não há apagar.
- **Impacto no existente:** Preenche a área Alunos criada na Spec 01.
- **Critérios de aceite (Dado/Quando/Então):**
  - Dado o formulário válido, Quando o administrador salva, Então o aluno ativo aparece na lista com nome e telefone.
  - Dado um telefone já cadastrado, Quando tenta salvar outro aluno, Então o sistema recusa e indica o telefone.
  - Dado um aluno ativo com ficha aberta, Quando o administrador inativa e confirma, Então o aluno sai da lista padrão e aparece no filtro de inativos.
  - Dado restrições em branco, Quando a ficha abre, Então o texto exibido é "nenhuma".
- **Definição de pronto:** Dá para criar, buscar, editar, abrir a ficha, inativar e reativar um aluno, e os erros de campo aparecem sem perder o que já foi digitado.
- **Dependências:** Spec 01 — a área Alunos no menu. Spec 10 — só administrador autenticado. Spec 11 — o aluno salvo permanece e a lista atualiza depois de gravar.
- **Fora do escopo desta spec:** E-mail e senha do aluno, primeiro acesso do aluno, foto, pagamento, agenda, avaliação e exclusão definitiva.

### Spec 03 — Planos

- **Fase:** 2
- **Objetivo (o quê):** O administrador vê os cinco planos, edita o preço e liga ou desliga a venda de cada um.
- **Intenção (por quê):** O pagamento precisa de um plano com preço. Sem isso, cada lançamento inventaria valor e duração.
- **Contexto:** Área Planos da Spec 01. Os pagamentos da Spec 06 usam só planos ativos. Nenhum pagamento existe ainda.
- **Atores:** Administrador.
- **Descrição do comportamento:** A área mostra os cinco planos já criados: avulso, mensal, trimestral, semestral e anual. Cada um mostra a duração em linguagem simples (1 aula, 30 dias, 90 dias, 180 dias, 365 dias), o preço e se está ativo. O administrador edita o preço e pode inativar um plano para ele sumir das vendas novas. Não dá para criar um sexto tipo nem apagar um tipo. Plano inativo continua legível no histórico quando a Spec 06 existir. Ao abrir pela primeira vez, os cinco estão ativos e o preço começa em zero até o administrador definir; preço zero não pode ser vendido.
- **Entradas e saídas:** Entradas: preço e situação (ativo ou inativo) de um plano. Saídas: lista dos cinco planos com duração, preço e situação, e mensagem se o preço for inválido.
- **Dados/entidades envolvidos (conceitual):** Plano: tipo fixo (avulso, mensal, trimestral, semestral, anual), duração (1 aula ou 30, 90, 180, 365 dias), preço em reais, situação (ativo ou inativo).
- **Estados e transições:** Ativo com preço maior que zero → pode ser vendido na Spec 06. Ativo com preço zero → visível, mas não vendável. Inativo → fora das vendas novas. Inativo pode voltar a ativo.
- **Regras de negócio:** Os tipos e as durações são fixos (Regras 3 e 4). O preço é definido pela academia (Regra 4). Não se apaga plano (Regra 17).
- **Validações:** Preço em reais, maior ou igual a zero, com até duas casas decimais. Preço negativo não salva. Para vender, o preço precisa ser maior que zero; essa trava é usada na Spec 06, e esta spec já impede salvar negativo.
- **Fluxo do usuário (passo a passo):**
  1. O administrador abre Planos.
  2. Vê os cinco tipos e as durações.
  3. Informa o preço do plano que quer vender.
  4. Salva.
  5. Inativa um plano que a academia não oferece mais.
- **Casos de borda e erros:** Preço vazio ou com letras: o campo explica e mantém o valor anterior. Preço zero: salva e a lista marca que ainda não está à venda. Não há estado de lista vazia, porque os cinco planos sempre existem.
- **Impacto no existente:** Preenche a área Planos da Spec 01.
- **Critérios de aceite (Dado/Quando/Então):**
  - Dado a área Planos aberta, Quando a lista carrega, Então aparecem avulso, mensal, trimestral, semestral e anual com as durações da Regra 4.
  - Dado um preço válido, Quando o administrador salva, Então a lista mostra o novo preço.
  - Dado um plano inativado, Quando a lista atualiza, Então o plano continua visível como inativo e não existe ação de apagar.
- **Definição de pronto:** Os cinco planos existem sempre, o preço válido persiste durante o uso do painel e inativar não remove o tipo.
- **Dependências:** Spec 01 — a área Planos no menu. Spec 10 — só administrador autenticado. Spec 11 — preço e situação permanecem e a lista atualiza depois de gravar.
- **Fora do escopo desta spec:** Cobrança online, matrícula automática, desconto, combo de planos e criar tipos novos.

### Spec 04 — Categorias de aula

- **Fase:** 2
- **Objetivo (o quê):** O administrador consulta as quatro categorias iniciais e consegue ajustar a lista que a grade de horários vai usar.
- **Intenção (por quê):** O horário precisa dizer que tipo de aula é. A categoria evita texto solto e diferente para a mesma aula.
- **Contexto:** Área Categorias da Spec 01. A Spec 05 escolhe uma categoria ativa ao criar o horário.
- **Atores:** Administrador.
- **Descrição do comportamento:** A lista inicial contém hipertrofia, emagrecer, resistência e bem-estar, todas ativas. O administrador inclui uma categoria nova pelo nome, edita o nome de uma existente e inativa ou reativa. Não apaga. Categoria inativa deixa de aparecer na escolha de horário novo. A lista mostra o nome e a situação.
- **Entradas e saídas:** Entradas: nome da categoria e ação de inativar ou reativar. Saídas: lista de categorias com situação, e erro se o nome for inválido ou repetido.
- **Dados/entidades envolvidos (conceitual):** Categoria de aula: nome, situação (ativa ou inativa).
- **Estados e transições:** Nova categoria nasce ativa. Ativa → inativa com confirmação. Inativa → ativa ao reativar.
- **Regras de negócio:** As quatro iniciais existem sempre (Regra 13). O administrador pode incluir outra (Regra 14, suposição). Nome não se repete, ignorando maiúsculas. Não se apaga categoria.
- **Validações:** Nome com pelo menos 2 caracteres, sem ser só espaço. Nome repetido não salva.
- **Fluxo do usuário (passo a passo):**
  1. O administrador abre Categorias.
  2. Confere as quatro iniciais.
  3. Se precisar, inclui outra ou corrige um nome.
  4. Inativa a que não deve entrar em horário novo.
- **Casos de borda e erros:** Tentar inativar mostrando que horários futuros podem continuar com ela: a confirmação avisa isso em uma frase. Nome duplicado: aponta o campo. Lista nunca fica sem as quatro iniciais, mesmo inativas.
- **Impacto no existente:** Preenche a área Categorias da Spec 01.
- **Critérios de aceite (Dado/Quando/Então):**
  - Dado a primeira abertura, Quando a lista carrega, Então hipertrofia, emagrecer, resistência e bem-estar estão ativas.
  - Dado um nome novo válido, Quando o administrador salva, Então a categoria entra ativa na lista.
  - Dado uma categoria ativa, Quando ele inativa e confirma, Então ela permanece na lista como inativa.
- **Definição de pronto:** As quatro categorias iniciais existem e o administrador consegue incluir, renomear, inativar e reativar sem apagar histórico de nome.
- **Dependências:** Spec 01 — a área Categorias no menu. Spec 10 — só administrador autenticado. Spec 11 — a lista permanece e atualiza depois de gravar.
- **Fora do escopo desta spec:** Ligar categoria a horário (Spec 05), cor por categoria, nível de dificuldade e aula experimental.

### Spec 05 — Horários de aula

- **Fase:** 3
- **Objetivo (o quê):** O administrador cria a grade semanal: dia, hora, categoria e vagas.
- **Intenção (por quê):** A agenda marca pessoas em aulas que se repetem. Sem a grade, cada agendamento inventaria um horário diferente.
- **Contexto:** Usa categorias ativas da Spec 04. A Spec 07 usa estes horários para uma data concreta. A área Horários vem da Spec 01.
- **Atores:** Administrador.
- **Descrição do comportamento:** A lista mostra dia da semana, início, fim, categoria e vagas, só dos horários ativos por padrão, com filtro para ver inativos. Incluir pede dia da semana, hora de início, hora de fim, uma categoria ativa e a quantidade de vagas. O horário vale para toda data futura daquele dia da semana. Editar permite mudar horário, categoria e vagas. Inativar tira o horário das escolhas de agenda nova e mantém os agendamentos já feitos para o administrador tratar na Spec 07. Dois horários no mesmo dia podem se sobrepor, porque a academia pode ter aulas paralelas. Se as vagas novas ficarem menores que agendamentos já feitos numa data, os agendamentos existentes permanecem e aquela data não aceita gente nova até o número ocupado ficar abaixo das vagas.
- **Entradas e saídas:** Entradas: dia da semana, início, fim, categoria ativa, vagas, situação. Saídas: grade listada e mensagem de erro no campo inválido.
- **Dados/entidades envolvidos (conceitual):** Horário de aula: dia da semana, hora de início, hora de fim, categoria, quantidade de vagas, situação (ativo ou inativo).
- **Estados e transições:** Novo horário nasce ativo. Ativo → inativo com confirmação. Inativo → ativo ao reativar, desde que a categoria ainda exista; se a categoria estiver inativa, a reativação do horário pede uma categoria ativa.
- **Regras de negócio:** Vale toda semana (Regra 10). Vagas são um número inteiro maior ou igual a 1. Categoria precisa estar ativa na hora de criar ou trocar. Não se apaga horário com agendamento ligado (Regra 17). Sobreposição no mesmo dia é permitida.
- **Validações:** Dia da semana obrigatório. Início e fim obrigatórios, fim depois do início, no mesmo dia (não atravessa meia-noite). Vagas inteiras, no mínimo 1. Categoria ativa obrigatória.
- **Fluxo do usuário (passo a passo):**
  1. O administrador abre Horários.
  2. Inclui dia, início, fim, categoria e vagas.
  3. Salva e vê o horário na grade.
  4. Ajusta vagas ou inativa quando a aula deixa de existir.
- **Casos de borda e erros:** Nenhuma categoria ativa: o formulário explica que é preciso ativar uma categoria antes, e não salva. Fim igual ou antes do início: não salva. Vagas zero: não salva. Grade vazia: convite para criar o primeiro horário. Inativar avisa que agendamentos já marcados continuam até alguém cancelar.
- **Impacto no existente:** Preenche a área Horários da Spec 01 e passa a depender da lista de categorias da Spec 04.
- **Critérios de aceite (Dado/Quando/Então):**
  - Dado dia, horas válidas, categoria ativa e vagas, Quando o administrador salva, Então o horário aparece na grade semanal.
  - Dado fim menor ou igual ao início, Quando tenta salvar, Então o sistema recusa e indica o horário.
  - Dado um horário ativo, Quando é inativado, Então ele sai da lista padrão e continua no filtro de inativos.
- **Definição de pronto:** A grade semanal pode ser criada, editada e inativada, sempre com categoria ativa e vagas válidas.
- **Dependências:** Spec 01 — menu. Spec 04 — categorias ativas. Spec 10 — só administrador autenticado. Spec 11 — a grade permanece e atualiza depois de gravar.
- **Fora do escopo desta spec:** Data avulsa fora da recorrência semanal, sala, professor, agenda do aluno e pagamento.

### Spec 06 — Pagamentos em dinheiro

- **Fase:** 3
- **Objetivo (o quê):** O administrador lança o dinheiro recebido na recepção, vê o histórico de cada aluno e a situação atual.
- **Intenção (por quê):** A academia precisa saber quem está em dia e quem atrasou, mesmo sem cobrança online. O lançamento manual é o controle deste recorte.
- **Contexto:** Usa alunos ativos da Spec 02 e planos da Spec 03. A ficha do aluno passa a mostrar situação e histórico. A agenda (Spec 07) e o dashboard (Spec 09) leem esta situação, sem bloquear aula.
- **Atores:** Administrador.
- **Descrição do comportamento:** A área Pagamentos lista os alunos com a situação atual e permite filtrar por em dia, atrasado, sem pagamento, crédito disponível e crédito utilizado. Busca por nome. Abrir um aluno mostra o histórico: data, plano, valor, forma (sempre dinheiro neste recorte) e o que aquele lançamento fez no período. Lançar pagamento pede aluno ativo, plano ativo com preço maior que zero, valor e data. O valor sugerido é o preço do plano e pode ser alterado (desconto ou acerto de balcão). A forma é dinheiro, fixa e visível. Ao confirmar, o histórico ganha a linha e a situação do aluno é recalculada. Não se apaga lançamento. Não se edita lançamento; um erro se corrige com um novo lançamento e, se for preciso anular o efeito, o administrador registra um estorno em dinheiro informando o lançamento de origem. O estorno não apaga a linha original: as duas ficam no histórico e a situação é recalculada sem contar o valor estornado como cobertura.
- **Entradas e saídas:** Entradas: aluno, plano, valor, data do pagamento, e opcionalmente o lançamento que se estorna. Saídas: lista de alunos com situação, histórico do aluno, mensagens de validação.
- **Dados/entidades envolvidos (conceitual):** Pagamento: aluno, plano, valor em reais, data, forma (dinheiro), tipo (recebimento ou estorno), e, no estorno, qual recebimento ele anula. Situação do aluno: em dia, atrasado, sem pagamento, crédito disponível ou crédito utilizado. Período coberto: data de início e data de fim para planos com prazo; para avulso, um crédito de 1 aula.
- **Estados e transições:** Aluno sem lançamento: **sem pagamento**. Recebimento de plano com prazo, cobrindo hoje: **em dia**. Período encerrado sem recebimento que cubra hoje: **atrasado**. Recebimento avulso sem aula consumida: **crédito disponível**. Agenda consome o crédito (Spec 07): **crédito utilizado**. Estorno de um recebimento tira a cobertura daquele lançamento e a situação volta ao que os lançamentos restantes determinam. Cancelar a aula que consumiu o crédito devolve **crédito disponível** (Spec 07).
- **Regras de negócio:** Regras 5, 6, 7, 8 e 9. Só aluno ativo e plano ativo com preço maior que zero entram num recebimento novo. A data do pagamento não pode ser futura. O estorno aponta um recebimento que ainda não foi estornado. Um recebimento só tem um estorno. A situação é sempre derivada dos lançamentos; o administrador não escolhe "atrasado" na mão.
- **Validações:** Aluno ativo obrigatório. Plano ativo com preço maior que zero obrigatório. Valor maior que zero, até duas casas. Data obrigatória, hoje ou no passado. Estorno sem recebimento de origem não salva. Segundo estorno do mesmo recebimento não salva.
- **Fluxo do usuário (passo a passo):**
  1. O administrador abre Pagamentos e vê quem está sem pagamento, em dia ou atrasado.
  2. Escolhe lançar, seleciona o aluno e o plano.
  3. Confere o valor sugerido, ajusta se preciso, informa a data e confirma.
  4. Abre o aluno e confere a nova linha e a situação.
  5. Se lançou errado, registra o estorno daquela linha.
- **Casos de borda e erros:** Nenhum aluno ativo: o lançamento explica que é preciso cadastrar um aluno. Plano com preço zero: não aparece para vender. Dois recebimentos no mesmo dia: ambos entram no histórico; a Regra 9 decide o período. Avulso enquanto já existe plano com prazo em dia: o avulso passa a ser o plano ativo a partir da data do pagamento e o prazo anterior deixa de cobrir, conforme a Regra 9; o histórico conserva os dois. Aluno inativo: não recebe lançamento novo e o histórico antigo continua abrível. Filtro sem resultados: mensagem específica daquele filtro.
- **Impacto no existente:** A ficha do aluno (Spec 02) passa a mostrar situação e histórico reais no lugar do bloco vazio de pagamento.
- **Critérios de aceite (Dado/Quando/Então):**
  - Dado um aluno sem pagamentos, Quando a lista carrega, Então a situação dele é sem pagamento.
  - Dado um recebimento mensal com data de hoje, Quando o administrador confirma, Então a situação fica em dia e o histórico mostra valor, plano, data e dinheiro.
  - Dado um mensal cujo período já acabou e não há outro pagamento cobrindo hoje, Quando a lista carrega, Então a situação é atrasado.
  - Dado um recebimento avulso, Quando ainda não houve agendamento que o consuma, Então a situação é crédito disponível.
  - Dado um recebimento estornado, Quando a situação é recalculada, Então aquele valor deixa de cobrir o período e a linha original continua visível junto com o estorno.
- **Definição de pronto:** Dá para lançar dinheiro, filtrar por situação, abrir o histórico de um aluno e estornar um recebimento sem apagar linha.
- **Dependências:** Spec 02 — alunos ativos. Spec 03 — planos e preços. Spec 01 — menu. Spec 10 — só administrador autenticado. Spec 11 — o histórico permanece e a situação atualiza depois de gravar.
- **Fora do escopo desta spec:** Pix, cartão, boleto, link de pagamento, parcelamento, nota fiscal e editar ou apagar um lançamento.

### Spec 07 — Agenda pelo administrador

- **Fase:** 3
- **Objetivo (o quê):** O administrador marca um aluno ativo num horário da grade, numa data, respeitando as vagas, e pode cancelar.
- **Intenção (por quê):** A grade sozinha não diz quem vem. A agenda é o compromisso do aluno com aquela aula. Neste recorte o aluno ainda não entra no sistema, então quem marca é o administrador.
- **Contexto:** Usa horários ativos da Spec 05, alunos ativos da Spec 02 e a situação de pagamento da Spec 06 só como aviso. A ficha do aluno passa a listar os agendamentos.
- **Atores:** Administrador.
- **Descrição do comportamento:** A agenda abre numa data, por padrão hoje. Mostra os horários ativos daquele dia da semana, com vagas totais, vagas ocupadas e vagas restantes. O administrador escolhe o horário e um aluno ativo. Antes de confirmar, vê a situação de pagamento e o aviso de avaliação se a Spec 08 já existir; se ainda não existir, o aviso de avaliação fica de fora até lá. Pagamento atrasado, sem pagamento ou avaliação vencida não impedem confirmar. Horário lotado impede. Não se agenda em data passada. O mesmo aluno não entra duas vezes no mesmo horário na mesma data. Ele pode entrar em outro horário no mesmo dia. Ao confirmar, a vaga ocupada aumenta. Se a situação do aluno for crédito avulso disponível, este agendamento consome esse crédito e a situação passa a crédito utilizado. Cancelar, a qualquer momento antes do início da aula, pede confirmação, devolve a vaga e, se aquele agendamento tinha consumido o crédito avulso, devolve o crédito para disponível. Depois do horário de início, cancelar não está mais disponível. A lista do dia mostra aluno, horário, categoria e se está marcado ou cancelado. Cancelados permanecem visíveis como cancelados, para o histórico do dia não sumir.
- **Entradas e saídas:** Entradas: data, horário ativo daquele dia da semana, aluno ativo, e a ação de cancelar. Saídas: ocupação do horário na data, lista de marcados e cancelados, avisos de pagamento e de avaliação, erro quando não há vaga ou a data é inválida.
- **Dados/entidades envolvidos (conceitual):** Agendamento: aluno, horário de aula, data, situação (marcado ou cancelado), e se consumiu crédito avulso. Ocupação da data: vagas do horário menos os agendamentos ainda marcados naquela data.
- **Estados e transições:** Marcado ao confirmar, desde que haja vaga e a data não seja passada. Marcado → cancelado antes do início, com confirmação. Cancelado não volta; se a pessoa for de novo, o administrador cria outro agendamento, se houver vaga. Crédito avulso disponível → utilizado ao marcar, e utilizado → disponível se esse agendamento for cancelado.
- **Regras de negócio:** Regras 8, 11 e 12. Quem agenda neste recorte é o administrador. Cancelamento pelo administrador vale até o início da aula (Regra 18). Horário inativo não aceita marcação nova. Aluno inativo não é marcado. Aulas paralelas no mesmo dia são independentes: cada horário tem a própria contagem de vagas.
- **Validações:** Data obrigatória, hoje ou futura. Horário ativo que ocorra naquele dia da semana. Aluno ativo. Vagas restantes pelo menos 1. Aluno ainda não marcado naquele horário naquela data. Cancelar só com agendamento marcado e antes do início.
- **Fluxo do usuário (passo a passo):**
  1. O administrador abre Agenda e escolhe a data.
  2. Vê os horários daquele dia e as vagas.
  3. Escolhe horário e aluno.
  4. Lê o aviso de pagamento, se houver, e confirma.
  5. Vê o aluno na lista do horário.
  6. Se precisar desmarcar, cancela antes do início e vê a vaga voltar.
- **Casos de borda e erros:** Data sem horário naquele dia da semana: mensagem de que não há aula, sem formulário de marcar. Lotado: o botão de confirmar não conclui e explica que não há vaga. Aluno já marcado naquele horário: recusa a duplicata. Dois horários sobrepostos: o aluno pode estar nos dois; o sistema não impede. Reduzir vagas na Spec 05 abaixo do já ocupado: a data mostra ocupação acima da capacidade e não aceita mais ninguém, sem apagar os já marcados. Cancelar depois do início: a ação não aparece. Agendamento de aluno que depois foi inativado: o registro do dia continua visível.
- **Impacto no existente:** A ficha do aluno passa a listar agendamentos. A situação de crédito avulso da Spec 06 muda quando a marcação consome ou devolve o crédito. Horários inativos deixam de ser escolhidos.
- **Critérios de aceite (Dado/Quando/Então):**
  - Dado um horário com vaga numa data futura, Quando o administrador confirma um aluno ativo, Então o aluno aparece marcado e as vagas restantes diminuem.
  - Dado um horário sem vaga restante, Quando tenta marcar outro aluno, Então o sistema recusa.
  - Dado um aluno atrasado ou sem pagamento, Quando o administrador confirma e há vaga, Então o agendamento entra e o aviso de pagamento foi mostrado antes.
  - Dado um crédito avulso disponível, Quando o agendamento é confirmado, Então o crédito fica utilizado.
  - Dado esse agendamento cancelado antes do início, Quando a confirmação do cancelamento ocorre, Então a vaga volta e o crédito avulso fica disponível de novo.
  - Dado uma data passada, Quando tenta marcar, Então o sistema recusa.
- **Definição de pronto:** Para uma data, o administrador vê a grade do dia, marca enquanto há vaga, recebe os avisos sem ser bloqueado por eles, e cancela antes do início com devolução de vaga e de crédito avulso.
- **Dependências:** Spec 02 — alunos ativos. Spec 05 — horários. Spec 06 — situação de pagamento e crédito avulso. Spec 01 — menu. Spec 10 — só administrador autenticado. Spec 11 — o agendamento permanece e a ocupação atualiza depois de gravar. O aviso de avaliação passa a aparecer quando a Spec 08 existir; até lá, a agenda funciona sem esse aviso.
- **Fora do escopo desta spec:** O aluno marcar ou cancelar sozinho, a trava de 2 horas do aluno, lista de espera, check-in e remarcar arrastando o horário.

### Spec 08 — Avaliação médica e alertas

- **Fase:** 4
- **Objetivo (o quê):** O administrador registra o histórico de avaliação de cada aluno e vê quem está a vencer, vencido ou sem avaliação.
- **Intenção (por quê):** A academia precisa saber quando chamar o aluno de novo, sem impedir a aula. O alerta é um lembrete visual, não uma trava.
- **Contexto:** Parte da ficha do aluno (Spec 02) e ganha uma área própria no menu para a fila de alertas. A agenda (Spec 07) passa a mostrar o aviso correspondente na hora de marcar, ainda sem bloquear.
- **Atores:** Administrador.
- **Descrição do comportamento:** Na ficha do aluno, o administrador registra uma avaliação com a data e as observações. O sistema calcula a validade para 6 meses depois dessa data e mostra os dois. O histórico lista da mais recente para a mais antiga. Não se apaga e não se edita; uma correção é um novo registro. A situação da avaliação usa a data de hoje e o registro mais recente: **em dia** quando faltam mais de 15 dias para a validade, **a vencer** quando faltam 15 dias ou menos e a validade ainda não passou, **vencida** quando hoje é depois da validade, **sem avaliação** quando não há registro. A área Avaliação médica lista os alunos ativos nessas situações e filtra por a vencer, vencida e sem avaliação. Aluno inativo não entra nessa fila e o histórico dele continua na ficha. Na agenda, ao escolher o aluno, o aviso mostra a situação da avaliação em uma linha. Confirmar o agendamento continua possível em qualquer situação.
- **Entradas e saídas:** Entradas: aluno, data da avaliação, observações. Saídas: histórico do aluno, validade calculada, situação, fila filtrada de alertas, aviso na agenda.
- **Dados/entidades envolvidos (conceitual):** Avaliação médica: aluno, data da avaliação, observações, validade (data da avaliação mais 6 meses). Situação derivada do registro mais recente: em dia, a vencer, vencida ou sem avaliação.
- **Estados e transições:** Sem avaliação → em dia, a vencer ou vencida conforme a data do primeiro registro e o dia de hoje. Um registro mais novo substitui o anterior só no cálculo da situação; o antigo permanece no histórico. Não há transição manual da situação.
- **Regras de negócio:** Regras 15 e 16. A validade não é digitada. O alerta não bloqueia agenda (Regra 12). Observações podem ficar vazias. A data da avaliação não pode ser futura.
- **Validações:** Aluno obrigatório. Data obrigatória, hoje ou no passado. Não permite dois registros idênticos do mesmo aluno na mesma data com as mesmas observações; se a data for a mesma e as observações mudarem, salva como outro registro do mesmo dia, o mais recente na ordem de inclusão vence a situação.
- **Fluxo do usuário (passo a passo):**
  1. O administrador abre a ficha do aluno ou a área Avaliação médica.
  2. Registra data e observações.
  3. Vê a validade e a situação.
  4. Na área de avaliação, filtra quem está a vencer, vencido ou sem avaliação.
  5. Na agenda, vê o aviso ao marcar e segue se quiser.
- **Casos de borda e erros:** Aluno sem avaliação: a ficha mostra sem avaliação e a fila o inclui nesse filtro. Data futura: não salva. Validade que cai em mês sem o mesmo dia: a validade vai para o último dia daquele mês, 6 meses depois. Vários registros: a situação usa só o mais recente e o histórico mostra todos. Aluno inativo some da fila e permanece consultável na ficha.
- **Impacto no existente:** A ficha do aluno deixa o bloco de avaliação vazio e passa a ter histórico. A agenda passa a exibir o aviso de avaliação além do aviso de pagamento.
- **Critérios de aceite (Dado/Quando/Então):**
  - Dado um aluno sem registros, Quando a ficha ou a fila abre, Então a situação é sem avaliação.
  - Dado uma avaliação com data de hoje, Quando o administrador salva, Então a validade exibida é 6 meses depois e a situação é em dia.
  - Dado uma validade que ocorre em 10 dias, Quando a fila carrega, Então o aluno aparece como a vencer.
  - Dado uma validade que já passou, Quando a fila carrega, Então o aluno aparece como vencida.
  - Dado um aluno vencido com vaga na agenda, Quando o administrador confirma o agendamento, Então a aula é marcada e o aviso de avaliação vencida foi mostrado.
- **Definição de pronto:** Cada aluno tem histórico, a situação bate com a regra dos 6 meses e dos 15 dias, a fila filtra os alertas e a agenda mostra o aviso sem bloquear.
- **Dependências:** Spec 02 — ficha do aluno. Spec 01 — menu. Spec 10 — só administrador autenticado. Spec 11 — o histórico permanece e a fila atualiza depois de gravar. Spec 07 — para o aviso na hora de agendar. Se a agenda ainda não estiver pronta, a avaliação funciona na ficha e na fila mesmo assim.
- **Fora do escopo desta spec:** Anexo de exame, nome do médico como cadastro próprio, aviso por e-mail ou WhatsApp, e impedir agendamento.

### Spec 09 — Resumo do dashboard

- **Fase:** 4
- **Objetivo (o quê):** O início do painel resume o que o administrador precisa ver ao chegar: alunos, pagamentos, agenda de hoje, categorias e avaliações.
- **Intenção (por quê):** As áreas já guardam o detalhe. O início existe para a pessoa saber por onde começar, sem abrir área por área.
- **Contexto:** Substitui o início vazio da Spec 01. Lê alunos (Spec 02), planos e categorias só como atalho e contagem simples (Specs 03 e 04), pagamentos (Spec 06), agenda de hoje (Spec 07) e alertas médicos (Spec 08).
- **Atores:** Administrador.
- **Descrição do comportamento:** O início mostra cartões com atalho para cada área e estes números, calculados na hora: quantidade de alunos ativos; quantidade de alunos ativos em dia; quantidade de alunos ativos atrasados; quantidade de alunos ativos sem pagamento; agendamentos marcados para hoje; avaliações de alunos ativos em a vencer, vencida ou sem avaliação. Cada número abre a área já filtrada quando o filtro existir (pagamentos atrasados, agenda na data de hoje, avaliação no grupo de atenção). Categorias mostram quantas estão ativas, como atalho, sem virar relatório. Planos mostram quantos estão à venda (ativos com preço maior que zero). Abaixo dos números, duas listas curtas: próximos agendamentos marcados de hoje (aluno, horário, categoria) e alunos que pedem avaliação (a vencer, vencida, sem avaliação). Lista vazia explica que não há item, com atalho para a área.
- **Entradas e saídas:** Entrada: abertura do Início. Saídas: contagens, listas curtas e navegação para a área filtrada. Não há formulário.
- **Dados/entidades envolvidos (conceitual):** Nenhum dado novo. O resumo lê aluno, situação de pagamento, agendamento marcado de hoje, situação da avaliação, categoria ativa e plano à venda.
- **Estados e transições:** Não se aplica. O resumo não tem estado próprio; muda quando os dados das outras specs mudam.
- **Regras de negócio:** Conta só aluno ativo nas situações de pagamento e de avaliação. Agendamento cancelado não entra no número de hoje. Crédito disponível e crédito utilizado não entram nos cartões "em dia" e "atrasado"; eles aparecem dentro do atalho de pagamentos, para os cartões de prazo não misturarem aula avulsa com mensalidade. O cartão de pagamentos deixa explícitos três números de prazo: em dia, atrasado e sem pagamento.
- **Validações:** Não se aplica. Não há entrada de dados.
- **Fluxo do usuário (passo a passo):**
  1. O administrador abre o Início.
  2. Lê os números.
  3. Abre um número e cai na área filtrada.
  4. Volta e confere a lista de aulas de hoje e a lista de avaliações.
- **Casos de borda e erros:** Academia sem alunos: todos os números de aluno são zero e as listas explicam o vazio. Aula de hoje já iniciada e ainda marcada: continua na lista de hoje até o fim do dia. Avaliação e pagamento de aluno inativo: ficam de fora dos números.
- **Impacto no existente:** O Início da Spec 01 deixa de ser a página sem números e passa a ser este resumo.
- **Critérios de aceite (Dado/Quando/Então):**
  - Dado alunos ativos em dia e atrasados, Quando o Início abre, Então os cartões mostram essas quantidades separadas.
  - Dado um agendamento marcado para hoje, Quando o Início abre, Então ele entra no número e na lista de hoje.
  - Dado um agendamento de hoje cancelado, Quando o Início abre, Então ele não entra no número.
  - Dado o cartão de atrasados, Quando o administrador o aciona, Então abre Pagamentos filtrado em atrasado.
  - Dado nenhum aluno cadastrado, Quando o Início abre, Então os números são zero e há orientação para cadastrar, sem erro.
- **Definição de pronto:** O Início mostra os números e as duas listas a partir dos dados reais das specs anteriores, e cada atalho abre a área certa.
- **Dependências:** Specs 01, 02, 03, 04, 06, 07, 08, 10 e 11.
- **Fora do escopo desta spec:** Gráfico, meta financeira, exportação, comparação entre meses e qualquer número de Pix ou cartão.

## 14. Ordem recomendada de implementação

1. Spec 10 — Acesso do administrador
2. Spec 11 — Dados persistentes e interface
3. Spec 01 — Navegação do painel
4. Spec 02 — Alunos
5. Spec 03 — Planos
6. Spec 04 — Categorias de aula
7. Spec 05 — Horários de aula
8. Spec 06 — Pagamentos em dinheiro
9. Spec 07 — Agenda pelo administrador
10. Spec 08 — Avaliação médica e alertas
11. Spec 09 — Resumo do dashboard

Seguir essa ordem evita construir agenda, pagamento ou resumo sem as informações de que dependem, e evita área do painel sem acesso e sem dados que permanecem. A Spec 08 pode ser feita logo depois da Spec 02 se a fila de avaliação for prioritária; o aviso dentro da agenda espera a Spec 07. A Spec 11 acompanha a primeira área que grava dados e vale para todas as seguintes.
