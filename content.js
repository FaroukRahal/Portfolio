// All site text lives here, in English and French.
// To add a project, copy one entry in PROJECTS and edit it.
// To add a screenshot or demo video, put the file in Assets/projects/ and fill in `media`:
//   media: { type: "image", src: "Assets/projects/steam-recommender.png", alt: { en: "...", fr: "..." } },
//   media: { type: "video", src: "Assets/projects/steam-recommender.mp4", poster: "Assets/projects/steam-recommender.jpg" },
//   (plays muted on loop, like a GIF, while on screen; the poster shows until it starts)

const UI = {
  en: {
    "meta.title": "Farouk Rahal | AI / ML Engineer",
    "meta.description": "Farouk Rahal, M.Sc. AI Systems student at EPITA Paris, building machine learning systems end to end.",
    "nav.cv": "Download CV",
    "coffee.start": "Insert coffee: start the snow",
    "coffee.stop": "Stop the snow",
    "wind.label": "Wind",
    "nav.projects": "Projects",
    "nav.about": "About",
    "nav.contact": "Contact Me",
    "intro.title": "Building Machine Learning Systems End to End",
    "intro.description": [
      "Master's graduate in AI & Data Science, currently pursuing an M.Sc. in Artificial Intelligence Systems at EPITA Paris.",
      "I design, train and deploy machine learning systems, from data pipelines to production.",
      "Seeking a 6-month end-of-studies internship in AI/ML engineering or data science, available immediately.",
    ],
    "projects.title": "Projects",
    "projects.team": "Team project",
    "projects.teamOf": "Team of {n}",
    "projects.preview": "Preview coming soon",
    "projects.hint": "Tap for details",
    "slider.prev": "Previous project",
    "slider.next": "Next project",
    "slider.goto": "Go to project {n}",
    "cta.question": "Interested in working with me?",
    "cta.proposal": [
      "You can send me an email or reach me on LinkedIn.",
    ],
  },
  fr: {
    "meta.title": "Farouk Rahal | Ingénieur IA / ML",
    "meta.description": "Farouk Rahal, étudiant en M.Sc. AI Systems à l'EPITA Paris, conçoit des systèmes de machine learning de bout en bout.",
    "nav.cv": "Télécharger le CV",
    "coffee.start": "Insérer un café : lancer la neige",
    "coffee.stop": "Arrêter la neige",
    "wind.label": "Vent",
    "nav.projects": "Projets",
    "nav.about": "À propos",
    "nav.contact": "Me contacter",
    "intro.title": "Des systèmes de machine learning, de bout en bout",
    "intro.description": [
      "Diplômé d'un Master en IA et Data Science, actuellement en M.Sc. Artificial Intelligence Systems à l'EPITA Paris.",
      "Je conçois, entraîne et déploie des systèmes de machine learning, des pipelines de données jusqu'à la production.",
      "À la recherche d'un stage de fin d'études de 6 mois en ingénierie IA/ML ou en data science, disponible immédiatement.",
    ],
    "projects.title": "Projets",
    "projects.team": "Projet d'équipe",
    "projects.teamOf": "Équipe de {n}",
    "projects.preview": "Aperçu bientôt disponible",
    "projects.hint": "Touchez pour les détails",
    "slider.prev": "Projet précédent",
    "slider.next": "Projet suivant",
    "slider.goto": "Aller au projet {n}",
    "cta.question": "Envie de travailler avec moi ?",
    "cta.proposal": [
      "Vous pouvez m'écrire par e-mail ou me contacter sur LinkedIn.",
    ],
  },
};

const PROJECTS = [
  {
    id: "rag-hackathon",
    media: {
      type: "image",
      src: "Assets/projects/rag-hackathon.png",
      alt: { en: "Retrieval-augmented generation for LLMs", fr: "Génération augmentée par récupération pour les LLM" },
    },
    team: null,
    title: {
      en: "Multi-Agent RAG Assistant for Financial Reports",
      fr: "Assistant RAG multi-agents pour rapports financiers",
    },
    context: {
      en: "EPITA GenAI Hackathon · 2026",
      fr: "Hackathon GenAI EPITA · 2026",
    },
    metrics: [],
    summary: {
      en: "A multi-agent assistant that answers questions about companies' annual reports, built during EPITA's GenAI hackathon, where our team placed 1st out of 18.",
      fr: "Un assistant multi-agents qui répond aux questions sur les rapports annuels des entreprises, réalisé lors du hackathon GenAI de l'EPITA, où notre équipe a terminé 1re sur 18.",
    },
    stack: ["Python", "RAG", "LLM agents", "MCP"],
  },
  {
    id: "steam-recommender",
    media: null,
    team: null,
    title: {
      en: "Real-Time Steam Game Recommender",
      fr: "Recommandation de jeux Steam en temps réel",
    },
    context: {
      en: "EPITA · Recommender Systems · 2026",
      fr: "EPITA · Systèmes de recommandation · 2026",
    },
    metrics: [],
    summary: {
      en: "A real-time game recommender trained on millions of Steam reviews, serving personalised suggestions through a live web app.",
      fr: "Un système de recommandation de jeux en temps réel, entraîné sur des millions d'avis Steam, qui propose des suggestions personnalisées via une application web.",
    },
    stack: ["PyTorch", "FAISS", "LightGBM", "FastAPI"],
  },
  {
    id: "credit-risk-mlops",
    media: null,
    team: null,
    title: {
      en: "Automated Retraining Pipeline for Credit Risk",
      fr: "Pipeline de réentraînement automatique pour le risque de crédit",
    },
    context: {
      en: "EPITA · Data Science in Production · 2026",
      fr: "EPITA · Data Science in Production · 2026",
    },
    metrics: [],
    summary: {
      en: "A production-style ML pipeline that predicts loan defaults and retrains itself, promoting a new model only when it beats the one in production.",
      fr: "Un pipeline de ML de type production qui prédit les défauts de paiement et se réentraîne seul, en ne promouvant un nouveau modèle que s'il surpasse celui en production.",
    },
    stack: ["Airflow", "MLflow", "FastAPI", "Docker"],
  },
  {
    id: "archivelens",
    media: { type: "video", src: "Assets/projects/archivelens-cropped.webm", poster: "Assets/projects/archivelens-poster.jpg" },
    team: null,
    title: {
      en: "ArchiveLens: Natural-Language Visual Search",
      fr: "ArchiveLens : recherche visuelle en langage naturel",
    },
    context: {
      en: "EPITA · Action Learning · 2026",
      fr: "EPITA · Action Learning · 2026",
    },
    metrics: [],
    summary: {
      en: "An extension of our research on open-vocabulary detection and confidence calibration: a visual search app that finds anything in photos and videos from a plain-English description, with confidence scores you can trust.",
      fr: "Le prolongement de nos travaux sur la détection open-vocabulary et la calibration de la confiance : une application de recherche visuelle qui retrouve n'importe quel élément dans des photos et des vidéos à partir d'une simple description, avec des scores de confiance fiables.",
    },
    stack: ["PyTorch", "YOLO-World", "Grounding DINO", "FastAPI"],
  },
  {
    id: "citypulse",
    media: null,
    team: null,
    title: {
      en: "CityPulse: Real-Time Smart Mobility Platform",
      fr: "CityPulse : plateforme de mobilité urbaine en temps réel",
    },
    context: {
      en: "EPITA · Big Data & Cloud Computing · 2026",
      fr: "EPITA · Big Data & Cloud Computing · 2026",
    },
    metrics: [],
    summary: {
      en: "A cloud-native platform that turns live traffic sensor data into real-time congestion insights and route suggestions.",
      fr: "Une plateforme cloud-native qui transforme les données de capteurs de trafic en indicateurs de congestion et en suggestions d'itinéraires en temps réel.",
    },
    stack: ["Python", "Redis Streams", "PostgreSQL", "Docker"],
  },
  {
    id: "cervical-cancer",
    media: {
      type: "image",
      src: "Assets/projects/cervical-cancer.jpg",
      alt: { en: "Cervical cancer detection using AI", fr: "Détection du cancer du col de l'utérus par IA" },
    },
    team: null,
    title: {
      en: "Cervical Cancer Detection",
      fr: "Détection du cancer du col de l'utérus",
    },
    context: {
      en: "Master's project · University of Constantine 2 · 2025",
      fr: "Projet de Master · Université Constantine 2 · 2025",
    },
    metrics: [],
    summary: {
      en: "A deep learning system that classifies cervical cell images, comparing 14 models to find the best performer.",
      fr: "Un système de deep learning qui classe des images de cellules cervicales, en comparant 14 modèles pour identifier le plus performant.",
    },
    stack: ["Deep learning", "CNNs", "Vision Transformers"],
  },
  {
    id: "brave-lab",
    media: {
      type: "image",
      src: "Assets/projects/brave-lab.png",
      alt: { en: "Brave Lab auditor dashboard", fr: "Tableau de bord auditeur de Brave Lab" },
    },
    team: null,
    title: {
      en: "Brave Lab: Blood Laboratory Management",
      fr: "Brave Lab : gestion de laboratoire d'analyses",
    },
    context: {
      en: "University project · University of Constantine 2",
      fr: "Projet universitaire · Université Constantine 2",
    },
    metrics: [],
    summary: {
      en: "A management system for a blood-testing laboratory, with online booking and payments, result tracking and AI-based disease prediction.",
      fr: "Un système de gestion pour un laboratoire d'analyses sanguines, avec prise de rendez-vous et paiement en ligne, suivi des résultats et prédiction de maladies par IA.",
    },
    stack: ["Django", "JavaScript", "Bootstrap"],
  },
  {
    id: "education-platform",
    media: {
      type: "image",
      src: "Assets/projects/education-platform.png",
      alt: { en: "Education Platform login page", fr: "Page de connexion de la plateforme éducative" },
    },
    team: null,
    title: {
      en: "Education Platform",
      fr: "Plateforme éducative",
    },
    context: {
      en: "University project · University of Constantine 2",
      fr: "Projet universitaire · Université Constantine 2",
    },
    metrics: [],
    summary: {
      en: "An e-learning platform built as a university web development project, with separate dashboards for admins, teachers and students to manage courses, assignments and learning activities.",
      fr: "Une plateforme d'e-learning réalisée dans le cadre d'un projet universitaire de développement web, avec des tableaux de bord distincts pour les administrateurs, les enseignants et les étudiants afin de gérer les cours, les devoirs et les activités pédagogiques.",
    },
    stack: ["HTML", "CSS", "JavaScript"],
  },
];
