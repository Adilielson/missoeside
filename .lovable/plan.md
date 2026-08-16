# Plano: Aba de Histórico de Alterações (Admin)

Este plano descreve a implementação de um sistema de logs de auditoria para rastrear ações realizadas por usuários no painel administrativo (criação/edição de posts, projetos, eventos e usuários).

## Alterações Propostas

### Backend & Banco de Dados
- **Tabela de Logs**: Utilizaremos a tabela `page_events` existente para eventos simples, ou criaremos uma nova tabela `admin_logs` se for necessário armazenar o estado anterior/novo das alterações (diff).
- **Triggers (Opcional)**: Avaliar o uso de triggers no banco para capturar alterações automáticas, ou implementar via aplicação para maior controle.

### Frontend & Dashboards
- **Nova Aba no Admin**: Adicionar "Histórico" ao menu lateral do `/admin`.
- **Página de Histórico**: Criar `src/routes/admin/history.tsx` com filtros por data, usuário e tipo de ação.
- **Integração de Logs**:
  - Instrumentar as páginas de Posts, Projetos e Eventos para disparar eventos de log no sucesso de operações de salvamento/exclusão.
  - Logar acessos à área administrativa.

### Segurança
- **Restrição de Acesso**: A nova aba será visível e acessível **apenas** para usuários com o cargo (`role`) de `admin`.

## Detalhes Técnicos
- **Hook de Registro**: Criar `useAdminLogger.ts` que facilita o envio de logs estruturados para o Supabase.
- **Componente de Timeline**: Exibir os logs em formato de linha do tempo ou tabela detalhada.
- **Metadados**: Salvar o JSON da alteração no campo `metadata` para permitir visualização do que mudou.

## Próximos Passos
1. Criar a nova rota de histórico no admin.
2. Adicionar o item ao menu em `src/routes/admin.tsx`.
3. Implementar a lógica de captura de logs nos formulários existentes.
