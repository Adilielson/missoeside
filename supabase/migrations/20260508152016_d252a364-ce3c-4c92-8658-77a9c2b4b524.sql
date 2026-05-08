INSERT INTO public.projects (
  name, 
  slug, 
  description, 
  short_description, 
  cover_image, 
  category, 
  country, 
  goal_amount, 
  current_amount, 
  status, 
  featured, 
  gallery
) VALUES 
(
  'África: Xai Xai / Gaza', 
  'africa-saude-xai-xai', 
  'Moçambique enfrenta desafios significativos no acesso à água potável e saneamento básico. Em Xai Xai, muitas famílias ainda dependem de fontes de água não tratada, o que resulta em altos índices de doenças hídricas, afetando principalmente as crianças da região.

Nosso projeto foca na construção de poços artesianos equipados com sistemas de filtragem solar. Além da infraestrutura, nossa equipe de missionários realiza treinamentos sobre higiene e cuidados com a saúde.', 
  'A Agência Cristã Missionária IDE está mobilizando esforços para transformar a realidade da comunidade de Xai Xai, na província de Gaza, Moçambique.', 
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200', 
  'SAÚDE / MISSÕES', 
  'Moçambique', 
  20000, 
  13000, 
  'PUBLISHED', 
  true, 
  ARRAY[
    'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800',
    'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=800',
    'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800',
    'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800'
  ]
),
(
  'África: Educação Xai Xai', 
  'africa-educacao-xai-xai', 
  'A falta de materiais escolares e professores capacitados é um dos maiores obstáculos para o desenvolvimento educacional em Xai Xai. Muitas crianças abandonam os estudos cedo por falta de recursos básicos.

Distribuímos kits escolares completos e promovemos treinamentos pedagógicos para professores locais, capacitando-os com metodologias modernas de ensino.', 
  'Fornecimento de materiais escolares e treinamento para professores locais em comunidades carentes de Moçambique.', 
  'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=1200', 
  'EDUCAÇÃO', 
  'Moçambique', 
  15000, 
  7500, 
  'PUBLISHED', 
  false, 
  ARRAY[
    'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=800',
    'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800',
    'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800',
    'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800'
  ]
);