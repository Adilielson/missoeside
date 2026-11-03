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
