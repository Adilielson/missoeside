# IDE Missões — Acompanhamento de doadores e Campanhas

## 1. Dados e permissões
- `/admin/analytics`: abas de visitas/engajamento e doadores/pagamentos.
- Identificação do doador: nome registrado em `donations`, e-mail, telefone, tipo/método, projeto e valor.
- Acesso aos dados pessoais e financeiros apenas por usuários com `profiles.role = admin`, reforçado por RLS.
- Doações anônimas continuam com o nome armazenado como `Doador Anônimo`: o nome real não está disponível no banco original.
- A coluna `donor_marketing_consent` começa `false` em todo registro antigo. **Não considerar doações antigas autorização de marketing.**

## 2. Implantação (ordem obrigatória)
1. Revisar e aplicar `supabase/migrations/20261101130000_donor_tracking_campaigns.sql` no Supabase do site, mantendo backup/rollback do banco.
2. Fazer o deploy das funções `asaas-webhook`, `create-donation` e `admin-asaas-reconcile` para o projeto Supabase correto.
3. Confirmar que `admin-asaas-reconcile` está acessível sem JWT na camada de gateway, mas recusa requisições sem JWT de usuário válido e sem papel admin.
4. **Somente depois** habilitar o segredo da Edge Function `DONOR_TRACKING_ENABLED=true`. Antes disso, o webhook e a emissão mantêm o esquema anterior.
5. Habilitar `VITE_DONOR_TRACKING_ENABLED=true` no ambiente de build do site, se for começar a coletar consentimento. Se não, a caixa de aceite permanece escondida.
6. Sincronizar/publicar a branch principal (deploy Vercel/Lovable conforme onde está o domínio).
7. Quando o webhook Asaas estiver implantado, autenticado e testado, habilitá-lo no painel. Não reenviar eventos antigos sem revisar idempotência.
8. Conferir filtros, vínculo com projetos e migração com conta admin e editor; testar `/admin/campaigns` com rascunhos, sem envio.
9. Testar conciliação manual (lotes de 20): comparar cobrança pendente/vencida/paga no Asaas e no dashboard.

## 3. Como interpretar a situação financeira
- Vencido: cobrança registrada com vencimento já passado e status aberto, conforme últimos dados do Asaas.
- A verificar: sem vencimento confiável ou sem histórico individual; não chamar de inadimplência.
- Mensalidade: cada cobrança `pay_...` é guardada separadamente em `asaas_payment_cycles`.
- Um registro de assinatura `sub_...` representa a relação recorrente, não a soma de todos os meses pagos.
- A consulta manual usa `GET /payments/{id}` ou `GET /subscriptions/{id}/payments`, não cria cobranças nem envia mensagens.
- Existe limite de leitura por lote e janela de até 100 cobranças por assinatura; monitorar paginação de assinaturas longas.

## 4. Campanhas e privacidade
- `/admin/campaigns` suporta elaboração, edição, organização de público e revisão (DRAFT/READY/ARCHIVED).
- Canais previstos: E-mail, WhatsApp, Newsletter e Multicanal.
- Não há botão de disparo coletivo; isso evita mensagens sem verificação de consentimento e opt-out.
- Preferir comunicação individual e operacional para boletos pendentes; não misturar com campanhas promocionais.
- Antes do envio automatizado: conectar provedor de e-mail transacional/marketing, domínio verificado, descadastro com link, logs de entrega, gestão de consentimento por canal, plataforma oficial WhatsApp/templating e limites de uso.
- Na newsletter, considerar apenas cadastros com opt-in válido e descadastro não solicitado.
- Templates sugeridos: boletim de impacto, prestação de contas, atualização do projeto, convite para evento, pesquisa de satisfação, acolhimento de novos apoiadores e lembretes operacionais de boletos.
- Mensagens de WhatsApp precisam obedecer às políticas e permissões do provedor; não automatizar pela API bancária Asaas.

## 5. Testes e limitações
- A página /doar2 foi preservada, exceto pelo opt-in opcional condicionando a flag de build.
- A fonte de dados é o Supabase; NÃO são dados de produção carregados por este PR.
- `npm run build` passou no GitHub Actions com instalação por `npm install --legacy-peer-deps --package-lock=false`.
- `tsc --noEmit` ainda aponta erros **anteriores** em `src/integrations/supabase/auth-attacher.ts`, `auth-middleware.ts`, `src/router.tsx`, `src/routes/equipe.$slug.tsx`. Resolver em atividade separada para não misturar escopos.
- O arquivo `package-lock.json` original não corresponde ao `package.json`, e os ambientes Vercel registraram falhas; corrigir a instalação/deploy fora desta atualização funcional.
- Nenhuma cobrança real, envio de e-mail ou mensagem WhatsApp foi executada por este PR.
