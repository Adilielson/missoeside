# WhatsApp ao doador após assinatura (Asaas + UazAPI)

## Diagnóstico (confirmado nos seus testes)
Analisei as doações de teste, os envios registrados e as configurações. A UazAPI funciona: os 5 envios registrados (testes e boleto) foram aceitos. A mensagem da assinatura não sai por 5 bloqueios somados:

1. **Não existe mensagem no momento da assinatura.** O sistema só avisa "novo apoiador mensal" **depois que o Asaas confirma o pagamento**. Assinar sem pagar não gera nada.
2. **O aviso do Asaas não chega.** Essa confirmação depende do webhook do Asaas, que ainda não está ativado. Sem ele, nenhum pagamento confirmado chega ao site.
3. **Chave geral de envio desligada.** O servidor não tem a configuração que libera envios automáticos. Hoje todo evento automático é ignorado ("Automação desativada no servidor").
4. **Modelos desligados.** "Novo apoiador mensal" e "Pagamento confirmado" estão desativados em Automações.
5. **Autorização do doador.** No seu teste de assinatura mensal (03/11, 12:48), só a caixa de novidades foi marcada. A de avisos de pagamento ficou desmarcada, e o sistema exige essa autorização.

## Solução
1. **Nova mensagem "Assinatura registrada"**, enviada assim que o doador conclui a assinatura mensal, sem esperar o pagamento. Ela agradece e informa valor, projeto e vencimento. Não diz que o pagamento foi recebido. Terá um modelo editável em Automações, ligado por padrão.
2. **Instruções da 1ª parcela:** para assinatura com PIX ou boleto, o código PIX ou o PDF do boleto continua sendo enviado logo em seguida (isso já existe).
3. **Ligar a chave geral de envio no servidor** (modo de teste no sandbox agora, produção depois).
4. **Ativar os modelos** "Novo apoiador mensal" e "Pagamento confirmado", para a confirmação sair quando o Asaas avisar o pagamento.
5. **Autorização mais clara no /doar2:** deixar evidente que, sem marcar "receber avisos da minha doação por WhatsApp", nenhuma mensagem é enviada. Se o doador não marcar, aparece um aviso curto antes de concluir.
6. **Diagnóstico visível:** em Automações, cada tentativa vai mostrar o motivo de não ter sido enviada (sem autorização, modelo desligado, telefone inválido etc.) em vez de sumir sem registro.
7. **Webhook do Asaas:** você mesmo ativa no painel do Asaas (sandbox), com o endereço que vou te passar. Antes você pediu para não ativar, então não farei isso sem você.

## Teste de ponta a ponta
- Assinatura mensal no /doar2 (sandbox), marcando a autorização, com seu número: deve chegar "Assinatura registrada" e as instruções da 1ª parcela.
- Pagar a parcela no sandbox: com o webhook ativo, deve chegar "Novo apoiador mensal".
- Conferir os registros na tela Automações.

## Detalhes técnicos
- `create-donation`: quando `type === "MONTHLY"` e houver autorização, chamar `whatsapp-automation` com o evento `subscription_created` e a chave `sub:<sub_id>`, que impede envio duplicado.
- `whatsapp-automation`: incluir `subscription_created` na lista permitida e entre os eventos financeiros. Pular a verificação de "pago no Asaas" só para esse evento, validando que a assinatura existe no Asaas. Registrar como `SKIPPED` os eventos ignorados, com o motivo.
- Migração: novo modelo `subscription_created` (ligado), ativar `new_subscriber` e `payment_confirmed`, e permitir o status `SKIPPED` e o campo de motivo nos registros de envio.
- Secret `IDE_WHATSAPP_SANDBOX_TEST_ENABLED=true` agora. `IDE_WHATSAPP_AUTOMATION_ENABLED=true` só na virada para produção.
- Nenhuma credencial existente é alterada. O código do GitHub `main` precisará receber as mesmas mudanças, senão um novo deploy a partir dele desfaz a correção.
