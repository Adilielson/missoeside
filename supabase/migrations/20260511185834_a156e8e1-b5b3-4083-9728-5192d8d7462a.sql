
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  area TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_bio TEXT,
  full_bio TEXT,
  image_url TEXT,
  specialties TEXT[] NOT NULL DEFAULT '{}',
  featured BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PUBLISHED',
  instagram_url TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published team members"
  ON public.team_members FOR SELECT
  USING (status = 'PUBLISHED');

CREATE POLICY "Authenticated can view all team members"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert team members"
  ON public.team_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update team members"
  ON public.team_members FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can delete team members"
  ON public.team_members FOR DELETE
  TO authenticated
  USING (true);

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.team_members (name, role, area, slug, short_bio, full_bio, image_url, specialties, featured, display_order, status) VALUES
('Pr. Ricardo Santos', 'Diretor Geral', 'Liderança', 'ricardo-santos', 'Lidera a direção geral do IDE Missões com visão pastoral e estratégica.', 'Pastor há mais de duas décadas, o Pr. Ricardo conduz a direção geral do IDE Missões, articulando equipes, parceiros e campos missionários para que o evangelho avance com excelência e cuidado.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop', ARRAY['Liderança Pastoral','Direção Estratégica','Mentoria'], false, 1, 'PUBLISHED'),
('Ana Oliveira', 'Coordenadora de Campo', 'Operações Missionárias', 'ana-oliveira', 'Coordena os campos missionários e o relacionamento com os obreiros em campo.', 'Ana atua há mais de 10 anos com missões transculturais, coordenando os campos do IDE, acompanhando obreiros e estruturando processos para que cada projeto tenha suporte e continuidade.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1974&auto=format&fit=crop', ARRAY['Coordenação de Campo','Acompanhamento Missionário','Gestão de Projetos'], true, 2, 'PUBLISHED'),
('Marcos Lima', 'Logística Missionária', 'Logística e Suprimentos', 'marcos-lima', 'Garante que cada missão tenha estrutura, recursos e logística para acontecer.', 'Marcos cuida da logística completa das operações missionárias do IDE — do envio de equipes ao suprimento de recursos em campo —, assegurando que nada falte para a obra.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1974&auto=format&fit=crop', ARRAY['Logística','Suprimentos','Operações'], false, 3, 'PUBLISHED'),
('Sarah Meirelles', 'Relacionamento e Doações', 'Mantenedores e Parcerias', 'sarah-meirelles', 'Cuida do relacionamento com mantenedores, doadores e parceiros do ministério.', 'Sarah é a ponte entre o IDE e quem sustenta a obra. Acompanha mantenedores, doadores e igrejas parceiras com transparência, gratidão e prestação de contas.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop', ARRAY['Relacionamento','Captação','Parcerias'], false, 4, 'PUBLISHED');
