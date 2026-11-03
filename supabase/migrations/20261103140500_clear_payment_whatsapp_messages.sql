-- Atualiza apenas a redação padrão antiga; não altera modelos personalizados.
UPDATE public.whatsapp_automation_templates SET
  content = replace(content,
    'Sua contribuição para *{{projeto}}* foi registrada.',
    'Muito obrigado por escolher apoiar *{{projeto}}*! Recebemos seu cadastro e estamos aguardando o pagamento para confirmar sua contribuição.'),
  updated_at = now()
WHERE event_type IN ('pix_instructions','boleto_instructions')
  AND content LIKE '%Sua contribuição para *{{projeto}}* foi registrada.%';
UPDATE public.whatsapp_automation_templates SET
  content = replace(content,
    'Confirmamos seu apoio de {{valor}} ao projeto {{projeto}}.',
    'Recebemos seu pagamento de {{valor}} ao projeto {{projeto}}. Sua contribuição está confirmada!'),
  updated_at = now()
WHERE event_type = 'payment_confirmed'
  AND content LIKE '%Confirmamos seu apoio de {{valor}} ao projeto {{projeto}}.%';
