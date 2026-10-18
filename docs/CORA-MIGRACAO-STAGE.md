# Missões IDE — Migração Cora Stage (não publicar sem homologação)

## Escopo aprovado
- Doação única: PIX e boleto Cora **e cartão de crédito**, obrigatoriamente através de um gateway complementar de cartão a definir (semelhante a checkout hospedado/tokenizado).
- Doação mensal: SOMENTE boleto, com uma cobrança nova por mês. Sem cobrança automática em conta bancária.
- **Decisão do proprietário (18/10/2026): manter cartão como opção de pagamento ÚNICO.** Nunca mostrar cartão quando o doador selecionar MENSAL.
- Cartão não é suportado pelo adaptador da API de cobrança Cora. Integrar outro provedor com checkout hospedado ou campos tokenizados, confirmação server-to-server e recebimento/repasse próprios do gateway. A escolha do parceiro ainda está pendente.
- Enquanto não houver gateway de cartão homologado, a opção de cartão não pode processar cobrança nem exibir sucesso fictício. Preservar o layout de cartão apenas como planejado e não lançar a rota renovada até a modalidade funcionar; alternativamente exibir mensagem de indisponibilidade temporária se a publicação não puder esperar.
- **Nunca** repassar número integral, validade ou CVV de cartão pelo Supabase Edge Functions, logs ou tabelas, sem arquitetura/escopo de conformidade PCI formalmente validada. Substituir os campos atualmente existentes em /doar2 por fluxo tokenizado/hospedado do novo gateway.
- Não alterar /doar em produção antes de testar e aprovar uma publicação separada.
- Preservar arquivos/colunas Asaas até finalizar migração e conciliação do histórico.

## Dados para Stage
- CORA_CLIENT_ID
- CORA_CERT_PEM (PEM completo, apenas segredos do backend)
- CORA_PRIVATE_KEY_PEM (PEM completo, apenas segredos do backend)
- CORA_ENV=stage
- CORA_WEBHOOK_SECRET (token aleatório forte criado pela IDE; confirmar mecanismo aceito pela Cora)
- CORA_SCHEDULER_SECRET (protege disparo de mensalidades; cron fora da camada pública)
Nunca inserir certificados, secrets, tokens, ou PII no GitHub, console do navegador ou logs.

## Endpoints oficiais
POST https://matls-clients.api.stage.cora.com.br/token 
Content-Type: application/x-www-form-urlencoded
grant_type=client_credentials&client_id=...
Autenticação: certificado + chave privada via mTLS.
POST https://api.stage.cora.com.br/v2/invoices/
Cabeçalhos: Authorization: Bearer ..., Content-Type: application/json, Idempotency-Key: UUID
Body mínimo: { code, customer: { name, email, document: { identity, type } }, services:[{name,description,amount}], payment_terms:{due_date}, payment_forms:["BANK_SLIP","PIX"] }.
Para PIX exclusivo, payment_forms:["PIX"]. amount em centavos.
Verificar schema/status exatos na documentação Stage na homologação.

## Atenção ao runtime mTLS
Deno nativo suporta Deno.createHttpClient({cert,key}), porém Supabase Edge Runtime pode não suportar ou variar por versão.
Executar handshake real em Stage antes de ativar o fluxo. Se falhar, hospedar uma ponte mTLS independente
(Node HTTPS Agent/Undici com cert e key ou Deno dedicado) e restringir comunicação com Supabase usando identidade de serviço;
nunca remover verificação TLS nem compartilhar a chave com o navegador.

## Fluxo de cobrança
1. Visitante seleciona doação e projeto e envia dados por backend.
2. Backend valida CPF/CNPJ, valor >= R$5, tipo/forma, limites e antiabuso.
3. Criar registro PENDING com idempotency_key e code interno, em transação/rotina atômica.
4. Gerar cobrança na Cora com chave idempotente; persistir invoice ID e options disponíveis.
5. Exibir QR Code, copia-e-cola ou boleto SOMENTE se Cora retornar dados correspondentes.
6. Nunca confirmar doação por clique "já paguei". Consulta/verificação por invoice autenticada.
7. Webhook deve autenticar origem, buscar fatura na API Cora, conferir id, code, valor e pagamento; atualização idempotente.
8. Notificações e somatórios somente após pagamento confirmado; evitar dados pessoais em eventos de analytics.

## Regras do checkout e separação de provedores
- ONE_TIME + PIX -> Cora Stage.
- ONE_TIME + BOLETO -> Cora Stage.
- ONE_TIME + CREDIT_CARD -> gateway complementar com checkout/tokenização, apenas quando homologado.
- MONTHLY + BOLETO -> Cora com orquestração mensal própria.
- MONTHLY + CREDIT_CARD ou MONTHLY + PIX -> rejeitar no frontend E no backend (na versão atual definida pelo cliente).
- Se mudar de ÚNICO para MENSAL, selecionar BOLETO automaticamente, limpar quaisquer estados de cartão e esconder essa opção; ao retornar a ÚNICO, oferecer novamente as três opções.
- Não habilitar botão/pagamento do cartão antes da integração real e dos callbacks seguros.
- O frontend NÃO deve decidir o provedor; o backend faz o roteamento por type/payment_method e rejeita combinações inválidas.

## Mensalidades por boleto
- Cadastro donation_recurrences ACTIVE com project_id, documento e e-mail de contato.
- Emissão do boleto do mês atual e salvamento do código/ID da cobrança.
- Agendador diário autenticado busca next_due_date <= hoje, emite apenas uma cobrança por competência,
  registra período e programa next_due_date, preservando dia de vencimento sempre que possível.
- Lock transacional/claim para impedir workers simultâneos e idempotency key determinística;
  se houve timeout, reconcilie invoice antes de tentar outra.
- Boleto não pago: notificação de lembrete sem emissão duplicada.
- Permitir cancelar/pausar com autenticação e auditoria (não basta informar ID).
- Falha de emissão: preservar o agendamento e registrar para retry idempotente.
- Todo mês o doador precisa pagar o boleto; NÃO equivale a Pix Automático.

## Migração de produção
1. Validar credenciais Stage, token, emissão PIX e boleto, webhook e simulação pagamento.
2. Garantir scripts de migração aditivos, políticas RLS e dados existentes.
3. Testar cancelamento, expirado, tentativa repetida, race conditions, timeout, PII.
4. Adicionar dashboards de conciliação e registros de falhas; monitorar webhook.
5. Selecionar, configurar e homologar gateway de cartão avulso; substituir coleta direta de PAN/CVV por hosted fields/tokenização e validar webhooks de pagamento.
6. Somente após aprovação, cadastrar credenciais Production e ativar /doar com rollout reversível.

## Referências
https://developers.cora.com.br/docs/client-credentials-int-direta
https://developers.cora.com.br/reference/emiss%C3%A3o-de-boleto-registrado-v2
https://developers.cora.com.br/reference/qr-code-pix-v2
https://developers.cora.com.br/docs/utiliza%C3%A7%C3%A3o-das-apis
