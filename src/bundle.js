const initialForSaleListings = [
  {
    id: "proj-1",
    type: "sale",
    title: "AI Copywriter Pro",
    titleEn: "AI Copywriter Pro",
    category: "ai",
    categoryEn: "AI Tool",
    askingPrice: 24000,
    mrr: 2450,
    status: "Doğrulanmış",
    statusEn: "Verified",
    isAnonymous: false,
    seller: {
      name: "Caner Yılmaz",
      handle: "@caner_dev",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      githubVerified: true
    },
    shortDesc: "GPT-4o tabanlı e-ticaret ve pazarlama içerik üretim platformu. 1,240 ödeyen kullanıcı.",
    shortDescEn: "GPT-4o powered e-commerce & marketing copy generator. 1,240 paying users.",
    fullDesc: "AI Copywriter Pro, Shopify ve WordPress satıcıları için otomatik SEO uyumlu ürün açıklamaları üretir. Stripe entegrasyonu tamamlanmıştır. Satış sonrası 30 gün teknik destek verilecektir.",
    fullDescEn: "AI Copywriter Pro generates automated SEO-optimized product descriptions for Shopify & WordPress merchants. Integrated with Stripe. Includes 30 days post-sale support.",
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    techStack: ["Next.js 14", "OpenAI API", "Tailwind CSS", "Supabase", "Stripe"],
    reasonForSelling: "Yeni projem nedeniyle vakit ayıramıyorum.",
    reasonForSellingEn: "Focusing on a new project, lack of time.",
    setupTimeHours: 2,
    createdAt: "2 saat önce",
    createdAtEn: "2 hours ago"
  },
  {
    id: "proj-2",
    type: "sale",
    title: "MetricsFlow Analytics",
    titleEn: "MetricsFlow Analytics",
    category: "saas",
    categoryEn: "Micro SaaS",
    askingPrice: 8500,
    mrr: 720,
    status: "Aktif",
    statusEn: "Active",
    isAnonymous: false,
    seller: {
      name: "Selin Aksoy",
      handle: "@selin_builds",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
      githubVerified: true
    },
    shortDesc: "KVKK & GDPR uyumlu, çerez gerektirmeyen hafif web analitik yazılımı.",
    shortDescEn: "GDPR & privacy-compliant cookieless lightweight web analytics tool.",
    fullDesc: "Google Analytics alternatifi gizlilik odaklı analitik aracı. PostgreSQL ve ClickHouse altyapısı ile saniyede binlerce veriyi işler. 45 aktif abone.",
    fullDescEn: "Privacy-first analytics platform alternative to Google Analytics. Handles thousands of hits using ClickHouse & PostgreSQL. 45 active subscribers.",
    coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    techStack: ["Vue 3", "Node.js", "ClickHouse", "PostgreSQL"],
    reasonForSelling: "Solopreneur olarak pazarlama alanında zorlanıyorum.",
    reasonForSellingEn: "Struggling with marketing as a solopreneur.",
    setupTimeHours: 1,
    createdAt: "5 saat önce",
    createdAtEn: "5 hours ago"
  },
  {
    id: "proj-3",
    type: "sale",
    title: "TabSaver Chrome Ext",
    titleEn: "TabSaver Chrome Ext",
    category: "extension",
    categoryEn: "Chrome Ext",
    askingPrice: 1200,
    mrr: 180,
    status: "Anonim İlan",
    statusEn: "Anonymous",
    isAnonymous: true,
    seller: {
      name: "Doğrulanmış Dev #4029",
      handle: "@anon_builder",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      githubVerified: true
    },
    shortDesc: "RAM kullanımını %70 azaltan sekme yöneticisi uzantısı. Chrome Web Store'da 15k indirme.",
    shortDescEn: "Tab manager extension reducing RAM usage by 70%. 15k downloads on Chrome Web Store.",
    fullDesc: "Chrome Mağazasında 4.8 yıldızlı değerlendirmeye sahip. Freemium model ile aylık pro üyelik geliri mevcuttur. Kod devri GitHub reposu üzerinden yapılacaktır.",
    fullDescEn: "4.8 rating on Chrome Store. Freemium model generating recurring pro revenue. Code transfer via private GitHub repo.",
    coverImage: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80",
    techStack: ["JavaScript", "Chrome Manifest V3", "Tailwind CSS"],
    reasonForSelling: "Diğer girişimime kaynak sağlamak için.",
    reasonForSellingEn: "Funding my next startup venture.",
    setupTimeHours: 0.5,
    createdAt: "1 gün önce",
    createdAtEn: "1 day ago"
  },
  {
    id: "proj-4",
    type: "sale",
    title: "FitnessTracker iOS & Android",
    titleEn: "FitnessTracker iOS & Android",
    category: "mobile",
    categoryEn: "Mobile App",
    askingPrice: 14500,
    mrr: 1100,
    status: "Doğrulanmış",
    statusEn: "Verified",
    isAnonymous: false,
    seller: {
      name: "Burak Demir",
      handle: "@burak_code",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      githubVerified: true
    },
    shortDesc: "Flutter ile geliştirilmiş yapay zeka destekli antrenman ve kalori takip uygulaması.",
    shortDescEn: "AI workout and calorie tracker mobile app built with Flutter.",
    fullDesc: "App Store ve Play Store hesapları ile birlikte devredilecektir. RevenueCat entegrasyonlu aylık ve yıllık abonelik sistemi kuruludur.",
    fullDescEn: "Transferred with App Store & Play Store publisher accounts. Integrated RevenueCat subscription system.",
    coverImage: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80",
    techStack: ["Flutter", "Dart", "Firebase", "RevenueCat"],
    reasonForSelling: "Kurumsal iş temposu sebebiyle destek verilemiyor.",
    reasonForSellingEn: "Corporate job commitments limit maintenance time.",
    setupTimeHours: 3,
    createdAt: "2 gün önce",
    createdAtEn: "2 days ago"
  },
  {
    id: "proj-5",
    type: "sale",
    title: "PdfWhisperer AI",
    titleEn: "PdfWhisperer AI",
    category: "ai",
    categoryEn: "AI Tool",
    askingPrice: 4200,
    mrr: 350,
    status: "Aktif",
    statusEn: "Active",
    isAnonymous: false,
    seller: {
      name: "Zeynep Kaya",
      handle: "@zeynep_tech",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
      githubVerified: true
    },
    shortDesc: "Uzun PDF belgeleri ile sohbet eden RAG mimarili mikro SaaS uygulaması.",
    shortDescEn: "Micro SaaS with RAG architecture allowing users to chat with long PDF files.",
    fullDesc: "LangChain, Pinecone ve OpenAI altyapılı. Öğrenciler ve akademisyenler tarafından aktif kullanılıyor. Aylık işletme maliyeti $25 civarı.",
    fullDescEn: "Built with LangChain, Pinecone & OpenAI. Used actively by students & researchers. Monthly infra cost around $25.",
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    techStack: ["Python", "FastAPI", "Pinecone", "Next.js", "Tailwind"],
    reasonForSelling: "Akademik tez dönemi yoğunluğu.",
    reasonForSellingEn: "Busy academic thesis period.",
    setupTimeHours: 1,
    createdAt: "3 gün önce",
    createdAtEn: "3 days ago"
  },
  {
    id: "proj-6",
    type: "sale",
    title: "InvoiceNinja Auto",
    titleEn: "InvoiceNinja Auto",
    category: "saas",
    categoryEn: "Micro SaaS",
    askingPrice: 3800,
    mrr: 290,
    status: "Doğrulanmış",
    statusEn: "Verified",
    isAnonymous: false,
    seller: {
      name: "Emre Arslan",
      handle: "@emre_dev",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
      githubVerified: true
    },
    shortDesc: "Serbest çalışanlar için otomatik e-fatura ve hatırlatıcı otomasyon platformu.",
    shortDescEn: "Automated e-invoicing and payment reminder SaaS for freelancers.",
    fullDesc: "Stripe ve İyzico altyapısı hazır. Müşterilere otomatik WhatsApp ve E-posta gecikme uyarısı gönderir.",
    fullDescEn: "Stripe & İyzico payment gateways ready. Sends automated WhatsApp & Email overdue invoice alerts.",
    coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    techStack: ["Laravel", "Vue 3", "PostgreSQL", "Twilio API"],
    reasonForSelling: "Yeni bir ajans kuruyorum.",
    reasonForSellingEn: "Starting a new digital agency.",
    setupTimeHours: 1.5,
    createdAt: "3 gün önce",
    createdAtEn: "3 days ago"
  },
  {
    id: "proj-7",
    type: "sale",
    title: "SocialPulse AI Automation",
    titleEn: "SocialPulse AI Automation",
    category: "ai",
    categoryEn: "AI Tool",
    askingPrice: 32000,
    mrr: 3400,
    status: "Doğrulanmış",
    statusEn: "Verified",
    isAnonymous: false,
    seller: {
      name: "Sarah Jenkins",
      handle: "@sarah_ai",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      githubVerified: true
    },
    shortDesc: "Sosyal medya gönderileri için yapay zeka içerik planlayıcı ve içerik üretici platform.",
    shortDescEn: "AI-powered social media post generator & automated scheduler platform.",
    fullDesc: "LinkedIn, X (Twitter) ve Instagram entegrasyonu tamamlanmıştır. 420 aktif ücretli abonelik. Stripe verified gelir raporu mevcuttur.",
    fullDescEn: "Integrated with LinkedIn, X (Twitter) & Instagram. 420 active paid subscriptions. Verified Stripe revenue reports included.",
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    techStack: ["Next.js 14", "Claude 3.5 API", "Tailwind CSS", "Supabase", "Stripe"],
    reasonForSelling: "Yeni kurumsal startup fikrime fon sağlamak için.",
    reasonForSellingEn: "Funding my new enterprise B2B venture.",
    setupTimeHours: 2,
    createdAt: "4 saat önce",
    createdAtEn: "4 hours ago"
  },
  {
    id: "proj-8",
    type: "sale",
    title: "DevFlow Docs & Kanban",
    titleEn: "DevFlow Docs & Kanban",
    category: "saas",
    categoryEn: "Micro SaaS",
    askingPrice: 16500,
    mrr: 1850,
    status: "Aktif",
    statusEn: "Active",
    isAnonymous: false,
    seller: {
      name: "Alex Rivera",
      handle: "@alex_devflow",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      githubVerified: true
    },
    shortDesc: "Yazılımcılar için minimalist dokümantasyon ve görev yönetim yazılımı.",
    shortDescEn: "Minimalist documentation and task management SaaS tailored for developers.",
    fullDesc: "Notion ve Linear alternatifi hızlı web uygulaması. 1,850$ MRR ile düzenli organik büyüme gösteriyor.",
    fullDescEn: "Fast web app alternative to Notion & Linear. Steady organic growth with $1,850 MRR.",
    coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    techStack: ["React", "TypeScript", "Node.js", "MongoDB", "Tailwind"],
    reasonForSelling: "Zaman darlığı ve yeni projelere odaklanma.",
    reasonForSellingEn: "Lack of time and focusing on new projects.",
    setupTimeHours: 1,
    createdAt: "6 saat önce",
    createdAtEn: "6 hours ago"
  },
  {
    id: "proj-9",
    type: "sale",
    title: "GrammarCheck Pro Chrome Ext",
    titleEn: "GrammarCheck Pro Chrome Ext",
    category: "extension",
    categoryEn: "Chrome Ext",
    askingPrice: 4500,
    mrr: 520,
    status: "Doğrulanmış",
    statusEn: "Verified",
    isAnonymous: false,
    seller: {
      name: "Elena Rostova",
      handle: "@elena_ext",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
      githubVerified: true
    },
    shortDesc: "E-posta yazarken anlık dil bilgisi düzelten Chrome eklentisi. 22k indirme.",
    shortDescEn: "Real-time grammar correction Chrome extension for emails. 22k downloads.",
    fullDesc: "Chrome Web Store'da 4.9 yıldıza sahip. Aylık $520 pro abonelik geliri getirmektedir.",
    fullDescEn: "4.9 star rating on Chrome Web Store. Generates $520 MRR from pro subscribers.",
    coverImage: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80",
    techStack: ["JavaScript", "Chrome Manifest V3", "OpenAI API"],
    reasonForSelling: "Yüksek lisans eğitimi.",
    reasonForSellingEn: "Starting master's degree program.",
    setupTimeHours: 0.5,
    createdAt: "1 gün önce",
    createdAtEn: "1 day ago"
  },
  {
    id: "proj-10",
    type: "sale",
    title: "HabitTracker 3D iOS & Android",
    titleEn: "HabitTracker 3D iOS & Android",
    category: "mobile",
    categoryEn: "Mobile App",
    askingPrice: 22000,
    mrr: 2100,
    status: "Doğrulanmış",
    statusEn: "Verified",
    isAnonymous: false,
    seller: {
      name: "Liam Thorne",
      handle: "@liam_mobile",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      githubVerified: true
    },
    shortDesc: "Gamified alışkanlık ve hedef takip mobil uygulaması. 35,000+ aktif kullanıcı.",
    shortDescEn: "Gamified habit and goal tracker mobile app. 35,000+ active users.",
    fullDesc: "React Native altyapılı. App Store ve Play Store hesapları ile devredilecektir. RevenueCat abonelik entegrasyonu vardır.",
    fullDescEn: "Built with React Native. Includes App Store & Play Store publisher accounts with RevenueCat.",
    coverImage: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80",
    techStack: ["React Native", "Expo", "Firebase", "RevenueCat"],
    reasonForSelling: "Başka bir mobil oyuna bütçe aktarmak.",
    reasonForSellingEn: "Reallocating capital to a new mobile game.",
    setupTimeHours: 2.5,
    createdAt: "1 gün önce",
    createdAtEn: "1 day ago"
  },
  {
    id: "proj-11",
    type: "sale",
    title: "VoiceScript AI Studio",
    titleEn: "VoiceScript AI Studio",
    category: "ai",
    categoryEn: "AI Tool",
    askingPrice: 45000,
    mrr: 4800,
    status: "Doğrulanmış",
    statusEn: "Verified",
    isAnonymous: false,
    seller: {
      name: "Marcus Bennett",
      handle: "@marcus_voice",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80",
      githubVerified: true
    },
    shortDesc: "Yapay zeka ile ses dublajı ve altyazı üreten içerik yazılımı. $4.8k MRR.",
    shortDescEn: "AI voice dubbing & automated subtitle generator platform. $4.8k MRR.",
    fullDesc: "Whisper ve ElevenLabs entegrasyonlu SaaS. YouTube ve TikTok içerik üreticileri tarafından yoğun kullanılıyor.",
    fullDescEn: "SaaS integrated with Whisper & ElevenLabs. Widely used by YouTube & TikTok creators.",
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    techStack: ["Python", "FastAPI", "Next.js", "Whisper AI", "Stripe"],
    reasonForSelling: "Büyütme aşaması için sermaye arayışı.",
    reasonForSellingEn: "Seeking exit capital for growth investments.",
    setupTimeHours: 3,
    createdAt: "2 gün önce",
    createdAtEn: "2 days ago"
  },
  {
    id: "proj-12",
    type: "sale",
    title: "FormCraft Surveys & Forms",
    titleEn: "FormCraft Surveys & Forms",
    category: "saas",
    categoryEn: "Micro SaaS",
    askingPrice: 11500,
    mrr: 940,
    status: "Aktif",
    statusEn: "Active",
    isAnonymous: false,
    seller: {
      name: "Chloe Miller",
      handle: "@chloe_forms",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
      githubVerified: true
    },
    shortDesc: "Typeform alternatifi sürükle-bırak form ve anket oluşturucu.",
    shortDescEn: "Drag-and-drop form and survey builder alternative to Typeform.",
    fullDesc: "Zapper ve Make entegrasyonlu. 85 aktif ödeyen işletme abonesi bulunmaktadır.",
    fullDescEn: "Integrated with Zapier & Make. 85 active paying business subscribers.",
    coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    techStack: ["Vue 3", "Node.js", "PostgreSQL", "Tailwind CSS"],
    reasonForSelling: "Tek kişilik geliştirici olarak destek süresini yönetememe.",
    reasonForSellingEn: "Solo founder struggling to keep up with support.",
    setupTimeHours: 1,
    createdAt: "2 gün önce",
    createdAtEn: "2 days ago"
  },
  {
    id: "proj-13",
    type: "sale",
    title: "PromptCraft AI Studio",
    titleEn: "PromptCraft AI Studio",
    category: "ai",
    categoryEn: "AI Tool",
    askingPrice: 8200,
    mrr: 760,
    status: "Doğrulanmış",
    statusEn: "Verified",
    isAnonymous: false,
    seller: {
      name: "Michael Chang",
      handle: "@michael_prompts",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      githubVerified: true
    },
    shortDesc: "ChatGPT ve Midjourney için profesyonel prompt kütüphanesi ve pazar yeri.",
    shortDescEn: "Professional prompt library and marketplace for ChatGPT & Midjourney.",
    fullDesc: "5,000+ kayıtlı üye. Prompt satıcılarından %15 komisyon ve aylık pro üyelik geliri sağlar.",
    fullDescEn: "5,000+ registered members. Generates 15% marketplace commission + pro subscriptions.",
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    techStack: ["Next.js 14", "Tailwind CSS", "Supabase", "Stripe"],
    reasonForSelling: "Yeni yapay zeka ajansı girişimime kaynak aktarmak.",
    reasonForSellingEn: "Reallocating capital to new AI agency initiative.",
    setupTimeHours: 1.5,
    createdAt: "3 gün önce",
    createdAtEn: "3 days ago"
  },
  {
    id: "proj-14",
    type: "sale",
    title: "PodcastTranscriber Pro",
    titleEn: "PodcastTranscriber Pro",
    category: "ai",
    categoryEn: "AI Tool",
    askingPrice: 19000,
    mrr: 1650,
    status: "Doğrulanmış",
    statusEn: "Verified",
    isAnonymous: false,
    seller: {
      name: "James Lawson",
      handle: "@james_audio",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
      githubVerified: true
    },
    shortDesc: "Podcast yayınları için otomatik transkript ve şov notları çıkaran yazılım.",
    shortDescEn: "Automated podcast transcription & show notes generator SaaS.",
    fullDesc: "Spotify ve Apple Podcasts RSS akışlarını otomatik tarar. 140+ aktif abonelik.",
    fullDescEn: "Auto-scrapes Spotify & Apple Podcasts RSS feeds. 140+ active subscriptions.",
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    techStack: ["Python", "Whisper API", "React", "PostgreSQL"],
    reasonForSelling: "Diğer projelere ağırlık vermek.",
    reasonForSellingEn: "Focusing on core product portfolio.",
    setupTimeHours: 2,
    createdAt: "3 gün önce",
    createdAtEn: "3 days ago"
  },
  {
    id: "proj-15",
    type: "sale",
    title: "CloudBackups Automated SaaS",
    titleEn: "CloudBackups Automated SaaS",
    category: "saas",
    categoryEn: "Micro SaaS",
    askingPrice: 18500,
    mrr: 1450,
    status: "Doğrulanmış",
    statusEn: "Verified",
    isAnonymous: false,
    seller: {
      name: "Jonathan Reed",
      handle: "@jonathan_cloud",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80",
      githubVerified: true
    },
    shortDesc: "Veritabanı ve S3 bulut sunucu yedeklerini otomatikleştiren B2B SaaS platformu.",
    shortDescEn: "Automated database & AWS S3 cloud backup platform for B2B teams.",
    fullDesc: "PostgreSQL, MySQL ve MongoDB veritabanlarını saatlik yedekler. 120 aktif ödeyen kurumsal abone.",
    fullDescEn: "Backs up PostgreSQL, MySQL & MongoDB databases hourly. 120 active paying B2B subscribers.",
    coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    techStack: ["Go", "Node.js", "Docker", "AWS S3", "Stripe"],
    reasonForSelling: "Yeni bir veri merkezine geçiş sermayesi.",
    reasonForSellingEn: "Reallocating capital for a new data center startup.",
    setupTimeHours: 1.5,
    createdAt: "4 saat önce",
    createdAtEn: "4 hours ago"
  },
  {
    id: "proj-16",
    type: "sale",
    title: "SEO Keywords Explorer Chrome Ext",
    titleEn: "SEO Keywords Explorer Chrome Ext",
    category: "extension",
    categoryEn: "Chrome Ext",
    askingPrice: 7800,
    mrr: 680,
    status: "Doğrulanmış",
    statusEn: "Verified",
    isAnonymous: false,
    seller: {
      name: "Sophia Vance",
      handle: "@sophia_seo",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      githubVerified: true
    },
    shortDesc: "Arama motoru sonuçlarında anlık keyword zorluğu çıkaran Chrome eklentisi.",
    shortDescEn: "Real-time search keyword difficulty & volume Chrome extension.",
    fullDesc: "Chrome Web Store'da 18,000+ aktif kullanıcı. Aylık $680 pro üyelik geliri getirmektedir.",
    fullDescEn: "18,000+ active users on Chrome Store. Generates $680 MRR from pro users.",
    coverImage: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80",
    techStack: ["JavaScript", "Chrome Manifest V3", "Tailwind CSS"],
    reasonForSelling: "Doktora eğitimi nedeniyle zaman ayıramama.",
    reasonForSellingEn: "Focusing on Ph.D. studies.",
    setupTimeHours: 0.5,
    createdAt: "5 saat önce",
    createdAtEn: "5 hours ago"
  },
  {
    id: "proj-17",
    type: "sale",
    title: "AIChatbot Support Suite",
    titleEn: "AIChatbot Support Suite",
    category: "ai",
    categoryEn: "AI Tool",
    askingPrice: 38000,
    mrr: 4100,
    status: "Doğrulanmış",
    statusEn: "Verified",
    isAnonymous: false,
    seller: {
      name: "Benjamin Cole",
      handle: "@benjamin_ai",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      githubVerified: true
    },
    shortDesc: "E-ticaret siteleri için müşteri temsilcisi gibi yanıt veren yapay zeka botu.",
    shortDescEn: "AI customer support agent for e-commerce stores with live chat integration.",
    fullDesc: "Shopify ve WooCommerce mağazalarıyla tek tıkla entegre olur. 310 aktif ödeyen marka.",
    fullDescEn: "One-click integration for Shopify & WooCommerce stores. 310 paying e-com brands.",
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    techStack: ["Next.js 14", "Claude 3.5 API", "Pinecone", "Stripe"],
    reasonForSelling: "Kurumsal fon yatırımı almak için yeni şirkete odaklanma.",
    reasonForSellingEn: "Transitioning to a venture-backed enterprise startup.",
    setupTimeHours: 2,
    createdAt: "1 gün önce",
    createdAtEn: "1 day ago"
  },
  {
    id: "proj-18",
    type: "sale",
    title: "CryptoTracker Pro iOS & Android",
    titleEn: "CryptoTracker Pro iOS & Android",
    category: "mobile",
    categoryEn: "Mobile App",
    askingPrice: 26000,
    mrr: 2300,
    status: "Doğrulanmış",
    statusEn: "Verified",
    isAnonymous: false,
    seller: {
      name: "Nathan Rivera",
      handle: "@nathan_crypto",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      githubVerified: true
    },
    shortDesc: "Canlı kripto varlık ve portföy takip mobil uygulaması. 45,000 indirme.",
    shortDescEn: "Real-time crypto portfolio & price tracker mobile app. 45,000 downloads.",
    fullDesc: "Flutter ile yazılmış, RevenueCat abonelikli. App Store ve Play Store hesapları ile devredilir.",
    fullDescEn: "Built with Flutter & RevenueCat. Transferred with App Store & Play Store publisher accounts.",
    coverImage: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80",
    techStack: ["Flutter", "Dart", "CoinGecko API", "RevenueCat"],
    reasonForSelling: "Başka bir mobil uygulamaya kaynak aktarmak.",
    reasonForSellingEn: "Reallocating resources to core mobile app.",
    setupTimeHours: 2,
    createdAt: "1 gün önce",
    createdAtEn: "1 day ago"
  },
  {
    id: "proj-19",
    type: "sale",
    title: "DocuSigner Light SaaS",
    titleEn: "DocuSigner Light SaaS",
    category: "saas",
    categoryEn: "Micro SaaS",
    askingPrice: 14200,
    mrr: 1150,
    status: "Aktif",
    statusEn: "Active",
    isAnonymous: false,
    seller: {
      name: "Emma Watson",
      handle: "@emma_docs",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
      githubVerified: true
    },
    shortDesc: "Küçük işletmeler için hafif ve hızlı e-imza platformu.",
    shortDescEn: "Lightweight & fast electronic signature SaaS for small businesses.",
    fullDesc: "DocuSign alternatifi uygun fiyatlı imzalama aracı. 110 aktif ödeyen abone.",
    fullDescEn: "Affordable e-signature tool alternative to DocuSign. 110 active subscribers.",
    coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    techStack: ["Vue 3", "Node.js", "PostgreSQL", "Stripe"],
    reasonForSelling: "Yeni bir e-ticaret yazılımı geliştirmek.",
    reasonForSellingEn: "Building a new e-commerce SaaS tool.",
    setupTimeHours: 1,
    createdAt: "2 gün önce",
    createdAtEn: "2 days ago"
  },
  {
    id: "proj-20",
    type: "sale",
    title: "ImageUpscaler AI Studio",
    titleEn: "ImageUpscaler AI Studio",
    category: "ai",
    categoryEn: "AI Tool",
    askingPrice: 29000,
    mrr: 2950,
    status: "Doğrulanmış",
    statusEn: "Verified",
    isAnonymous: false,
    seller: {
      name: "Oliver Thorne",
      handle: "@oliver_upscale",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
      githubVerified: true
    },
    shortDesc: "Görsellerin çözünürlüğünü yapay zeka ile 4K'ya yükselten web uygulaması.",
    shortDescEn: "AI image resolution upscaler up to 4K web application.",
    fullDesc: "Replicate ve Real-ESRGAN altyapılı. 280+ aktif ödeyen üye. Stripe doğrulandı.",
    fullDescEn: "Powered by Real-ESRGAN & Replicate API. 280+ paying subscribers. Verified Stripe.",
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    techStack: ["Python", "FastAPI", "Next.js", "Replicate API"],
    reasonForSelling: "Yapay zeka ajansıma kaynak sağlamak.",
    reasonForSellingEn: "Funding my AI consulting agency.",
    setupTimeHours: 2,
    createdAt: "2 gün önce",
    createdAtEn: "2 days ago"
  }
];

const initialWtbListings = [
  {
    id: "wtb-1",
    type: "wtb",
    title: "Aylık $500+ Geliri Olan Micro SaaS Arıyorum",
    titleEn: "Looking for Micro SaaS with $500+ MRR",
    budget: 15000,
    category: "saas",
    categoryEn: "Micro SaaS",
    buyer: {
      name: "Tarkan Güneş",
      handle: "@tarkan_vc",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80"
    },
    description: "B2B alanında, hazır müşteri kitlesi olan ve organik trafiğe sahip SaaS projelerine bütçem hazır. Kod temizliği ve Stripe geçmişi sunulabilmelidir.",
    descriptionEn: "Budget ready for B2B SaaS with active customer base and organic traffic. Clean codebase & Stripe history required.",
    techPreference: "Next.js, Node.js veya Laravel",
    techPreferenceEn: "Next.js, Node.js or Laravel",
    mrrRequirement: "Minimum $500 MRR",
    mrrRequirementEn: "Minimum $500 MRR",
    createdAt: "1 saat önce",
    createdAtEn: "1 hour ago"
  },
  {
    id: "wtb-2",
    type: "wtb",
    title: "OpenAI / Claude API Destekli AI Araçları Alınacaktır",
    titleEn: "Willing to Buy AI Tools Powered by OpenAI / Claude API",
    budget: 8000,
    category: "ai",
    categoryEn: "AI Tool",
    buyer: {
      name: "Deniz Şahin",
      handle: "@deniz_ai",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80"
    },
    description: "İçerik, görsel üretimi veya ses analizi odaklı AI web uygulamalarını devralmak istiyorum. Gelir olmasa da hazır kullanıcı olması yeterlidir.",
    descriptionEn: "Looking to acquire AI web apps focused on content, image generation, or audio analysis. Active user base preferred over revenue.",
    techPreference: "Python, FastAPI, React/Next.js",
    techPreferenceEn: "Python, FastAPI, React/Next.js",
    mrrRequirement: "Gelir şartı yok (Kullanıcı verisi yeterli)",
    mrrRequirementEn: "No revenue requirement (Active users sufficient)",
    createdAt: "4 saat önce",
    createdAtEn: "4 hours ago"
  },
  {
    id: "wtb-3",
    type: "wtb",
    title: "Yüksek İndirmeli Chrome Uzantısı Satın Alınacaktır",
    titleEn: "Acquiring High-Download Chrome Extensions",
    budget: 3500,
    category: "extension",
    categoryEn: "Chrome Ext",
    buyer: {
      name: "Kaan Yılmaz",
      handle: "@kaan_ext",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
    },
    description: "Chrome Web Store'da minimum 5,000+ aktif kullanıcısı olan verimlilik veya geliştirici uzantılarını nakit olarak devralmaya hazırım.",
    descriptionEn: "Ready to cash-buy productivity or developer Chrome extensions with 5,000+ active users.",
    techPreference: "Manifest V3 Compliant JS",
    techPreferenceEn: "Manifest V3 Compliant JS",
    mrrRequirement: "Organik kullanıcı trafiği önemli",
    mrrRequirementEn: "Organic user traffic primary criteria",
    createdAt: "1 gün önce",
    createdAtEn: "1 day ago"
  },
  {
    id: "wtb-4",
    type: "wtb",
    title: "Bütçem $50,000 - B2B SaaS veya Verimlilik Aracı Arıyorum",
    titleEn: "Budget $50k - Looking to Acquire B2B SaaS or Productivity Tool",
    budget: 50000,
    category: "saas",
    categoryEn: "Micro SaaS",
    buyer: {
      name: "David Vance",
      handle: "@david_invest",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80"
    },
    description: "B2B alanında $1.5k+ MRR üreten SaaS veya verimlilik yazılımlarını 7 gün içinde nakit kapatmaya hazırım. Stripe doğrulama raporu gereklidir.",
    descriptionEn: "Looking to acquire B2B SaaS making $1.5k+ MRR. Cash deal with 7-day closing timeline. Stripe verification required.",
    techPreference: "Next.js, Node.js, PostgreSQL",
    techPreferenceEn: "Next.js, Node.js, PostgreSQL",
    mrrRequirement: "Minimum $1,500 MRR",
    mrrRequirementEn: "Minimum $1,500 MRR",
    createdAt: "2 saat önce",
    createdAtEn: "2 hours ago"
  },
  {
    id: "wtb-5",
    type: "wtb",
    title: "Claude 3.5 Sonnet Destekli AI Projesi Alınacaktır",
    titleEn: "Looking to Buy Claude 3.5 Sonnet Powered AI Apps",
    budget: 35000,
    category: "ai",
    categoryEn: "AI Tool",
    buyer: {
      name: "Sophia Sterling",
      handle: "@sophia_vc",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
    },
    description: "Kod üretimi, yazarlık veya veri analizi odaklı AI web uygulamalarını devralmak istiyoruz. Aktif aboneleri olan projelere öncelik verilecektir.",
    descriptionEn: "Acquiring AI web apps focused on code generation, copywriting, or analytics. Active subscriber base prioritized.",
    techPreference: "Python, FastAPI, Next.js, Anthropic API",
    techPreferenceEn: "Python, FastAPI, Next.js, Anthropic API",
    mrrRequirement: "Minimum $1,000 MRR",
    mrrRequirementEn: "Minimum $1,000 MRR",
    createdAt: "3 saat önce",
    createdAtEn: "3 hours ago"
  },
  {
    id: "wtb-6",
    type: "wtb",
    title: "10k+ İndirmeli Mobile App veya Oyun Satın Alınacaktır",
    titleEn: "Acquiring Mobile Apps or Games with 10k+ Downloads",
    budget: 25000,
    category: "mobile",
    categoryEn: "Mobile App",
    buyer: {
      name: "Lucas Bennett",
      handle: "@lucas_mobile",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80"
    },
    description: "App Store ve Play Store üzerinde organik indirmesi ve aktif abonesi olan mobil uygulamaları devralıyoruz. Devir RevenueCat üzerinden yapılacaktır.",
    descriptionEn: "Acquiring iOS/Android mobile apps with organic downloads & active subscribers via RevenueCat.",
    techPreference: "React Native, Flutter, Swift",
    techPreferenceEn: "React Native, Flutter, Swift",
    mrrRequirement: "Minimum $800 MRR",
    mrrRequirementEn: "Minimum $800 MRR",
    createdAt: "5 saat önce",
    createdAtEn: "5 hours ago"
  },
  {
    id: "wtb-7",
    type: "wtb",
    title: "SEO & Analitik Odaklı Chrome Eklentisi Arıyorum",
    titleEn: "Looking for SEO & Analytics Chrome Extension",
    budget: 6000,
    category: "extension",
    categoryEn: "Chrome Ext",
    buyer: {
      name: "Christopher Cole",
      handle: "@chris_ext",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"
    },
    description: "Chrome Mağazasında 3,000+ aktif kullanıcısı olan SEO, anahtar kelime veya rakip analizi eklentilerini peşin ödeme ile satın almak istiyorum.",
    descriptionEn: "Buying SEO or analytics Chrome extensions with 3,000+ active users. Quick cash payment.",
    techPreference: "JavaScript, Manifest V3",
    techPreferenceEn: "JavaScript, Manifest V3",
    mrrRequirement: "Kullanıcı sayısı önemli",
    mrrRequirementEn: "Active user count primary metric",
    createdAt: "1 gün önce",
    createdAtEn: "1 day ago"
  },
  {
    id: "wtb-8",
    type: "wtb",
    title: "Fintech & Fatura Otomasyonu Mikro SaaS Alınacaktır",
    titleEn: "Buying Fintech & Invoicing Automation Micro SaaS",
    budget: 40000,
    category: "saas",
    categoryEn: "Micro SaaS",
    buyer: {
      name: "Andrew Chang",
      handle: "@andrew_fintech",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
    },
    description: "Ödeme altyapısı hazır, serbest çalışanlar veya küçük işletmeler tarafından kullanılan e-fatura otomasyonlarını devralmaya hazırız.",
    descriptionEn: "Acquiring e-invoicing and payment automation SaaS used by freelancers & SMBs.",
    techPreference: "Laravel, Vue 3, Node.js, Stripe",
    techPreferenceEn: "Laravel, Vue 3, Node.js, Stripe",
    mrrRequirement: "Minimum $2,000 MRR",
    mrrRequirementEn: "Minimum $2,000 MRR",
    createdAt: "1 gün önce",
    createdAtEn: "1 day ago"
  },
  {
    id: "wtb-9",
    type: "wtb",
    title: "Görsel Üretim & Tasarım AI Aracı Satın Alınacaktır",
    titleEn: "Acquiring AI Image Generation & Design Tool",
    budget: 20000,
    category: "ai",
    categoryEn: "AI Tool",
    buyer: {
      name: "Victoria Lawson",
      handle: "@victoria_design",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80"
    },
    description: "Midjourney API, Flux veya Stable Diffusion altyapılı görsel düzenleme web araçlarına bütçem hazır. Hazır aboneliği olanlar önceliklidir.",
    descriptionEn: "Budget ready for AI image generation apps powered by Midjourney API, Flux or Stable Diffusion.",
    techPreference: "Next.js, Python, Replicate API",
    techPreferenceEn: "Next.js, Python, Replicate API",
    mrrRequirement: "Minimum $600 MRR",
    mrrRequirementEn: "Minimum $600 MRR",
    createdAt: "2 gün önce",
    createdAtEn: "2 days ago"
  }
];

const initialMessages = [
  {
    id: "thread-1",
    partnerName: "Caner Yılmaz",
    partnerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    projectTitle: "AI Copywriter Pro",
    askingPrice: "$24,000",
    unread: true,
    messages: [
      { sender: "them", text: "Selam! AI Copywriter Pro projesi ile ilgilendiğinizi gördüm. Herhangi bir sorunuz var mı?", textEn: "Hi! I saw you are interested in AI Copywriter Pro. Do you have any questions?", time: "10:30" },
      { sender: "me", text: "Merhaba Caner Bey! GitHub reposunu incelemek ve Stripe canlı verilerini görmek isterim.", textEn: "Hello Caner! I would love to inspect the GitHub repo and see live Stripe analytics.", time: "10:35" },
      { sender: "them", text: "Tabii ki! E-posta adresinizi iletirseniz yetki tanımlayayım.", textEn: "Sure thing! Please share your email so I can grant read access.", time: "10:38" }
    ]
  },
  {
    id: "thread-2",
    partnerName: "Selin Aksoy",
    partnerAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
    projectTitle: "MetricsFlow Analytics",
    askingPrice: "$8,500",
    unread: false,
    messages: [
      { sender: "me", text: "MetricsFlow projesi için pazarlık payınız var mıdır?", textEn: "Is there room for negotiation on the MetricsFlow project?", time: "Dün" },
      { sender: "them", text: "Selam! Ciddi alıcılar için ufak bir ikram yapabiliriz. Detaylı sunum iletebilirim.", textEn: "Hi! For serious cash buyers we can offer a modest discount. I can send over a deck.", time: "Dün" }
    ]
  },
  {
    id: "thread-3",
    partnerName: "Tarkan Güneş",
    partnerAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80",
    projectTitle: "Proje Arıyorum: B2B SaaS",
    askingPrice: "$15,000 Bütçe",
    unread: false,
    messages: [
      { sender: "me", text: "İlanınızı gördüm. Aylık $600 MRR getiren bir SEO aracım var, teklif iletmek isterim.", textEn: "I saw your WTB post. I have an SEO tool making $600 MRR, would love to submit a pitch.", time: "2 gün önce" },
      { sender: "them", text: "Harika! Lütfen projenin demo linkini ve Stripe dokümanını iletir misiniz?", textEn: "Great! Could you please share the demo link and Stripe verification docs?", time: "2 gün önce" }
    ]
  }
];


const translations = {
  tr: {
    // Navigation & Header Bar
    navListings: "İlanlar",
    navWtb: "Proje Arıyorum",
    navSellers: "Satıcılar",
    navHowItWorks: "Nasıl Çalışır?",
    navPricing: "Fiyatlandırma",
    navLogin: "Giriş Yap",
    navRegister: "Kayıt Ol",
    navStartFree: "Ücretsiz Başla",
    themeLight: "Açık Tema",
    themeDark: "Koyu Tema",
    searchPlaceholder: "Proje adı, tech stack (Next.js, Python, AI) ara...",

    // Top Banner & Vision
    bannerNew: "🔥 YENİ",
    bannerText: "\"Looking to Buy\" (Proje Arıyorum) özelliği aktif! Bütçenizi yazın, satıcılar size ulaşsın.",
    bannerAction: "İlan Oluştur →",
    visionPill: "Biz kod satmıyoruz. Biz ikinci şans satıyoruz.",
    heroTitleLine1: "Dijital Projelerin",
    heroTitleLine2: "Yeni Sahiplerini Bulduğu Yer",
    heroSubtitle: "SaaS'lar, mobil uygulamalar, AI projeleri, Chrome Extension'lar ve daha fazlasını yeni sahipleriyle buluşturuyoruz.",
    statListings: "Aktif Proje İlanı",
    statDeals: "Tamamlanan Anlaşma",
    statResponse: "Ortalama Yanıt Süresi",
    statResponseVal: "< 1 Saat",
    btnExplore: "Projeleri Keşfet →",
    btnSellProject: "Proje Sat",

    // Onboarding Full-Screen Page Translations
    obSkipBtn: "Şimdi değil, ilanları keşfet →",
    obHeroLine1: "Yarım Kalan Projelerine",
    obHeroLine2: "İkinci Şansı Ver",
    obHeroSub: "SaaS'lar, AI araçları, Chrome eklentileri ve mobil uygulamaları doğrudan girişimcilerden alın veya satın. Komisyon ve gizli ücret yoktur.",
    obStat1: "Aktif Proje",
    obStat2: "Satış Hacmi",
    obStat3: "Komisyon Oranı",
    obQuote: "\"Geliştirdiğim fakat zaman ayıramadığım AI eklentimi Searya üzerinden 3 gün içinde sattım!\"",
    obQuoteAuthor: "— Merve K. (Solo SaaS Founder)",
    obOrSocial: "veya tek tıkla kayıt olun",

    // Onboarding & Signup Modal
    onboardingTitleStep1: "Searya'ya Hoş Geldiniz! 👋",
    onboardingSubStep1: "Platformdaki temel amacınız nedir?",
    roleBuyerTitle: "🟢 Proje Alıcısıyım",
    roleBuyerDesc: "Yarım kalmış SaaS, AI veya mobil uygulamaları satın almak istiyorum.",
    roleSellerTitle: "🟣 Proje Satıcısıyım",
    roleSellerDesc: "Atıl duran veya devretmek istediğim dijital projelerimi satmak istiyorum.",
    roleBothTitle: "⚡ Hem Alıcı Hem Satıcıyım",
    roleBothDesc: "Proje alıp satan bağımsız bir girişimciyim.",
    
    onboardingTitleStep2: "Hesap Bilgileriniz 🔐",
    onboardingSubStep2: "Profilinizi oluşturun ve toplulukla etkileşime geçin.",
    labelFullName: "Ad Soyad",
    labelEmail: "E-posta Adresi",
    labelPassword: "Şifre",
    labelSocialProfile: "GitHub veya X (Twitter) Kullanıcı Adınız (Opsiyonel)",
    socialBadgeTip: "💡 Doğrulanmış Geliştirici Rozeti kazanmanızı sağlar.",
    
    onboardingTitleStep3: "İlgi Alanlarınız & Tech Stack 🚀",
    onboardingSubStep3: "İlgilendiğiniz teknolojileri seçin, uygun projeleri öne çıkaralım.",
    
    btnNextStep: "Devam Et →",
    btnBack: "← Geri",
    btnCompleteRegistration: "Kayıt Ol & Başla 🚀",
    
    onboardingSuccessTitle: "Aramıza Hoş Geldiniz! 🎉",
    onboardingSuccessSub: "Searya platformunda ikinci şans arayan projeler sizi bekliyor.",
    onboardingGiftNotice: "🎁 Hesabınıza 2 Ücretsiz Bağlantı Kredisi Tanımlandı!",
    btnStartExploring: "Projeleri Keşfetmeye Başla →",

    // Featured 3D Hero Card
    featuredCardBadge: "Öne Çıkan Proje",
    featuredCardTitle: "AI Writer Pro",
    featuredCardCategory: "GPT-4o altyapılı içerik üretim platformu. 1,200+ aktif ödeyen kullanıcı.",
    featuredCardRevenue: "Aylık Gelir",
    featuredCardRevVal: "$2,450",
    featuredCardUsers: "Kullanıcılar",
    featuredCardUsersVal: "1,240",
    featuredCardBtn: "İlan Detaylarını İncele →",

    // Marketplace Grid & Tabs
    tabForSale: "Satılık Projeler",
    tabWtb: "Proje Arıyorum (WTB)",
    gridTitleSale: "Son Eklenen Satılık Projeler",
    gridTitleWtb: "Aranan Proje İlanları (Looking To Buy)",
    gridSubtitleSale: "Satıcı ile doğrudan DM üzerinden pazarlık yapın, komisyon veya sepet ödemesi yoktur.",
    gridSubtitleWtb: "Bütçesini belirten doğrulanmış alıcılarla doğrudan iletişime geçin.",

    // Filters & Sorting
    filterLabel: "Filtrele:",
    catAll: "Tümü",
    catAi: "AI Projeleri",
    catSaas: "Micro SaaS",
    catExtension: "Chrome Ext",
    catMobile: "Mobil Uygulama",
    catAnonymous: "Anonim İlanlar",
    sortLabel: "Sırala:",
    sortNewest: "En Yeniler",
    sortPriceLow: "Fiyat: Düşükten Yüksek",
    sortPriceHigh: "Fiyat: Yüksekten Düşük",
    sortPopular: "En Çok Görüntülenenler",

    // Pricing Section Header
    pricingTitleLine1: "Basit, ",
    pricingTitleHighlight: "Şeffaf",
    pricingTitleLine2: ", Adil",
    pricingSubtitle: "İhtiyacına göre seç, sadece kullandığın kadar öde.",
    pricingToggleBuyer: "🟢 Alıcı (Proje Satın Almak İstiyorum)",
    pricingToggleSeller: "🟣 Satıcı (Proje Satmak İstiyorum)",
    simplePricing: {
      kicker: "Satış komisyonu yok",
      title: "Alıcı için 2, satıcı için 2.",
      subtitle: "Yeni satıcı bağlantıları sınırlı; açılmış konuşmalarda mesajlaşma her zaman sınırsız.",
      buyerRole: "ALICI",
      sellerRole: "SATICI",
      freeTitle: "Ücretsiz Keşfet",
      freeDesc: "Projeleri keşfet ve ilk görüşmelerini başlat",
      freePeriod: " / sonsuza kadar",
      freeFeatures: ["Tüm ilanları incele", "2 ücretsiz yeni satıcı bağlantısı", "Açılmış konuşmalarda sınırsız mesaj", "Proje Arıyorum ilanı aç"],
      freeButton: "Ücretsiz Katıl",
      buyerPackTitle: "10 Bağlantı Paketi",
      buyerPackDesc: "Yeni satıcılarla görüşmeye devam et",
      buyerPackPeriod: " / tek seferlik",
      buyerPackFeatures: ["10 yeni satıcı bağlantısı", "Kredilerin süresi dolmaz", "Açılmış konuşmalarda sınırsız mesaj", "İstediğin zaman kullan"],
      buyerPackButton: "10 Bağlantı Satın Al",
      standardTitle: "Standart İlan",
      standardDesc: "Projeni doğru alıcılarla buluştur",
      standardPeriod: " / 60 gün",
      standardFeatures: ["1 aktif satış ilanı", "Sınırsız alıcı mesajı", "Temel ilan istatistikleri", "İstediğin zaman düzenleme"],
      standardButton: "İlanını Yayınla",
      verifiedBadge: "En çok tercih edilen",
      verifiedTitle: "Doğrulanmış İlan",
      verifiedDesc: "Daha fazla güven ve görünürlük",
      verifiedPeriod: " / 60 gün",
      verifiedFeatures: ["Standart ilandaki her şey", "GitHub veya gelir doğrulaması", "Doğrulanmış ilan rozeti", "14 gün ana sayfada öne çıkma"],
      verifiedButton: "Doğrulanmış İlan Aç",
      note: "Tek seferlik ödeme · Otomatik yenileme yok · Satıştan komisyon alınmaz"
    },

    // Buyer Section Header
    buyerSectionTitle: "🟢 Alıcı Paketleri",
    buyerSectionSubtitle: "Doğru projeyi bul, satıcılarla kolayca iletişime geç.",

    // Buyer Card 1: Ücretsiz
    buyerFreeTitle: "Ücretsiz",
    buyerFreeDesc: "Başla ve platformu keşfet",
    buyerFreeConnections: "5",
    buyerFreeSub: "ücretsiz bağlantı / ay",
    buyerFreeFeatures: [
      "Tüm ilanları görüntüle",
      "Satıcı profillerini incele",
      "Ayda 5 ücretsiz bağlantı",
      "Sınırsız mesajlaşma",
      "Favorilere ekleme"
    ],
    buyerFreeBtn: "Ücretsiz Başla",

    // Buyer Card 2: Connection Pack
    buyerPackBadge: "En Popüler",
    buyerPackTitle: "Connection Pack",
    buyerPackDesc: "Daha fazla satıcıyla konuş",
    buyerPackPrice: "$19",
    buyerPackConn: "20 bağlantı",
    buyerPackSub: "Tek seferlik ödeme",
    buyerPackFeatures: [
      "20 bağlantı (farklı satıcıyla görüşme)",
      "Açılan konuşmalarda sınırsız mesajlaşma",
      "Kredilerin süresi dolmaz",
      "İstediğin zaman kullan"
    ],
    buyerPackBtn: "Hemen Satın Al",

    // Seller Section Header
    sellerSectionTitle: "🟣 Satıcı Paketleri",
    sellerSectionSubtitle: "Projeni sergile, doğru alıcılarla buluştur.",

    // Seller Card 1: Ücretsiz
    sellerFreeTitle: "Ücretsiz",
    sellerFreeDesc: "Hemen ilanını yayınla",
    sellerFreeCount: "2",
    sellerFreeSub: "ücretsiz aktif ilan",
    sellerFreeFeatures: [
      "2 ücretsiz aktif ilan",
      "Gelen mesajlara sınırsız cevap",
      "İlan düzenleme",
      "İlan istatistikleri (temel)"
    ],
    sellerFreeBtn: "Ücretsiz Başla",

    // Seller Card 2: Ek İlan
    sellerExtraTitle: "Ek İlan",
    sellerExtraDesc: "Sınırını aş, daha çok paylaş",
    sellerExtraPrice: "$9",
    sellerExtraPriceUnit: "/ ilan",
    sellerExtraSub: "Tek seferlik ödeme",
    sellerExtraFeatures: [
      "3. ilandan itibaren her ilan için",
      "İlan süresi: 60 gün",
      "İstediğin kadar ilan ekle",
      "Ücretsiz ilana ek olarak kullanılır"
    ],
    sellerExtraBtn: "İlan Ekle",

    // Seller Card 3: Homepage Featured
    sellerFeaturedTitle: "Homepage Featured",
    sellerFeaturedDesc: "İlanını ana sayfada öne çıkar",
    sellerFeaturedPrice: "$19",
    sellerFeaturedPriceUnit: "tek seferlik",
    sellerFeaturedSub: "Ana sayfa vitrininde 14 gün kalma",
    sellerFeaturedFeatures: [
      "Ana sayfa vitrininde öne çıkma",
      "Parlak yeşil / mor çerçeve",
      "5 kat daha fazla alıcı görüntülemesi",
      "Arama sonuçlarında üst sıralar"
    ],
    sellerFeaturedBtn: "Şimdi Öne Çıkar",

    // Seller Card 4: Seller Pro
    sellerProBadge: "En Çok Tercih Edilen",
    sellerProTitle: "Seller Pro",
    sellerProDesc: "İşini büyütmek için her şey",
    sellerProPrice: "$29",
    sellerProPriceUnit: "/ ay",
    sellerProSub: "Aylık abonelik",
    sellerProFeatures: [
      "Sınırsız aktif proje ilanı",
      "Ayda 2 ücretsiz Featured spot",
      "Sınırsız alıcı ilanına proje öner",
      "Detaylı görünürlük istatistikleri",
      "Doğrulanmış satıcı rozeti",
      "Öncelikli destek"
    ],
    sellerProBtn: "Hemen Yükselt",

    // Trust Features Banner
    trustTitle: "Güvenli ve Şeffaf",
    trustSubtitle: "Tüm görüşmelerinizi platform içinde yapın. İletişim bilgilerinizi karşılıklı onay olmadan paylaşmayın.",
    trustLearnMore: "Daha fazla bilgi →",
    trustFeature1Title: "Sınırsız Mesajlaş",
    trustFeature1Desc: "Açtığın konuşmalarda sınırsız mesajlaşabilirsin.",
    trustFeature2Title: "Güvenli İletişim",
    trustFeature2Desc: "İletişim bilgilerin karşılıklı onay olmadan paylaşılmaz.",
    trustFeature3Title: "Komisyonsuz",
    trustFeature3Desc: "Anlaşmalarını istediğin yerde gerçekleştir, komisyon yok.",
    trustFeature4Title: "Doğru Kitle",
    trustFeature4Desc: "Projene gerçekten ilgi duyan alıcılarla buluş.",

    // Messaging & Inbox Drawer
    inboxTitle: "Doğrudan Mesajlar (DM)",
    inboxSubtitle: "Aktif Sohbetleriniz",
    inboxEmpty: "Henüz bir mesajlaşmanız yok.",
    inboxSafetyTitle: "Güvenlik Tavsiyesi:",
    inboxSafetyText: "Ödemeyi yapmadan önce GitHub reposunu ve canlı demoyu inceleyin. Güvenli kod ve domain transferi için Escrow.com önerilir.",
    inboxPlaceholder: "Mesajınızı yazın...",

    // Card & Modal Actions
    btnSendMessage: "Mesaj Gönder",
    btnSendOffer: "Teklif Ver",
    btnShareCard: "Paylaş",
    btnShareCardCreate: "Sosyal Medya Görseli Oluştur",
    btnCreateListing: "İlan Ver",
    anonBadge: "Anonim",
    mrrBadge: " MRR",
    wtbBadge: "LOOKING TO BUY",

    // Footer
    footerColMarketplace: "Pazaryeri",
    footerLinkForSale: "Satılık Projeler",
    footerLinkWtb: "\"Proje Arıyorum\" İlanları",
    footerLinkAnon: "Anonim İlanlar",
    footerColTrust: "Güven & Devir",
    footerLinkEscrow: "Escrow Güvenlik Rehberi",
    footerLinkChecklist: "Kod Devir Kontrol Listesi",
    footerLinkContract: "Şablon Sözleşme PDF",
    footerColSocial: "Sosyal & Topluluk",
    footerTagline: "Yarım kalan dijital projelerin yeni sahiplerini bulduğu bağımsız pazaryeri platformu.",
    footerRights: "© 2026 Searya. Tüm hakları saklıdır. Biz ikinci şans satıyoruz.",

    // Toasts
    toastLangChanged: "Dil Türkçe olarak değiştirildi.",
    toastThemeDark: "Koyu Tema aktif edildi.",
    toastThemeLight: "Açık Tema aktif edildi.",
    toastPublished: "İlanınız başarıyla yayınlandı!",
    toastCopied: "Paylaşım metni kopyalandı!",
    toastRegistrationSuccess: "Kayıt başarıyla tamamlandı! 2 ücretsiz bağlantı tanımlandı."
  },
  en: {
    // Navigation & Header Bar
    navListings: "Listings",
    navWtb: "Looking to Buy",
    navSellers: "Sellers",
    navHowItWorks: "How It Works?",
    navPricing: "Pricing",
    navLogin: "Log In",
    navRegister: "Sign Up",
    navStartFree: "Start Free",
    themeLight: "Light Mode",
    themeDark: "Dark Mode",
    searchPlaceholder: "Search project name, tech stack (Next.js, Python, AI)...",

    // Top Banner & Vision
    bannerNew: "🔥 NEW",
    bannerText: "\"Looking to Buy\" feature is live! Specify your budget and let sellers reach you.",
    bannerAction: "Create Listing →",
    visionPill: "We don't sell code. We sell second chances.",
    heroTitleLine1: "Where Digital Projects",
    heroTitleLine2: "Find Their Next Founders",
    heroSubtitle: "Connect abandoned or ready-to-launch SaaS, mobile apps, AI tools & Chrome Extensions with new owners.",
    statListings: "Active Listings",
    statDeals: "Deals Closed",
    statResponse: "Avg Response Time",
    statResponseVal: "< 1 Hour",
    btnExplore: "Explore Projects →",
    btnSellProject: "Sell Project",

    // Onboarding Full-Screen Page Translations
    obSkipBtn: "Not now, explore listings →",
    obHeroLine1: "Give Unfinished Projects",
    obHeroLine2: "A Second Chance",
    obHeroSub: "Acquire or sell SaaS tools, AI apps, Chrome extensions & mobile apps directly from founders. Zero commissions or platform markups.",
    obStat1: "Active Projects",
    obStat2: "Volume Traded",
    obStat3: "Platform Fee",
    obQuote: "\"Sold my AI Chrome extension in just 3 days on Searya!\"",
    obQuoteAuthor: "— Merve K. (Solo SaaS Founder)",
    obOrSocial: "or sign up with 1-click",

    // Onboarding & Signup Modal
    onboardingTitleStep1: "Welcome to Searya! 👋",
    onboardingSubStep1: "What is your primary goal on the platform?",
    roleBuyerTitle: "🟢 Project Buyer",
    roleBuyerDesc: "I want to acquire abandoned or ready SaaS, AI tools & mobile apps.",
    roleSellerTitle: "🟣 Project Seller",
    roleSellerDesc: "I want to list and sell my digital assets & projects.",
    roleBothTitle: "⚡ Both Buyer & Seller",
    roleBothDesc: "I trade and build projects actively as an independent builder.",
    
    onboardingTitleStep2: "Account Credentials 🔐",
    onboardingSubStep2: "Create your profile to start connecting.",
    labelFullName: "Full Name",
    labelEmail: "Email Address",
    labelPassword: "Password",
    labelSocialProfile: "GitHub or X (Twitter) Username (Optional)",
    socialBadgeTip: "💡 Grants you a Verified Builder Badge.",
    
    onboardingTitleStep3: "Interests & Tech Stack 🚀",
    onboardingSubStep3: "Select your preferred tech stacks to get tailored recommendations.",
    
    btnNextStep: "Next Step →",
    btnBack: "← Back",
    btnCompleteRegistration: "Complete Signup 🚀",
    
    onboardingSuccessTitle: "Welcome Aboard! 🎉",
    onboardingSuccessSub: "Unlaunched and promising projects await you on Searya.",
    onboardingGiftNotice: "🎁 2 Free Contact Credits Added To Your Account!",
    btnStartExploring: "Start Exploring Projects →",

    // Featured 3D Hero Card
    featuredCardBadge: "Featured Project",
    featuredCardTitle: "AI Writer Pro",
    featuredCardCategory: "GPT-4o powered content generation suite. 1,200+ active paying subscribers.",
    featuredCardRevenue: "Monthly Revenue",
    featuredCardRevVal: "$2,450",
    featuredCardUsers: "Active Users",
    featuredCardUsersVal: "1,240",
    featuredCardBtn: "Inspect Project Details →",

    // Marketplace Grid & Tabs
    tabForSale: "Projects For Sale",
    tabWtb: "Looking to Buy (WTB)",
    gridTitleSale: "Latest Projects For Sale",
    gridTitleWtb: "Buying Requests (Looking To Buy)",
    gridSubtitleSale: "Negotiate directly via built-in DM. Zero commission, zero platform fees.",
    gridSubtitleWtb: "Pitch directly to verified cash buyers with specified budgets.",

    // Filters & Sorting
    filterLabel: "Filter:",
    catAll: "All",
    catAi: "AI Tools",
    catSaas: "Micro SaaS",
    catExtension: "Chrome Ext",
    catMobile: "Mobile Apps",
    catAnonymous: "Anonymous",
    sortLabel: "Sort:",
    sortNewest: "Newest First",
    sortPriceLow: "Price: Low to High",
    sortPriceHigh: "Price: High to Low",
    sortPopular: "Most Viewed",

    // Pricing Section Header
    pricingTitleLine1: "Simple, ",
    pricingTitleHighlight: "Transparent",
    pricingTitleLine2: ", Fair",
    pricingSubtitle: "Pick what fits your needs, pay only for what you use.",
    pricingToggleBuyer: "🟢 Buyer (Looking to Buy Projects)",
    pricingToggleSeller: "🟣 Seller (Looking to Sell Projects)",
    simplePricing: {
      kicker: "No sales commission",
      title: "Two for buyers, two for sellers.",
      subtitle: "New seller connections are limited; messaging in opened conversations is always unlimited.",
      buyerRole: "BUYER",
      sellerRole: "SELLER",
      freeTitle: "Explore Free",
      freeDesc: "Explore projects and start your first conversations",
      freePeriod: " / forever",
      freeFeatures: ["Browse every listing", "2 free new seller connections", "Unlimited messages in opened chats", "Post Looking to Buy requests"],
      freeButton: "Join Free",
      buyerPackTitle: "10 Connection Pack",
      buyerPackDesc: "Keep talking to new sellers",
      buyerPackPeriod: " / one-time",
      buyerPackFeatures: ["10 new seller connections", "Credits never expire", "Unlimited messages in opened chats", "Use whenever you need"],
      buyerPackButton: "Buy 10 Connections",
      standardTitle: "Standard Listing",
      standardDesc: "Meet the right buyers for your project",
      standardPeriod: " / 60 days",
      standardFeatures: ["1 active sale listing", "Unlimited buyer messages", "Basic listing analytics", "Edit anytime"],
      standardButton: "Publish Listing",
      verifiedBadge: "Most popular",
      verifiedTitle: "Verified Listing",
      verifiedDesc: "More trust and visibility",
      verifiedPeriod: " / 60 days",
      verifiedFeatures: ["Everything in Standard", "GitHub or revenue verification", "Verified listing badge", "14 days featured on homepage"],
      verifiedButton: "Create Verified Listing",
      note: "One-time payment · No auto-renewal · No sales commission"
    },

    // Buyer Section Header
    buyerSectionTitle: "🟢 Buyer Packages",
    buyerSectionSubtitle: "Find the right project and reach out to sellers easily.",

    // Buyer Card 1: Free
    buyerFreeTitle: "Free",
    buyerFreeDesc: "Start and explore the platform",
    buyerFreeConnections: "5",
    buyerFreeSub: "free connections / mo",
    buyerFreeFeatures: [
      "Browse all public listings",
      "Inspect seller profiles",
      "Start 5 free seller contacts per month",
      "Unlimited messaging in active threads",
      "Save to favorites"
    ],
    buyerFreeBtn: "Start Free",

    // Buyer Card 2: Connection Pack
    buyerPackBadge: "Most Popular",
    buyerPackTitle: "Connection Pack",
    buyerPackDesc: "Connect with more sellers",
    buyerPackPrice: "$19",
    buyerPackConn: "20 connections",
    buyerPackSub: "One-time payment",
    buyerPackFeatures: [
      "20 connections (contact different sellers)",
      "Unlimited messaging in opened threads",
      "Credits never expire",
      "Use anytime you want"
    ],
    buyerPackBtn: "Buy Pack Now",

    // Seller Section Header
    sellerSectionTitle: "🟣 Seller Packages",
    sellerSectionSubtitle: "Showcase your project, connect with verified buyers.",

    // Seller Card 1: Free
    sellerFreeTitle: "Free",
    sellerFreeDesc: "Publish your listing instantly",
    sellerFreeCount: "2",
    sellerFreeSub: "free active listings",
    sellerFreeFeatures: [
      "2 free active project listings",
      "Unlimited replies to incoming messages",
      "Listing edit access",
      "Basic view analytics"
    ],
    sellerFreeBtn: "Start Free",

    // Seller Card 2: Extra Listing
    sellerExtraTitle: "Extra Listing",
    sellerExtraDesc: "Expand your reach",
    sellerExtraPrice: "$9",
    sellerExtraPriceUnit: "/ listing",
    sellerExtraSub: "One-time payment",
    sellerExtraFeatures: [
      "Per listing after 2nd free listing",
      "Listing duration: 60 days",
      "Add as many listings as needed",
      "Used in addition to free allowance"
    ],
    sellerExtraBtn: "Add Listing",

    // Seller Card 3: Homepage Featured
    sellerFeaturedTitle: "Homepage Featured",
    sellerFeaturedDesc: "Highlight your listing on homepage",
    sellerFeaturedPrice: "$19",
    sellerFeaturedPriceUnit: "one-time",
    sellerFeaturedSub: "14-day homepage top showcase",
    sellerFeaturedFeatures: [
      "Featured placement on homepage",
      "Glowing emerald / purple border",
      "5x more buyer views",
      "Top position in search results"
    ],
    sellerFeaturedBtn: "Feature Now",

    // Seller Card 4: Seller Pro
    sellerProBadge: "Top Choice",
    sellerProTitle: "Seller Pro",
    sellerProDesc: "Everything to scale your venture sales",
    sellerProPrice: "$29",
    sellerProPriceUnit: "/ mo",
    sellerProSub: "Monthly subscription",
    sellerProFeatures: [
      "Unlimited active project listings",
      "2 free Featured spots per month",
      "Unlimited pitches to buyer requests",
      "Advanced view & DM analytics",
      "Verified Builder Badge",
      "Priority founder support"
    ],
    sellerProBtn: "Upgrade to Pro",

    // Trust Features Banner
    trustTitle: "Safe & Transparent",
    trustSubtitle: "Conduct all discussions inside our platform. Do not share contact info without mutual approval.",
    trustLearnMore: "Learn more →",
    trustFeature1Title: "Unlimited Messaging",
    trustFeature1Desc: "Chat infinitely inside active conversation threads with buyers and sellers.",
    trustFeature2Title: "Secure Communication",
    trustFeature2Desc: "Contact details are kept private until both parties explicitly confirm handshake.",
    trustFeature3Title: "Zero Platform Fees",
    trustFeature3Desc: "Complete your code transfer on Escrow or any provider you choose without commissions.",
    trustFeature4Title: "Targeted Audience",
    trustFeature4Desc: "Reach verified developers and cash buyers actively looking for digital assets.",

    // Messaging & Inbox Drawer
    inboxTitle: "Direct Messages (DM)",
    inboxSubtitle: "Active Conversations",
    inboxEmpty: "No messages yet.",
    inboxSafetyTitle: "Safety Advisory:",
    inboxSafetyText: "Inspect the GitHub repository and live demo before sending payment. Escrow.com is recommended for secure code and domain transfer.",
    inboxPlaceholder: "Type your message...",

    // Card & Modal Actions
    btnSendMessage: "Send Message",
    btnSendOffer: "Make Offer",
    btnShareCard: "Share",
    btnShareCardCreate: "Generate Social Share Card",
    btnCreateListing: "Create Listing",
    anonBadge: "Anonymous",
    mrrBadge: " MRR",
    wtbBadge: "LOOKING TO BUY",

    // Footer
    footerColMarketplace: "Marketplace",
    footerLinkForSale: "Projects For Sale",
    footerLinkWtb: "\"Looking to Buy\" Listings",
    footerLinkAnon: "Anonymous Listings",
    footerColTrust: "Trust & Transfer",
    footerLinkEscrow: "Escrow Safety Guide",
    footerLinkChecklist: "Handover Checklist",
    footerLinkContract: "Template Contract PDF",
    footerColSocial: "Social & Community",
    footerTagline: "An independent marketplace where abandoned digital projects find their next founders.",
    footerRights: "© 2026 Searya. All rights reserved. We sell second chances.",

    // Toasts
    toastLangChanged: "Language set to English.",
    toastThemeDark: "Dark Mode activated.",
    toastThemeLight: "Light Mode activated.",
    toastPublished: "Your listing was successfully published!",
    toastCopied: "Share card text copied to clipboard!",
    toastRegistrationSuccess: "Registration completed! 2 free connections added."
  }
};





// Application State
let state = {
  activeTab: 'sale', // 'sale' | 'wtb'
  categoryFilter: 'all', // 'all' | 'ai' | 'saas' | 'extension' | 'mobile' | 'anonymous'
  searchQuery: '',
  sortBy: 'newest',
  forSaleListings: [...initialForSaleListings],
  wtbListings: [...initialWtbListings],
  messages: [...initialMessages],
  activeThreadId: 'thread-1',
  theme: 'dark', // 'dark' | 'light'
  lang: 'tr', // 'tr' | 'en'
  pricingTab: 'seller', // 'buyer' | 'seller'
  inboxOpen: false,
  buyerConnections: 2
};

// Safe Dynamic DOM Element Getters (Never null!)
const el = {
  tabForSale: () => document.getElementById('tab-for-sale'),
  tabLookingToBuy: () => document.getElementById('tab-looking-to-buy'),
  forSaleCount: () => document.getElementById('for-sale-count'),
  wtbCount: () => document.getElementById('wtb-count'),
  categoryPills: () => document.getElementById('category-pills'),
  globalSearch: () => document.getElementById('global-search'),
  sortSelect: () => document.getElementById('sort-select'),
  listingsGridContainer: () => document.getElementById('listings-grid-container') || document.getElementById('listings-grid'),
  gridTitle: () => document.getElementById('grid-title'),
  gridSubtitle: () => document.getElementById('grid-subtitle'),
  modalBackdrop: () => document.getElementById('modal-backdrop'),
  modalContent: () => document.getElementById('modal-content'),
  inboxDrawer: () => document.getElementById('inbox-drawer'),
  inboxBtn: () => document.getElementById('inbox-btn'),
  createListingBtn: () => document.getElementById('create-listing-btn'),
  bannerActionBtn: () => document.getElementById('t-banner-action'),
  btnHeroSell: () => document.getElementById('btn-hero-sell'),
  featuredInspectBtn: () => document.getElementById('featured-inspect-btn'),
  themeToggleBtn: () => document.getElementById('theme-toggle-btn'),
  langSelect: () => document.getElementById('lang-select'),
  pricingToggleBuyer: () => document.getElementById('pricing-toggle-buyer'),
  pricingToggleSeller: () => document.getElementById('pricing-toggle-seller'),
  toastContainer: () => document.getElementById('toast-container'),
  hero3DCardTarget: () => document.getElementById('hero-3d-card-target')
};

// Get active translation dictionary
function t() {
  return translations[state.lang] || translations.tr;
}

// Initialize Application when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

function startApp() {
  initTheme();
  setupEventListeners();
  setup3DTiltEffect();
  updateStaticTranslations();
  renderListings();
}

// Theme Setup (Seamless & Reliable Light/Dark mode switching)
function initTheme() {
  if (state.theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  initTheme();
  updateStaticTranslations();
  showToast(state.theme === 'dark' ? t().toastThemeDark : t().toastThemeLight);
}

// Hero Featured Card Click & Interactivity Handler
function setup3DTiltEffect() {
  const card = el.hero3DCardTarget();
  if (!card) return;

  card.addEventListener('click', () => {
    const featured = state.forSaleListings[0];
    if (featured) openProjectDetailModal(featured);
  });
}

// Update UI Text on Language Change
function setLanguage(lang) {
  state.lang = lang;
  updateStaticTranslations();
  renderListings();
  if (state.inboxOpen) renderInboxDrawerContent();
  showToast(t().toastLangChanged);
}

function updateStaticTranslations() {
  const dict = t();
  
  // Navigation & Theme Toggle Bar
  const navListings = document.getElementById('t-nav-listings');
  const navWtb = document.getElementById('t-nav-wtb');
  const navPricing = document.getElementById('t-nav-pricing');
  const themeLightLabel = document.getElementById('t-theme-light-label');
  const themeDarkLabel = document.getElementById('t-theme-dark-label');

  if (navListings) navListings.textContent = dict.navListings;
  if (navWtb) navWtb.textContent = dict.navWtb;
  if (navPricing) navPricing.textContent = dict.navPricing;
  if (themeLightLabel) themeLightLabel.textContent = dict.themeLight;
  if (themeDarkLabel) themeDarkLabel.textContent = dict.themeDark;

  // Search Input Placeholder
  const search = el.globalSearch();
  if (search) search.placeholder = dict.searchPlaceholder;

  // Banner & Hero
  const bNew = document.getElementById('t-banner-new');
  const bText = document.getElementById('t-banner-text');
  const bAction = document.getElementById('t-banner-action');
  const vPill = document.getElementById('t-vision-pill');
  const hLine1 = document.getElementById('t-hero-line1');
  const hLine2 = document.getElementById('t-hero-line2');
  const hSub = document.getElementById('t-hero-subtitle');
  
  if (bNew) bNew.textContent = dict.bannerNew;
  if (bText) bText.textContent = dict.bannerText;
  if (bAction) bAction.textContent = dict.bannerAction;
  if (vPill) vPill.textContent = dict.visionPill;
  if (hLine1) hLine1.textContent = dict.heroTitleLine1;
  if (hLine2) hLine2.textContent = dict.heroTitleLine2;
  if (hSub) hSub.textContent = dict.heroSubtitle;

  const sListings = document.getElementById('t-stat-listings');
  const sDeals = document.getElementById('t-stat-deals');
  const sResp = document.getElementById('t-stat-response');
  const sRespVal = document.getElementById('t-stat-response-val');
  const btnExp = document.getElementById('t-btn-explore');
  const btnSell = document.getElementById('t-btn-sell-project');

  if (sListings) sListings.textContent = dict.statListings;
  if (sDeals) sDeals.textContent = dict.statDeals;
  if (sResp) sResp.textContent = dict.statResponse;
  if (sRespVal) sRespVal.textContent = dict.statResponseVal;
  if (btnExp) btnExp.textContent = dict.btnExplore;
  if (btnSell) btnSell.textContent = dict.btnSellProject;

  // Featured 3D Hero Card
  const fcBadge = document.getElementById('t-featured-card-badge');
  const fcTitle = document.getElementById('t-featured-card-title');
  const fcCat = document.getElementById('t-featured-card-category');
  const fcRev = document.getElementById('t-featured-card-revenue');
  const fcRevVal = document.getElementById('t-featured-card-revval');
  const fcUsers = document.getElementById('t-featured-card-users');
  const fcUsersVal = document.getElementById('t-featured-card-usersval');
  const fcBtn = document.getElementById('t-featured-card-btn');

  if (fcBadge) fcBadge.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>${dict.featuredCardBadge}`;
  if (fcTitle) fcTitle.textContent = dict.featuredCardTitle;
  if (fcCat) fcCat.textContent = dict.featuredCardCategory;
  if (fcRev) fcRev.textContent = dict.featuredCardRevenue;
  if (fcRevVal) fcRevVal.textContent = dict.featuredCardRevVal;
  if (fcUsers) fcUsers.textContent = dict.featuredCardUsers;
  if (fcUsersVal) fcUsersVal.textContent = `${dict.featuredCardUsersVal} 👥`;
  if (fcBtn) fcBtn.textContent = dict.featuredCardBtn;

  // Pricing Main Section Titles
  const pMainTitle = document.getElementById('t-pricing-main-title');
  const pSub = document.getElementById('t-pricing-subtitle');
  const pBBtn = el.pricingToggleBuyer();
  const pSBtn = el.pricingToggleSeller();

  if (pMainTitle) pMainTitle.innerHTML = `${dict.pricingTitleLine1}<span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 dark:from-purple-400 dark:via-indigo-400 dark:to-emerald-400">${dict.pricingTitleHighlight}</span>${dict.pricingTitleLine2}`;
  if (pSub) pSub.textContent = dict.pricingSubtitle;
  if (pBBtn) pBBtn.textContent = dict.pricingToggleBuyer;
  if (pSBtn) pSBtn.textContent = dict.pricingToggleSeller;

  // Simplified three-option pricing
  const simplePricing = dict.simplePricing;
  if (simplePricing) {
    const setText = (id, value) => {
      const node = document.getElementById(id);
      if (node) node.textContent = value;
    };
    const setFeatureList = (id, features, colorClass) => {
      const node = document.getElementById(id);
      if (node) node.innerHTML = features.map(feature => `<li class="flex items-start gap-2"><i class="ph-bold ph-check-circle ${colorClass} mt-0.5 flex-shrink-0"></i><span>${feature}</span></li>`).join('');
    };

    setText('t-simple-pricing-kicker', simplePricing.kicker);
    setText('t-simple-pricing-title', simplePricing.title);
    setText('t-simple-pricing-subtitle', simplePricing.subtitle);
    setText('t-simple-free-role', simplePricing.buyerRole);
    setText('t-simple-buyer-pack-role', simplePricing.buyerRole);
    setText('t-simple-standard-role', simplePricing.sellerRole);
    setText('t-simple-verified-role', simplePricing.sellerRole);
    setText('t-simple-free-title', simplePricing.freeTitle);
    setText('t-simple-free-desc', simplePricing.freeDesc);
    setText('t-simple-free-period', simplePricing.freePeriod);
    setText('simple-buyer-btn', simplePricing.freeButton);
    setText('t-simple-buyer-pack-title', simplePricing.buyerPackTitle);
    setText('t-simple-buyer-pack-desc', simplePricing.buyerPackDesc);
    setText('t-simple-buyer-pack-period', simplePricing.buyerPackPeriod);
    setText('simple-buyer-pack-btn', simplePricing.buyerPackButton);
    setText('t-simple-standard-title', simplePricing.standardTitle);
    setText('t-simple-standard-desc', simplePricing.standardDesc);
    setText('t-simple-standard-period', simplePricing.standardPeriod);
    setText('simple-standard-btn', simplePricing.standardButton);
    setText('t-simple-verified-badge', simplePricing.verifiedBadge);
    setText('t-simple-verified-title', simplePricing.verifiedTitle);
    setText('t-simple-verified-desc', simplePricing.verifiedDesc);
    setText('t-simple-verified-period', simplePricing.verifiedPeriod);
    setText('simple-verified-btn', simplePricing.verifiedButton);
    setText('t-simple-pricing-note', simplePricing.note);
    setFeatureList('t-simple-free-list', simplePricing.freeFeatures, 'text-emerald-500');
    setFeatureList('t-simple-buyer-pack-list', simplePricing.buyerPackFeatures, 'text-emerald-500');
    setFeatureList('t-simple-standard-list', simplePricing.standardFeatures, 'text-purple-500');
    setFeatureList('t-simple-verified-list', simplePricing.verifiedFeatures, 'text-emerald-400');
  }
  updateBuyerCreditBadge();

  // Buyer Section Headers & Cards
  const bSecT = document.getElementById('t-buyer-sec-title');
  const bSecSub = document.getElementById('t-buyer-sec-subtitle');
  if (bSecT) bSecT.textContent = dict.buyerSectionTitle;
  if (bSecSub) bSecSub.textContent = dict.buyerSectionSubtitle;

  const bFTitle = document.getElementById('t-buyer-free-title');
  const bFDesc = document.getElementById('t-buyer-free-desc');
  const bFConn = document.getElementById('t-buyer-free-conn');
  const bFSub = document.getElementById('t-buyer-free-sub');
  const bFBtn = document.getElementById('t-buyer-free-btn');
  const bFList = document.getElementById('t-buyer-free-list');

  if (bFTitle) bFTitle.textContent = dict.buyerFreeTitle;
  if (bFDesc) bFDesc.textContent = dict.buyerFreeDesc;
  if (bFConn) bFConn.textContent = dict.buyerFreeConnections;
  if (bFSub) bFSub.textContent = dict.buyerFreeSub;
  if (bFBtn) bFBtn.textContent = dict.buyerFreeBtn;
  if (bFList) bFList.innerHTML = dict.buyerFreeFeatures.map(f => `<li class="flex items-start gap-2"><i class="ph-bold ph-check text-emerald-500 text-sm flex-shrink-0 mt-0.5"></i> <span>${f}</span></li>`).join('');

  const bPBadge = document.getElementById('t-buyer-pack-badge');
  const bPTitle = document.getElementById('t-buyer-pack-title');
  const bPDesc = document.getElementById('t-buyer-pack-desc');
  const bPPrice = document.getElementById('t-buyer-pack-price');
  const bPConn = document.getElementById('t-buyer-pack-conn');
  const bPSub = document.getElementById('t-buyer-pack-sub');
  const bPBtn = document.getElementById('t-buyer-pack-btn');
  const bPList = document.getElementById('t-buyer-pack-list');

  if (bPBadge) bPBadge.innerHTML = `🔥 ${dict.buyerPackBadge}`;
  if (bPTitle) bPTitle.textContent = dict.buyerPackTitle;
  if (bPDesc) bPDesc.textContent = dict.buyerPackDesc;
  if (bPPrice) bPPrice.textContent = dict.buyerPackPrice;
  if (bPConn) bPConn.textContent = dict.buyerPackConn;
  if (bPSub) bPSub.textContent = dict.buyerPackSub;
  if (bPBtn) bPBtn.textContent = dict.buyerPackBtn;
  if (bPList) bPList.innerHTML = dict.buyerPackFeatures.map(f => `<li class="flex items-start gap-2"><i class="ph-bold ph-check text-emerald-500 text-sm flex-shrink-0 mt-0.5"></i> <span>${f}</span></li>`).join('');

  // Seller Section Headers & Cards
  const sSecT = document.getElementById('t-seller-sec-title');
  const sSecSub = document.getElementById('t-seller-sec-subtitle');
  if (sSecT) sSecT.textContent = dict.sellerSectionTitle;
  if (sSecSub) sSecSub.textContent = dict.sellerSectionSubtitle;

  const sFTitle = document.getElementById('t-seller-free-title');
  const sFDesc = document.getElementById('t-seller-free-desc');
  const sFCount = document.getElementById('t-seller-free-count');
  const sFSub = document.getElementById('t-seller-free-sub');
  const sFBtn = document.getElementById('t-seller-free-btn');
  const sFList = document.getElementById('t-seller-free-list');

  if (sFTitle) sFTitle.textContent = dict.sellerFreeTitle;
  if (sFDesc) sFDesc.textContent = dict.sellerFreeDesc;
  if (sFCount) sFCount.textContent = dict.sellerFreeCount;
  if (sFSub) sFSub.textContent = dict.sellerFreeSub;
  if (sFBtn) sFBtn.textContent = dict.sellerFreeBtn;
  if (sFList) sFList.innerHTML = dict.sellerFreeFeatures.map(f => `<li class="flex items-start gap-1.5"><i class="ph-bold ph-check text-purple-500 text-xs flex-shrink-0 mt-0.5"></i> <span>${f}</span></li>`).join('');

  const sETitle = document.getElementById('t-seller-extra-title');
  const sEDesc = document.getElementById('t-seller-extra-desc');
  const sEPrice = document.getElementById('t-seller-extra-price');
  const sEUnit = document.getElementById('t-seller-extra-unit');
  const sESub = document.getElementById('t-seller-extra-sub');
  const sEBtn = document.getElementById('t-seller-extra-btn');
  const sEList = document.getElementById('t-seller-extra-list');

  if (sETitle) sETitle.textContent = dict.sellerExtraTitle;
  if (sEDesc) sEDesc.textContent = dict.sellerExtraDesc;
  if (sEPrice) sEPrice.textContent = dict.sellerExtraPrice;
  if (sEUnit) sEUnit.textContent = dict.sellerExtraPriceUnit;
  if (sESub) sESub.textContent = dict.sellerExtraSub;
  if (sEBtn) sEBtn.textContent = dict.sellerExtraBtn;
  if (sEList) sEList.innerHTML = dict.sellerExtraFeatures.map(f => `<li class="flex items-start gap-1.5"><i class="ph-bold ph-check text-purple-500 text-xs flex-shrink-0 mt-0.5"></i> <span>${f}</span></li>`).join('');

  const sFeatTitle = document.getElementById('t-seller-feat-title');
  const sFeatDesc = document.getElementById('t-seller-feat-desc');
  const sFeatPrice = document.getElementById('t-seller-feat-price');
  const sFeatUnit = document.getElementById('t-seller-feat-unit');
  const sFeatSub = document.getElementById('t-seller-feat-sub');
  const sFeatBtn = document.getElementById('t-seller-feat-btn');
  const sFeatList = document.getElementById('t-seller-feat-list');

  if (sFeatTitle) sFeatTitle.textContent = dict.sellerFeaturedTitle;
  if (sFeatDesc) sFeatDesc.textContent = dict.sellerFeaturedDesc;
  if (sFeatPrice) sFeatPrice.textContent = dict.sellerFeaturedPrice;
  if (sFeatUnit) sFeatUnit.textContent = dict.sellerFeaturedPriceUnit;
  if (sFeatSub) sFeatSub.textContent = dict.sellerFeaturedSub;
  if (sFeatBtn) sFeatBtn.textContent = dict.sellerFeaturedBtn;
  if (sFeatList) sFeatList.innerHTML = dict.sellerFeaturedFeatures.map(f => `<li class="flex items-start gap-1.5"><i class="ph-bold ph-check text-purple-500 text-xs flex-shrink-0 mt-0.5"></i> <span>${f}</span></li>`).join('');

  const sProBadge = document.getElementById('t-seller-pro-badge');
  const sProTitle = document.getElementById('t-seller-pro-title');
  const sProDesc = document.getElementById('t-seller-pro-desc');
  const sProPrice = document.getElementById('t-seller-pro-price');
  const sProUnit = document.getElementById('t-seller-pro-unit');
  const sProSub = document.getElementById('t-seller-pro-sub');
  const sProBtn = document.getElementById('t-seller-pro-btn');
  const sProList = document.getElementById('t-seller-pro-list');

  if (sProBadge) sProBadge.innerHTML = `👑 ${dict.sellerProBadge}`;
  if (sProTitle) sProTitle.textContent = dict.sellerProTitle;
  if (sProDesc) sProDesc.textContent = dict.sellerProDesc;
  if (sProPrice) sProPrice.textContent = dict.sellerProPrice;
  if (sProUnit) sProUnit.textContent = dict.sellerProPriceUnit;
  if (sProSub) sProSub.textContent = dict.sellerProSub;
  if (sProBtn) sProBtn.textContent = dict.sellerProBtn;
  if (sProList) sProList.innerHTML = dict.sellerProFeatures.map(f => `<li class="flex items-start gap-1.5"><i class="ph-bold ph-sparkle text-purple-300 text-xs flex-shrink-0 mt-0.5"></i> <span>${f}</span></li>`).join('');

  // Trust Features Banner
  const trTitleSm = document.getElementById('t-trust-title-sm');
  const trSubSm = document.getElementById('t-trust-sub-sm');
  const trLMBtn = document.getElementById('t-trust-learn-btn');
  if (trTitleSm) trTitleSm.textContent = dict.trustTitle;
  if (trSubSm) trSubSm.textContent = dict.trustSubtitle.split('.')[0] + '.';
  if (trLMBtn) trLMBtn.textContent = dict.trustLearnMore;

  const trF1T = document.getElementById('t-trust-f1-title');
  const trF1D = document.getElementById('t-trust-f1-desc');
  const trF2T = document.getElementById('t-trust-f2-title');
  const trF2D = document.getElementById('t-trust-f2-desc');
  const trF3T = document.getElementById('t-trust-f3-title');
  const trF3D = document.getElementById('t-trust-f3-desc');
  const trF4T = document.getElementById('t-trust-f4-title');
  const trF4D = document.getElementById('t-trust-f4-desc');

  if (trF1T) trF1T.textContent = dict.trustFeature1Title;
  if (trF1D) trF1D.textContent = dict.trustFeature1Desc;
  if (trF2T) trF2T.textContent = dict.trustFeature2Title;
  if (trF2D) trF2D.textContent = dict.trustFeature2Desc;
  if (trF3T) trF3T.textContent = dict.trustFeature3Title;
  if (trF3D) trF3D.textContent = dict.trustFeature3Desc;
  if (trF4T) trF4T.textContent = dict.trustFeature4Title;
  if (trF4D) trF4D.textContent = dict.trustFeature4Desc;

  // Tabs & Filters
  const tSale = document.getElementById('t-tab-sale');
  const tWtb = document.getElementById('t-tab-wtb');
  const fLabel = document.getElementById('t-filter-label');
  const cAll = document.getElementById('t-cat-all');
  const cAi = document.getElementById('t-cat-ai');
  const cSaas = document.getElementById('t-cat-saas');
  const cExt = document.getElementById('t-cat-extension');
  const cMob = document.getElementById('t-cat-mobile');
  const cAnon = document.getElementById('t-cat-anon');

  if (tSale) tSale.textContent = dict.tabForSale;
  if (tWtb) tWtb.textContent = dict.tabWtb;
  if (fLabel) fLabel.textContent = dict.filterLabel;
  if (cAll) cAll.textContent = dict.catAll;
  if (cAi) cAi.innerHTML = `<i class="ph-bold ph-brain text-purple-500 mr-1"></i>${dict.catAi}`;
  if (cSaas) cSaas.innerHTML = `<i class="ph-bold ph-lightning text-amber-500 mr-1"></i>${dict.catSaas}`;
  if (cExt) cExt.innerHTML = `<i class="ph-bold ph-browsers text-blue-500 mr-1"></i>${dict.catExtension}`;
  if (cMob) cMob.innerHTML = `<i class="ph-bold ph-device-mobile text-emerald-500 mr-1"></i>${dict.catMobile}`;
  if (cAnon) cAnon.innerHTML = `<i class="ph-bold ph-user-ghost text-amber-500 mr-1"></i>${dict.catAnonymous}`;

  // Buttons & Controls
  const btnCreate = document.getElementById('t-btn-create-listing');
  const sLabel = document.getElementById('t-sort-label');
  const sNew = document.getElementById('t-sort-newest');
  const sLow = document.getElementById('t-sort-low');
  const sHigh = document.getElementById('t-sort-high');
  const sPop = document.getElementById('t-sort-popular');

  if (btnCreate) btnCreate.textContent = dict.btnCreateListing;
  if (sLabel) sLabel.textContent = dict.sortLabel;
  if (sNew) sNew.textContent = dict.sortNewest;
  if (sLow) sLow.textContent = dict.sortPriceLow;
  if (sHigh) sHigh.textContent = dict.sortPriceHigh;
  if (sPop) sPop.textContent = dict.sortPopular;

  // Footer Titles & Links
  const fColMarket = document.getElementById('t-footer-col-marketplace');
  const fLinkSale = document.getElementById('t-footer-link-forsale');
  const fLinkWtb = document.getElementById('t-footer-link-wtb');
  const fLinkAnon = document.getElementById('t-footer-link-anon');
  const fColTrust = document.getElementById('t-footer-col-trust');
  const fLinkEscrow = document.getElementById('t-footer-link-escrow');
  const fLinkChecklist = document.getElementById('t-footer-link-checklist');
  const fLinkContract = document.getElementById('t-footer-link-contract');
  const fColSocial = document.getElementById('t-footer-col-social');
  const fTagline = document.getElementById('t-footer-tagline');
  const fRights = document.getElementById('t-footer-rights');

  if (fColMarket) fColMarket.textContent = dict.footerColMarketplace;
  if (fLinkSale) fLinkSale.textContent = dict.footerLinkForSale;
  if (fLinkWtb) fLinkWtb.textContent = dict.footerLinkWtb;
  if (fLinkAnon) fLinkAnon.textContent = dict.footerLinkAnon;
  if (fColTrust) fColTrust.textContent = dict.footerColTrust;
  if (fLinkEscrow) fLinkEscrow.textContent = dict.footerLinkEscrow;
  if (fLinkChecklist) fLinkChecklist.textContent = dict.footerLinkChecklist;
  if (fLinkContract) fLinkContract.textContent = dict.footerLinkContract;
  if (fColSocial) fColSocial.textContent = dict.footerColSocial;
  if (fTagline) fTagline.textContent = dict.footerTagline;
  if (fRights) fRights.textContent = dict.footerRights;

  // Onboarding Full-Screen Page Static Translations
  const obVision = document.getElementById('t-ob-vision-pill');
  const obLine1 = document.getElementById('t-ob-hero-line1');
  const obLine2 = document.getElementById('t-ob-hero-line2');
  const obSub = document.getElementById('t-ob-hero-sub');
  const obStat1 = document.getElementById('t-ob-stat1');
  const obStat2 = document.getElementById('t-ob-stat2');
  const obStat3 = document.getElementById('t-ob-stat3');
  const obQuote = document.getElementById('t-ob-quote');
  const obQuoteAuth = document.getElementById('t-ob-quote-author');
  const obSkipBtn = document.getElementById('t-ob-skip-btn');
  const obTL = document.getElementById('t-ob-theme-light-label');
  const obTD = document.getElementById('t-ob-theme-dark-label');

  if (obVision) obVision.textContent = dict.visionPill;
  if (obLine1) obLine1.textContent = dict.obHeroLine1;
  if (obLine2) obLine2.textContent = dict.obHeroLine2;
  if (obSub) obSub.textContent = dict.obHeroSub;
  if (obStat1) obStat1.textContent = dict.obStat1;
  if (obStat2) obStat2.textContent = dict.obStat2;
  if (obStat3) obStat3.textContent = dict.obStat3;
  if (obQuote) obQuote.textContent = dict.obQuote;
  if (obQuoteAuth) obQuoteAuth.textContent = dict.obQuoteAuthor;
  if (obSkipBtn) obSkipBtn.textContent = dict.obSkipBtn;
  if (obTL) obTL.textContent = dict.themeLight;
  if (obTD) obTD.textContent = dict.themeDark;

  // Render auth card in current language
  renderAuthCard();
}

// Event Listeners
function setupEventListeners() {
  const tBtn = el.themeToggleBtn();
  const obTBtn = document.getElementById('ob-theme-toggle-btn');
  const cardTBtn = document.getElementById('ob-card-theme-btn');
  const lSel = el.langSelect();
  const obLSel = document.getElementById('ob-lang-select');
  const cardLSel = document.getElementById('ob-card-lang-select');

  if (tBtn) tBtn.addEventListener('click', toggleTheme);
  if (obTBtn) obTBtn.addEventListener('click', toggleTheme);
  if (cardTBtn) cardTBtn.addEventListener('click', toggleTheme);
  
  if (lSel) {
    lSel.addEventListener('change', (e) => {
      setLanguage(e.target.value);
      if (obLSel) obLSel.value = e.target.value;
      if (cardLSel) cardLSel.value = e.target.value;
    });
  }
  if (obLSel) {
    obLSel.addEventListener('change', (e) => {
      setLanguage(e.target.value);
      if (lSel) lSel.value = e.target.value;
      if (cardLSel) cardLSel.value = e.target.value;
    });
  }
  if (cardLSel) {
    cardLSel.addEventListener('change', (e) => {
      setLanguage(e.target.value);
      if (lSel) lSel.value = e.target.value;
      if (obLSel) obLSel.value = e.target.value;
    });
  }

  // Auth Card Segmented Tabs (Giriş Yap vs Kayıt Ol)
  document.getElementById('ob-tab-login')?.addEventListener('click', () => {
    authMode = 'login';
    renderAuthCard();
  });
  document.getElementById('ob-tab-register')?.addEventListener('click', () => {
    authMode = 'register';
    renderAuthCard();
  });

  // Navbar Links
  document.getElementById('t-nav-battles')?.addEventListener('click', (e) => {
    e.preventDefault();
    openProjectBattlesModal();
  });

  document.getElementById('t-nav-valuation')?.addEventListener('click', (e) => {
    e.preventDefault();
    openValuationModal();
  });

  document.getElementById('t-nav-pricing')?.addEventListener('click', (e) => {
    e.preventDefault();
    const pSection = document.getElementById('pricing-section');
    if (pSection) {
      pSection.classList.remove('hidden');
      pSection.scrollIntoView({ behavior: 'smooth' });
    }
  });

  document.getElementById('t-nav-listings')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('sale');
    document.getElementById('listings-grid')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('t-nav-wtb')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('wtb');
    document.getElementById('listings-grid')?.scrollIntoView({ behavior: 'smooth' });
  });

  const tabSale = el.tabForSale();
  const tabWtb = el.tabLookingToBuy();
  if (tabSale) tabSale.addEventListener('click', () => switchTab('sale'));
  if (tabWtb) tabWtb.addEventListener('click', () => switchTab('wtb'));

  const search = el.globalSearch();
  if (search) {
    search.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.toLowerCase().trim();
      renderListings();
    });
  }

  const sort = el.sortSelect();
  if (sort) {
    sort.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderListings();
    });
  }

  const catPills = el.categoryPills();
  if (catPills) {
    catPills.addEventListener('click', (e) => {
      const chip = e.target.closest('.cat-chip');
      if (!chip) return;
      document.querySelectorAll('.cat-chip').forEach(c => {
        c.classList.remove('active', 'bg-slate-900', 'text-white', 'dark:bg-slate-800');
        c.classList.add('bg-white', 'text-slate-600', 'dark:bg-slate-900', 'dark:text-slate-400');
      });
      chip.classList.add('active', 'bg-slate-900', 'text-white', 'dark:bg-slate-800');
      state.categoryFilter = chip.dataset.category;
      renderListings();
    });
  }

  const backdrop = el.modalBackdrop();
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
  }

  const createBtn = el.createListingBtn();
  const bannerBtn = el.bannerActionBtn();
  const heroSellBtn = el.btnHeroSell();
  const featInspectBtn = el.featuredInspectBtn();
  const inboxTrigger = el.inboxBtn();

  if (createBtn) createBtn.addEventListener('click', openCreateListingModal);
  if (bannerBtn) bannerBtn.addEventListener('click', openCreateListingModal);
  if (heroSellBtn) heroSellBtn.addEventListener('click', openCreateListingModal);
  if (featInspectBtn) {
    featInspectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const featured = state.forSaleListings[0];
      if (featured) openProjectDetailModal(featured);
    });
  }

  if (inboxTrigger) inboxTrigger.addEventListener('click', toggleInboxDrawer);

  const navRegister = document.getElementById('nav-register-btn');
  if (navRegister) navRegister.addEventListener('click', () => showOnboardingPage('register'));

  const skipBtn = document.getElementById('skip-to-marketplace-btn');
  if (skipBtn) skipBtn.addEventListener('click', () => showMainAppPage(true));

  const onboardingView = document.getElementById('onboarding-fullview');
  document.getElementById('ob-close-btn')?.addEventListener('click', () => showMainAppPage(false));
  onboardingView?.addEventListener('click', (e) => {
    if (e.target === onboardingView) showMainAppPage(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && onboardingView && !onboardingView.classList.contains('hidden')) {
      showMainAppPage(false);
    }
  });

  const brandLogo = document.getElementById('main-brand-logo');
  if (brandLogo) {
    brandLogo.addEventListener('click', (e) => {
      e.preventDefault();
      showMainAppPage();
    });
  }

  // Pricing View Mode Toggle Buttons (Alıcı / Satıcı / Tüm Paketler)
  const pBBtn = el.pricingToggleBuyer();
  const pSBtn = el.pricingToggleSeller();
  const pABtn = document.getElementById('pricing-toggle-all');

  if (pBBtn) pBBtn.addEventListener('click', () => switchPricingView('buyer'));
  if (pSBtn) pSBtn.addEventListener('click', () => switchPricingView('seller'));
  if (pABtn) pABtn.addEventListener('click', () => switchPricingView('all'));

  // Package Purchase Buttons (Alıcı & Satıcı Paket Butonları)
  document.getElementById('t-buyer-free-btn')?.addEventListener('click', () => openPackagePurchaseModal('Alıcı Ücretsiz Paket', '$0'));
  document.getElementById('t-buyer-pack-btn')?.addEventListener('click', () => openPackagePurchaseModal('Buyer Connection Pack (20 Bağlantı)', '$19'));
  document.getElementById('t-seller-free-btn')?.addEventListener('click', () => openPackagePurchaseModal('Satıcı Ücretsiz Paket (2 İlan)', '$0'));
  document.getElementById('t-seller-extra-btn')?.addEventListener('click', () => openPackagePurchaseModal('Satıcı Ek İlan Paketi', '$9'));
  document.getElementById('t-seller-feat-btn')?.addEventListener('click', () => openPackagePurchaseModal('Homepage Featured Vitrin İlanı', '$19'));
  document.getElementById('t-seller-pro-btn')?.addEventListener('click', () => openPackagePurchaseModal('Seller Pro Aylık Abonelik', '$29/ay'));

  // Simplified pricing actions
  document.getElementById('simple-buyer-btn')?.addEventListener('click', () => showOnboardingPage('register'));
  document.getElementById('simple-buyer-pack-btn')?.addEventListener('click', openBuyerConnectionPack);
  document.getElementById('simple-standard-btn')?.addEventListener('click', () => openPackagePurchaseModal(state.lang === 'en' ? 'Standard Listing — 60 Days' : 'Standart İlan — 60 Gün', '$9'));
  document.getElementById('simple-verified-btn')?.addEventListener('click', () => openPackagePurchaseModal(state.lang === 'en' ? 'Verified Listing — 60 Days' : 'Doğrulanmış İlan — 60 Gün', '$19'));
}

// Package Purchase Modal Checkout Handler
function openPackagePurchaseModal(packageName, price, onConfirm = null) {
  const isEn = state.lang === 'en';
  const backdrop = el.modalBackdrop();
  const content = el.modalContent();

  if (!backdrop || !content) return;

  content.innerHTML = `
    <div class="p-6 sm:p-8 space-y-6">
      <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl font-bold">
            <i class="ph-bold ph-shopping-bag font-bold"></i>
          </div>
          <div>
            <h3 class="text-xl font-black text-slate-900 dark:text-white">${packageName}</h3>
            <span class="text-xs text-slate-500">${isEn ? 'Package Purchase Checkout' : 'Paket Satın Alma Paneli'}</span>
          </div>
        </div>
        <button id="close-package-modal" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center">
          <i class="ph-bold ph-x"></i>
        </button>
      </div>

      <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <div>
          <span class="text-xs text-slate-500 block">${isEn ? 'Selected Package' : 'Seçilen Paket'}</span>
          <strong class="text-sm font-black text-slate-900 dark:text-white">${packageName}</strong>
        </div>
        <span class="text-2xl font-black text-emerald-600 dark:text-emerald-400">${price}</span>
      </div>

      <div class="space-y-3">
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">${isEn ? 'Cardholder Name' : 'Kart Üzerindeki İsim'}</label>
          <input type="text" value="Can Yılmaz" class="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-none focus:border-purple-600">
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">${isEn ? 'Card Number' : 'Kart Numarası'}</label>
          <input type="text" value="4543 •••• •••• 8821" class="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-none focus:border-purple-600">
        </div>
      </div>

      <button id="confirm-package-buy" class="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-purple-600 text-white font-black text-sm shadow-xl shadow-purple-500/25 hover:from-emerald-500 hover:to-purple-500 transition-all cursor-pointer">
        ${price === '$0' ? (isEn ? 'Activate Free Package 🎉' : 'Ücretsiz Paketi Aktif Et 🎉') : (isEn ? `Pay ${price} & Activate Package 🔒` : `${price} Öde & Paketi Aktifleştir 🔒`)}
      </button>
    </div>
  `;

  backdrop.classList.remove('hidden');
  document.getElementById('close-package-modal')?.addEventListener('click', closeModal);
  document.getElementById('confirm-package-buy')?.addEventListener('click', () => {
    if (typeof onConfirm === 'function') onConfirm();
    closeModal();
    showToast(isEn ? `${packageName} activated successfully!` : `${packageName} başarısıyla aktifleştirildi! 🎉`);
  });
}

// Interactive Free SaaS & AI Project Valuation Calculator Modal
function openValuationModal() {
  const isEn = state.lang === 'en';
  const backdrop = el.modalBackdrop();
  const content = el.modalContent();

  if (!backdrop || !content) return;

  content.innerHTML = `
    <div class="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[88vh]">
      
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl font-bold">
            📊
          </div>
          <div>
            <h3 class="text-xl font-black text-slate-900 dark:text-white">${isEn ? 'AI Project Valuation Calculator' : 'Ücretsiz Proje Değerleme Hesaplayıcı'}</h3>
            <span class="text-xs text-slate-500">${isEn ? 'Calculate your estimated SaaS valuation in seconds' : 'Projenizin tahmini satış değerini 10 saniyede hesaplayın'}</span>
          </div>
        </div>
        <button id="close-valuation-modal" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center">
          <i class="ph-bold ph-x"></i>
        </button>
      </div>

      <!-- Form Inputs Grid -->
      <div class="space-y-4">
        
        <div>
          <label class="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">${isEn ? 'Monthly Recurring Revenue ($ MRR)' : 'Aylık Düzenli Gelir ($ MRR)'}</label>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
            <input type="number" id="calc-mrr" value="2450" placeholder="2450" class="w-full pl-8 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600">
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">${isEn ? 'Project Category' : 'Proje Kategorisi'}</label>
            <select id="calc-cat" class="w-full px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none">
              <option value="ai">🤖 AI Projesi (2.5x - 3.5x ARR)</option>
              <option value="saas" selected>⚡ Micro SaaS (2.0x - 2.8x ARR)</option>
              <option value="extension">🧩 Chrome Extension (1.2x - 2.0x ARR)</option>
              <option value="mobile">📱 Mobil Uygulama (1.5x - 2.4x ARR)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">${isEn ? 'Monthly Growth Rate' : 'Aylık Büyüme Oranı'}</label>
            <select id="calc-growth" class="w-full px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none">
              <option value="high">🚀 Yüksek Büyüme (> %15/ay)</option>
              <option value="med" selected>📈 Düzenli Büyüme (%5 - %15/ay)</option>
              <option value="stable">⚓ Stabil Gelir (%0 - %5/ay)</option>
            </select>
          </div>
        </div>

      </div>

      <!-- Real-Time Calculation Result Box -->
      <div id="valuation-result-box" class="p-6 rounded-3xl bg-gradient-to-br from-purple-900/90 via-indigo-900/90 to-slate-900 text-white border border-purple-500/40 shadow-2xl space-y-4 relative overflow-hidden">
        
        <div class="flex items-center justify-between">
          <span class="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500 text-slate-950 flex items-center gap-1">
            <i class="ph-bold ph-sparkle"></i> GERÇEKÇİ PİYASA SATIŞ DEĞERİ
          </span>
          <span id="calc-multiple-badge" class="text-xs font-black text-purple-300 bg-purple-500/20 px-2.5 py-1 rounded-xl border border-purple-500/30">2.4x ARR (28x MRR)</span>
        </div>

        <div class="text-center py-2">
          <span class="text-xs text-slate-300 block font-medium mb-1">${isEn ? 'Estimated Market Value' : 'Tahmini Piyasa Satış Değeri (Makul Aralık)'}</span>
          <strong id="calc-valuation-range" class="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-purple-300 to-indigo-300">$58,800 – $82,300</strong>
        </div>

        <div class="grid grid-cols-3 gap-2 text-center text-xs border-t border-white/10 pt-4">
          <div>
            <span class="text-[10px] text-slate-400 block font-semibold">Yıllık Gelir (ARR)</span>
            <strong id="calc-arr-val" class="font-bold text-white text-sm">$29,400</strong>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 block font-semibold">Tahmini Satış Süresi</span>
            <strong class="font-bold text-emerald-400 text-sm">7-14 Gün</strong>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 block font-semibold">Komisyon Oranı</span>
            <strong class="font-bold text-purple-300 text-sm">%0 Komisyon</strong>
          </div>
        </div>

      </div>

      <!-- Action Button -->
      <button id="calc-list-now-btn" class="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-purple-600 text-white font-extrabold text-sm shadow-xl shadow-purple-500/25 hover:from-emerald-500 hover:to-purple-500 transition-all cursor-pointer flex items-center justify-center gap-2">
        <span>🚀 Projeni Bu Fiyata Searya'da Satışa Çıkar →</span>
      </button>

    </div>
  `;

  backdrop.classList.remove('hidden');

  const mrrInput = document.getElementById('calc-mrr');
  const catSelect = document.getElementById('calc-cat');
  const growthSelect = document.getElementById('calc-growth');
  const rangeEl = document.getElementById('calc-valuation-range');
  const multipleEl = document.getElementById('calc-multiple-badge');
  const arrEl = document.getElementById('calc-arr-val');

  function updateValuation() {
    const mrr = parseFloat(mrrInput?.value || 0);
    const cat = catSelect?.value || 'saas';
    const growth = growthSelect?.value || 'med';

    const arr = mrr * 12;
    let baseMult = 2.4;

    if (cat === 'ai') baseMult = 3.0;
    else if (cat === 'saas') baseMult = 2.4;
    else if (cat === 'extension') baseMult = 1.6;
    else if (cat === 'mobile') baseMult = 2.0;

    if (growth === 'high') baseMult += 0.4;
    else if (growth === 'stable') baseMult -= 0.4;

    const minVal = Math.round(arr * (baseMult - 0.4));
    const maxVal = Math.round(arr * (baseMult + 0.4));

    if (rangeEl) rangeEl.textContent = `$${minVal.toLocaleString()} – $${maxVal.toLocaleString()}`;
    if (multipleEl) multipleEl.textContent = `${baseMult.toFixed(1)}x ARR (${Math.round(baseMult * 12)}x MRR)`;
    if (arrEl) arrEl.textContent = `$${arr.toLocaleString()}`;
  }

  mrrInput?.addEventListener('input', updateValuation);
  catSelect?.addEventListener('change', updateValuation);
  growthSelect?.addEventListener('change', updateValuation);

  document.getElementById('close-valuation-modal')?.addEventListener('click', closeModal);
  document.getElementById('calc-list-now-btn')?.addEventListener('click', () => {
    closeModal();
    openCreateListingModal();
  });
}

// Gamified Viral Feature: Project Battles (Hangisini Satın Alırdın?)
function openProjectBattlesModal() {
  const isEn = state.lang === 'en';
  const backdrop = el.modalBackdrop();
  const content = el.modalContent();

  if (!backdrop || !content) return;

  const listings = initialForSaleListings.filter(p => p.type === 'sale' || p.askingPrice);
  if (listings.length < 2) return;

  // Pick two random distinct projects
  let idxA = Math.floor(Math.random() * listings.length);
  let idxB = Math.floor(Math.random() * listings.length);
  while (idxB === idxA) {
    idxB = Math.floor(Math.random() * listings.length);
  }

  const projA = listings[idxA];
  const projB = listings[idxB];

  let hasVoted = false;

  function renderBattle() {
    content.innerHTML = `
      <div class="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[90vh]">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-purple-600 to-emerald-500 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-amber-500/20">
              ⚔️
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">VIRAL ARENA</span>
                <span class="text-xs text-slate-400 font-bold">1,840+ Oy Kullanıldı</span>
              </div>
              <h3 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">${isEn ? 'Project Battles: Which would you buy?' : 'Project Battles: Hangisini Satın Alırdın?'}</h3>
            </div>
          </div>

          <button id="close-battle-modal" class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-white flex items-center justify-center transition-all">
            <i class="ph-bold ph-x text-base"></i>
          </button>
        </div>

        <p class="text-xs text-center text-slate-400 font-medium">
          ${isEn ? 'Compare two digital projects side-by-side and cast your vote on which acquisition makes more sense!' : 'İki dijital projeyi yan yana karşılaştır, yatırım yapmak isteyeceğin tarafa oyunu ver!'}
        </p>

        <!-- Battle Arena Side by Side Grid -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center relative">
          
          <!-- PROJECT A (LEFT CARD) -->
          <div class="md:col-span-5 rounded-3xl p-5 bg-slate-900/90 border border-purple-500/40 text-white space-y-4 shadow-xl hover:border-purple-500 transition-all flex flex-col justify-between h-full relative overflow-hidden group">
            <div class="space-y-3">
              <div class="h-32 rounded-2xl overflow-hidden relative">
                <img src="${projA.coverImage || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                <span class="absolute top-2 left-2 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-purple-600 text-white shadow-md">PROJE A</span>
              </div>

              <div>
                <h4 class="text-base font-black text-white line-clamp-1">${projA.title}</h4>
                <p class="text-xs text-slate-400 mt-0.5 line-clamp-2">${projA.shortDesc || projA.description}</p>
              </div>

              <div class="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-black/40 border border-white/5">
                <div>
                  <span class="text-[10px] text-slate-400 block font-semibold">Fiyat</span>
                  <strong class="text-sm font-black text-purple-400">$${(projA.askingPrice || 0).toLocaleString()}</strong>
                </div>
                <div>
                  <span class="text-[10px] text-slate-400 block font-semibold">Aylık MRR</span>
                  <strong class="text-sm font-black text-emerald-400">$${(projA.mrr || 0).toLocaleString()} /ay</strong>
                </div>
              </div>
            </div>

            <!-- Vote Button A / Results Bar A -->
            <div class="pt-3 border-t border-white/10 space-y-2">
              ${!hasVoted ? `
                <button id="vote-btn-a" class="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2">
                  <span>👈 Bu Projeyi Alırdım</span>
                </button>
              ` : `
                <div class="space-y-1">
                  <div class="flex items-center justify-between text-xs font-black">
                    <span class="text-purple-400">Proje A</span>
                    <span class="text-white">%64 Oy</span>
                  </div>
                  <div class="h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style="width: 64%"></div>
                  </div>
                </div>
              `}
            </div>
          </div>

          <!-- VS LIGHTNING BADGE -->
          <div class="md:col-span-2 flex items-center justify-center my-2 md:my-0">
            <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 via-red-500 to-purple-600 text-white font-black text-sm flex items-center justify-center shadow-xl ring-4 ring-slate-950 animate-bounce">
              VS
            </div>
          </div>

          <!-- PROJECT B (RIGHT CARD) -->
          <div class="md:col-span-5 rounded-3xl p-5 bg-slate-900/90 border border-emerald-500/40 text-white space-y-4 shadow-xl hover:border-emerald-500 transition-all flex flex-col justify-between h-full relative overflow-hidden group">
            <div class="space-y-3">
              <div class="h-32 rounded-2xl overflow-hidden relative">
                <img src="${projB.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                <span class="absolute top-2 left-2 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-600 text-white shadow-md">PROJE B</span>
              </div>

              <div>
                <h4 class="text-base font-black text-white line-clamp-1">${projB.title}</h4>
                <p class="text-xs text-slate-400 mt-0.5 line-clamp-2">${projB.shortDesc || projB.description}</p>
              </div>

              <div class="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-black/40 border border-white/5">
                <div>
                  <span class="text-[10px] text-slate-400 block font-semibold">Fiyat</span>
                  <strong class="text-sm font-black text-purple-400">$${(projB.askingPrice || 0).toLocaleString()}</strong>
                </div>
                <div>
                  <span class="text-[10px] text-slate-400 block font-semibold">Aylık MRR</span>
                  <strong class="text-sm font-black text-emerald-400">$${(projB.mrr || 0).toLocaleString()} /ay</strong>
                </div>
              </div>
            </div>

            <!-- Vote Button B / Results Bar B -->
            <div class="pt-3 border-t border-white/10 space-y-2">
              ${!hasVoted ? `
                <button id="vote-btn-b" class="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
                  <span>Bu Projeyi Alırdım 👉</span>
                </button>
              ` : `
                <div class="space-y-1">
                  <div class="flex items-center justify-between text-xs font-black">
                    <span class="text-emerald-400">Proje B</span>
                    <span class="text-white">%36 Oy</span>
                  </div>
                  <div class="h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style="width: 36%"></div>
                  </div>
                </div>
              `}
            </div>
          </div>

        </div>

        <!-- Next Battle Action Bar -->
        ${hasVoted ? `
          <div class="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <span class="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
              <i class="ph-bold ph-check-circle text-base"></i> Oyunuz kaydedildi! Toplam %64 ile Proje A önde gidiyor.
            </span>

            <button id="next-battle-btn" class="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition-all">
              <span>🎲 Sonraki İki Proje (Next Battle) →</span>
            </button>
          </div>
        ` : ''}

      </div>
    `;

    backdrop.classList.remove('hidden');

    document.getElementById('close-battle-modal')?.addEventListener('click', closeModal);

    document.getElementById('vote-btn-a')?.addEventListener('click', () => {
      hasVoted = true;
      showToast("🏆 Oyunuz Proje A'ya kaydedildi!");
      renderBattle();
    });

    document.getElementById('vote-btn-b')?.addEventListener('click', () => {
      hasVoted = true;
      showToast("🏆 Oyunuz Proje B'ye kaydedildi!");
      renderBattle();
    });

    document.getElementById('next-battle-btn')?.addEventListener('click', () => {
      openProjectBattlesModal();
    });
  }

  renderBattle();
}

// Switch Pricing View (Buyer, Seller or Both Side-by-Side)
function switchPricingView(mode) {
  state.pricingTab = mode;
  
  const bCol = document.getElementById('pricing-col-buyer');
  const sCol = document.getElementById('pricing-col-seller');
  const bBtn = el.pricingToggleBuyer();
  const sBtn = el.pricingToggleSeller();
  const aBtn = document.getElementById('pricing-toggle-all');

  const defaultStyle = "pricing-toggle-btn px-5 py-2.5 rounded-full font-bold text-xs transition-all text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-transparent";

  if (bBtn) bBtn.className = defaultStyle;
  if (sBtn) sBtn.className = defaultStyle;
  if (aBtn) aBtn.className = defaultStyle;

  if (mode === 'buyer') {
    if (bCol) bCol.className = "lg:col-span-12 space-y-6 animate-fade-in block";
    if (sCol) sCol.className = "hidden";
    if (bBtn) bBtn.className = "pricing-toggle-btn active px-6 py-2.5 rounded-full font-bold text-xs transition-all bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30";
  } else if (mode === 'seller') {
    if (sCol) sCol.className = "lg:col-span-12 space-y-6 animate-fade-in block";
    if (bCol) bCol.className = "hidden";
    if (sBtn) sBtn.className = "pricing-toggle-btn active px-6 py-2.5 rounded-full font-bold text-xs transition-all bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-purple-500/30";
  } else {
    // Both side-by-side
    if (bCol) bCol.className = "lg:col-span-5 space-y-6 animate-fade-in block";
    if (sCol) sCol.className = "lg:col-span-7 space-y-6 animate-fade-in block";
    if (aBtn) aBtn.className = "pricing-toggle-btn active px-5 py-2.5 rounded-full font-bold text-xs transition-all bg-slate-900 text-white dark:bg-slate-700 shadow-md";
  }
}

// Switch Main Tab cleanly
function switchTab(tab) {
  state.activeTab = tab;
  state.categoryFilter = 'all';

  document.querySelectorAll('.cat-chip').forEach(c => {
    c.classList.remove('active', 'bg-slate-900', 'text-white', 'dark:bg-slate-800');
    c.classList.add('bg-white', 'text-slate-600', 'dark:bg-slate-900', 'dark:text-slate-400');
  });
  document.querySelector('.cat-chip[data-category="all"]')?.classList.add('active', 'bg-slate-900', 'text-white', 'dark:bg-slate-800');

  const dict = t();
  const tabSale = el.tabForSale();
  const tabWtb = el.tabLookingToBuy();
  const gTitle = el.gridTitle();
  const gSub = el.gridSubtitle();

  if (tab === 'sale') {
    if (tabSale) tabSale.className = "tab-btn active flex flex-shrink-0 items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all text-emerald-950 dark:text-emerald-300 bg-white dark:bg-emerald-500/20 border border-slate-200 dark:border-emerald-500/40 shadow-sm";
    if (tabWtb) tabWtb.className = "tab-btn flex flex-shrink-0 items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white";
    if (gTitle) gTitle.textContent = dict.gridTitleSale;
    if (gSub) gSub.textContent = dict.gridSubtitleSale;
  } else {
    if (tabWtb) tabWtb.className = "tab-btn active flex flex-shrink-0 items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all text-indigo-950 dark:text-indigo-300 bg-white dark:bg-indigo-500/20 border border-slate-200 dark:border-indigo-500/40 shadow-sm";
    if (tabSale) tabSale.className = "tab-btn flex flex-shrink-0 items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white";
    if (gTitle) gTitle.textContent = dict.gridTitleWtb;
    if (gSub) gSub.textContent = dict.gridSubtitleWtb;
  }
  renderListings();
}

// Render Grid of Side-by-Side Square Cards
function renderListings() {
  const container = el.listingsGridContainer();
  if (!container) return;

  const isSale = state.activeTab === 'sale';
  let items = isSale ? [...state.forSaleListings] : [...state.wtbListings];

  // Category Filter
  if (state.categoryFilter !== 'all') {
    if (state.categoryFilter === 'anonymous') {
      items = items.filter(i => i.isAnonymous);
    } else {
      items = items.filter(i => i.category === state.categoryFilter);
    }
  }

  // Search Query
  if (state.searchQuery) {
    items = items.filter(i => {
      const title = state.lang === 'en' ? (i.titleEn || i.title) : i.title;
      const desc = state.lang === 'en' ? (i.shortDescEn || i.shortDesc) : i.shortDesc;
      return title.toLowerCase().includes(state.searchQuery) ||
        desc?.toLowerCase().includes(state.searchQuery) ||
        i.techStack?.some(t => t.toLowerCase().includes(state.searchQuery));
    });
  }

  // Sorting
  if (state.sortBy === 'price-low') {
    items.sort((a, b) => (a.askingPrice || a.budget || 0) - (b.askingPrice || b.budget || 0));
  } else if (state.sortBy === 'price-high') {
    items.sort((a, b) => (b.askingPrice || b.budget || 0) - (a.askingPrice || a.budget || 0));
  }

  const cntSale = el.forSaleCount();
  const cntWtb = el.wtbCount();
  if (cntSale) cntSale.textContent = state.forSaleListings.length;
  if (cntWtb) cntWtb.textContent = state.wtbListings.length;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center space-y-3 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800">
        <i class="ph-duotone ph-magnifying-glass text-4xl text-slate-400"></i>
        <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200">${state.lang === 'en' ? 'No results found' : 'Sonuç bulunamadı'}</h3>
        <p class="text-xs text-slate-500 max-w-sm mx-auto">${state.lang === 'en' ? 'Try a different filter or create a new listing.' : 'Farklı bir filtre deneyabilir veya yeni bir ilan oluşturabilirsiniz.'}</p>
        <button onclick="document.getElementById('create-listing-btn').click()" class="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-all">${t().btnCreateListing} →</button>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => isSale ? renderSaleSquareCard(item) : renderWtbSquareCard(item)).join('');

  // Attach Click Handlers to All Cards in Grid
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.share-btn')) return;
      if (e.target.closest('.dm-direct-btn')) return;
      const id = card.dataset.id;
      const allItems = [...state.forSaleListings, ...state.wtbListings];
      const listing = allItems.find(i => i.id === id);
      if (listing) openProjectDetailModal(listing);
    });
  });

  document.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const allItems = [...state.forSaleListings, ...state.wtbListings];
      const listing = allItems.find(i => i.id === id);
      if (listing) openShareCardModal(listing);
    });
  });

  document.querySelectorAll('.dm-direct-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const allItems = [...state.forSaleListings, ...state.wtbListings];
      const listing = allItems.find(i => i.id === id);
      if (listing) openInboxWithMessage(listing);
    });
  });
}

// Render Individual Sale Project Card (Square Aspect Ratio & Bilingual)
function renderSaleSquareCard(p) {
  const dict = t();
  const title = state.lang === 'en' ? (p.titleEn || p.title) : p.title;
  const desc = state.lang === 'en' ? (p.shortDescEn || p.shortDesc) : p.shortDesc;
  const categoryLabel = state.lang === 'en' ? (p.categoryEn || p.category) : p.category;
  const formattedPrice = p.askingPrice ? `$${p.askingPrice.toLocaleString()}` : '$450';

  return `
    <div data-id="${p.id}" class="project-card glass-card glass-card-hover rounded-3xl overflow-hidden cursor-pointer flex flex-col justify-between group border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0D131F] shadow-sm transition-all duration-300">
      <div>
        <!-- Square Image Cover Container -->
        <div class="relative w-full aspect-square overflow-hidden bg-slate-100 dark:bg-slate-900">
          <img src="${p.coverImage}" alt="${title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent"></div>
          
          <!-- Category Pill -->
          <div class="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
            <span class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-slate-900/90 text-white backdrop-blur-md border border-white/10 flex items-center gap-1">
              <i class="ph-bold ph-tag"></i> ${categoryLabel.toUpperCase()}
            </span>
            ${p.isAnonymous ? `
              <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/90 text-slate-950 backdrop-blur-md flex items-center gap-1 shadow-sm">
                <i class="ph-bold ph-user-ghost"></i> ${dict.anonBadge}
              </span>
            ` : ''}
          </div>

          <!-- PROMINENT PRICE BADGE (Top Right) -->
          <div class="absolute top-3 right-3 z-10">
            <span class="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-500 text-slate-950 shadow-lg backdrop-blur-md border border-emerald-400/40">
              ${formattedPrice}
            </span>
          </div>

          <!-- Overlay Seller Info & Title -->
          <div class="absolute bottom-3 left-3 right-3 space-y-1.5 text-white z-10">
            <div class="flex items-center gap-2">
              <img src="${p.seller.avatar}" alt="Seller" class="w-5 h-5 rounded-full object-cover border border-white/40">
              <span class="text-[11px] font-medium text-slate-200 truncate max-w-[120px]">${p.seller.name}</span>
              ${p.seller.githubVerified ? `
                <i class="ph-fill ph-check-circle text-emerald-400 text-xs"></i>
              ` : ''}
            </div>

            <h3 class="text-base font-extrabold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
              ${title}
            </h3>
          </div>
        </div>

        <div class="p-4 space-y-2.5">
          <p class="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 font-normal leading-relaxed">
            ${desc}
          </p>

          <div class="flex flex-wrap gap-1 pt-1">
            ${p.techStack.slice(0, 3).map(tech => `
              <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
                ${tech}
              </span>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="p-4 pt-0 flex items-center justify-between gap-2">
        <button data-id="${p.id}" class="share-btn p-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-white hover:bg-emerald-50 text-xs font-semibold flex items-center gap-1 border border-slate-200 dark:border-slate-700/60 transition-all" title="${dict.btnShareCard}">
          <i class="ph-bold ph-share-network text-emerald-500 text-sm"></i>
        </button>

        <button data-id="${p.id}" class="dm-direct-btn flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm">
          <i class="ph-bold ph-paper-plane-tilt"></i>
          <span>${dict.btnSendMessage}</span>
        </button>
      </div>
    </div>
  `;
}

// Render WTB Card (Square Aspect Ratio & Bilingual)
function renderWtbSquareCard(w) {
  const dict = t();
  const title = state.lang === 'en' ? (w.titleEn || w.title) : w.title;
  const desc = state.lang === 'en' ? (w.descriptionEn || w.description) : w.description;
  const formattedBudget = w.budget ? `$${w.budget.toLocaleString()}` : '$500 - $1,000';

  return `
    <div data-id="${w.id}" class="project-card glass-card glass-card-hover rounded-3xl p-5 cursor-pointer flex flex-col justify-between space-y-4 border-2 border-indigo-500/30 bg-gradient-to-br from-white via-indigo-50/20 to-white dark:from-[#0D131F] dark:via-indigo-950/20 dark:to-[#0D131F] shadow-sm transition-all duration-300">
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-indigo-600 text-white flex items-center gap-1 shadow-sm">
            <i class="ph-bold ph-target"></i> ${dict.wtbBadge}
          </span>
          <span class="px-3 py-1 rounded-xl text-xs font-black bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/40">
            ${formattedBudget}
          </span>
        </div>

        <div class="flex items-center gap-2 pt-1">
          <img src="${w.buyer.avatar}" alt="Buyer" class="w-7 h-7 rounded-full object-cover border border-indigo-300">
          <div>
            <span class="text-xs font-bold text-slate-900 dark:text-white block">${w.buyer.name}</span>
          </div>
        </div>

        <h3 class="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
          ${title}
        </h3>
        <p class="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
          ${desc}
        </p>

        <div class="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px] flex items-center justify-between text-slate-700 dark:text-slate-300">
          <div class="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
            <i class="ph-bold ph-code"></i> ${state.lang === 'en' ? (w.techPreferenceEn || w.techPreference) : w.techPreference}
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between gap-2 pt-2">
        <button data-id="${w.id}" class="share-btn px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700/60 transition-all">
          <i class="ph-bold ph-share-network text-indigo-500"></i>
          <span>${dict.btnShareCard}</span>
        </button>

        <button data-id="${w.id}" class="dm-direct-btn flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all">
          <i class="ph-bold ph-paper-plane-tilt"></i>
          <span>${dict.btnSendOffer}</span>
        </button>
      </div>
    </div>
  `;
}

// Project Detail Modal
function openProjectDetailModal(p) {
  const dict = t();
  const isSale = p.type === 'sale' || p.askingPrice;
  const title = state.lang === 'en' ? (p.titleEn || p.title) : p.title;
  const desc = state.lang === 'en' ? (p.fullDescEn || p.fullDesc || p.descriptionEn || p.description) : (p.fullDesc || p.description);
  const backdrop = el.modalBackdrop();
  const content = el.modalContent();
  if (!backdrop || !content) return;

  content.innerHTML = `
    <div class="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-900 flex-shrink-0">
      <img src="${p.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'}" alt="${title}" class="w-full h-full object-cover">
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
      <button id="close-modal-btn" class="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-slate-800 transition-all backdrop-blur-md">
        <i class="ph-bold ph-x text-lg"></i>
      </button>
      
      <div class="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${isSale ? 'bg-emerald-500 text-slate-950' : 'bg-indigo-600 text-white'}">
              ${isSale ? (state.lang === 'en' ? (p.categoryEn || p.category) : p.category) : (state.lang === 'en' ? 'LOOKING TO BUY' : 'PROJE ARIYORUM')}
            </span>
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800/90 text-white border border-slate-700">
              ${p.status || 'Active'}
            </span>
          </div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-white">${title}</h2>
        </div>
        <div class="text-right">
          <span class="text-xs text-slate-400 block font-medium">${isSale ? (state.lang === 'en' ? 'Asking Price' : 'İstenen Fiyat') : (state.lang === 'en' ? 'Budget' : 'Bütçe')}</span>
          <span class="text-3xl font-extrabold text-emerald-400">$${(p.askingPrice || p.budget || 0).toLocaleString()}</span>
        </div>
      </div>
    </div>

    <div class="p-6 sm:p-8 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-6">
        <div>
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">${state.lang === 'en' ? 'About Project' : 'Proje Hakkında'}</h3>
          <p class="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">${desc}</p>
        </div>

        <div class="space-y-3">
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400">Tech Stack & Services</h3>
          <div class="flex flex-wrap gap-2">
            ${(p.techStack || [p.techPreference || 'Next.js', 'Tailwind', 'Stripe']).map(t => `
              <span class="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700">
                ${t}
              </span>
            `).join('')}
          </div>
        </div>

        <!-- STRIPE & GITHUB VERIFIED TRUST BOX -->
        <div class="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-purple-500/10 to-indigo-500/10 border border-emerald-500/30 dark:border-emerald-500/40 space-y-4">
          
          <div class="flex items-center justify-between">
            <span class="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500 text-slate-950 flex items-center gap-1.5 shadow-sm">
              <i class="ph-bold ph-shield-check text-xs"></i> %100 DOĞRULANMIŞ VERİLER
            </span>
            <span class="text-[11px] text-slate-400 font-medium">Stripe & GitHub Entegre</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div class="p-3 rounded-xl bg-white/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
              <span class="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">💳 Stripe Aylık Gelir</span>
              <strong class="text-sm font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">$${(p.mrr || 2450).toLocaleString()} / Ay</strong>
              <span class="text-[9px] text-emerald-600 font-bold">✓ Canlı Gelir Onaylı</span>
            </div>

            <div class="p-3 rounded-xl bg-white/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
              <span class="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">🐙 GitHub Repo Sağlığı</span>
              <strong class="text-sm font-black text-purple-600 dark:text-purple-400 block mt-0.5">450+ Commit</strong>
              <span class="text-[9px] text-purple-600 font-bold">✓ Kod Reposu Onaylı</span>
            </div>

            <div class="p-3 rounded-xl bg-white/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
              <span class="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">🛡️ Escrow Mülkiyet</span>
              <strong class="text-sm font-black text-indigo-600 dark:text-indigo-400 block mt-0.5">Alan Adı & Kod</strong>
              <span class="text-[9px] text-indigo-600 font-bold">✓ Güvenli Devir Hazır</span>
            </div>
          </div>

          <!-- Monthly Revenue Trend Bar Chart Visualization -->
          <div class="space-y-1.5 pt-1">
            <div class="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <span>Son 4 Ay Stripe Gelir Trendi ($)</span>
              <span class="text-emerald-600 dark:text-emerald-400">+%34 Artış</span>
            </div>
            <div class="h-10 flex items-end gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div class="flex-1 bg-purple-500/40 hover:bg-purple-500 rounded-md h-[45%] transition-all relative group cursor-pointer" title="Ocak: $1,200">
                <span class="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">$1.2k</span>
              </div>
              <div class="flex-1 bg-purple-500/60 hover:bg-purple-500 rounded-md h-[65%] transition-all relative group cursor-pointer" title="Şubat: $1,650">
                <span class="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">$1.65k</span>
              </div>
              <div class="flex-1 bg-emerald-500/80 hover:bg-emerald-500 rounded-md h-[80%] transition-all relative group cursor-pointer" title="Mart: $2,100">
                <span class="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">$2.1k</span>
              </div>
              <div class="flex-1 bg-emerald-500 hover:bg-emerald-400 rounded-md h-[100%] transition-all relative group cursor-pointer" title="Nisan: $2,450">
                <span class="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">$2.45k</span>
              </div>
            </div>
          </div>

        </div>

        ${isSale ? `
          <div class="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span class="text-slate-400 block font-medium">${state.lang === 'en' ? 'Selling Reason' : 'Satış Nedeni'}</span>
              <span class="text-slate-800 dark:text-slate-200 font-semibold">${state.lang === 'en' ? (p.reasonForSellingEn || p.reasonForSelling || 'Strategic Pivot') : (p.reasonForSelling || 'Strateji Değişikliği')}</span>
            </div>
            <div>
              <span class="text-slate-400 block font-medium">${state.lang === 'en' ? 'Setup Time' : 'Kurulum Süresi'}</span>
              <span class="text-slate-800 dark:text-slate-200 font-semibold">~${p.setupTimeHours || 1} ${state.lang === 'en' ? 'hours' : 'saat'}</span>
            </div>
          </div>
        ` : `
          <div class="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 text-xs text-indigo-900 dark:text-indigo-200">
            <span class="font-bold block">${state.lang === 'en' ? 'MRR Requirement:' : 'MRR Şartı:'}</span>
            <span>${state.lang === 'en' ? (p.mrrRequirementEn || p.mrrRequirement) : p.mrrRequirement}</span>
          </div>
        `}
      </div>

      <div class="space-y-6">
        <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">${isSale ? (state.lang === 'en' ? 'Seller Profile' : 'Satıcı Profili') : (state.lang === 'en' ? 'Buyer Profile' : 'Alıcı Profili')}</h4>
          
          <div class="flex items-center gap-3">
            <img src="${(p.seller || p.buyer).avatar}" alt="Dev" class="w-12 h-12 rounded-2xl object-cover border border-slate-300 dark:border-slate-700">
            <div>
              <h5 class="text-sm font-bold text-slate-900 dark:text-white">${(p.seller || p.buyer).name}</h5>
              <span class="text-xs text-slate-500 dark:text-slate-400">${(p.seller || p.buyer).handle || '@builder'}</span>
            </div>
          </div>

          <button id="modal-send-dm-btn" class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all">
            <i class="ph-bold ph-paper-plane-tilt text-lg"></i>
            <span>${isSale ? dict.btnSendMessage : dict.btnSendOffer}</span>
          </button>

          <button id="modal-share-card-btn" class="w-full py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all">
            <i class="ph-bold ph-share-network text-emerald-500 text-base"></i>
            <span>${dict.btnShareCardCreate}</span>
          </button>
        </div>
      </div>
    </div>
  `;

  backdrop.classList.remove('hidden');

  document.getElementById('close-modal-btn')?.addEventListener('click', closeModal);
  document.getElementById('modal-send-dm-btn')?.addEventListener('click', () => {
    closeModal();
    openInboxWithMessage(p);
  });
  document.getElementById('modal-share-card-btn')?.addEventListener('click', () => {
    closeModal();
    openShareCardModal(p);
  });
}

function closeModal() {
  const backdrop = el.modalBackdrop();
  if (backdrop) backdrop.classList.add('hidden');
}

// Interactive Social Media Share Card Generator Modal
function openShareCardModal(p) {
  const isSale = p.type === 'sale' || p.askingPrice;
  let activeFormat = 'twitter';
  const backdrop = el.modalBackdrop();
  const content = el.modalContent();
  if (!backdrop || !content) return;

  const updateCardPreview = () => {
    const cardTitle = p.title || "AI SaaS Platform";
    const priceText = isSale ? `$${(p.askingPrice || 450).toLocaleString()}` : `$${(p.budget || 500).toLocaleString()} – $1,000`;
    const techPills = (p.techStack || ['Next.js', 'Tailwind CSS', 'Supabase', 'Stripe']).slice(0, 4);

    const isPurple = isSale;
    const badgeBg = isPurple ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white';
    const badgeText = isPurple ? 'FOR SALE' : 'LOOKING TO BUY';
    const badgeIcon = isPurple ? 'ph-bold ph-rocket' : 'ph-bold ph-target';

    const cardHtml = `
      <div class="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
        
        <div class="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-2xl ${isPurple ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'} flex items-center justify-center text-2xl shadow-sm">
              <i class="ph-bold ${isPurple ? 'ph-shopping-bag' : 'ph-magnifying-glass'}"></i>
            </div>
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider ${isPurple ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-600 dark:text-emerald-400'}">
                ${isPurple ? (state.lang === 'en' ? 'SALE LISTING SHARE CARD' : 'SATIŞ İLANI PAYLAŞIM KARTI') : (state.lang === 'en' ? 'BUYING REQUEST SHARE CARD' : 'ALIŞ İLANI PAYLAŞIM KARTI')}
              </span>
              <h3 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                ${isPurple ? (state.lang === 'en' ? 'Selling this project!' : 'Bu projeyi satıyorum!') : (state.lang === 'en' ? 'Looking for this project!' : 'Bu projeyi arıyorum!')}
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ${isPurple ? (state.lang === 'en' ? 'Share to reach right cash buyers fast.' : 'Paylaş, doğru alıcıya daha hızlı ulaş.') : (state.lang === 'en' ? 'Share to get pitches from sellers directly.' : 'Paylaş, doğru satıcıdan teklif al.')}
              </p>
            </div>
          </div>

          <button id="close-share-modal" class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-white flex items-center justify-center transition-all">
            <i class="ph-bold ph-x text-lg"></i>
          </button>
        </div>

        <div class="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button data-format="twitter" class="format-tab-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeFormat === 'twitter' ? (isPurple ? 'bg-purple-600 text-white shadow-md' : 'bg-emerald-600 text-white shadow-md') : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}">
            <i class="ph-bold ph-x-logo"></i>
            <span>X (Twitter) – 1200x675</span>
          </button>

          <button data-format="feed" class="format-tab-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeFormat === 'feed' ? (isPurple ? 'bg-purple-600 text-white shadow-md' : 'bg-emerald-600 text-white shadow-md') : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}">
            <i class="ph-bold ph-instagram-logo"></i>
            <span>Instagram (Feed) – 1080x1080</span>
          </button>

          <button data-format="story" class="format-tab-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeFormat === 'story' ? (isPurple ? 'bg-purple-600 text-white shadow-md' : 'bg-emerald-600 text-white shadow-md') : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}">
            <i class="ph-bold ph-device-mobile"></i>
            <span>Instagram Story – 1080x1920</span>
          </button>

          <button data-format="whatsapp" class="format-tab-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeFormat === 'whatsapp' ? (isPurple ? 'bg-purple-600 text-white shadow-md' : 'bg-emerald-600 text-white shadow-md') : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}">
            <i class="ph-bold ph-whatsapp-logo"></i>
            <span>WhatsApp – 1024x1024</span>
          </button>
        </div>

        <div class="relative w-full rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl transition-all duration-300 ${
          isPurple 
            ? 'bg-gradient-to-br from-[#120B24] via-[#1A1038] to-[#0A0518] text-white border border-purple-500/30' 
            : 'bg-gradient-to-br from-[#061F16] via-[#0B2E21] to-[#04120D] text-white border border-emerald-500/30'
        } ${
          activeFormat === 'twitter' ? 'aspect-twitter' : activeFormat === 'feed' ? 'aspect-feed' : activeFormat === 'story' ? 'aspect-story' : 'aspect-whatsapp'
        } flex flex-col justify-between">
          
          <div class="flex items-center justify-between">
            <span class="px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${badgeBg} flex items-center gap-1.5 shadow-md">
              <i class="${badgeIcon}"></i> ${badgeText}
            </span>

            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-lg ${isPurple ? 'bg-purple-600' : 'bg-emerald-600'} flex items-center justify-center text-white text-xs font-black">S</div>
              <span class="font-extrabold text-sm text-white tracking-tight">Searya</span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-auto">
            <div class="${isSale ? 'md:col-span-7' : 'md:col-span-12'} space-y-3">
              <h2 class="text-2xl sm:text-3xl font-black text-white leading-tight">${cardTitle}</h2>
              
              <div class="space-y-1">
                <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">${isSale ? (state.lang === 'en' ? 'ASKING PRICE' : 'FİYAT') : (state.lang === 'en' ? 'BUDGET' : 'BÜTÇE')}</span>
                <span class="text-3xl sm:text-4xl font-black ${isPurple ? 'text-purple-400' : 'text-emerald-400'}">${priceText}</span>
              </div>

              <div class="flex flex-wrap gap-2 pt-2">
                ${techPills.map(tech => `
                  <span class="px-3 py-1 rounded-xl text-xs font-bold bg-white/10 text-white backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                    <i class="ph-bold ph-code text-xs ${isPurple ? 'text-purple-400' : 'text-emerald-400'}"></i> ${tech}
                  </span>
                `).join('')}
              </div>
            </div>

            ${isSale ? `
              <div class="md:col-span-5 hidden md:block">
                <div class="rounded-2xl p-3 bg-slate-900/90 border border-slate-700/80 shadow-xl space-y-2">
                  <div class="flex items-center gap-1.5 pb-1 border-b border-slate-800">
                    <span class="w-2 h-2 rounded-full bg-red-500"></span>
                    <span class="w-2 h-2 rounded-full bg-yellow-500"></span>
                    <span class="w-2 h-2 rounded-full bg-green-500"></span>
                    <span class="text-[9px] text-slate-500 ml-2 font-mono">dashboard.app</span>
                  </div>
                  <img src="${p.coverImage || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80'}" class="w-full h-24 object-cover rounded-lg">
                </div>
              </div>
            ` : ''}
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-white/10">
            <span class="text-[10px] font-extrabold uppercase tracking-wider ${isPurple ? 'text-purple-300 bg-purple-500/20 border border-purple-500/40' : 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/40'} px-3 py-1 rounded-full flex items-center gap-1.5">
              <i class="ph-bold ph-check-circle"></i> ${isSale ? 'READY TO LAUNCH' : 'HEMEN ALMAYA HAZIRIM'}
            </span>

            <span class="text-xs font-bold text-slate-400 flex items-center gap-1">
              <i class="ph-bold ph-globe"></i> searya.com
            </span>
          </div>

        </div>

        <div class="space-y-3">
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block">${state.lang === 'en' ? 'Preset Tweet / Caption Copy:' : 'Hazır Metin & Link:'}</label>
          <textarea id="tweet-textarea" readonly class="w-full h-24 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 font-mono focus:outline-none">🔥 SEARYA ${badgeText}: ${cardTitle}\n💰 ${isSale ? 'Price' : 'Budget'}: ${priceText}\n🛠 Tech: ${techPills.join(', ')}\n👉 Details: https://searya.com/p/${p.id}\n#BuildInPublic #Searya #IndieHackers</textarea>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 pt-1">
          <button id="copy-tweet-btn" class="flex-1 py-3 rounded-xl bg-slate-900 text-white dark:bg-slate-800 hover:bg-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all">
            <i class="ph-bold ph-copy text-base"></i>
            <span>${state.lang === 'en' ? 'Copy Text & Link' : 'Metni & Linki Kopyala'}</span>
          </button>

          <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(`🔥 SEARYA ${badgeText}: ${cardTitle}\n💰 ${priceText}\n👉 Details: https://searya.com/p/${p.id}\n#BuildInPublic #Searya`)}" target="_blank" class="flex-1 py-3 rounded-xl ${isPurple ? 'bg-purple-600 hover:bg-purple-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all text-center">
            <i class="ph-bold ph-x-logo text-base"></i>
            <span>${state.lang === 'en' ? 'Share on X / Twitter' : 'X (Twitter)\'da Paylaş'}</span>
          </a>
        </div>
      </div>
    `;

    content.innerHTML = cardHtml;

    document.querySelectorAll('.format-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeFormat = btn.dataset.format;
        updateCardPreview();
      });
    });

    document.getElementById('close-share-modal')?.addEventListener('click', closeModal);
    document.getElementById('copy-tweet-btn')?.addEventListener('click', () => {
      const text = document.getElementById('tweet-textarea').value;
      navigator.clipboard.writeText(text);
      showToast(t().toastCopied);
    });
  };

  updateCardPreview();
  backdrop.classList.remove('hidden');
}

// Create Listing Modal
function openCreateListingModal() {
  const dict = t();
  let uploadedImageData = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80";
  const backdrop = el.modalBackdrop();
  const content = el.modalContent();
  if (!backdrop || !content) return;

  content.innerHTML = `
    <!-- Header -->
    <div class="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0 bg-white dark:bg-[#0D131F]">
      <div>
        <h3 class="text-xl font-bold text-slate-900 dark:text-white">${dict.btnCreateListing}</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">${state.lang === 'en' ? 'Post your digital project or specify your buying criteria.' : 'Projenizi yeni sahipleriyle buluşturun veya ne satın almak istediğinizi yazın.'}</p>
      </div>
      <button id="close-create-modal" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-white flex items-center justify-center">
        <i class="ph-bold ph-x text-base"></i>
      </button>
    </div>

    <!-- Scrollable Form Body -->
    <form id="create-listing-form" class="flex-1 overflow-y-auto p-6 space-y-4">
      <div class="grid grid-cols-2 gap-3 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <label class="flex items-center justify-center gap-2 p-2.5 rounded-lg cursor-pointer font-bold text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 shadow-sm">
          <input type="radio" name="listingType" value="sale" checked class="accent-emerald-500">
          <span>🚀 ${state.lang === 'en' ? 'Project For Sale' : 'Projemi Satıyorum'}</span>
        </label>
        <label class="flex items-center justify-center gap-2 p-2.5 rounded-lg cursor-pointer font-bold text-xs text-slate-600 dark:text-slate-400">
          <input type="radio" name="listingType" value="wtb" class="accent-emerald-500">
          <span>🎯 ${state.lang === 'en' ? 'Looking to Buy (WTB)' : 'Proje Arıyorum (WTB)'}</span>
        </label>
      </div>

      <div>
        <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">${state.lang === 'en' ? 'Listing Title' : 'İlan Başlığı'}</label>
        <input type="text" id="form-title" required placeholder="${state.lang === 'en' ? 'e.g. Next.js + OpenAI Content SaaS' : 'Örn: Next.js + OpenAI İçerik SaaS'}" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500">
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">${state.lang === 'en' ? 'Category' : 'Kategori'}</label>
          <select id="form-category" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none">
            <option value="ai">🤖 ${state.lang === 'en' ? 'AI Tool' : 'AI Projesi'}</option>
            <option value="saas">⚡ Micro SaaS</option>
            <option value="extension">🧩 Chrome Extension</option>
            <option value="mobile">📱 ${state.lang === 'en' ? 'Mobile App' : 'Mobil Uygulama'}</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">${state.lang === 'en' ? 'Price / Budget ($)' : 'Fiyat / Bütçe ($)'}</label>
          <input type="number" id="form-price" required placeholder="450" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500">
        </div>
      </div>

      <!-- IMAGE UPLOAD CONTAINER -->
      <div id="image-upload-wrapper" class="space-y-2">
        <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block flex items-center justify-between">
          <span>🖼️ ${dict.formImageLabel}</span>
          <span class="text-[10px] text-slate-400 font-normal">PNG, JPG, WebP</span>
        </label>
        
        <div class="border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-4 text-center hover:border-emerald-500 dark:hover:border-emerald-500 transition-all bg-slate-50 dark:bg-slate-900/50 cursor-pointer relative group">
          <input type="file" id="form-image-file" accept="image/*" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
          
          <div id="image-upload-preview-box" class="flex flex-col items-center justify-center space-y-2">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl">
              <i class="ph-bold ph-image-square"></i>
            </div>
            <p id="image-upload-status" class="text-xs font-semibold text-slate-700 dark:text-slate-300">
              ${dict.formImageDropzone}
            </p>
            <span class="text-[10px] text-slate-400">${state.lang === 'en' ? 'or paste an image link below' : 'veya aşağıya bir görsel bağlantısı yapıştırın'}</span>
          </div>
        </div>

        <input type="url" id="form-image-url" placeholder="${dict.formImagePlaceholder}" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500">

        <div class="pt-1">
          <span class="text-[10px] font-bold text-slate-400 block mb-1.5">${dict.formImagePresets}</span>
          <div class="grid grid-cols-4 gap-2">
            <button type="button" class="preset-img-btn h-12 rounded-xl overflow-hidden border-2 border-transparent hover:border-emerald-500 transition-all" data-url="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80">
              <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=200&q=80" class="w-full h-full object-cover" title="Analytics Dashboard">
            </button>
            <button type="button" class="preset-img-btn h-12 rounded-xl overflow-hidden border-2 border-transparent hover:border-emerald-500 transition-all" data-url="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80">
              <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80" class="w-full h-full object-cover" title="AI Suite">
            </button>
            <button type="button" class="preset-img-btn h-12 rounded-xl overflow-hidden border-2 border-transparent hover:border-emerald-500 transition-all" data-url="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=600&q=80">
              <img src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=200&q=80" class="w-full h-full object-cover" title="Mobile App">
            </button>
            <button type="button" class="preset-img-btn h-12 rounded-xl overflow-hidden border-2 border-transparent hover:border-emerald-500 transition-all" data-url="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80">
              <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=200&q=80" class="w-full h-full object-cover" title="SaaS Code">
            </button>
          </div>
        </div>
      </div>

      <div>
        <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Tech Stack</label>
        <input type="text" id="form-stack" placeholder="Next.js 14, Tailwind, OpenAI API, Supabase" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500">
      </div>

      <div>
        <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">${state.lang === 'en' ? 'Description & Details' : 'Kısa Açıklama & Detaylar'}</label>
        <textarea id="form-desc" rows="3" required placeholder="${state.lang === 'en' ? 'What does the project do? Why are you selling?' : 'Proje ne iş yapar? Neden satıyorsunuz?'}" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"></textarea>
      </div>

      <div class="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <i class="ph-bold ph-eye-slash text-xl text-amber-500"></i>
          <div>
            <span class="text-xs font-bold text-slate-900 dark:text-white block">${state.lang === 'en' ? 'Anonymous Listing (Private)' : 'Anonim İlan Aç (Private Listing)'}</span>
            <span class="text-[10px] text-slate-500 dark:text-slate-400">${state.lang === 'en' ? 'Hide your real name until DM handshake.' : 'İsminiz ve profiliniz gizlensin, sadece Doğrulanmış Dev olarak görünsün.'}</span>
          </div>
        </div>
        <input type="checkbox" id="form-anonymous" class="w-5 h-5 accent-emerald-500 rounded cursor-pointer">
      </div>

      <!-- Action Footer -->
      <div class="pt-4 border-t border-slate-200 dark:border-slate-800">
        <button type="submit" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
          <span>${state.lang === 'en' ? 'Publish Listing →' : 'İlanı Yayınla →'}</span>
        </button>
      </div>
    </form>
  `;

  backdrop.classList.remove('hidden');

  const typeRadios = document.querySelectorAll('input[name="listingType"]');
  const imageWrapper = document.getElementById('image-upload-wrapper');

  typeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'wtb') {
        if (imageWrapper) imageWrapper.classList.add('hidden');
      } else {
        if (imageWrapper) imageWrapper.classList.remove('hidden');
      }
    });
  });

  const fileInput = document.getElementById('form-image-file');
  const urlInput = document.getElementById('form-image-url');
  const previewBox = document.getElementById('image-upload-preview-box');

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          uploadedImageData = event.target.result;
          if (urlInput) urlInput.value = '';
          if (previewBox) {
            previewBox.innerHTML = `
              <img src="${uploadedImageData}" class="h-20 w-auto rounded-xl object-cover shadow-md mx-auto border border-emerald-500">
              <span class="text-xs text-emerald-500 font-bold flex items-center gap-1"><i class="ph-bold ph-check"></i> ${state.lang === 'en' ? 'Image uploaded!' : 'Görsel yüklendi!'}</span>
            `;
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  document.querySelectorAll('.preset-img-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-img-btn').forEach(b => b.classList.remove('border-emerald-500', 'ring-2', 'ring-emerald-500'));
      btn.classList.add('border-emerald-500', 'ring-2', 'ring-emerald-500');
      uploadedImageData = btn.dataset.url;
      if (urlInput) urlInput.value = uploadedImageData;
      if (previewBox) {
        previewBox.innerHTML = `
          <img src="${uploadedImageData}" class="h-20 w-auto rounded-xl object-cover shadow-md mx-auto border border-emerald-500">
          <span class="text-xs text-emerald-500 font-bold flex items-center gap-1"><i class="ph-bold ph-check"></i> ${state.lang === 'en' ? 'Preset selected!' : 'Örnek şablon seçildi!'}</span>
        `;
      }
    });
  });

  if (urlInput) {
    urlInput.addEventListener('input', (e) => {
      if (e.target.value) {
        uploadedImageData = e.target.value;
      }
    });
  }

  document.getElementById('close-create-modal')?.addEventListener('click', closeModal);
  document.getElementById('create-listing-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.querySelector('input[name="listingType"]:checked').value;
    const title = document.getElementById('form-title').value;
    const category = document.getElementById('form-category').value;
    const price = parseFloat(document.getElementById('form-price').value);
    const stack = document.getElementById('form-stack').value.split(',').map(s => s.trim());
    const desc = document.getElementById('form-desc').value;
    const isAnon = document.getElementById('form-anonymous').checked;
    const finalImage = urlInput ? (urlInput.value.trim() || uploadedImageData) : uploadedImageData;

    const newListing = {
      id: `proj-${Date.now()}`,
      type,
      title,
      titleEn: title,
      slug: title.toLowerCase().replace(/[^a-z0-0]/g, '-'),
      category,
      categoryEn: category.toUpperCase(),
      askingPrice: price,
      budget: price,
      mrr: 0,
      status: isAnon ? (state.lang === 'en' ? "Anonymous Listing" : "Anonim İlan") : "New",
      isAnonymous: isAnon,
      seller: {
        name: isAnon ? (state.lang === 'en' ? `Verified Dev #${Math.floor(1000 + Math.random() * 9000)}` : `Doğrulanmış Dev #${Math.floor(1000 + Math.random() * 9000)}`) : "Alex Rivera",
        handle: isAnon ? "@anon_builder" : "@arivera_dev",
        avatar: isAnon ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
        githubVerified: true
      },
      buyer: {
        name: "Alex Rivera",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
      },
      shortDesc: desc,
      shortDescEn: desc,
      description: desc,
      descriptionEn: desc,
      coverImage: finalImage,
      techStack: stack,
      createdAt: state.lang === 'en' ? "Just now" : "Şimdi"
    };

    if (type === 'sale') {
      state.forSaleListings.unshift(newListing);
      switchTab('sale');
    } else {
      state.wtbListings.unshift(newListing);
      switchTab('wtb');
    }

    closeModal();
    showToast(t().toastPublished);
  });
}

// DEDICATED MULTI-THREAD INBOX MESSAGING DRAWER SYSTEM
function toggleInboxDrawer() {
  const drawer = el.inboxDrawer();
  if (!drawer) return;

  if (drawer.classList.contains('translate-x-full')) {
    state.inboxOpen = true;
    renderInboxDrawerContent();
    drawer.classList.remove('translate-x-full');
  } else {
    state.inboxOpen = false;
    drawer.classList.add('translate-x-full');
  }
}

function openInboxWithMessage(listing) {
  // Find or create thread for this listing
  let thread = state.messages.find(m => m.projectTitle === listing.title);
  if (!thread) {
    const requiresBuyerConnection = listing.type === 'sale';
    if (requiresBuyerConnection && state.buyerConnections <= 0) {
      openBuyerConnectionPack();
      return;
    }

    if (requiresBuyerConnection) {
      state.buyerConnections -= 1;
      updateBuyerCreditBadge();
    }
    const newThreadId = `thread-${Date.now()}`;
    const partner = listing.seller || listing.buyer || { name: "Alex Rivera", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" };
    thread = {
      id: newThreadId,
      partnerName: partner.name,
      partnerAvatar: partner.avatar,
      projectTitle: listing.title,
      askingPrice: `$${listing.askingPrice || listing.budget}`,
      unread: false,
      messages: [
        { 
          sender: "me", 
          text: state.lang === 'en' ? `Hi! I am interested in ${listing.title}. Is it still available?` : `Selam! ${listing.title} ilanı ile ilgileniyorum. Hala müsait mi?`,
          textEn: `Hi! I am interested in ${listing.title}. Is it still available?`,
          time: state.lang === 'en' ? "Just now" : "Şimdi" 
        }
      ]
    };
    state.messages.unshift(thread);
  }

  state.activeThreadId = thread.id;
  state.inboxOpen = true;
  renderInboxDrawerContent();
  const drawer = el.inboxDrawer();
  if (drawer) drawer.classList.remove('translate-x-full');
}

function updateBuyerCreditBadge() {
  const badge = document.getElementById('buyer-credit-count');
  if (!badge) return;
  badge.textContent = state.buyerConnections > 99 ? '99+' : String(state.buyerConnections);
  const label = state.lang === 'en'
    ? `${state.buyerConnections} new seller connections remaining`
    : `${state.buyerConnections} yeni satıcı bağlantısı kaldı`;
  badge.setAttribute('aria-label', label);
  el.inboxBtn()?.setAttribute('title', label);
}

function openBuyerConnectionPack() {
  const packageName = state.lang === 'en' ? '10 Connection Pack' : '10 Bağlantı Paketi';
  openPackagePurchaseModal(packageName, '$9', () => {
    state.buyerConnections += 10;
    updateBuyerCreditBadge();
  });
}

function renderInboxDrawerContent() {
  const drawer = el.inboxDrawer();
  if (!drawer) return;

  const dict = t();
  const activeThread = state.messages.find(m => m.id === state.activeThreadId) || state.messages[0];

  drawer.innerHTML = `
    <!-- Header -->
    <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#0D131F]">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-lg font-bold">
          <i class="ph-bold ph-chats"></i>
        </div>
        <div>
          <h3 class="text-sm font-extrabold text-slate-900 dark:text-white">${dict.inboxTitle}</h3>
          <p class="text-[10px] text-slate-500 dark:text-slate-400">${dict.inboxSubtitle} · <strong class="text-emerald-600 dark:text-emerald-400">${state.buyerConnections} ${state.lang === 'en' ? 'connections left' : 'bağlantı kaldı'}</strong></p>
        </div>
      </div>

      <button id="close-inbox-btn" class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all">
        <i class="ph-bold ph-x text-base"></i>
      </button>
    </div>

    <!-- Multi-Thread Conversation Switcher List -->
    <div class="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60 overflow-x-auto flex items-center gap-2 no-scrollbar">
      ${state.messages.map(thread => `
        <button data-thread-id="${thread.id}" class="thread-tab-btn flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
          thread.id === activeThread.id
            ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
        }">
          <img src="${thread.partnerAvatar}" class="w-5 h-5 rounded-full object-cover">
          <span class="truncate max-w-[100px]">${thread.partnerName}</span>
          ${thread.unread ? `<span class="w-2 h-2 rounded-full bg-emerald-400"></span>` : ''}
        </button>
      `).join('')}
    </div>

    <!-- Safety Warning Banner -->
    <div class="p-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
      <i class="ph-bold ph-shield-warning text-base text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0"></i>
      <div>
        <strong>${dict.inboxSafetyTitle}</strong> ${dict.inboxSafetyText}
      </div>
    </div>

    <!-- Active Chat Partner Header Bar -->
    <div class="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#0D131F]">
      <div class="flex items-center gap-2.5">
        <img src="${activeThread.partnerAvatar}" class="w-7 h-7 rounded-full object-cover border border-slate-300 dark:border-slate-700">
        <div>
          <h4 class="text-xs font-bold text-slate-900 dark:text-white">${activeThread.partnerName}</h4>
          <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">${activeThread.projectTitle} (${activeThread.askingPrice})</span>
        </div>
      </div>
      <span class="text-[10px] text-slate-400 font-medium">${state.lang === 'en' ? 'Active Handshake' : 'Aktif Görüşme'}</span>
    </div>

    <!-- Scrollable Messages Box -->
    <div class="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-[#080C14]/50" id="chat-messages-box">
      ${activeThread.messages.map(msg => `
        <div class="flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}">
          <div class="max-w-[85%] p-3 rounded-2xl text-xs font-normal ${
            msg.sender === 'me' 
              ? 'bg-emerald-600 text-white rounded-br-none shadow-sm' 
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700 shadow-sm'
          }">
            ${state.lang === 'en' ? (msg.textEn || msg.text) : msg.text}
          </div>
          <span class="text-[9px] text-slate-400 mt-1 px-1">${msg.time}</span>
        </div>
      `).join('')}
    </div>

    <!-- Send Message Form -->
    <form id="dm-send-form" class="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2 bg-white dark:bg-[#0D131F]">
      <input type="text" id="dm-input" required placeholder="${dict.inboxPlaceholder}" class="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500">
      <button type="submit" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center shadow-md">
        <i class="ph-bold ph-paper-plane-right text-base"></i>
      </button>
    </form>
  `;

  document.getElementById('close-inbox-btn')?.addEventListener('click', toggleInboxDrawer);

  document.querySelectorAll('.thread-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeThreadId = btn.dataset.threadId;
      renderInboxDrawerContent();
    });
  });

  const chatBox = document.getElementById('chat-messages-box');
  if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;

  document.getElementById('dm-send-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('dm-input');
    const text = input ? input.value.trim() : '';
    if (!text) return;

    activeThread.messages.push({
      sender: "me",
      text: text,
      textEn: text,
      time: state.lang === 'en' ? "Just now" : "Şimdi"
    });
    if (input) input.value = '';
    renderInboxDrawerContent();

    setTimeout(() => {
      activeThread.messages.push({
        sender: "them",
        text: state.lang === 'en' ? "Thanks for reaching out! Could you share your email so I can invite you to the private GitHub repo?" : "Mesajınız için teşekkürler! GitHub reposu daveti için e-posta adresinizi paylaşır mısınız?",
        textEn: "Thanks for reaching out! Could you share your email so I can invite you to the private GitHub repo?",
        time: state.lang === 'en' ? "Just now" : "Şimdi"
      });
      renderInboxDrawerContent();
    }, 1200);
  });
}

// Toast Notifications
function showToast(message) {
  const container = el.toastContainer();
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 flex items-center gap-2 animate-fade-in pointer-events-auto';
  toast.innerHTML = `<i class="ph-bold ph-check-circle text-emerald-400 text-base"></i> <span>${message}</span>`;
  
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// Dedicated Full-Screen Onboarding & Auth Card Manager
let authMode = 'login'; // 'login' | 'register'
let authRole = 'buyer';

function showOnboardingPage(mode = 'login') {
  authMode = mode === 'register' || mode === 1 ? 'register' : 'login';
  const obView = document.getElementById('onboarding-fullview');
  const mainView = document.getElementById('main-app-view');

  if (obView && mainView) {
    obView.classList.remove('hidden');
    obView.classList.add('flex');
    document.body.classList.add('onboarding-open');
  }

  renderAuthCard();
  window.setTimeout(() => document.getElementById('auth-email')?.focus(), 50);
}

function showMainAppPage(scrollToListings = false) {
  const obView = document.getElementById('onboarding-fullview');
  const mainView = document.getElementById('main-app-view');

  if (obView && mainView) {
    obView.classList.add('hidden');
    obView.classList.remove('flex');
    mainView.classList.remove('hidden');
    mainView.classList.add('flex-col');
    document.body.classList.remove('onboarding-open');
    
    if (scrollToListings) {
      setTimeout(() => {
        const grid = document.getElementById('listings-grid');
        if (grid) grid.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }
}

function renderAuthCard() {
  const isEn = state.lang === 'en';
  const titleEl = document.getElementById('t-ob-card-title');
  const subEl = document.getElementById('t-ob-card-sub');
  const tabLogin = document.getElementById('ob-tab-login');
  const tabReg = document.getElementById('ob-tab-register');
  const formContainer = document.getElementById('ob-form-fields-container');

  if (!formContainer) return;

  const activeTabStyle = "py-2.5 rounded-xl font-extrabold text-xs transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm";
  const inactiveTabStyle = "py-2.5 rounded-xl font-semibold text-xs transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white";

  if (authMode === 'login') {
    if (titleEl) titleEl.textContent = isEn ? "Welcome to Searya! 👋" : "Searya'ya Hoş Geldiniz! 👋";
    if (subEl) subEl.textContent = isEn ? "Don't have an account? Sign up for free." : "Hesabınız yok mu? Hemen ücretsiz kayıt olun.";
    if (tabLogin) tabLogin.className = activeTabStyle;
    if (tabReg) tabReg.className = inactiveTabStyle;

    formContainer.innerHTML = `
      <form id="auth-form" class="space-y-4" onsubmit="return false;">
        <div>
          <label class="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1.5">${isEn ? 'Email Address' : 'E-posta adresi'}</label>
          <div class="relative">
            <i class="ph-bold ph-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base"></i>
            <input type="email" id="auth-email" placeholder="ornek@email.com" class="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-600 transition-colors">
          </div>
        </div>

        <div>
          <label class="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1.5">${isEn ? 'Password' : 'Şifre'}</label>
          <div class="relative">
            <i class="ph-bold ph-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base"></i>
            <input type="password" id="auth-password" placeholder="${isEn ? 'Enter password' : 'Şifrenizi girin'}" class="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-600 transition-colors">
            <button type="button" id="toggle-pw-btn" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <i class="ph-bold ph-eye text-base"></i>
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between text-xs pt-1">
          <label class="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 font-medium">
            <input type="checkbox" checked class="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500">
            <span>${isEn ? 'Keep me logged in' : 'Oturumu açık tut'}</span>
          </label>
          <a href="#" class="font-bold text-purple-600 dark:text-purple-400 hover:underline">${isEn ? 'Forgot password?' : 'Şifremi unuttum?'}</a>
        </div>

        <button type="button" id="auth-submit-btn" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/25 transition-all transform active:scale-95 cursor-pointer">
          ${isEn ? 'Log In' : 'Giriş Yap'}
        </button>
      </form>
    `;
  } else {
    if (titleEl) titleEl.textContent = isEn ? "Create Your Account 🚀" : "Hesabınızı Oluşturun 🚀";
    if (subEl) subEl.textContent = isEn ? "Already registered? Switch to Login." : "Zaten hesabınız var mı? Giriş yapın.";
    if (tabReg) tabReg.className = activeTabStyle;
    if (tabLogin) tabLogin.className = inactiveTabStyle;

    formContainer.innerHTML = `
      <form id="auth-form" class="space-y-4" onsubmit="return false;">
        <div>
          <label class="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1.5">${isEn ? 'Full Name' : 'Ad Soyad'}</label>
          <div class="relative">
            <i class="ph-bold ph-user absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base"></i>
            <input type="text" id="auth-fullname" placeholder="${isEn ? 'Enter your full name' : 'Adınızı ve soyadınızı girin'}" class="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-600 transition-colors">
          </div>
        </div>

        <div>
          <label class="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1.5">${isEn ? 'Email Address' : 'E-posta adresi'}</label>
          <div class="relative">
            <i class="ph-bold ph-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base"></i>
            <input type="email" id="auth-email" placeholder="ornek@email.com" class="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-600 transition-colors">
          </div>
        </div>

        <div>
          <label class="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1.5">${isEn ? 'Password' : 'Şifre'}</label>
          <div class="relative">
            <i class="ph-bold ph-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base"></i>
            <input type="password" id="auth-password" placeholder="${isEn ? 'Min 8 characters' : 'Şifrenizi girin (min 8 karakter)'}" class="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-600 transition-colors">
            <button type="button" id="toggle-pw-btn" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <i class="ph-bold ph-eye text-base"></i>
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1.5">${isEn ? 'Profile Role' : 'Profil Tipi'}</label>
          <div class="grid grid-cols-3 gap-2">
            <button type="button" data-role="buyer" class="auth-role-btn py-2 rounded-xl border-2 text-xs font-bold transition-all ${authRole === 'buyer' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}">🟢 ${isEn ? 'Buyer' : 'Alıcı'}</button>
            <button type="button" data-role="seller" class="auth-role-btn py-2 rounded-xl border-2 text-xs font-bold transition-all ${authRole === 'seller' ? 'border-purple-500 bg-purple-500/10 text-purple-600' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}">🟣 ${isEn ? 'Seller' : 'Satıcı'}</button>
            <button type="button" data-role="both" class="auth-role-btn py-2 rounded-xl border-2 text-xs font-bold transition-all ${authRole === 'both' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}">⚡ ${isEn ? 'Both' : 'İkisi de'}</button>
          </div>
        </div>

        <button type="button" id="auth-submit-btn" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
          <span>${isEn ? 'Sign Up & Get 2 Free Connections 🎉' : 'Kayıt Ol & 2 Ücretsiz Bağlantı Kazan 🎉'}</span>
        </button>
      </form>
    `;

    document.querySelectorAll('.auth-role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        authRole = btn.dataset.role;
        renderAuthCard();
      });
    });
  }

  // Password toggle
  document.getElementById('toggle-pw-btn')?.addEventListener('click', () => {
    const input = document.getElementById('auth-password');
    if (input) input.type = input.type === 'password' ? 'text' : 'password';
  });

  // Direct Button Click Listener (Executes 100% reliably)
  document.getElementById('auth-submit-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    showToast(authMode === 'login' ? (isEn ? "Welcome back!" : "Başarıyla giriş yapıldı!") : (isEn ? "Registration successful!" : "Kayıt başarıyla tamamlandı!"));
    showMainAppPage();
  });

  // Form Submit Listener (Enter Key)
  document.getElementById('auth-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast(authMode === 'login' ? (isEn ? "Welcome back!" : "Başarıyla giriş yapıldı!") : (isEn ? "Registration successful!" : "Kayıt başarıyla tamamlandı!"));
    showMainAppPage();
  });

  // Social Auth Buttons Click Listeners
  document.querySelectorAll('.social-auth-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showToast(isEn ? "Successfully connected via social login!" : "Sosyal hesapla başarıyla giriş yapıldı!");
      showMainAppPage();
    });
  });
}
