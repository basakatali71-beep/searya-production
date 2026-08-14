const CATEGORY_LABELS = Object.freeze({
  saas: 'SaaS',
  mobile: 'Mobile App',
  ai: 'AI Tool',
  extension: 'Chrome Extension',
  notion: 'Notion Template',
  'ui-kit': 'UI Kit',
  api: 'Developer API'
});

const maleNames = [
  'Alex Rivera', 'Marcus Chen', 'David Miller', 'Ethan Brooks', 'Noah Bennett',
  'Liam Parker', 'Jordan Reed', 'Caleb Foster', 'Owen Carter', 'Mason Hayes',
  'Lucas Morgan', 'Henry Collins', 'Daniel Kim', 'Ryan Mitchell', 'Jack Sullivan',
  'Nathan Cooper', 'Adrian Torres', 'Julian Wright', 'Connor Evans', 'Isaac Turner',
  'Miles Anderson', 'Aaron Patel', 'Samuel Grant', 'Dylan Murphy', 'Leo Thompson',
  'Gabriel Scott', 'Thomas Walker', 'Andrew Lewis', 'Benjamin Clark', 'Cameron Price',
  'Nicholas Baker', 'Jonathan Hall', 'Christopher Young', 'Matthew Adams', 'Adam Nelson',
  'Charles Robinson', 'Austin Campbell', 'Robert Phillips', 'Kevin Martinez', 'Jason Wood',
  'Eric Hughes', 'Patrick Ward', 'Brandon Cox', 'Tyler Richardson', 'Justin Bailey',
  'Ian Russell', 'Cole Howard', 'Blake Peterson', 'Maxwell Gray', 'Victor Ramirez'
];

const femaleNames = [
  'Sarah Jenkins', 'Emily Watson', 'Olivia Bennett', 'Maya Thompson', 'Chloe Morgan',
  'Avery Collins', 'Grace Parker', 'Natalie Foster', 'Sophie Carter', 'Ella Hayes',
  'Madison Reed', 'Hannah Brooks', 'Zoe Mitchell', 'Claire Sullivan', 'Lily Cooper',
  'Audrey Torres', 'Julia Wright', 'Leah Evans', 'Nora Turner', 'Mia Anderson',
  'Isabella Patel', 'Ruby Grant', 'Stella Murphy', 'Lucy Kim', 'Victoria Scott',
  'Caroline Walker', 'Anna Lewis', 'Rachel Clark', 'Samantha Price', 'Lauren Baker',
  'Katherine Hall', 'Brooke Young', 'Nicole Adams', 'Erin Nelson', 'Vanessa Robinson',
  'Jasmine Campbell', 'Morgan Phillips', 'Alyssa Martinez', 'Diana Wood', 'Rebecca Hughes',
  'Paige Ward', 'Hailey Cox', 'Taylor Richardson', 'Jessica Bailey', 'Sydney Russell',
  'Naomi Howard', 'Camila Peterson', 'Evelyn Gray', 'Valerie Ramirez', 'Autumn Flores'
];

const roles = ['Developer', 'Founder', 'Designer', 'Maker'];

function slugify(value) {
  return String(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function profile(name, gender, avatarNumber, index) {
  const role = roles[index % roles.length];
  const username = slugify(name).replace(/-/g, '.');
  return {
    name,
    gender,
    username,
    handle: `@${username}`,
    avatar: `https://randomuser.me/api/portraits/${gender === 'male' ? 'men' : 'women'}/${avatarNumber}.jpg`,
    role,
    bio: `${name} is a ${role.toLowerCase()} building practical digital products, with a focus on clear user experiences, maintainable systems, and thoughtful handoffs.`,
    githubVerified: index % 3 !== 1
  };
}

const sellerProfiles = Array.from({ length: 50 }, (_, index) => index % 2 === 0
  ? profile(maleNames[index / 2], 'male', index / 2 + 1, index)
  : profile(femaleNames[(index - 1) / 2], 'female', (index + 1) / 2, index));

const buyerProfiles = Array.from({ length: 50 }, (_, index) => index % 2 === 0
  ? profile(maleNames[25 + index / 2], 'male', 26 + index / 2, index + 50)
  : profile(femaleNames[25 + (index - 1) / 2], 'female', 26 + (index - 1) / 2, index + 50));

const thumbnails = [
  'photo-1551288049-bebda4e38f71', 'photo-1460925895917-afdab827c52f', 'photo-1558655146-d09347e92766',
  'photo-1512941937669-90a1b58e7e9c', 'photo-1518770660439-4636190af475', 'photo-1558494949-ef010cbdcc31',
  'photo-1618005182384-a83a8bd57fbe', 'photo-1507238691740-187a5b1d37b8', 'photo-1555066931-4365d14bab8c',
  'photo-1547658719-da2b51169166', 'photo-1535223289827-42f1e9919769', 'photo-1484417894907-623942c8ee29'
];

const sellerRows = [
  ['ClientPulse Retention Dashboard','saas',12500,1180,'Next.js,TypeScript,PostgreSQL,Tailwind CSS','customer-success teams','combines account health scores, renewal notes, and risk alerts in one focused workspace','34 paying workspaces and consistent organic signups'],
  ['Briefly AI Content Planner','ai',7800,640,'Next.js,Python,OpenAI API,Supabase','small marketing teams','turns campaign goals into structured briefs, calendars, and channel-specific draft outlines','21 active subscribers with low support volume'],
  ['Pocket Pantry Grocery Planner','mobile',4200,310,'Flutter,Dart,Firebase,RevenueCat','busy households','creates shared meal plans and automatically groups grocery lists by store section','4.7-star beta feedback and 1,900 installs'],
  ['Tab Harbor Workspace Saver','extension',2400,185,'TypeScript,React,Chrome Manifest V3,IndexedDB','researchers and remote workers','saves browser sessions into searchable workspaces with notes and cloud sync','8,400 users and a growing paid tier'],
  ['Freelance Command Center','notion',49,0,'Notion,Formula 2.0,Figma','independent consultants','organizes leads, proposals, active work, invoices, and quarterly goals without extra software','more than 600 prior downloads'],
  ['Fintech Mobile UI System','ui-kit',399,0,'Figma,Design Tokens,Auto Layout,Variables','fintech founders and product designers','provides production-ready onboarding, wallet, card, transfer, and verification flows','validated across three shipped client products'],
  ['AddressVerify REST API','api',9600,890,'Python,FastAPI,PostgreSQL,Docker','commerce and logistics developers','normalizes US shipping addresses and flags likely delivery problems before checkout','processing 180,000 requests per month'],
  ['MeetingNote Follow-Up SaaS','saas',6900,525,'React,Node.js,PostgreSQL,OpenAI API','client-facing service teams','converts meeting notes into assigned action items, summaries, and follow-up emails','17 paying teams and stable usage'],
  ['SupportLens AI Triage','ai',14500,1320,'Python,FastAPI,Next.js,Anthropic API','lean support departments','classifies incoming tickets, suggests replies, and highlights urgent churn signals','46 paying accounts with documented onboarding'],
  ['TrailMates Outdoor Planner','mobile',5100,270,'React Native,Expo,Supabase,Mapbox','hikers and weekend travel groups','builds collaborative itineraries with offline checklists, maps, and shared packing lists','2,700 registered users and strong retention'],
  ['Inbox Quiet Hours','extension',1250,92,'JavaScript,Chrome Manifest V3,Gmail API','knowledge workers','batches inbox notifications into scheduled windows and protects uninterrupted focus time','3,600 weekly active users'],
  ['Creator Sponsorship OS','notion',199,0,'Notion,Notion Forms,Canva','newsletter and podcast creators','tracks sponsor outreach, inventory, deliverables, payments, and campaign performance','used by 240 creators'],
  ['Healthcare Appointment UI Kit','ui-kit',549,0,'Figma,Auto Layout,Variables,WCAG','health-tech product teams','covers patient search, booking, intake, telehealth, records, and accessible form states','includes 140 screens and 320 components'],
  ['Screenshot Rendering API','api',11200,970,'Node.js,Playwright,Redis,AWS','developers building reporting tools','turns public or authenticated web pages into reliable PNG and PDF captures through a simple endpoint','serving 260,000 monthly renders'],
  ['ProposalFlow for Agencies','saas',8800,760,'Vue,Node.js,PostgreSQL,Tailwind CSS','small digital agencies','creates reusable proposals, approval workflows, and branded client acceptance pages','29 agencies on monthly plans'],
  ['CatalogCraft Product Copy AI','ai',5900,430,'Python,Next.js,OpenAI API,Shopify API','independent online stores','generates brand-aware product descriptions, metadata, and collection copy in bulk','14 stores and a healthy usage pattern'],
  ['HabitBloom Daily Coach','mobile',3600,210,'Flutter,Firebase,RevenueCat,Cloud Functions','wellness-focused consumers','pairs flexible habit tracking with private reflections and gentle progress summaries','1,200 monthly active users'],
  ['Pull Request Context Helper','extension',3200,245,'TypeScript,React,GitHub API,Manifest V3','software engineering teams','adds linked issue context, ownership hints, and review checklists inside GitHub pull requests','11 paid organizations'],
  ['Small Business Finance Hub','notion',249,0,'Notion,Formula 2.0,Notion Charts','solo business owners','combines cash planning, invoice tracking, expense review, and monthly decision notes','refined through 80 customer interviews'],
  ['Travel Booking App UI Kit','ui-kit',449,0,'Figma,Variables,Auto Layout,Prototyping','travel app founders','delivers polished search, itinerary, hotel, flight, checkout, and disruption-management screens','fully documented light and dark themes'],
  ['Email Reputation Monitor API','api',15000,1410,'Go,PostgreSQL,Redis,Kubernetes','email platforms and growth tools','checks domain configuration, blocklist signals, and deliverability changes through scheduled monitoring','62 customers with predictable infrastructure costs'],
  ['WaitlistLoop Referral Platform','saas',7300,610,'Next.js,PostgreSQL,Resend,Stripe','early-stage product teams','launches branded waitlists with referrals, milestones, fraud controls, and conversion analytics','38 active campaigns and steady MRR'],
  ['ContractClarity AI Reviewer','ai',9900,820,'Python,FastAPI,React,OpenAI API','freelancers and boutique agencies','summarizes service agreements and flags payment, scope, renewal, and ownership clauses for review','25 paying teams and repeat document usage'],
  ['LocalLens City Guide','mobile',2800,120,'React Native,Expo,Mapbox,Supabase','independent travelers','lets users save neighborhood recommendations and build offline, map-based day plans','950 registered users in three launch cities'],
  ['Calendar Buffer Guard','extension',950,68,'JavaScript,Google Calendar API,Manifest V3','remote professionals','automatically protects travel, preparation, and recovery time around calendar events','2,100 installs with minimal maintenance'],
  ['Product Launch Workspace','notion',129,0,'Notion,Notion Forms,Figma','indie makers','turns positioning, launch tasks, content assets, outreach, and results into one guided system','tested across 35 public launches'],
  ['B2B Analytics Dashboard Kit','ui-kit',599,0,'Figma,Design Tokens,Variables,Charts','B2B SaaS design teams','includes responsive tables, filters, charts, permissions, billing, and empty states for complex products','designed for fast developer handoff'],
  ['Invoice Extraction API','api',13800,1260,'Python,FastAPI,OCR,PostgreSQL','accounting and operations software','extracts normalized vendor, date, tax, line-item, and total data from common invoice formats','processing 90,000 documents monthly'],
  ['ReviewBoard Client Approval','saas',4700,350,'Vue,Node.js,PostgreSQL,S3','creative studios','collects timestamped feedback, version decisions, and final approvals for visual deliverables','18 paying studios and simple operations'],
  ['VoiceBrief AI Summaries','ai',6400,505,'Next.js,Python,Whisper,OpenAI API','consultants and research teams','transcribes uploaded interviews and produces structured themes, quotes, and next-step summaries','31 subscribers with high repeat usage'],
  ['ShiftSwap Team Scheduler','mobile',6200,455,'Flutter,Firebase,Cloud Functions,Stripe','small retail and hospitality teams','manages schedules, availability, swap requests, and manager approvals from a mobile-first interface','12 business customers across 19 locations'],
  ['Accessibility Quick Audit','extension',2100,155,'TypeScript,React,axe-core,Manifest V3','designers and front-end developers','runs practical accessibility checks on any page and exports prioritized remediation notes','6,700 installs and 140 paid users'],
  ['Agency Hiring Pipeline','notion',179,0,'Notion,Formula 2.0,Notion Forms','small agencies','standardizes candidate sourcing, scorecards, interviews, references, offers, and onboarding preparation','used internally by 45 hiring managers'],
  ['Marketplace Seller UI Kit','ui-kit',699,0,'Figma,Variables,Auto Layout,Prototyping','marketplace product teams','covers seller onboarding, listings, inventory, orders, payouts, disputes, and performance analytics','over 180 responsive screens'],
  ['Webhook Reliability API','api',14750,1375,'Go,Redis,PostgreSQL,Docker','SaaS engineering teams','accepts, signs, retries, logs, and replays webhooks without requiring teams to build queue infrastructure','delivering 1.4 million events monthly'],
  ['ChurnInterview Scheduler','saas',3900,275,'Next.js,Supabase,Resend,Tailwind CSS','subscription product founders','invites canceled customers to short interviews and organizes insights by churn reason','16 paying products and low churn'],
  ['ResumeTailor AI Assistant','ai',3300,240,'React,Python,OpenAI API,PostgreSQL','active job seekers','adapts resume emphasis to a job description while preserving truthful experience and formatting','430 paid reports sold in six months'],
  ['StudySprint Focus Rooms','mobile',4500,295,'React Native,Expo,Firebase,RevenueCat','college students','offers shared focus rooms, accountability streaks, and distraction-free study timers','3,400 monthly active users'],
  ['Docs Sidekick Search','extension',1750,115,'TypeScript,React,Chrome Manifest V3','developers and technical support teams','searches approved documentation sources from a compact browser command palette','4,900 active installations'],
  ['Customer Research Repository','notion',219,0,'Notion,Notion Forms,Formula 2.0','product managers and founders','connects interviews, evidence, themes, opportunities, and roadmap decisions in a traceable system','developed through two years of product research'],
  ['Food Delivery Mobile UI Kit','ui-kit',499,0,'Figma,Auto Layout,Variables,Prototyping','food delivery startups','covers discovery, menus, customization, checkout, courier tracking, support, and reorder flows','includes accessible components and developer notes'],
  ['Currency Conversion API','api',10400,930,'Node.js,Redis,PostgreSQL,AWS Lambda','commerce and finance developers','provides cached exchange rates, historical queries, conversion rules, and usage reporting','serving 410,000 calls per month'],
  ['NPS Follow-Up Automations','saas',5700,470,'Laravel,Vue,MySQL,Resend','customer experience teams','routes promoters, passives, and detractors into configurable follow-up sequences with team assignments','23 paying companies and documented playbooks'],
  ['Podcast Clip Finder AI','ai',8600,690,'Python,Next.js,Whisper,FFmpeg','podcast producers','identifies quotable moments, generates captions, and prepares editable short-form clip suggestions','19 production teams on recurring plans'],
  ['PetCare Family Organizer','mobile',2300,90,'Flutter,Firebase,Cloud Functions','multi-pet households','shares feeding, medication, appointment, and care notes among family members and sitters','1,500 downloads with positive reviews'],
  ['SEO Outline Companion','extension',1450,105,'JavaScript,React,Chrome Manifest V3','content strategists','captures search results, related questions, and competitor headings into editable content outlines','3,100 active users'],
  ['Consulting Delivery OS','notion',299,0,'Notion,Formula 2.0,Notion Forms','independent consultants and small firms','connects sales handoff, discovery, work plans, meetings, decisions, deliverables, and renewal opportunities','shaped by 120 completed consulting projects'],
  ['AI Assistant Component Kit','ui-kit',749,0,'Figma,Variables,Auto Layout,Design Tokens','teams designing AI products','provides chat, citations, prompt controls, model settings, generation states, history, and safety patterns','includes 260 components and coded token guidance'],
  ['PDF Form Fill API','api',12900,1110,'Python,FastAPI,PDF.js,Docker','workflow automation developers','maps structured data into common PDF forms and returns validated, flattened documents through an API','used by 37 business customers'],
  ['RoadmapSignal Feedback SaaS','saas',11800,1040,'Next.js,TypeScript,PostgreSQL,Tailwind CSS','B2B product teams','centralizes feedback, links evidence to opportunities, and publishes selective customer-facing updates','41 paying workspaces with documented growth channels']
];

const buyerRows = [
  ['Seeking a Focused B2B Micro-SaaS MVP','saas',2500,9000,'Next.js,React,PostgreSQL','an operational B2B workflow product with a clear user and a usable admin area'],
  ['Buying an AI Support Workflow Tool','ai',3000,10000,'Python,OpenAI API,React','a practical AI wrapper for support triage, knowledge search, or response drafting'],
  ['Looking for a Polished iOS Utility App','mobile',1500,7000,'Swift,SwiftUI,Firebase','a lightweight productivity or personal finance utility ready for App Store submission'],
  ['Acquiring a Useful Chrome Extension','extension',500,3500,'TypeScript,Manifest V3,React','a narrow browser workflow with genuine utility and clean permissions'],
  ['Wanted: Premium Notion Business System','notion',100,900,'Notion,Formula 2.0,Notion Forms','a complete operations, finance, or client-management workspace with documentation'],
  ['Seeking a Production-Ready Mobile UI Kit','ui-kit',250,1800,'Figma,Variables,Auto Layout','a coherent component system for fintech, wellness, travel, or productivity apps'],
  ['Buying a Document Processing API','api',2500,10000,'Python,FastAPI,Docker','a stable API for PDF, OCR, conversion, extraction, or document validation tasks'],
  ['Looking for a Vertical SaaS Starter','saas',1200,6000,'Next.js,Supabase,Tailwind CSS','a credible MVP serving one specific trade, profession, or local-business workflow'],
  ['Wanted: AI Research Assistant MVP','ai',1800,7500,'Python,LLM,RAG,PostgreSQL','a research product with source citations, saved projects, and transparent output controls'],
  ['Seeking a Cross-Platform Wellness App','mobile',2000,8500,'Flutter,Firebase,RevenueCat','a thoughtful wellness, habit, or guided journaling app with solid onboarding'],
  ['Buying a Developer Productivity Extension','extension',800,4500,'TypeScript,GitHub API,Manifest V3','a browser extension that improves code review, documentation, testing, or issue workflows'],
  ['Looking for a Creator Notion Template','notion',75,650,'Notion,Canva,Formula 2.0','a polished creator-business system for content, sponsorships, or product launches'],
  ['Seeking an Accessible SaaS UI Library','ui-kit',300,2200,'Figma,WCAG,Design Tokens','a web application UI kit with strong tables, forms, navigation, and accessibility states'],
  ['Buying a Reliable Webhook API','api',3500,10000,'Go,Node.js,Redis','a developer API with retry logic, logs, clear documentation, and manageable infrastructure'],
  ['Wanted: Customer Feedback Micro-SaaS','saas',2500,8000,'React,Node.js,PostgreSQL','a feedback collection or research repository product with an opinionated workflow'],
  ['Looking for an Ethical AI Writing Tool','ai',1200,5000,'Next.js,OpenAI API,Supabase','a focused writing assistant that supports user control, citations, or brand consistency'],
  ['Acquiring an Android Home Organizer','mobile',1200,5500,'Kotlin,Jetpack Compose,Firebase','a family, household, pet, or home-maintenance organizer with a clean codebase'],
  ['Seeking a Gmail Workflow Extension','extension',700,4000,'JavaScript,Gmail API,Manifest V3','a small extension that reduces inbox work without requesting unnecessary permissions'],
  ['Wanted: Consulting Operations Template','notion',100,800,'Notion,Notion Forms,Formula 2.0','a consultant workspace covering lead-to-delivery processes and client communication'],
  ['Buying a Modern Marketplace UI Kit','ui-kit',400,2500,'Figma,Variables,Auto Layout','a comprehensive buyer-and-seller marketplace design system with responsive screens'],
  ['Looking for an Email Validation API','api',2000,9000,'Python,Node.js,PostgreSQL','an API that validates, normalizes, or monitors email and domain data responsibly'],
  ['Seeking a Bootstrapped Analytics SaaS','saas',4000,10000,'Next.js,ClickHouse,PostgreSQL','a privacy-conscious analytics product with real usage or a convincing working MVP'],
  ['Buying an AI Meeting Assistant','ai',2500,9000,'Python,Whisper,React','a meeting transcription or follow-up tool with strong privacy choices and editable outputs'],
  ['Wanted: Subscription Fitness Mobile App','mobile',3000,10000,'Flutter,RevenueCat,Firebase','a fitness or mobility app with content structure, progress tracking, and subscription readiness'],
  ['Looking for a Research Tab Manager','extension',500,3000,'TypeScript,IndexedDB,Manifest V3','a browser tool for saving, annotating, and organizing research sessions'],
  ['Seeking a Notion Finance Dashboard','notion',80,600,'Notion,Notion Charts,Formula 2.0','a practical cash-flow, expense, and planning template for solo businesses'],
  ['Buying a Design System for AI Products','ui-kit',500,3000,'Figma,Design Tokens,Variables','an extensible kit for assistant, generation, citation, and model-setting experiences'],
  ['Wanted: Screenshot or Rendering API','api',3000,10000,'Node.js,Playwright,Redis','a maintained page rendering, screenshot, or document generation API with usage controls'],
  ['Looking for a Simple Agency SaaS','saas',1800,6500,'Laravel,Vue,MySQL','a client approval, proposal, reporting, or delivery workflow for small agencies'],
  ['Seeking an AI Commerce Assistant','ai',2500,8500,'Python,Shopify API,LLM','an ecommerce AI tool focused on merchandising, catalog quality, or customer operations'],
  ['Buying a Travel Planning Mobile MVP','mobile',1500,6500,'React Native,Mapbox,Supabase','a collaborative itinerary or local discovery app with useful offline behavior'],
  ['Wanted: Calendar Productivity Extension','extension',400,2600,'JavaScript,Google Calendar API','a lightweight scheduling, buffer, time-zone, or meeting preparation extension'],
  ['Looking for a Team Wiki Template','notion',100,750,'Notion,Notion Forms','a well-structured internal wiki and operating manual for distributed teams'],
  ['Seeking a Healthcare Mobile UI Kit','ui-kit',350,2400,'Figma,WCAG,Auto Layout','an accessible patient-facing UI library with realistic booking and care workflows'],
  ['Buying a Location Data API','api',2500,9500,'Go,PostgreSQL,Redis','a geocoding, address, place, distance, or routing API with clear data provenance'],
  ['Wanted: Lightweight HR Micro-SaaS','saas',2200,7800,'Next.js,PostgreSQL,Tailwind CSS','a focused hiring, onboarding, policy, or employee-operations product for small teams'],
  ['Looking for an AI Interview Product','ai',1800,6500,'React,Python,OpenAI API','an interview preparation or qualitative research tool with structured, useful outputs'],
  ['Seeking a Family Coordination App','mobile',1000,5000,'Flutter,Firebase','a shared routine, chores, appointments, or caregiving app with straightforward onboarding'],
  ['Buying an Accessibility Extension','extension',700,3800,'TypeScript,axe-core,Manifest V3','a practical accessibility auditing or reading aid with responsible permissions'],
  ['Wanted: Product Research Notion OS','notion',120,950,'Notion,Notion Forms,Formula 2.0','a traceable research repository connecting evidence, insights, and product decisions'],
  ['Looking for a B2B Dashboard UI Kit','ui-kit',450,2800,'Figma,Variables,Design Tokens','a polished analytics and administration kit suitable for a serious SaaS product'],
  ['Seeking a Financial Data API MVP','api',3500,10000,'Python,FastAPI,PostgreSQL','a legitimate finance data normalization or reporting API with documented sources'],
  ['Buying a Niche Scheduling SaaS','saas',2500,9000,'React,Node.js,PostgreSQL','a scheduling product for a clearly defined industry with working reminders and admin controls'],
  ['Wanted: AI Audio Workflow Tool','ai',2500,8500,'Python,Whisper,FFmpeg','an audio transcription, editing, clipping, or review product serving professional creators'],
  ['Looking for a Study Companion App','mobile',1200,5800,'React Native,Firebase,Expo','a focus, flashcard, accountability, or study planning app for students'],
  ['Seeking an SEO Browser Extension','extension',600,3200,'JavaScript,Chrome Manifest V3','a focused SEO research or on-page review extension with exportable results'],
  ['Buying a Launch Planning Template','notion',75,550,'Notion,Canva','a guided launch workspace with positioning, assets, outreach, and post-launch review'],
  ['Wanted: Food Delivery UI Library','ui-kit',300,2100,'Figma,Auto Layout,Variables','a complete and consistent customer ordering experience with courier tracking states'],
  ['Looking for a PDF Automation API','api',3000,10000,'Python,PDF.js,Docker','a working API for filling, merging, signing, extracting, or validating PDF documents'],
  ['Seeking a Revenue-Ready Micro-SaaS','saas',4500,10000,'Next.js,TypeScript,PostgreSQL','a small subscription product with clean ownership, understandable operations, and early revenue']
];

function createdDate(index) {
  const date = new Date(Date.UTC(2026, 7, 12 - Math.floor(index / 4), 16 - (index % 4), 0, 0));
  return date.toISOString();
}

function seedViewCount(index) {
  return 1000 + ((index * 37 + 17) % 100) * 10 + ((index * 7 + 3) % 10);
}

function saleDescription(row, seller) {
  const [title, category, price, mrr, stack, audience, core, traction] = row;
  return `${title} is a focused ${CATEGORY_LABELS[category].toLowerCase()} built for ${audience}. The product ${core}. It was designed as a real operating product rather than a throwaway demo, with clear navigation, responsive screens, sensible validation, and an architecture that a new owner can continue without rebuilding the foundation. The current stack includes ${stack.split(',').join(', ')}, and the repository is organized with practical setup notes, environment variable guidance, and deployment documentation.\n\nThe listing includes the source code, product name and visual assets, database schema, deployment configuration, onboarding copy, and the operating documentation used by the current owner. ${traction.charAt(0).toUpperCase() + traction.slice(1)}. ${mrr > 0 ? `Current monthly recurring revenue is approximately $${mrr.toLocaleString('en-US')}; a buyer should independently verify revenue, customer, and expense records during due diligence.` : 'The product is not currently marketed as a recurring-revenue business, so the opportunity is best suited to a buyer who values the completed product, positioning, and launch-ready assets.'}\n\nA practical next owner could improve acquisition through focused content, partnerships, direct outreach, or a tighter onboarding experiment. The codebase has no known ownership disputes, and third-party services are documented for transfer or replacement. The asking price is $${price.toLocaleString('en-US')}. I am selling to concentrate on a smaller number of commitments, and I can provide a structured handoff, one live walkthrough, and fourteen days of reasonable transition support. Searya connects interested parties only; buyers should review the code, accounts, claims, licenses, and transfer terms directly before making any payment.`;
}

function buyerDescription(row, buyer) {
  const [title, category, min, max, stack, requirement] = row;
  return `${buyer.name} is looking to acquire ${requirement}. The target budget is $${min.toLocaleString('en-US')}–$${max.toLocaleString('en-US')}, depending on product quality, completeness, documentation, traction, and the assets included in the transfer. Preferred technologies include ${stack.split(',').join(', ')}, although a well-maintained alternative stack will be considered when the architecture is clear and deployment is straightforward.\n\nThe ideal project should have a working core experience, responsive user-facing screens, secure authentication where needed, and a codebase that can be reviewed before an agreement. Early revenue is welcome but not required. Honest metrics, clean ownership, third-party license details, operating costs, and a practical handoff plan matter more than inflated projections. Please include the live URL or a private demo, current status, known limitations, monthly expenses, repository overview, and exactly what is included in the sale. Projects with copied branding, unclear source ownership, unverifiable claims, or unnecessary access permissions will not be considered. The buyer is prepared to move efficiently after technical review, but all payment and transfer arrangements must be agreed directly and independently outside Searya.`;
}

export const initialForSaleListings = sellerRows.map((row, index) => {
  const [title, category, price, mrr, stack] = row;
  const seller = sellerProfiles[index];
  const iso = createdDate(index);
  const description = saleDescription(row, seller);
  return {
    id: `proj-${index + 1}`,
    type: 'sale',
    slug: slugify(title),
    title,
    titleEn: title,
    category,
    categoryEn: CATEGORY_LABELS[category],
    askingPrice: price,
    mrr,
    status: mrr > 0 ? 'Revenue Generating' : 'Launch Ready',
    statusEn: mrr > 0 ? 'Revenue Generating' : 'Launch Ready',
    isAnonymous: false,
    isVerified: index % 3 === 0,
    seller,
    shortDesc: description.split('\n\n')[0],
    shortDescEn: description.split('\n\n')[0],
    fullDesc: description,
    fullDescEn: description,
    coverImage: `https://images.unsplash.com/${thumbnails[index % thumbnails.length]}?auto=format&fit=crop&w=1200&q=82&searya=${index + 1}`,
    techStack: stack.split(','),
    reasonForSelling: 'The owner is narrowing their product portfolio and will support an orderly transition.',
    reasonForSellingEn: 'The owner is narrowing their product portfolio and will support an orderly transition.',
    setupTimeHours: mrr > 0 ? 3 : 5,
    views: seedViewCount(index),
    createdAt: iso,
    createdAtEn: iso,
    createdAtIso: iso
  };
});

export const initialWtbListings = buyerRows.map((row, index) => {
  const [title, category, budgetMin, budgetMax, stack] = row;
  const buyer = buyerProfiles[index];
  const iso = createdDate(index + 2);
  const description = buyerDescription(row, buyer);
  return {
    id: `wtb-${index + 1}`,
    type: 'wtb',
    slug: slugify(title),
    title,
    titleEn: title,
    budget: budgetMax,
    budgetMin,
    budgetMax,
    budgetRange: `$${budgetMin.toLocaleString('en-US')}–$${budgetMax.toLocaleString('en-US')}`,
    category,
    categoryEn: CATEGORY_LABELS[category],
    buyer,
    shortDesc: description.split('\n\n')[0],
    shortDescEn: description.split('\n\n')[0],
    fullDesc: description,
    fullDescEn: description,
    techStack: stack.split(','),
    views: seedViewCount(index + sellerRows.length),
    createdAt: iso,
    createdAtEn: iso,
    createdAtIso: iso
  };
});

export const seedProfiles = Object.freeze([...sellerProfiles, ...buyerProfiles]);
export const seedCategoryLabels = CATEGORY_LABELS;
