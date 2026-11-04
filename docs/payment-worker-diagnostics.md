# Diagnóstico de instruções de pagamento

Base: main fdc344c012a99d2eb8e9003b155daddb6efe8705. Branch: fix/payment-worker-diagnostics.

## Alterações

- Etapas registradas com traceId, nome da etapa e HTTP status (sem corpo externo, tokens, telefone, PDF ou PIX nos logs).
- Impedimentos autenticados registrados em whatsapp_automation_deliveries, event_type payment_diagnostic, status SKIPPED ou REJECTED e skip_reason com código e motivo. AuditSaved=false denuncia falha de persistência e o traceId permanece no log.
- Falhas de envio conservam UNKNOWN quando o provedor não respondeu com ID. Repetições só avançam se o envio anterior consta ACCEPTED; UNKNOWN, RESERVED e REJECTED não são sucesso.
- Diagnósticos não consomem cota de envios. A cota global continua usando o contador já existente, sem garantia atômica contra concorrência de cobranças diferentes.
- Flags aceitam trim e caixa indiferente. Valores diferentes de vazio/true/false geram INVALID_WHATSAPP_FLAG. A flag Sandbox nunca libera produção.
- create-donation audita resposta sanitizada do worker, inclusive resultados HTTP 200 com skipped/ok=false. Não grava corpo bruto, que pode conter dados pessoais. O resultado é associado ao UUID da doação e traceId.
- Teste administrativo test_donation reutiliza a cobrança existente, exige confirmação explícita, Sandbox, flag Sandbox, consentimento, template, opt-out e coincidência do telefone informado com o cadastrado. Usa as mesmas chaves de deduplicação dos eventos, não cria cobrança e não contorna tentativas incertas. Mensalidade exige pay_ da parcela.
- O painel já exibia skip_reason na main do Lovable; foi acrescentado o formulário de teste de doação existente, sem telefone pessoal fixo no código.

## Banco e deploy

Não há nova migração. É necessário o skip_reason/status SKIPPED já previsto na main do Lovable. O worker verifica o campo antes de iniciar envio; caso o banco esteja indisponível ou desatualizado, falha explicitamente. Nenhuma migration antiga será executada.

A CI desta branch executa a suíte simulada e a verificação de rotas antes de publicar SOMENTE whatsapp-payment-instructions, create-donation e whatsapp-automation no projeto já configurado no repositório. Não altera secrets/flags/modelos, não executa SQL e não cria cobranças ou envia WhatsApp. Interrompe o deploy se main mudar desde a base revisada.

PRs #18/#19 permanecem separados e não são mesclados por este trabalho. Este diagnóstico preserva o fluxo atual de main (PIX e boleto separados); não publica a mudança de cobrança híbrida nem a migração de reserva do PR #19.

## Validação

- node --test scripts/test-payment-diagnostics.mjs: 25 testes locais aprovados, com dependências HTTP e banco simulados.
- node scripts/check-donation-flow.mjs: aprovado.
- npm run build: aprovado (16,68 s; aviso de tamanho de bundle).
- Teste real de envio: pendente de sessão administrativa no painel, identificação da doação/cobrança de teste, confirmação de ambiente e verificação de entrega no telefone autorizado. ACCEPTED não comprova recebimento.

O painel aberto solicitou login. Nenhuma doação foi criada, alterada ou paga durante os testes locais. Nenhuma mensagem real foi enviada. Para a doação recente informada pelo usuário, usar o formulário de teste de doação existente após autenticação; o telefone deve ser digitado na interface, não persistido em documentação pública.
