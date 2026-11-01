# IDE Missões — Integração WhatsApp (UazAPI)

## O que já existia
No Superadmin já existem as credenciais `UAZAPI_URL`, `UAZAPI_TOKEN` e `UAZAPI_INSTANCE`, além do teste `GET /instance/status`. Isso **não prova** que os valores estejam cadastrados na instância publicada.
A função `send-notification` antiga usa Gmail SMTP, não UazAPI. Não foi modificada aqui e não deve ser usada para campanhas indiscriminadas.

## O que foi implementado
- Nova Edge Function `campaign-whatsapp`: servidor obtém `UAZAPI_URL` e `UAZAPI_TOKEN` de `system_settings`, consulta números com **consentimento explícito**, elimina duplicatas, respeita descadastros e chama `POST /send/text` com header `token`.
- Usa `{{nome}}` no corpo da campanha para inserir o primeiro nome, quando houver. Inclui instrução de descadastro (responder SAIR).
- Ações: `preview` (somente contagem agregada), `send` (lote de até 5, só após confirmação do admin), `optout` (registra número na lista de supressão).
- A função exige JWT autenticado, papel `admin` comprovado no banco, campanha salva em `READY` e canal `WHATSAPP` ou `MULTICHANNEL`.
- `send` aceita somente audiência `DONORS_CONSENTED` ou `ALL_OPTED_IN`. Neste último caso **a lista de WhatsApp também é somente dos doadores com opt-in**: a tabela newsletter não possui telefones.
- Cada tentativa tem registro único por campanha+telefone para não reenviar automaticamente após falha/timeout. `ACCEPTED` significa aceito pelo provedor, não entregue/visualizado.
- Segurança: HTTPS obrigatório na URL, números BR E.164, no máximo 5 mensagens por ação e 40 tentativas em 24 horas, nunca disparo automático.
- O token UazAPI permanece no servidor e NÃO é retornado ao frontend nem salvo no GitHub.

## Publicação passo a passo (nenhum envio foi realizado nesta implementação)
1. **Verificar a API real:** o projeto usa a **UazAPI**, embora ela tenha sido chamada de "WhatsApi". Se for outro fornecedor com endpoints diferentes, substituir o adaptador ANTES de implantar.
2. Aplicar a migração anterior `20261101130000_donor_tracking_campaigns.sql` caso ainda não esteja aplicada.
3. Aplicar `20261101163000_communication_whatsapp_deliveries.sql` (tabelas ledger e opt-out, RLS admin SELECT; INSERT/UPDATE somente service_role).
4. Publicar a função `campaign-whatsapp` com `verify_jwt=false`, que valida a sessão por JWT e role internamente.
5. Confirmar no Superadmin que `UAZAPI_URL` (Server URL HTTPS, sem rota), `UAZAPI_TOKEN` (token **da instância**, não `admintoken`) estão configurados e que **Testar conexão** retorna sucesso. `UAZAPI_INSTANCE` fica preservado como metadado, não é exigido pelo endpoint `/send/text`.
6. Com a instância conectada, o usuário admin deve abrir `/admin/campaigns`, criar campanha de WhatsApp com público **Doadores com consentimento**, texto e status `READY`; clicar **Ver público WhatsApp**. Inicialmente verá `sendingEnabled=false`.
7. Somente após confirmar o destinatário de teste autorizado e o comportamento do provedor, habilitar no Supabase Functions Secrets `UAZAPI_CAMPAIGN_ENABLED=true`. Depois, um clique explícito em **Enviar próximo lote** faz até 5 envios reais. Evitar testar com o público amplo; restringir ao projeto/grupo de teste ou base fictícia consentida.
8. Respostas `SAIR` **não são capturadas automaticamente**. O responsável deve registrá-las em **Descadastro de WhatsApp** antes de qualquer outro lote. Para automação de opt-out, adicionar webhook de recebimento verificado e testes com o provedor.
9. Não ativar campanhas em lote sem consentimento; não contatar toda a base histórica ou usar lista de cobranças pendentes para mensagens promocionais.

## Limitações relevantes
- A integração usa API **não oficial** de WhatsApp: há risco de bloqueios, alterações do provedor e falta de garantias de entrega.
- Não implementamos envios em massa automáticos, agendamentos, templates oficiais ou respostas de WhatsApp.
- O consentimento é coletado opcionalmente no checkout somente quando `DONOR_TRACKING_ENABLED=true` e `VITE_DONOR_TRACKING_ENABLED=true` após a migração.
- Para envio de boletos, separar notificação operacional (sem marketing) de campanhas; validar vencimento/Asaas antes de cobrar.
- Para automação de alto volume, preferir a Plataforma do WhatsApp Business oficial, com consentimentos, templates aprovados, descadastro automatizado e rastreamento de entregas.

## Demais pendências do painel e Asaas
- Confirmar migração do Supabase e deploy de `create-donation`, `asaas-webhook`, `admin-asaas-reconcile`.
- Ativar `DONOR_TRACKING_ENABLED` somente depois de migrar o banco, e validar a correlação de cada boleto mensal.
- Publicar o domínio pelo Lovable/Vercel; merge no GitHub não garante deploy.
- O repo contém incompatibilidade entre `package.json` e `package-lock.json`, e erros TypeScript anteriores fora das telas novas; resolver no projeto separadamente.
