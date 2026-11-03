# Missões IDE — automações de WhatsApp (UazAPI)

## Estado / segurança
A arquitetura foi implementada no GitHub, mas **não há envio liberado por padrão**.
O telefone **remetente** é o WhatsApp que está conectado à instância UazAPI do Superadmin (token `UAZAPI_TOKEN`, telefone `UAZAPI_PHONE`). O destino de teste é **+55 27 98139-2914**, fixado no backend. Nenhum segredo deve ser exposto no frontend.

### Ativar publicação automática do Supabase via GitHub
Configurar **uma única vez** no repositório em Settings → Secrets and variables → Actions:
- Secret `SUPABASE_ACCESS_TOKEN`: token pessoal de acesso Supabase, cadastrado **apenas em GitHub Actions Secrets**.
- Secret `SUPABASE_DB_PASSWORD`: senha do banco Supabase, armazenada apenas no Actions Secrets.
- Variable `SUPABASE_PROJECT_REF`: ID do projeto Supabase da aplicação Missões IDE.

A workflow `.github/workflows/supabase-deploy.yml` dispara quando a branch `main` recebe mudanças sob `supabase/`; aplica migrações antes de publicar as funções. Sem esses valores, a publicação **não acontece**. Verificar o status da ação no GitHub Actions. Não divulgar tokens ou senhas no chat.

### Implantação
1. Aplicar a migração `20261103090000_whatsapp_automations.sql`.
2. Publicar `whatsapp-automation`, `create-donation`, `asaas-webhook` e demais Edge Functions atualizadas.
3. Abrir **Admin → Comunicação · Automações**. Testar envio apenas ao destinatário fixo. O teste exige login admin e confirmação.
4. Verificar status `ACCEPTED` (aceito pela API **não significa entregue**). Confirmar recebimento no aparelho.
5. Verificar o webhook Asaas com autenticação e conciliação de cobrança de teste no Sandbox.
6. Habilitar modelos individualmente.
7. Somente após homologação, configurar no Supabase Edge Functions Secrets: `IDE_WHATSAPP_AUTOMATION_ENABLED=true`. A chave global é intencionalmente independente dos toggles na interface.

### Gatilhos disponibilizados
- `welcome`: cadastro de contribuição realizado. **Não** afirma pagamento.
- `payment_confirmed`: pagamento avulso confirmado pelo Asaas.
- `new_subscriber`: primeiro pagamento mensal confirmado.
- `monthly_renewal`: parcela mensal posterior confirmada.
- `payment_overdue`: cobrança atrasada, verificada pelo Asaas.
- `upcoming_due`, `anniversary`: **modelos cadastrados; requerem agendador/varredura diária antes de funcionar**.
- `project_updates`: **modelo cadastrado; requer aprovação editorial e envio manual consentido**.

Todos os gatilhos usam nomes/valores/projeto do **banco**, não do visitante, e exigem `donor_marketing_consent = true` e data de aceite, mesmo para mensagens transacionais (abordagem deliberadamente conservadora). Descadastros de `communication_opt_outs` bloqueiam envios. A tabela de tentativas possui chave de evento única. Respostas incertas não são reenviadas automaticamente. A cota global é 40 tentativas por 24h.

O telefone do remetente **não** deve ser passado no body de uma mensagem: ele é determinado pela instância UazAPI conectada ao token. O número `UAZAPI_PHONE` é apenas a referência administrativa.

### Requisitos anteriores
- `communication_opt_outs` precisa existir, como usado pela integração existente de campanhas.
- O aceite opcional no checkout é persistido no banco; se a migração ainda não estiver aplicada, a atualização de aceite falha de forma não bloqueante e as mensagens são impedidas.
- Webhooks Asaas só disparam mensagens **depois** de validar o token e consultar a situação da cobrança com a API oficial.


## Orientações de cobrança sem links — PIX e boleto PDF

### Implantação
Os novos arquivos estão sob `supabase/` e dependem da publicação da Edge Function `whatsapp-payment-instructions` e da migração `20261103101500_whatsapp_payment_templates.sql`. O merge no GitHub **não** garante que a função já foi publicada no Supabase. Consulte o workflow de deploy, configure as credenciais de GitHub Actions conforme acima e confirme sucesso nas migrações.

### Conteúdo e comportamento
- **PIX**: mensagem em etapas para o apoiador, seguida de outra mensagem que contém **exclusivamente o código PIX copia e cola**, obtido em tempo real de `GET /payments/{id}/pixQrCode`. Não são enviados links ou QR Codes externos.
- **Boleto**: documento verdadeiro no WhatsApp via `POST /send/media`, `type=document`, `docName=Boleto-Missoes-IDE.pdf`, com legenda em linguagem simples. PDF obtido diretamente do `bankSlipUrl` retornado pelo Asaas, validado em backend e transmitido como base64; **o link não é enviado ao doador**.
- **Em ambos**: valor, vencimento, projeto e nome são carregados da cobrança autenticada e do registro da doação. A mensagem avisa explicitamente que o pagamento ainda está pendente.
- **Regras de segurança**: verificação Asaas e UazAPI; domínio Asaas HTTPS para obter PDF (até 5 MB); consentimento explícito e descadastro; chave única de cobrança+etapa; sem reenvio automático quando resultado incerto; limite diário global de mensagens.
- **Mensalidades**: quando uma nova cobrança da assinatura estiver disponível, o webhook Asaas envia as instruções com o ID da respectiva parcela.

### Testes operacionais
Em `/admin/automations`, clique separadamente:
1. **Testar PIX copia e cola** — lê a cobrança avulsa PIX de teste mais recente registrada na base e consulta o Asaas Sandbox. Envia ao número fixo +55 27 98139-2914 a orientação e o código em mensagem isolada.
2. **Testar boleto PDF anexado** — lê a cobrança avulsa boleto de teste mais recente, consulta o Asaas Sandbox, busca o PDF, valida-o e envia o documento ao mesmo número.
3. Confira no WhatsApp que o código pode ser copiado e que o PDF abre como anexo, **sem nenhum link**.
4. Confirme no histórico os resultados `ACCEPTED` (aceito pelo provedor), `REJECTED` ou `UNKNOWN` (incerto). Aceito não significa entregue.
5. Se não houver cobranças Sandbox pendentes, crie uma doação de teste em cada modalidade pelo formulário antes de clicar.

**Nunca pagar o boleto/PIX do teste.** O sistema bloqueia testes de cobrança quando o Asaas está configurado como Produção. Os testes não exigem habilitar o envio global.

### Publicação automática
Após homologação, habilite individualmente os modelos `pix_instructions` e `boleto_instructions` e a chave Supabase `IDE_WHATSAPP_AUTOMATION_ENABLED=true`. O envio aos doadores continua desativado até ambas as liberações serem feitas. Como a instância UazAPI é não oficial, podem ocorrer instabilidade, bloqueios e custos próprios da plataforma.

## Dois momentos da comunicação — boleto mensal e confirmação

O checkout passa a oferecer **aceite específico e opcional para mensagens de pagamento**. É separado do aceite de novidades e campanhas, e armazenado nas colunas `donor_payment_notification_consent` e `donor_payment_notification_consent_at`. Sem esse aceite, o sistema não envia boleto/PIX nem a confirmação pelo WhatsApp.

**Etapa 1 — cobrança pendente:** depois do cadastro, o boleto/PIX é enviado pela instância UazAPI do Superadmin. O modelo editável deixa claro que a cobrança está **aguardando pagamento**, nunca que a doação está confirmada. A página `/obrigado?pending=true` também informa o estado pendente.

**Etapa 2 — pagamento confirmado:** webhook validado `PAYMENT_CONFIRMED` ou `PAYMENT_RECEIVED` consulta o estado de cobrança no Asaas, associa ao cliente, valor e assinatura, e encaminha ao worker `whatsapp-automation`, que **revalida** o pagamento antes do envio. A deduplicação usa `paid:{paymentId}`: a mesma parcela não recebe dois agradecimentos. Mensagens para assinatura mensal usam `new_subscriber` no primeiro pagamento e `monthly_renewal` nos seguintes.

O fluxo independe de `PAYMENT_AUTHORIZED` (autorização isolada não prova recebimento).

### Piloto de ponta a ponta no Sandbox
Após confirmar sucesso do workflow de migração e deploy:
1. No Superadmin, manter `ASAAS_ENV=sandbox` com **chave da conta Sandbox**; manter o token UazAPI e o telefone institucional.
2. Garantir que o webhook Asaas **dessa conta Sandbox** está configurado com a URL correta de `asaas-webhook` e seu `ASAAS_WEBHOOK_TOKEN` autenticado. Sem esse webhook, a mensagem de pagamento confirmado não será disparada.
3. No **Supabase Edge Function Secrets**, definir `IDE_WHATSAPP_SANDBOX_TEST_ENABLED=true` e **manter** `IDE_WHATSAPP_AUTOMATION_ENABLED=false`.
4. No Admin → Comunicação · Automações, ativar os modelos de `boleto_instructions` e `new_subscriber` (e `monthly_renewal` para parcelas posteriores); salvar. Para PIX, ativar `pix_instructions`.
5. Criar **nova doação mensal por boleto** com o telefone do apoiador `+55 27 98139-2914`. Marcar o campo opcional de autorização de avisos de pagamento pelo WhatsApp.
6. Conferir a tela de **cobrança registrada / aguardando pagamento**, o PDF do boleto pelo WhatsApp e o histórico de tentativas.
7. Na conta Asaas **Sandbox**, localizar o pagamento `pay_...` da primeira parcela e usar **Confirmar pagamento**. Não pagar boleto real; a confirmação é simulada.
8. Verificar `PAYMENT_CONFIRMED`/`PAYMENT_RECEIVED` no webhook, status atualizado da doação e **segunda mensagem de agradecimento** no mesmo WhatsApp.
9. Repetir com PIX e depois, quando desejado, com nova mensalidade. Todas as cobranças são checadas novamente no Asaas para evitar falsos positivos.

O piloto automático só opera se `ASAAS_ENV=sandbox` **e** o telefone destinatário for exatamente `5527981392914`. Outros apoiadores não recebem mensagens automáticas com a chave global desligada.

### Migração para produção
No Superadmin, alterar para `ASAAS_ENV=production` e inserir a chave API **de Produção**. Configurar o webhook na conta Asaas de Produção e validar sua autenticação. A operação de envio continuará usando **o mesmo número institucional UazAPI**. Desabilitar o piloto Sandbox e, **somente após homologação e aprovação**, configurar `IDE_WHATSAPP_AUTOMATION_ENABLED=true` no Supabase. Os modelos permanecem editáveis na interface.

A chave do Sandbox não funciona em Produção. **Trocar o seletor não migra webhooks nem credenciais automaticamente.** O recurso WhatsApp aqui é próprio da UazAPI, não a notificação nativa do Asaas.
