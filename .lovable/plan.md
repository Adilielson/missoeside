### Objetivo
Transformar a página de checkout em uma experiência dinâmica vinculada a um projeto específico, permitindo que os doadores vejam os detalhes do projeto que estão apoiando e garantindo que o sistema registre para onde a verba será destinada.

### O que será feito:

**1. Alteração no Link de Apoio**
- No card do projeto e na página de detalhes do projeto, o botão "Apoiar agora" deixará de ser um simples alerta ou link genérico e passará a redirecionar para `/doar?project={slug}`.

**2. Dinamismo na Página de Checkout (`/doar`)**
- A página irá capturar o `slug` do projeto via URL.
- Se houver um projeto selecionado, os dados (imagem, nome e descrição curta) serão exibidos no lado direito da tela, substituindo o conteúdo estático atual.
- Se não houver projeto na URL, a página manterá o comportamento padrão (doação geral).

**3. Persistência do Vínculo**
- Ao finalizar a doação, o `slug` ou `id` do projeto será enviado para a Edge Function `create-donation`.
- Esse valor será salvo no campo `campaign` da tabela `donations`, permitindo que você saiba exatamente para qual projeto cada doação foi destinada no seu painel.

**4. Feedback visual pós-doação**
- Adição de uma mensagem ou detalhe no checkout informando que a verba está sendo destinada ao projeto em questão.

### Detalhes técnicos (para referência):
- Uso de `useSearchParams` do TanStack Router para capturar o projeto.
- Busca dinâmica no Supabase para carregar os dados do projeto no lado direito do checkout.
- Atualização da chamada da função `create-donation` para incluir o campo `campaign`.
