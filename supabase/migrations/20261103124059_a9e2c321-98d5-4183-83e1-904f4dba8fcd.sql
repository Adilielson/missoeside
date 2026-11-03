-- Accessible, no-link payment instructions. Explicitly opt-in and off by default.
INSERT INTO public.whatsapp_automation_templates(event_type,label,enabled,content)
VALUES
 ('pix_instructions','PIX — código copia e cola',false,
 'Olá, {{nome}}!

Sua contribuição para *{{projeto}}* foi registrada.

*FORMA DE PAGAMENTO: PIX*
*Valor:* {{valor}}
*Vencimento:* {{vencimento}}

Para pagar:
1. Abra o aplicativo do seu banco.
2. Escolha *PIX*.
3. Escolha *Pix Copia e Cola*.
4. Copie o código que enviaremos na *próxima mensagem*.
5. Cole no aplicativo do banco e confira os dados antes de confirmar.

*Esta cobrança ainda não está paga.*

Se precisar de ajuda, responda esta mensagem.'),
 ('boleto_instructions','Boleto — PDF anexado',false,
 'Olá, {{nome}}!

Sua contribuição para *{{projeto}}* foi registrada.

*FORMA DE PAGAMENTO: BOLETO*
*Valor:* {{valor}}
*Vencimento:* {{vencimento}}

O *boleto está anexado a esta mensagem em PDF*, com o nome Boleto-Missoes-IDE.pdf.

Para pagar:
1. Toque no arquivo PDF anexado.
2. Abra o boleto no celular.
3. Utilize o aplicativo do banco ou apresente o boleto no local de pagamento aceito.

*Esta cobrança ainda não está paga.* Confira os dados antes de pagar.

Se precisar de ajuda, responda esta mensagem.')
ON CONFLICT (event_type) DO NOTHING;