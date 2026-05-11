Para garantir que o doador só seja redirecionado após a confirmação do pagamento, especialmente no PIX e Cartão de Crédito, vamos implementar as seguintes melhorias:

### 1. Novo Webhook para Confirmação Real
Como estamos usando o Sandbox do Asaas, o sistema precisa de um "recebedor" de notificações para saber quando o pagamento foi confirmado de fato no Asaas.
- Criar a Edge Function `asaas-webhook` para processar eventos como `PAYMENT_RECEIVED` e `PAYMENT_CONFIRMED`.
- Ao receber a confirmação, o status da doação no banco de dados será atualizado de `PENDING` para `CONFIRMED`.

### 2. Polling de Status no Frontend
No PIX e Cartão, o usuário fica em uma tela de espera.
- Implementar uma lógica de "busca automática" (polling) na página de doação.
- O frontend perguntará ao banco de dados a cada 3-5 segundos: "Esta doação já foi confirmada?".
- Assim que o status mudar para `CONFIRMED` (via webhook), o sistema redireciona automaticamente para a página de obrigado.

### 3. Simulação no Sandbox
Para testar no Sandbox do Asaas:
- No caso do Cartão, o Asaas costuma confirmar quase instantaneamente se os dados forem válidos.
- No caso do PIX, você pode usar o simulador do Asaas ou simplesmente atualizar o status manualmente no banco de dados para testar o redirecionamento automático que vamos criar.

### Detalhes Técnicos
- Criação da tabela de logs de webhook (opcional, para depuração).
- Atualização da função `create-donation` para retornar o ID da doação criado para o frontend.
- Modificação no `doar.tsx` para incluir o loop de verificação após gerar o PIX ou processar o Cartão.

Deseja que eu comece criando o Webhook e a lógica de verificação?