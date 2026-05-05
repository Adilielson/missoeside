
export interface Project {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  location: string;
  country: string;
  date: string;
  coverImage: string;
  introText: string;
  bodyText: string;
  whatWeDo: string;
  projectGoal: string;
  spiritualImpact: string;
  callToAction: string;
  goalAmount: number;
  raisedAmount: number;
  active: boolean;
  gallery: string[];
}

export const projects: Project[] = [
  {
    id: "1",
    slug: "africa-saude-xai-xai",
    title: "África",
    subtitle: "Xai Xai / Gaza",
    category: "SAÚDE / MISSÕES",
    location: "Moçambique, África",
    country: "Moçambique",
    date: "04 DE MAIO, 2026",
    coverImage: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200",
    introText: "A Agência Cristã Missionária IDE está mobilizando esforços para transformar a realidade da comunidade de Xai Xai, na província de Gaza, Moçambique.",
    bodyText: "Moçambique enfrenta desafios significativos no acesso à água potável e saneamento básico. Em Xai Xai, muitas famílias ainda dependem de fontes de água não tratada, o que resulta em altos índices de doenças hídricas, afetando principalmente as crianças da região.",
    whatWeDo: "Nosso projeto foca na construção de poços artesianos equipados com sistemas de filtragem solar. Além da infraestrutura, nossa equipe de missionários realiza treinamentos sobre higiene e cuidados com a saúde.",
    projectGoal: "Instalação de 5 poços artesianos de alta profundidade para servir mais de 10.000 pessoas.",
    spiritualImpact: "Através da água física, levamos a 'Água da Vida', estabelecendo pontos de pregação e apoio espiritual.",
    callToAction: "Junte-se a nós nesta causa. Cada contribuição nos aproxima de mais um metro perfurado, de mais uma criança saudável e de uma comunidade que pode sonhar com um futuro melhor.",
    goalAmount: 20000,
    raisedAmount: 13000,
    active: true,
    gallery: [
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800",
      "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=800",
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800",
      "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800"
    ]
  },
  {
    id: "2",
    slug: "africa-educacao-xai-xai",
    title: "África",
    subtitle: "Xai Xai / Gaza",
    category: "EDUCAÇÃO",
    location: "Moçambique, África",
    country: "Moçambique",
    date: "04 DE MAIO, 2026",
    coverImage: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=1200",
    introText: "Fornecimento de materiais escolares e treinamento para professores locais em comunidades carentes de Moçambique.",
    bodyText: "A falta de materiais escolares e professores capacitados é um dos maiores obstáculos para o desenvolvimento educacional em Xai Xai. Muitas crianças abandonam os estudos cedo por falta de recursos básicos.",
    whatWeDo: "Distribuímos kits escolares completos e promovemos treinamentos pedagógicos para professores locais, capacitando-os com metodologias modernas de ensino.",
    projectGoal: "Equipar 10 escolas e capacitar 50 professores para atender mais de 2.000 alunos.",
    spiritualImpact: "Educação que transforma não só a mente, mas também o coração. Cada escola é também um ponto de encontro e esperança.",
    callToAction: "Sua doação garante que uma criança tenha acesso a lápis, cadernos e um professor preparado para mudar sua vida.",
    goalAmount: 15000,
    raisedAmount: 7500,
    active: true,
    gallery: [
      "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=800",
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800",
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800",
      "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800"
    ]
  },
  {
    id: "3",
    slug: "alivio-fome-america-latina",
    title: "Alívio à Fome",
    subtitle: "América Latina",
    category: "ALIMENTAÇÃO",
    location: "América Latina",
    country: "Brasil / Venezuela",
    date: "04 DE MAIO, 2026",
    coverImage: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200",
    introText: "Distribuição de cestas básicas e apoio a hortas comunitárias autossustentáveis em comunidades vulneráveis da América Latina.",
    bodyText: "A insegurança alimentar atinge milhões de famílias na América Latina. Nosso projeto combina distribuição imediata de alimentos com a criação de hortas comunitárias para gerar sustentabilidade a longo prazo.",
    whatWeDo: "Distribuímos cestas básicas mensais e ensinamos técnicas de agricultura urbana para que as famílias possam produzir seu próprio alimento.",
    projectGoal: "Atender 500 famílias mensalmente e criar 20 hortas comunitárias autossustentáveis.",
    spiritualImpact: "Alimentamos o corpo e o espírito. Cada família atendida recebe também apoio espiritual e acompanhamento pastoral.",
    callToAction: "Com R$ 50 você alimenta uma família por um mês. Sua contribuição tem impacto imediato e mensurável.",
    goalAmount: 25000,
    raisedAmount: 18000,
    active: true,
    gallery: [
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800",
      "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800",
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800",
      "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=800"
    ]
  },
  {
    id: "4",
    slug: "apoio-refugiados",
    title: "Apoio a Refugiados",
    subtitle: "Vítimas de Guerra",
    category: "EMERGÊNCIA",
    location: "Oriente Médio",
    country: "Gaza / Síria",
    date: "04 DE MAIO, 2026",
    coverImage: "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=1200",
    introText: "Assistência médica e psicológica imediata para famílias deslocadas por conflitos armados no Oriente Médio.",
    bodyText: "Milhares de famílias foram forçadas a abandonar suas casas por causa de conflitos armados. Elas precisam de assistência imediata: abrigo, alimento, atendimento médico e suporte emocional.",
    whatWeDo: "Nossa equipe de missionários e voluntários atua diretamente nas zonas de conflito oferecendo atendimento médico básico, suporte psicológico e distribuição de kits de emergência.",
    projectGoal: "Atender 1.000 famílias com kits de emergência e acompanhamento médico e psicológico.",
    spiritualImpact: "Em meio à dor e ao caos, levamos a mensagem de esperança e restauração. O amor de Deus não conhece fronteiras.",
    callToAction: "Em situações de emergência, cada minuto conta. Sua doação hoje pode salvar uma vida amanhã.",
    goalAmount: 50000,
    raisedAmount: 32000,
    active: true,
    gallery: [
      "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800",
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800",
      "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=800",
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800"
    ]
  }
];

export const getProjectBySlug = (slug: string): Project | undefined => {
  return projects.find(p => p.slug === slug);
};

export const getActiveProjects = (): Project[] => {
  return projects.filter(p => p.active);
};

export const getOtherProjects = (currentSlug: string): Project[] => {
  return projects.filter(p => p.slug !== currentSlug && p.active).slice(0, 3);
};
