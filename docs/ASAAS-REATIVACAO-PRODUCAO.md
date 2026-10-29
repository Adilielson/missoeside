# IDE Missões: retorno ao Asaas — 29/10/2026

**Situação: preparação em PR rascunho; não mesclar, não publicar, não processar pagamento real sem homologação.**

## Decisão de produto
- Gateway exclusivo: Asaas (abandonar Cora e Mercado Pago no projeto).
- Doação única: PIX, boleto bancário e cartão de crédito.
- Mensal: **apenas boleto**. A assinatura é gerada no Asaas por `/subscriptions` com `cycle=MONTHLY`. O pagador quita cada boleto manualmente.
- Manter projetos/campanhas, PIX dinâmico, possibilidade de anonimato, dashboard e histórico.

## O que já estava na branch main
- `src/routes/doar.tsx` era uma página temporária de PIX manual e conta Caixa.
- `src/routes/doar2.tsx` contém o checkout Asaas, com processamento por `create-donation`.
- `supabase/functions/create-donation/index.ts` contém cliente Asaas, pagamentos e assinaturas.
- `supabase/functions/asaas-webhook/index.ts` confirmava pagamentos sem autenticar o evento.

## O que este PR prepara
- Rota `/doar` redireciona para checkout existente `/doar2`, preservando `?project=...`.
- Webhook passa a validar `asaas-access-token`, confirmar a cobrança por consulta na API Asaas e gravar cada pagamento em ledger separado.
- Migração aditiva `asaas_payment_receipts` preserva meses distintos de assinatura e limita acesso a service_role.
- Função `donation-status` e helper HMAC disponibilizam consulta autenticada a estado da doação, mas ainda não conectados ao checkout.

## PENDÊNCIAS CRÍTICAS — NÃO PUBLICAR
1. Atualizar `src/routes/doar2.tsx`: ao escolher `MONTHLY`, selecionar `BOLETO`; ocultar PIX/cartão. Ao voltar para `ONE_TIME`, oferecer PIX/BOLETO/CREDIT_CARD. Alterar também a validação do backend `create-donation` para rejeitar outros métodos mensais.
2. Corrigir `create-donation`: validar dados e montante, exigir status secret, devolver token HMAC, não incluir PII no retorno, usar `externalReference` único, buscar `bankSlipUrl` da primeira cobrança de assinatura.
3. Trocar o polling direto na tabela protegida `donations` pela função `donation-status` com token HMAC. Evitar timers concorrentes.
4. Pagamento gerado NÃO é pagamento confirmado. PIX/boleto devem exibir pendência e somente encaminhar a /obrigado após confirmação. Desativar mensagem de Sandbox quando produção.
5. Impedir notificação de agradecimento antes de confirmação; no código atual `create-donation` chama `send-notification` logo após emissão. Proteger também `send-notification` contra chamadas públicas indevidas.
6. Substituir a coleta direta de PAN/CVV do cartão no frontend e repasse pelo backend por fluxo de cartão tokenizado ou checkout hospedado, conforme conformidade PCI e recursos habilitados na conta Asaas; validar liberação e antifraude. Não registrar PAN/CVV nos logs.
7. Corrigir erro de checkout se `donor_email` estiver vazio, pois coluna no banco exige e-mail. Nunca expor CPF a consultas públicas.
8. Testar idempotência na criação de cobranças, pois reenvio após timeout pode criar cobrança duplicada.
9. Aplicar a migração SQL do ledger ANTES de publicar o webhook novo; caso contrário, entregas podem falhar e causar pausa na fila Asaas.
10. Verificar status `CONFIRMED`, `RECEIVED`, `REFUNDED`, cancelamentos, duplicatas e mensalidades de competências futuras.
11. Fazer homologação e revisão humana antes de produção. Não foi feita requisição ao Asaas durante esta preparação.

## Configuração necessária no Supabase/backend (sem incluir valores)
- `ASAAS_API_KEY` **produção** (ou `system_settings.ASAAS_API_KEY` já configurado).
- `ASAAS_ENV=production` (ou `system_settings.ASAAS_ENV=production`). **A configuração armazenada na tabela prevalece sobre o ENV no código existente.** Conferir o valor ativo antes de qualquer teste.
- `ASAAS_WEBHOOK_TOKEN` em segredo/setting: token de 32–255 caracteres, distinto da API Key, idêntico ao configurado no webhook de produção do Asaas.
- `DONATION_STATUS_SECRET`: segredo aleatório com pelo menos 32 caracteres, somente backend. Requer adaptação do checkout e de `create-donation` antes de ser utilizado.
- `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são segredos backend; não colocar no client ou GitHub.
- Webhook: URL final da Edge Function `asaas-webhook`, POST, sem exigir JWT padrão, mas com `asaas-access-token`.

## Observações de rollout
- Encerrar PR da Cora sem merge (feito).
- Fazer revisão do fluxo completo em ambiente controlado. Usar sandbox independente para testes fictícios; para teste real de produção, transação pequena autorizada, acompanhada de conciliação e eventuais tarifas.
- Após validação, habilitar webhook Asaas de produção e fazer deploy das funções com migrações.
- Abrir e concluir PR para main; só então publicar o site oficial.
- Em caso de erro, reverter commit/rota oficial para a página anterior, preservar pagamentos já gerados no Asaas e consultar eventos antes de refazer cobrança.

Fontes:
https://docs.asaas.com/docs/sobre-os-webhooks
https://docs.asaas.com/docs/cobrancas-via-cartao-de-credito
https://docs.asaas.com/docs/faq-assinaturas
https://docs.asaas.com/docs/payments-overview
