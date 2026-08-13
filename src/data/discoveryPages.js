export const DISCOVERY_INDEX_THRESHOLD = 3;

export const DISCOVERY_PAGES = Object.freeze({
  'nextjs-saas-projects': {
    title: 'Next.js SaaS Projects | Discover Projects on Searya',
    description: 'Explore SaaS projects built with Next.js and connect directly with project owners on Searya.',
    h1: 'Next.js SaaS Projects',
    intro: 'Explore public SaaS projects whose owners identify Next.js in the technology stack. Review the product, operating context and transferable assets before starting a direct conversation.',
    category: 'saas', tech: ['next.js', 'next.js 14'],
    explanation: 'Next.js can support server-rendered product interfaces, API routes and full-stack SaaS workflows. Its presence does not establish code quality or deployment readiness, so ask how the application is structured, hosted and maintained.',
    buyerGuidance: 'Request a working demonstration, repository overview, deployment instructions and a list of external services. Confirm the framework version and estimate any upgrade work.',
    related: ['nodejs-saas-projects', 'supabase-saas-projects', 'vue-saas-projects'],
    guides: ['/guides/how-to-buy-a-small-saas', '/guides/what-to-check-before-buying-a-saas']
  },
  'react-saas-projects': {
    title: 'React SaaS Projects | Discover Projects on Searya',
    description: 'Explore SaaS projects that list React in their technology stack and contact project owners directly on Searya.',
    h1: 'React SaaS Projects',
    intro: 'Browse public SaaS listings whose owners explicitly include React in the project technology stack. Compare the working product and transfer scope rather than treating a framework label as proof of quality.',
    category: 'saas', tech: ['react'],
    explanation: 'React projects can vary from focused single-page tools to complex subscription applications. The useful questions concern architecture, state management, backend dependencies, tests and the path to production.',
    buyerGuidance: 'Confirm which repository contains the production interface, how releases are built and whether important components depend on non-transferable licences or accounts.',
    related: ['nextjs-saas-projects', 'nodejs-saas-projects', 'vue-saas-projects'],
    guides: ['/guides/how-to-buy-a-small-saas']
  },
  'nodejs-saas-projects': {
    title: 'Node.js SaaS Projects | Explore Software Projects | Searya',
    description: 'Discover SaaS projects built with Node.js, review public listing details and connect directly with their owners on Searya.',
    h1: 'Node.js SaaS Projects',
    intro: 'Discover public SaaS projects whose owners list Node.js in their technology stack. Use each listing to understand the product, then verify architecture and operations directly with the owner.',
    category: 'saas', tech: ['node.js'],
    explanation: 'Node.js is commonly used for APIs, background jobs and complete web products. Buyers should understand runtime versions, package maintenance, queues, database access and how production incidents are handled.',
    buyerGuidance: 'Ask for reproducible setup and deployment steps, dependency and security checks, monitoring details and a realistic account of recurring maintenance.',
    related: ['nextjs-saas-projects', 'vue-saas-projects', 'supabase-saas-projects'],
    guides: ['/guides/how-to-buy-a-small-saas', '/guides/what-to-check-before-buying-a-saas']
  },
  'vue-saas-projects': {
    title: 'Vue SaaS Projects | Discover Software Opportunities | Searya',
    description: 'Explore SaaS projects built with Vue and connect directly with project owners through Searya.',
    h1: 'Vue SaaS Projects',
    intro: 'Explore active public SaaS listings whose technology stack includes Vue. Review the real inventory currently available and contact owners directly when a project fits your goals.',
    category: 'saas', tech: ['vue', 'vue 3'],
    explanation: 'Vue can power focused dashboards and larger web applications. Check the version, component system, build tooling, backend relationship and documentation before deciding how easily a project can be operated.',
    buyerGuidance: 'Review a live build and the repository structure. Confirm how authentication, data fetching, deployments and upgrades work, and identify any founder-only operational knowledge.',
    related: ['nodejs-saas-projects', 'nextjs-saas-projects', 'supabase-saas-projects'],
    guides: ['/guides/how-to-buy-a-small-saas']
  },
  'supabase-saas-projects': {
    title: 'Supabase SaaS Projects | Discover Projects on Searya',
    description: 'Browse SaaS projects using Supabase and speak directly with their owners on Searya.',
    h1: 'Supabase SaaS Projects',
    intro: 'Browse public SaaS projects whose owners list Supabase in their current technology stack. Explore the product first, then verify database, authentication and infrastructure details directly.',
    category: 'saas', tech: ['supabase'],
    explanation: 'A Supabase project may depend on hosted databases, authentication, storage, functions and security policies. Transfer planning should cover project ownership, data, secrets, quotas and a tested migration or account handover.',
    buyerGuidance: 'Inspect row-level security, backups, function deployments, storage rules and external integrations. Confirm how user data can lawfully and safely transfer.',
    related: ['nextjs-saas-projects', 'nodejs-saas-projects', 'vue-saas-projects'],
    guides: ['/guides/what-to-check-before-buying-a-saas']
  },
  'flutter-mobile-apps': {
    title: 'Flutter Mobile Apps | Discover App Projects | Searya',
    description: 'Explore mobile app projects built with Flutter and connect directly with their owners on Searya.',
    h1: 'Flutter Mobile App Projects',
    intro: 'Explore public mobile app listings whose owners identify Flutter in the technology stack. Compare working products, store status and transfer scope before contacting an owner.',
    category: 'mobile', tech: ['flutter'],
    explanation: 'Flutter supports cross-platform app development, but each project still has platform-specific signing, store, notification and backend requirements. Verify what currently builds and ships on each target platform.',
    buyerGuidance: 'Request clean build instructions, supported Flutter and Dart versions, signing details, store status, backend dependencies and a complete list of transferable assets.',
    related: ['react-native-mobile-apps', 'firebase-mobile-apps'],
    guides: ['/guides/buy-app-vs-build-from-scratch', '/guides/how-to-sell-an-app']
  },
  'react-native-mobile-apps': {
    title: 'React Native Mobile Apps | Discover App Projects | Searya',
    description: 'Discover mobile app projects using React Native and contact their project owners directly on Searya.',
    h1: 'React Native Mobile App Projects',
    intro: 'Browse public mobile listings whose owners explicitly include React Native in the technology stack. Review the current app and verify native dependencies before starting a conversation.',
    category: 'mobile', tech: ['react native'],
    explanation: 'React Native can share product code across platforms while retaining native build and module requirements. Assess package health, platform differences and store readiness rather than relying on the cross-platform label alone.',
    buyerGuidance: 'Check clean iOS and Android builds, native modules, signing, push notifications, store records and whether an Expo or bare workflow is used.',
    related: ['flutter-mobile-apps', 'firebase-mobile-apps'],
    guides: ['/guides/buy-app-vs-build-from-scratch']
  },
  'firebase-mobile-apps': {
    title: 'Firebase Mobile Apps | Explore App Projects | Searya',
    description: 'Explore mobile app projects using Firebase and connect directly with their owners through Searya.',
    h1: 'Firebase Mobile App Projects',
    intro: 'Explore public mobile app listings whose owners list Firebase in the technology stack. Review the app, backend usage and current operating requirements with the owner.',
    category: 'mobile', tech: ['firebase'],
    explanation: 'Firebase may support authentication, databases, functions, analytics and notifications. Buyers need to understand which services are active, how security rules work and how the cloud project can transfer.',
    buyerGuidance: 'Inspect billing, usage, rules, indexes, functions, service accounts, backups and connected mobile apps. Plan credential rotation and ownership changes before handover.',
    related: ['flutter-mobile-apps', 'react-native-mobile-apps'],
    guides: ['/guides/how-to-sell-an-app', '/guides/buy-app-vs-build-from-scratch']
  },
  'python-ai-tools': {
    title: 'Python AI Tools & Projects | Discover on Searya',
    description: 'Discover AI tools built with Python, review real public listings and speak directly with project owners on Searya.',
    h1: 'Python AI Tools & Projects',
    intro: 'Discover public AI tool listings whose owners identify Python in the technology stack. Explore what each product currently does and verify its model, data and infrastructure dependencies directly.',
    category: 'ai', tech: ['python'],
    explanation: 'Python AI products can depend on model providers, data pipelines, task queues and compute-heavy services. The language alone does not describe operating cost, reliability or model ownership.',
    buyerGuidance: 'Request architecture and deployment details, model and dataset rights, dependency versions, API costs, evaluation methods and known reliability limitations.',
    related: ['openai-api-projects', 'nextjs-ai-tools'],
    guides: ['/guides/what-to-check-before-buying-a-saas']
  },
  'openai-api-projects': {
    title: 'OpenAI API Projects | Discover AI Tools on Searya',
    description: 'Explore AI tool projects using the OpenAI API and connect directly with their owners through Searya.',
    h1: 'OpenAI API Projects',
    intro: 'Explore public AI tool listings whose owners explicitly identify the OpenAI API in their technology stack. Review the user workflow and understand the external model dependency before contacting an owner.',
    category: 'ai', tech: ['openai api'],
    explanation: 'An OpenAI API integration can provide important product capability while leaving model access, cost, limits and reliability outside the project owner’s control. Confirm what is proprietary and what depends on the provider.',
    buyerGuidance: 'Inspect prompt and workflow design, usage economics, safety controls, fallbacks, data handling and the process for moving to a buyer-owned API account.',
    related: ['python-ai-tools', 'nextjs-ai-tools'],
    guides: ['/guides/what-to-check-before-buying-a-saas']
  },
  'nextjs-ai-tools': {
    title: 'Next.js AI Tools & Projects | Discover on Searya',
    description: 'Browse AI tools built with Next.js and connect directly with project owners on Searya.',
    h1: 'Next.js AI Tools & Projects',
    intro: 'Browse active public AI tool listings whose owners include Next.js in the technology stack. Compare product use cases and verify both application and model dependencies directly.',
    category: 'ai', tech: ['next.js', 'next.js 14'],
    explanation: 'Next.js may provide the product interface and server layer while core AI behaviour relies on separate APIs, models or data services. Review both halves of the system and their costs.',
    buyerGuidance: 'Ask for a live demonstration, deployment and environment documentation, external provider details, usage costs and an explanation of how failures or rate limits are handled.',
    related: ['openai-api-projects', 'python-ai-tools', 'nextjs-saas-projects'],
    guides: ['/guides/how-to-buy-a-small-saas']
  },
  'chrome-extension-projects': {
    title: 'Chrome Extension Projects | Discover Opportunities | Searya',
    description: 'Explore public Chrome extension projects and connect directly with their owners through Searya.',
    h1: 'Chrome Extension Projects',
    intro: 'Explore active public Chrome extension listings from their project owners. Compare use cases, technology and store status, then start a direct conversation when a project interests you.',
    category: 'extension',
    explanation: 'Chrome extensions can involve sensitive browser permissions, store policies, privacy disclosures and external services. Confirm the manifest version, requested permissions and transfer path.',
    buyerGuidance: 'Review source ownership, Manifest V3 compatibility, store history, permissions, data handling, active users and every account or service needed to keep the extension working.',
    related: ['nextjs-saas-projects', 'nextjs-ai-tools'],
    guides: ['/guides/how-to-find-buyers-for-a-digital-project', '/legal/transfer-checklist.html']
  }
});

