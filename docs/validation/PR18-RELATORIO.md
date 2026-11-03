# PR #18 — validação de cobrança híbrida

Data: 03/11/2026 (America/Sao_Paulo).
Base examinada: `3f4c5d611943e03b755497fa40530346f6feb267`.
Branch de correções: `dev/pr18-sandbox-validation`.

**Resultado: testes locais aprovados; homologação externa pendente. Não recomendado para produção.**

## Evidência executada

A suíte `scripts/test-pr18.mjs` executa os handlers reais de criação e envio, removendo somente o import remoto e os tipos TypeScript. Supabase, Asaas e UazAPI são simulados em memória; nenhuma chamada HTTP externa ou mensagem WhatsApp ocorre. Dados são sintéticos. A suíte exige Node 24 e não depende de instalação npm.

- Código original do PR: 26 cenários, 15 aprovados, 11 reprovados contra os critérios de segurança/regressão.
- Código corrigido: 26 cenários, 26 aprovados, 0 reprovados. Saída completa em `pr18-local-tests.txt`.
- `node scripts/check-donation-flow.mjs`: aprovado.
- `git diff --check`: aprovado.
- `npm run build`: aprovado (aviso de bundle acima de 500 kB). Dependências instaladas pelo mesmo comando da CI existente: `npm install --ignore-scripts --legacy-peer-deps --package-lock=false --no-audit --no-fund`.
- `npm ci`: bloqueado por conflitos de peer dependencies e lockfile preexistente fora de sincronia. Nenhum manifesto/lockfile foi alterado nesta correção. A instalação reproduzível com npm ci permanece pendente.
- `npx tsc --noEmit`: reprovado com 7 diagnósticos em arquivos não alterados (auth-attacher, auth-middleware, router e equipe.$slug), incluindo dependência @tanstack/react-start ausente. Sem diagnósticos nos arquivos de interface alterados; build aprovado não substitui esta checagem.
- Nenhum teste de pagamento real, chamada Asaas Sandbox ou envio UazAPI foi realizado nesta sessão.

## Matriz dos objetivos

| Objetivo | Evidência local | Homologação externa |
|---|---|---|
| Uma cobrança | Uma chamada POST /payments, billingType BOLETO; reserva impede repetição da mesma request_id, inclusive concorrência e timeout | Pendente: confirmar um único pay_ na conta Sandbox autorizada |
| PDF e PIX do mesmo ID | PIX consultado em /payments/pay_test123/pixQrCode; PDF obtido do bankSlipUrl da cobrança validada; arquivo com assinatura PDF | Pendente: PDF real, conteúdo e código PIX do mesmo pay_ |
| Envio consentido | PDF antes do PIX puro; telefone cadastrado; bloqueios por consentimento, opt-out, template, allowlist e conexão | Pendente: recebimento dos dois itens em telefone explicitamente autorizado |
| Segunda via | Apenas GET no Asaas; reutiliza pay_; uma tentativa por item/dia; admin e parcela mensal verificados | Pendente: comparar contagem de cobranças antes/depois no Sandbox |
| Falhas e duplicidade | Rejeição, timeout, resposta sem ID e erro de auditoria não viram sucesso; repetição não envia novamente | Pendente: restrição UNIQUE real no PostgreSQL, contrato UazAPI e confirmação de entrega |
| Produção futura | Credencial/ambiente verificados; flag Sandbox não autoriza produção; documentação de transição abaixo | Bloqueada até homologação externa |

## Correções

1. Duplicidade de envio consulta o status anterior: apenas ACCEPTED permite continuar. RESERVED, UNKNOWN e REJECTED bloqueiam o avanço e não são apresentados como sucesso.
2. Resposta HTTP 2xx sem identificador de mensagem fica UNKNOWN. Falha ao registrar auditoria também impede continuar para PIX.
3. Sandbox exige `IDE_WHATSAPP_SANDBOX_ALLOWED_PHONES` (lista E.164 separada por vírgula), inclusive quando a flag global estiver ligada. Lista vazia bloqueia todos.
4. Testes administrativos da mesma cobrança são deduplicados por cobrança/item/dia UTC, sem chave aleatória em cada clique.
5. Worker verifica incompatibilidade conhecida de prefixos de credencial e ambiente; aceita alias `prod`. Sem flag global de produção, interrompe antes de consultar a cobrança em produção.
6. Segunda via ignorada por falta de consentimento, modelo desativado etc. mostra o motivo na interface, em vez de toast de envio bem-sucedido.
7. Criação exige request_id UUID e faz reserva atômica ANTES de qualquer chamada ao Asaas. Repetição recebe 409; indisponibilidade da tabela recebe 503 antes de mutações externas. Checkout mantém a mesma chave em sessionStorage durante falhas/reload.
8. Valor, método e modalidade inválidos são rejeitados antes de chamadas externas; método HTTP restrito a POST.
9. URL de fatura não é mais usada como fallback de um campo apresentado como PDF.

## Migração nova preparada, NÃO executada

`supabase/migrations/20261104090000_donation_creation_requests.sql` adiciona uma tabela isolada, com chave primária `(environment, request_id)`, RLS e acesso apenas pelo backend. Não atualiza doações, valores, status financeiros nem configurações existentes.

Antes de implantar a função corrigida, aplicar **somente essa migração nova** em banco de homologação isolado e validar acesso service-role/UNIQUE/RLS. Sem essa tabela, a criação falha fechada e não cria cobranças. Não executar histórico de migrations, `db push` indiscriminado ou `migration repair`.

Reservas incertas não expiram automaticamente. Uma falha após a reserva exige conciliação administrativa: verificar se o Asaas criou a cobrança antes de iniciar outra solicitação. A proteção é por request_id, não uma garantia global contra novas chaves deliberadas ou novas abas independentes. Não houve implementação de recuperação automática de resultado nem de retry automático.

## Pendências para homologação

- Disponibilizar um Supabase de homologação isolado com os schemas necessários e implantação desta branch. O preview Vercel não comprova isolamento do backend.
- Configurar credencial Asaas Sandbox e instância UazAPI de teste por mecanismo seguro, sem inserir segredos em relatório, chat ou repositório.
- Identificar conta/cliente sintético e telefone(s) autorizados. O número fixo presente no código não foi usado nesta sessão.
- Manter `IDE_WHATSAPP_AUTOMATION_ENABLED=false`; somente no ambiente de homologação, configurar a flag Sandbox e allowlist e habilitar o template boleto_instructions.
- Criar uma doação sintética consentida; registrar request_id, pay_ e evidências redigidas da contagem de cobranças. Confirmar PDF e PIX no telefone, sem efetuar pagamento.
- Repetir a mesma requisição/chamar segunda via e conferir que não há novo pay_. Verificar os registros RESERVED/ACCEPTED e os IDs retornados pela UazAPI.
- Validar o formato real da resposta UazAPI (ID de mensagem), limites/contrato do envio de PDF base64 e a disponibilidade do PIX híbrido na conta Asaas usada.
- Exercitar falha/repetição em homologação sem alterar cobranças antigas. ACCEPTED continua significando apenas aceite do provedor; entrega não é inferida sem evidência no destinatário.
- Validar criação de assinatura mensal, primeira parcela tardia e recuperação via webhook em ambiente real. A suíte atual cobre vínculo de segunda via mensal, não todo o ciclo de criação da assinatura.
- Validar a cota diária sob concorrência: o contador existente não é uma reserva atômica global. A deduplicação por evento é independente dessa cota.
- Falhas anteriores à reserva de envio (ex.: PDF indisponível) retornam erro sem registro individual na tabela de envios; avaliar observabilidade/reprocessamento operacional antes de produção.

## Migração futura para produção

Somente após as pendências acima: validar a nova migração isoladamente, revisar credenciais e endpoints de produção, separar evidências/logs por ambiente e confirmar os templates/consentimento/opt-out. Manter automação global desligada durante implantação, com ativação controlada posterior. Não reutilizar IDs Sandbox como produção. Não copiar credenciais entre ambientes.

O workflow existente publica Edge Functions quando main muda. Por isso, este trabalho fica na branch de desenvolvimento e NÃO mescla o PR #18. A nova CI roda somente testes simulados; não contém segredos, deploy ou migrações.

## Restrições preservadas

Nenhum dado financeiro existente alterado. Nenhuma cobrança real ou em produção criada. Nenhum pagamento efetuado. Nenhuma automação global ativada. Nenhuma migração executada. Nenhum PR mesclado. Nenhum segredo ou dado pessoal incluído nas evidências.
