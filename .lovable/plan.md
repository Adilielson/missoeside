## Objetivo

Criar uma página pública "Equipe" com perfis detalhados, transformar os dados mockados da seção `Team` da home em dados persistidos no banco, e adicionar uma aba "Equipe" no painel administrativo com CRUD completo (espelhando o padrão já existente em Projetos / Eventos / Blog).

## 1. Banco de Dados (Supabase)

Criar tabela `team_members`:

- `name` (texto, obrigatório)
- `role` (texto, obrigatório) — ex: "Diretor Geral", "CEO"
- `area` (texto, obrigatório) — Área de atuação no IDE (ex: "Liderança Executiva")
- `slug` (texto único, obrigatório) — usado na URL `/equipe/$slug`
- `short_bio` (texto) — frase curta tipo "Lidera a visão estratégica…"
- `full_bio` (texto longo) — descrição completa
- `image_url` (texto) — foto do membro
- `specialties` (text[]) — tags/chips ("Liderança Executiva", "Parcerias"…)
- `featured` (boolean) — destaque visual (cartão elevado como "Ana Oliveira")
- `display_order` (int) — ordenação manual
- `status` (enum/text: `PUBLISHED` | `DRAFT`)
- `instagram_url`, `linkedin_url` (texto, opcionais)

**RLS:**
- Leitura pública apenas de `status = 'PUBLISHED'`
- Insert/Update/Delete apenas para usuários autenticados (mesmo padrão das outras tabelas administrativas)

**Seed:** inserir os 4 membros atualmente mockados em `src/components/sections/Team.tsx` (Pr. Ricardo, Ana Oliveira, Marcos Lima, Sarah Meirelles) + um exemplo "Adilielson / CEO" baseado na imagem enviada, para que a página já apareça populada.

## 2. Home — Seção Team dinâmica

Refatorar `src/components/sections/Team.tsx`:

- Remover array mockado.
- Buscar membros com `useQuery` (status PUBLISHED, ordenados por `display_order`).
- Manter exatamente o mesmo design/layout atual (cartões redondos, destaque do `featured`).
- Cada cartão vira um link para `/equipe/$slug`.
- Botão "Junte-se à Equipe" continua igual.

## 3. Página pública `/equipe`

Nova rota `src/routes/equipe.tsx`:

- Lista todos os membros publicados em grid.
- Mesma identidade visual da home (cartões com nome, cargo, foto).
- Cada cartão linka para o perfil individual.
- Head/SEO próprio: título "Nossa Equipe — IDE Missões", description, og tags.

## 4. Página de perfil `/equipe/$slug`

Nova rota `src/routes/equipe.$slug.tsx` inspirada na imagem de referência (Adilielson):

- Layout 2 colunas: foto grande à esquerda, conteúdo à direita.
- Badge do cargo no topo.
- Nome em destaque (display font).
- `short_bio` como subtítulo.
- `full_bio` em parágrafo.
- Bloco "ESPECIALIDADES" com chips a partir de `specialties`.
- Links sociais (Instagram/LinkedIn) se existirem.
- Adaptado à paleta atual do site (claro/laranja), não ao tema verde/escuro da imagem (a imagem é apenas referência de estrutura).
- SEO dinâmico com nome + cargo no title e og:image = foto do membro.
- `notFoundComponent` se slug não existir.

## 5. Painel Administrativo

Adicionar item "Equipe" no menu lateral em `src/routes/admin.tsx` (ícone `UserCircle` ou `Users2`).

Nova rota `src/routes/admin/team.tsx` seguindo exatamente o padrão de `admin/projects.tsx`:

- Tabela listando todos os membros (incluindo DRAFT).
- Botão "Novo Membro".
- Modal/Dialog de criação e edição com campos: nome, cargo, área, slug (auto-gerado a partir do nome, editável), bio curta, bio completa (textarea), URL da imagem, especialidades (input de tags), destaque (switch), ordem (number), status, Instagram, LinkedIn.
- Ações por linha: Editar, Excluir (com confirmação), Alternar status.
- Validação de slug único.

## 6. Detalhes técnicos

- Usar `supabase` client (browser) com TanStack Query (`useQuery` / `useMutation`), igual aos módulos existentes.
- Tipos vêm automaticamente de `src/integrations/supabase/types.ts` após a migration.
- Slug: gerado client-side (lowercase, sem acento, hífens) com fallback editável no admin.
- Imagens: por enquanto via URL externa (mesmo padrão atual de projetos/eventos), sem upload para Storage.

## Resumo de arquivos

**Criar:**
- `src/routes/equipe.tsx`
- `src/routes/equipe.$slug.tsx`
- `src/routes/admin/team.tsx`

**Editar:**
- `src/components/sections/Team.tsx` (mock → query)
- `src/routes/admin.tsx` (novo item de menu)

**Migration:** criar tabela `team_members`, RLS, seed inicial.
