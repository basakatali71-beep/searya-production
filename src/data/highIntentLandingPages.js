export const HIGH_INTENT_LANDING_PAGES = Object.freeze({
  '/buy-micro-saas-under-5000': {
    intent: true, title: 'Buy Micro SaaS Under $5,000 | Searya',
    description: 'Explore owner-listed micro SaaS projects below $5,000 with 0% marketplace commission and direct founder messaging.',
    h1: 'Buy Micro SaaS Projects Under $5,000',
    intro: 'Explore focused SaaS products with asking prices below $5,000, compare what is included and speak directly with each founder before deciding whether to proceed.',
    kicker: 'Affordable micro SaaS opportunities', category: 'saas', maxPriceCents: 500000, listingTitle: 'SaaS projects with asking prices below $5,000',
    explanation: 'A lower asking price does not remove the need for careful review. Confirm source-code ownership, hosting costs, customer obligations, third-party licenses and the exact assets included. Revenue may be absent or unverified, so ask for evidence and test the product directly.',
    related: ['/micro-saas-for-sale', '/saas-projects-for-sale-by-owner', '/guides/how-to-buy-a-small-saas'],
    faqs: [
      ['Are all projects on this page priced below $5,000?', 'The page filters current approved SaaS listings by their published asking price. Owners can update listings, so confirm the current price directly before making decisions.'],
      ['Does a low asking price mean a project is low risk?', 'No. Code quality, ownership, operating costs, customer obligations and transfer restrictions still require independent due diligence.'],
      ['Can I message the SaaS founder directly?', 'Yes. Searya enables direct conversations with project owners and does not act as a broker in the transaction.'],
      ['Does Searya charge a sale commission?', 'Searya does not process the acquisition and currently charges no marketplace commission on an independently arranged transaction.']
    ]
  },
  '/saas-projects-for-sale-by-owner': {
    intent: true, title: 'SaaS Projects for Sale by Owner | Searya',
    description: 'Discover owner-listed SaaS projects with 0% marketplace commission and direct founder messaging.',
    h1: 'SaaS Projects for Sale Directly by Owners',
    intro: 'Browse SaaS opportunities published by project owners, review the available evidence and start a direct founder-to-buyer conversation without an intermediary.',
    kicker: 'Founder-listed SaaS', category: 'saas', listingTitle: 'SaaS projects listed by owners',
    explanation: 'Direct owner contact can make technical and operational questions easier to answer, but it is not a substitute for verification. Ask who owns the code, domain and brand; inspect infrastructure and recurring costs; and document every asset that would be included in a potential transfer.',
    related: ['/saas-for-sale', '/buy-micro-saas-under-5000', '/sell-saas-without-commission'],
    faqs: [
      ['Are listings posted by project owners?', 'Searya listings identify the account responsible for the project. Buyers should still verify identity, authority and ownership before proceeding.'],
      ['Can I ask the founder technical questions?', 'Yes. Direct messaging is designed for questions about the product, technology, customers, costs and possible transfer scope.'],
      ['Does Searya negotiate for either party?', 'No. Searya provides discovery and messaging; users handle negotiation, contracts, payment and transfer independently.'],
      ['What evidence should I request?', 'Relevant evidence may include a working demonstration, repository access, analytics, billing records, infrastructure details and proof of asset ownership.']
    ]
  },
  '/buy-source-code-from-developers': {
    intent: true, title: 'Buy Source Code Directly From Developers | Searya',
    description: 'Buy source-code projects with 0% marketplace commission and direct developer messaging. Review ownership, technology and transfer scope.',
    h1: 'Buy Project Source Code Directly From Developers',
    intro: 'Discover software projects from their builders, compare technology stacks and ask direct questions about code quality, documentation, licensing and included assets.',
    kicker: 'Developer-owned projects', category: 'all', listingTitle: 'Projects available for direct technical review',
    explanation: 'Before acquiring source code, inspect repository history, dependencies, licenses, secrets handling, deployment instructions and automated tests. Confirm that the seller owns or can legally transfer every component and that third-party accounts can be migrated to buyer-controlled services.',
    related: ['/mobile-apps-with-source-code-for-sale', '/chrome-extension-business-for-sale', '/guides/digital-project-handover-checklist'],
    faqs: [
      ['Does every listing include source code?', 'Not automatically. Read the listing and ask the owner to state precisely which repositories, branches, documentation and deployment assets are included.'],
      ['Can I inspect private code before an agreement?', 'That depends on the owner and the stage of due diligence. Parties may use staged access, demonstrations or confidentiality terms they arrange independently.'],
      ['Does Searya verify code quality?', 'No. Buyers should conduct their own technical review or engage a qualified reviewer before making a commitment.'],
      ['How is code transferred?', 'The parties determine the repository, account and credential migration process outside Searya and should document acceptance checks.']
    ]
  },
  '/sell-saas-without-commission': {
    intent: true, seller: true, title: 'Sell a SaaS Without Marketplace Commission | Searya',
    description: 'List your SaaS, reach potential buyers and message directly with 0% marketplace commission during Searya’s free launch.',
    h1: 'Sell Your SaaS Without Marketplace Commission',
    intro: 'Publish an accurate SaaS listing, become discoverable to potential buyers and handle conversations directly without paying Searya a percentage of an independently arranged sale.',
    kicker: '0% commission SaaS listings', category: 'saas', listingTitle: 'People currently looking for SaaS projects', cta: 'List Your SaaS',
    explanation: 'A credible SaaS listing should explain the customer problem, product stage, technology, recurring costs, revenue status and included assets. Avoid unsupported claims. Clear limitations and evidence create better conversations than inflated projections.',
    related: ['/sell-your-saas', '/saas-projects-for-sale-by-owner', '/where-to-sell-a-side-project'],
    faqs: [
      ['What does 0% commission mean?', 'Searya does not take a percentage of a transaction arranged independently between users. Searya is not the payment processor, escrow provider or contracting party.'],
      ['Can I list a pre-revenue SaaS?', 'Yes. State that it is pre-revenue and describe the working product, users, validation and unfinished work accurately.'],
      ['What should I prepare before listing?', 'Prepare a product summary, technology overview, included-asset list, evidence you can share privately and a realistic asking price.'],
      ['Does a listing guarantee a buyer?', 'No. A listing improves discoverability and enables direct contact, but Searya cannot guarantee inquiries, offers or a sale.']
    ]
  },
  '/zero-commission-startup-marketplace': {
    intent: true, title: '0% Commission Startup Marketplace | Searya',
    description: 'Explore founder-listed SaaS, apps and digital projects with direct messaging and zero marketplace commission.',
    h1: 'A 0% Commission Marketplace for Startup Projects',
    intro: 'Discover SaaS products, mobile apps, AI tools and other digital projects while communicating directly with the people who built or own them.',
    kicker: 'Direct digital-project discovery', category: 'all', listingTitle: 'Startup and digital projects from their owners',
    explanation: 'Zero marketplace commission means Searya does not take a percentage of an independently arranged transaction. It does not mean a project is free, verified or risk-free. Buyers and sellers remain responsible for identity checks, due diligence, contracts, payment and transfer.',
    related: ['/direct-founder-marketplace', '/saas-projects-for-sale-by-owner', '/sell-your-digital-project'],
    faqs: [
      ['Are the projects free?', 'No. Each sale listing has its own asking price. Zero commission refers only to Searya not taking a percentage of an independently arranged transaction.'],
      ['Does Searya process payments?', 'No. Users arrange payment, contracts and transfer outside Searya after completing their own checks.'],
      ['Can both buyers and sellers post listings?', 'Yes. Owners can list projects for sale and interested buyers can publish Looking to Buy requests.'],
      ['Does Searya guarantee listing claims?', 'No. Users must independently verify identity, ownership, product condition, financial claims and transferability.']
    ]
  },
  '/buy-chrome-extension-business': {
    intent: true, title: 'Buy a Chrome Extension Business | Searya',
    description: 'Discover Chrome extension projects with 0% marketplace commission and direct owner messaging about code, users and transfer details.',
    h1: 'Buy a Chrome Extension Project or Business',
    intro: 'Explore browser-extension opportunities, review their technology and use cases, and message owners directly before conducting technical and policy due diligence.',
    kicker: 'Chrome extension acquisitions', category: 'extension', listingTitle: 'Chrome extension projects from their owners',
    explanation: 'Review Manifest version, requested permissions, store-policy history, privacy disclosures, active users and external services. Confirm whether the store listing, domain, code, analytics and back-end resources can be transferred under current platform rules.',
    related: ['/chrome-extensions-for-sale', '/buy-source-code-from-developers', '/guides/digital-project-handover-checklist'],
    faqs: [
      ['Can a Chrome Web Store listing be transferred?', 'Platform policies can change. Verify the current Chrome Web Store process and seller eligibility before agreeing to a transfer.'],
      ['What extension metrics should I verify?', 'Review active users, retention, ratings, permission changes, support history, analytics quality and any revenue evidence directly.'],
      ['Are browser permissions important?', 'Yes. Excessive or poorly justified permissions can create privacy, security and store-compliance risks.'],
      ['Does Searya approve the transaction?', 'No. Searya helps users discover each other and communicate; the parties make independent decisions.']
    ]
  },
  '/mobile-apps-with-source-code-for-sale': {
    intent: true, title: 'Mobile Apps With Source Code for Sale | Searya',
    description: 'Explore mobile apps with source code, 0% marketplace commission and direct owner messaging about included code and assets.',
    h1: 'Mobile Apps With Source Code for Sale',
    intro: 'Discover mobile app projects, compare their stacks and ask project owners directly about repositories, designs, back ends and store assets.',
    kicker: 'Transferable mobile projects', category: 'mobile', listingTitle: 'Mobile app projects available for review',
    explanation: 'Source code is only one part of a mobile app transfer. Confirm signing keys, bundle identifiers, developer-account restrictions, API credentials, back-end services, privacy obligations, design files and deployment documentation.',
    related: ['/mobile-apps-for-sale', '/buy-source-code-from-developers', '/sell-your-app'],
    faqs: [
      ['Is source code included in every mobile listing?', 'Not necessarily. Ask the owner to identify every repository, platform build and supporting service included in the proposed transfer.'],
      ['Should I test the app before proceeding?', 'Yes. Test available builds and core workflows, then review crash data, store status, dependencies and code quality.'],
      ['Can developer accounts be transferred?', 'Account and app-transfer rules vary by platform. Check current Apple and Google requirements independently.'],
      ['Does Searya provide escrow?', 'No. Searya provides discovery and messaging, while users arrange contracts, payments and handover independently.']
    ]
  },
  '/notion-templates-for-sale-marketplace': {
    intent: true, title: 'Notion Templates for Sale Marketplace | Searya',
    description: 'Discover Notion template products with 0% marketplace commission and direct creator messaging about assets and transfer rights.',
    h1: 'Discover Notion Templates and Template Businesses for Sale',
    intro: 'Explore Notion-based digital products, understand what each opportunity includes and contact creators directly about content, brand and distribution assets.',
    kicker: 'Notion template opportunities', category: 'notion', listingTitle: 'Notion templates and related digital products',
    explanation: 'Evaluate the originality and ownership of the template, connected assets, documentation, customer files and distribution channels. Confirm whether branding, domains, social accounts and historical customer obligations are part of the proposed scope.',
    related: ['/zero-commission-startup-marketplace', '/buy-source-code-from-developers', '/sell-your-digital-project'],
    faqs: [
      ['What can a Notion template project include?', 'It may include the template, documentation, brand assets, domains, audience channels and related files, but the owner must specify the scope.'],
      ['Should I verify content ownership?', 'Yes. Confirm that the seller created or holds transferable rights to all text, images, databases and brand assets.'],
      ['Are customer lists automatically transferable?', 'No. Privacy laws, consent and platform terms may restrict customer-data transfers. Obtain appropriate professional advice.'],
      ['Can I message the creator before deciding?', 'Yes. Searya supports direct messaging so interested users can ask project-specific questions.']
    ]
  },
  '/where-to-sell-a-side-project': {
    intent: true, seller: true, title: 'Where to Sell a Side Project | Searya',
    description: 'List your side project with 0% marketplace commission and connect directly with potential buyers.',
    h1: 'Where to Sell Your Side Project Directly',
    intro: 'Give an unused or completed side project a clear public listing and let potential buyers contact you directly about its product, code and included assets.',
    kicker: 'A marketplace for side projects', category: 'all', listingTitle: 'What buyers are looking for now', cta: 'List Your Side Project',
    explanation: 'A useful side-project listing explains what works today, why the product exists, the technology used, known limitations and the assets included. Be honest about revenue and usage rather than estimating figures you cannot substantiate.',
    related: ['/sell-your-digital-project', '/sell-saas-without-commission', '/guides/how-to-sell-a-side-project'],
    faqs: [
      ['Can I list a side project with no users?', 'Yes. Describe its actual stage, working features and remaining work without implying traction that does not exist.'],
      ['Can I sell code I built for a previous client?', 'Only if you own the transferable rights. Review contracts and intellectual-property obligations before listing anything.'],
      ['How do potential buyers contact me?', 'Signed-in users can start a direct conversation from the public listing.'],
      ['Does Searya complete the sale?', 'No. Searya is a discovery and messaging platform; users arrange verification, agreements, payment and transfer themselves.']
    ]
  },
  '/direct-founder-marketplace': {
    intent: true, title: 'Direct Founder Marketplace for Digital Projects | Searya',
    description: 'Connect directly with founders selling SaaS, apps and source-code projects through a 0% commission digital-project marketplace.',
    h1: 'A Direct Founder-to-Buyer Marketplace for Digital Projects',
    intro: 'Discover digital products from their owners and ask direct questions about the product, technology, evidence and possible transfer scope.',
    kicker: 'Founder-to-buyer messaging', category: 'all', listingTitle: 'Projects available for direct owner conversations',
    explanation: 'Direct messaging reduces communication layers but does not remove transaction risk. Confirm identity and ownership, review technical and commercial evidence, use written agreements and choose an appropriate independent payment method.',
    related: ['/zero-commission-startup-marketplace', '/saas-projects-for-sale-by-owner', '/buy-source-code-from-developers'],
    faqs: [
      ['Can I speak directly with a project founder?', 'Yes. Listings are designed to let interested users start project-specific conversations with the responsible owner account.'],
      ['Is Searya a broker?', 'No. Searya provides marketplace discovery and messaging but does not negotiate, collect transaction commission or represent either party.'],
      ['Does direct messaging make a transaction safe?', 'No. Users still need to verify identity, ownership, code, claims, contracts, payment arrangements and transfer completion independently.'],
      ['Can buyers publish requirements?', 'Yes. Looking to Buy listings let buyers describe desired categories, budgets, technologies and project stages.']
    ]
  }
});

export default HIGH_INTENT_LANDING_PAGES;
