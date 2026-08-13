export const GUIDE_PUBLISHED_DATE = '2026-08-12';

export const GUIDE_CATEGORIES = Object.freeze([
  'Selling Digital Projects',
  'Buying Digital Projects',
  'Valuation & Due Diligence',
  'Founder Guides'
]);

export const GUIDES = Object.freeze({
  '/guides/how-to-sell-a-saas': {
    category: 'Selling Digital Projects',
    title: 'How to Sell a SaaS: A Practical Founder Guide | Searya',
    description: 'A practical guide to preparing, presenting and discussing a SaaS sale, from metrics and documentation to buyer questions and due diligence.',
    h1: 'How to Sell a SaaS',
    intro: 'Selling a SaaS is less about writing an exciting advertisement and more about making the business understandable. A serious buyer wants to know what the product does, what it costs to operate, who depends on it and what would need to change hands. Good preparation makes those questions easier to answer and helps both sides recognize a poor fit early.',
    links: ['/sell-your-saas', '/saas-for-sale', '/guides/how-much-is-my-saas-worth'],
    cta: ['Ready to introduce your SaaS?', 'Create an accurate listing that gives potential buyers enough context to start a useful conversation.', '/sell-your-saas', 'List your SaaS'],
    sections: [
      ['Decide what you are actually offering', [
        'Begin by defining the sale perimeter. Is the buyer receiving the company, only the software assets, or a collection of code, domains, customer relationships and operating accounts? These are not interchangeable. A project-level transfer may exclude contracts, cash, liabilities or the legal entity. Write a simple asset list before speaking with buyers so the scope does not change from one conversation to another.',
        'List the source repositories, domains, trademarks, design files, documentation, databases, analytics properties, social accounts and third-party services involved. Mark which items you own, which can be transferred and which require a buyer to open a replacement account. If a contractor wrote important code or design work, confirm that the relevant intellectual-property rights were assigned to you.',
        'Also decide what happens after the transfer. A buyer may expect migration help, introductions to contractors or a short support period. State what you can reasonably provide and for how long. An honest boundary is more useful than an open-ended promise that becomes difficult to fulfil.'
      ]],
      ['Prepare the numbers a buyer will question', [
        'Create a monthly view of revenue, refunds, payment fees, hosting, software subscriptions, contractors, support costs and advertising. Separate recurring revenue from setup fees or one-time services. If you mix founder consulting with product revenue, identify each component. A clean table is easier to verify than a headline number with no explanation.',
        'Expect questions about active customers, plan mix, churn, annual contracts, trials, discounts, failed payments and customer concentration. One customer producing half of revenue creates a different risk from fifty smaller customers. Explain how metrics are calculated and provide read-only or redacted evidence at an appropriate stage. Never share customer personal data merely to make a listing look stronger.',
        'Non-revenue products still need operating facts. Document sign-ups, active usage, waitlist size, traffic sources, conversion events and infrastructure costs. The important distinction is between measured activity and an assumption. Label estimates as estimates and do not turn a short traffic spike into a recurring claim.'
      ]],
      ['Make the product technically legible', [
        'A buyer needs to understand whether they can operate the product after you step away. Prepare an architecture overview showing the front end, back end, database, hosting, scheduled jobs, email, analytics, payments and external APIs. It does not need to be a beautiful diagram; it needs to match reality.',
        'Add setup instructions, environment-variable names, deployment steps, backup and restore procedures, test commands and a list of known defects. Identify dependencies with unusual licences or expensive usage tiers. Record who has production access and how secrets will be rotated. If deployments rely on your laptop or undocumented manual steps, fix or document that before a buyer discovers it.',
        'Summarize technical debt without drama. Buyers can accept an old framework, incomplete tests or a fragile integration when they can price the work. They become cautious when obvious problems were hidden. A short risk register with impact, likelihood and a practical next action creates more confidence than claiming the codebase is perfect.'
      ]],
      ['Present the opportunity without overselling it', [
        'Your public description should explain the user, problem, current stage, business model, technology and assets included. It should also say what is not included. Avoid vague phrases such as “huge potential” unless you can connect them to a specific observation, such as repeated requests from a defined customer group. The buyer is evaluating evidence, not enthusiasm.',
        'Choose an asking price or range you can explain. Price may reflect financial performance, replacement cost, strategic fit, transferable distribution and the amount of founder work required. It should not be justified only by the hours you spent building. Those hours may show effort, but a buyer is paying for the asset and future economics they can actually obtain.',
        'Use screenshots that show the working product and write captions that make their context clear. Do not expose dashboards, private keys or customer data. A concise public listing should qualify interest; detailed evidence belongs in a controlled due-diligence process.'
      ]],
      ['Manage conversations and buyer expectations', [
        'Good buyers usually ask specific questions. Prepare a short first-response document covering the reason for selling, weekly workload, customer support, growth channels, technology, transfer scope and timing. This keeps answers consistent and lets you notice where your records are incomplete.',
        'Qualify the other side as well. Ask what they have operated before, what they want to acquire, their preferred timeline and whether they can handle the technology or customer obligations. Avoid sending an entire repository or unredacted financial records to every person who asks. Share information in stages as the conversation becomes credible.',
        'A buyer may want demonstrations, read-only analytics, code review, customer-contract samples or access to a staging environment. Agree on what can be shown, protect personal data and record what was provided. If a request seems unrelated to evaluating the project, pause and ask why it is necessary.'
      ]],
      ['Plan due diligence and handover before agreeing', [
        'Due diligence is not a final obstacle; it is how both parties check that their assumptions match. Expect verification of ownership, finances, customers, code, licences, infrastructure and legal obligations. Keep an indexed folder of relevant documents and update it when facts change. If something cannot be verified, say so directly.',
        'Write a transfer checklist covering repositories, domains, databases, documentation, credentials, vendor accounts, billing, email, analytics and customer communication. Decide the order of transfer and when access will be revoked. Sensitive credentials should be replaced, not simply forwarded. Both sides should independently choose appropriate legal and payment arrangements.',
        'Searya can help a founder become discoverable and speak directly with interested people. It does not process an acquisition, hold funds, provide escrow or become a party to the agreement. Use independent professional advice when the transaction, tax, privacy or legal consequences justify it.'
      ]]
    ]
  },

  '/guides/where-to-sell-a-saas': {
    category: 'Selling Digital Projects',
    title: 'Where to Sell a SaaS Project: Options for Founders | Searya',
    description: 'Compare marketplaces, founder communities, direct outreach and other ways to find potential buyers for a SaaS project.',
    h1: 'Where Can You Sell a SaaS Project?',
    intro: 'There is no single best place to sell every SaaS. A small pre-revenue tool, a profitable niche product and a company with staff and complex contracts need different buyer pools and different levels of support. The useful question is not simply where to post. It is where the right kind of buyer is likely to understand the asset and where you can run a responsible process.',
    links: ['/sell-your-saas', '/saas-for-sale', '/guides/how-to-find-buyers-for-a-digital-project'],
    cta: ['Want another channel for discovery?', 'List your SaaS on Searya so interested people can understand the project and contact you directly.', '/sell-your-saas', 'Introduce your SaaS'],
    sections: [
      ['Start with the type of buyer you need', [
        'An operator may value stable customers and a manageable weekly workload. A technical founder may prefer good code and an unfinished growth opportunity. A strategic buyer may care about an integration, audience or dataset that complements another product. Write down the likely buyer profile before choosing a channel.',
        'Size matters as well. A simple asset sale may be handled through direct founder conversations, while a larger business with employees, complex contracts or regulated data may require an adviser and a more formal process. The more complicated the obligations, the less suitable a casual public post becomes.',
        'Consider confidentiality. Public exposure can produce more conversations, but customers, staff or competitors may see the listing. If that would cause material harm, use a short anonymous summary and reveal identifying information only after qualifying a potential buyer. Never make a confidentiality claim you cannot maintain across your chosen channels.'
      ]],
      ['SaaS marketplaces and discovery platforms', [
        'A focused marketplace can put your project in front of people already exploring software opportunities. It also gives you a structured place to explain stage, technology, price expectations and included assets. That context can reduce irrelevant first messages compared with a generic classified listing.',
        'Marketplaces differ substantially. Some broker transactions, some provide escrow, some charge commissions and some only help people discover one another. Review the actual service before assuming it verifies buyers, validates financial claims or manages payment. Read the rules on eligible projects, fees, confidentiality and exclusivity.',
        'Searya is a discovery and direct-contact option for digital projects. Owners can publish accurate listings, and potential buyers can start conversations. Searya does not process the acquisition, hold funds or conduct due diligence. It can be a useful channel when you want visibility and direct communication, but it may not be the best or only route for a complex transaction.'
      ]],
      ['Founder communities and professional networks', [
        'Founder communities can work well when trust already exists. A concise post in a relevant group may reach operators who understand the niche, the technology or the workload. Explain what the product is, why you are considering a transfer and what kind of buyer would be a fit. Follow community rules and avoid reposting the same promotion everywhere.',
        'Your personal network is often underestimated. Former colleagues, investors, agency partners, customers and other founders may know a suitable operator even when they are not buyers themselves. A private, specific request is easier to refer than “I am selling something.” Give contacts a short summary they can forward without exposing confidential details.',
        'The weakness of communities is inconsistent intent. Interest can be friendly rather than commercial, and public comments can encourage unrealistic expectations. Move serious discussions into a documented one-to-one process and verify the identity and capability of the other party.'
      ]],
      ['Direct outreach to strategic buyers', [
        'Direct outreach is appropriate when a short list of companies has a clear reason to care. A complementary product, agency, data provider or vertical operator may gain distribution, customers or technology from the acquisition. Research the specific fit before contacting anyone.',
        'A useful message is short: identify the project, explain the strategic connection, state that you are exploring a transfer and ask whether the topic belongs with them. Do not attach confidential files or send a generic mass email. A relevant observation about their business is more persuasive than a long pitch about your own effort.',
        'Direct outreach takes time and may receive few replies, but each response can be better qualified. It is not automatically superior to a marketplace. Use it when the buyer universe is identifiable and the strategic case is credible, not merely because you want a higher price.'
      ]],
      ['Brokers and advisers', [
        'A broker or adviser may help package information, reach buyers, manage a process and coordinate offers. That can be valuable when the business is large enough to justify fees, when you need confidentiality or when the founder cannot manage many conversations. Ask how they source buyers, what work they perform and how compensation and exclusivity operate.',
        'Do not confuse a large mailing list with a suitable buyer network. Request a clear engagement scope, realistic timeline and explanation of what happens if no transaction occurs. Understand which claims the adviser verifies and which remain your responsibility.',
        'For a very early or low-value project, professional representation may cost more than it adds. In that case, good documentation, a focused listing and careful direct conversations may be more proportionate.'
      ]],
      ['Use more than one channel without creating confusion', [
        'A founder can combine a marketplace listing, selective community posts and a short direct-outreach list. Keep the core facts, scope and price logic consistent. If different channels show different revenue, assets or reasons for selling, buyers may assume the worst even when the difference was accidental.',
        'Track each conversation, next step, information shared and follow-up date. Remove stale listings when the project changes materially or is no longer available. If one channel requires exclusivity, respect it. If it does not, avoid promising exclusivity to individual buyers before you intend to grant it.',
        'Judge a channel by qualified conversations, not page views. Ten curious messages can consume more time than one well-matched operator. The best place to sell your SaaS is the place that reaches credible buyers while allowing you to present the facts, protect sensitive information and complete independent verification.'
      ]]
    ]
  },

  '/guides/how-much-is-my-saas-worth': {
    category: 'Valuation & Due Diligence',
    title: 'How Much Is My SaaS Worth? A Practical Valuation Guide | Searya',
    description: 'Understand the factors that influence a SaaS valuation, including revenue quality, growth, churn, concentration, code and owner involvement.',
    h1: 'How Much Is My SaaS Worth?',
    intro: 'A SaaS does not have one objective value that a calculator can reveal. Value depends on the quality of the business, the risks a buyer inherits, the work required after transfer and the strategic fit for a particular buyer. A valuation range can guide a conversation, but evidence and deal terms determine what someone is actually willing to offer.',
    links: ['/sell-your-saas', '/saas-for-sale', '/guides/how-to-sell-a-saas'],
    cta: ['Ready to present the facts behind your SaaS?', 'Create a transparent listing and let potential buyers decide whether the project fits their goals.', '/sell-your-saas', 'List your SaaS'],
    sections: [
      ['Start with normalized financial performance', [
        'Review revenue and expenses month by month rather than relying on a single annual total. Separate recurring subscriptions, usage charges, services, refunds and one-time income. Then identify the expenses required to keep the product operating: hosting, APIs, email, support, contractors, software, payment fees and ongoing marketing.',
        'Founder expenses require care. Some owner costs are discretionary, but owner labour is not automatically free. If the founder handles twenty hours of support and development each week, a buyer must either perform that work or pay someone else. A useful profit view shows both reported cash profit and the realistic cost of replacing essential labour.',
        'Use records that can be reconciled to payment providers, bank statements and accounting data. A spreadsheet is helpful, but its categories should connect to evidence. Consistent, understandable numbers reduce uncertainty; unexplained adjustments usually increase it.'
      ]],
      ['Revenue quality matters more than a headline', [
        'Recurring revenue is stronger when customers actively use the product, pay standard prices and can be retained without constant founder intervention. Revenue becomes riskier when it depends on temporary discounts, annual prepayments that create future service obligations or custom work that cannot be repeated.',
        'Customer concentration changes the picture. If one account represents a large share of income, losing it can transform the business immediately. Document the share of revenue from the largest customers, contract terms, renewal dates and whether those relationships depend personally on the founder.',
        'Payment history also matters. Track refunds, chargebacks, overdue invoices, failed renewals and the distinction between booked and collected revenue. A buyer will generally prefer a smaller number that is clear and repeatable to a larger number built from uncertain or non-transferable arrangements.'
      ]],
      ['Growth, churn and acquisition explain durability', [
        'Growth can support a stronger valuation when its source is understandable and likely to continue. Break down new revenue by channel and explain whether it came from organic search, partnerships, paid advertising, launches, affiliates or founder-led sales. A single viral event is different from a repeatable acquisition system.',
        'Churn should be measured in a way that fits the product. Show customer churn, revenue churn, upgrades, downgrades and cancellations over consistent periods. Small products can have volatile percentages, so provide the underlying counts as well. Explain why customers leave when you have reliable evidence.',
        'Compare acquisition cost with customer value cautiously. If data is limited, say that. Do not present lifetime value calculated from a few months as certainty. Buyers will form their own assumptions, and transparent limitations make your analysis more useful.'
      ]],
      ['Product quality and technical risk affect the price', [
        'A working product with clear documentation, automated deployment, backups, tests and manageable infrastructure is easier to take over. Technical debt is not automatically fatal, but it creates cost and uncertainty. An undocumented system that only the founder can deploy may be worth less to a buyer who must stabilize it immediately.',
        'Review security, privacy, open-source licences, vendor dependencies and API economics. A product built around an external service can remain attractive, but the buyer needs to know usage limits, pricing exposure and whether the account or contract transfers. Identify any feature that relies on manual intervention disguised as automation.',
        'Code quality is only one component. A polished codebase with no users may have less commercial value than an imperfect product with loyal customers. The right weighting depends on the buyer: an operator may value cash flow, while a strategic buyer may value technology or distribution.'
      ]],
      ['Owner involvement and transferability change risk', [
        'List every recurring task and its actual frequency: support, sales calls, content, releases, billing exceptions, data imports and incident response. Mark which tasks are documented, automated or handled by contractors. A “two-hour-per-week” business should be supported by a realistic task log, not memory.',
        'Relationships may also be founder-dependent. Customers, partners and suppliers might expect to work with you personally. Explain whether contracts can be assigned and how introductions would happen. If the brand is tied to your public identity, a buyer may need a transition plan rather than a silent handover.',
        'Transferability includes domains, repositories, trademarks, data rights, app-store accounts and third-party tools. Assets that cannot legally or practically move may reduce value even when they are central to current operations.'
      ]],
      ['Use valuation methods as lenses, not promises', [
        'Buyers may look at profit, recurring revenue, replacement cost, comparable transactions or strategic value. Each method answers a different question. A profit approach considers economic return; replacement cost considers what it would take to reproduce the asset; strategic value considers benefits unique to a particular buyer.',
        'Public multiples are often incomplete because deal terms, business quality and verified figures differ. Avoid treating a broad industry range as a guaranteed outcome. Payment timing, seller financing, earn-outs, retained liabilities and transition support can make two offers with the same headline price economically different.',
        'Build a defensible range by documenting strengths, risks and the evidence behind each assumption. Then test it through credible buyer conversations. Searya can help owners and potential buyers discover one another, but it does not appraise projects, guarantee a valuation or process the transaction. Consider qualified financial, tax and legal advice for significant decisions.'
        , 'Revisit the range when material facts change. A lost customer, a new annual contract, a security problem or a reduction in founder workload can change risk quickly. Keep the source data dated and let potential buyers see which period each conclusion represents. Valuation is most useful when it supports a clear decision, not when it becomes a fixed identity for the product.'
      ]]
    ]
  },

  '/guides/selling-a-saas-with-no-revenue': {
    category: 'Selling Digital Projects',
    title: 'Selling a SaaS With No Revenue: What Buyers Evaluate | Searya',
    description: 'Learn how a pre-revenue SaaS can still offer value through product quality, code, design, users, distribution and saved development time.',
    h1: 'Can You Sell a SaaS With No Revenue?',
    intro: 'Yes, a SaaS without revenue can be transferable, but a sale is never guaranteed. The buyer is not purchasing proven cash flow; they are deciding whether the product, technology, audience or market access saves enough time and reduces enough uncertainty to justify the price and effort. Your job is to show what exists today without presenting future potential as a completed result.',
    links: ['/sell-your-saas', '/micro-saas-for-sale', '/guides/how-much-is-my-saas-worth'],
    cta: ['Have a pre-revenue SaaS worth showing?', 'Explain what works, what is included and what remains to be validated in a clear Searya listing.', '/sell-your-saas', 'List your pre-revenue SaaS'],
    sections: [
      ['Understand what can create value before revenue', [
        'A working product can save a buyer months of design, engineering and deployment. That value is stronger when the core workflow is complete, the product is stable and another developer can run it. A collection of screens with no functioning back end is a different asset and should be described as a prototype rather than a SaaS business.',
        'Code, design systems, domains, integrations and documented infrastructure may be useful independently. A buyer could want a technical foundation for a related market rather than your exact original plan. List these assets precisely and confirm that you own the rights required to transfer them.',
        'Distribution can matter as much as software. An engaged waitlist, active free users, a relevant email audience, ranking content or a credible community can shorten the path to validation. Use consent-respecting, aggregate evidence. A large list of unengaged or improperly collected contacts is not a quality asset.'
      ]],
      ['Separate evidence from potential', [
        'Pre-revenue listings often rely on the word “potential,” but buyers need observable facts. Report the number of people who completed a meaningful action, how often they return, which features they use and what feedback they gave. Define the measurement period and source.',
        'A waitlist is more useful when subscribers match the target customer and opted in recently. User interviews are stronger when they reveal repeated problems and willingness to try a solution. Traffic is stronger when it comes from a repeatable, relevant source. None of these proves future revenue, but each can reduce a particular uncertainty.',
        'Do not convert expressions of interest into fictional customers or project annual revenue from a handful of sign-ups. State what has and has not been tested: pricing, onboarding, retention, payment, support and acquisition. A buyer can then decide which unknowns they are equipped to solve.'
      ]],
      ['Make saved development time credible', [
        'The claim that a product saves months of work only holds if the code is usable. Provide setup documentation, a dependency list, architecture notes, a staging demonstration and a summary of known issues. Remove secrets from repositories and check that licences permit transfer and commercial use.',
        'Explain the stack and why it was chosen. Identify areas that need refactoring, incomplete features and manual workarounds. A buyer may still prefer the project to starting from zero, but they need enough information to estimate the remaining work.',
        'Design assets should include editable source files where you have the right to transfer them. For third-party templates, fonts, photos or components, document licence limits. The same applies to domains, brand names and social handles: possession does not always mean unrestricted transferability.'
      ]],
      ['Choose a price based on present assets', [
        'Without revenue, a financial multiple is usually not the main anchor. Consider the replacement effort for the usable assets, the cost of completing the product, the strength of verified demand and the risks a buyer accepts. Founder hours are an input, not an invoice; inefficient work does not automatically create buyer value.',
        'Review comparable projects cautiously. Public asking prices may not equal completed transaction prices, and two products that look similar may differ in code quality, distribution and ownership. A lower, explainable range can produce better conversations than a large number based only on market size.',
        'Decide whether you value speed, price or finding a particular kind of operator. These goals can conflict. If the project requires specialist knowledge or continuing support from you, include that reality in your timing and handover plan.'
      ]],
      ['Write a listing that qualifies interest', [
        'Lead with the problem, target user and current working state. Then explain the technology, included assets, measured usage, operating cost and known limitations. Clearly label the project as pre-revenue. This does not weaken the listing; it lets the right buyer evaluate it without first correcting an inflated impression.',
        'Use a short product demonstration or screenshots that show actual workflows. Avoid mockups that appear to be live features. Explain what a buyer can test and what information can be shared privately after an initial conversation.',
        'State why you are selling in practical terms. Perhaps your priorities changed, distribution is outside your skill set or you want to focus on another product. A believable reason helps a buyer understand the context without requiring a dramatic founder story.'
      ]],
      ['Run a careful transfer process', [
        'Even a small pre-revenue project needs ownership checks and a written scope. Confirm repositories, domains, designs, databases, analytics, user data, vendor accounts and intellectual property. Personal data should only move with a lawful basis and appropriate safeguards; it is not simply another file in the sale folder.',
        'Demonstrate the product before sharing unrestricted production access. Rotate credentials during handover and record which services require the buyer to create a new account. Agree on post-transfer support and avoid promising indefinite help.',
        'Searya can make a pre-revenue SaaS discoverable and allow interested people to contact its owner. It does not verify value, guarantee a buyer, hold payment or manage the acquisition. Both sides remain responsible for due diligence and any independent legal or payment arrangements.'
        , 'If no suitable buyer appears, the preparation is still useful. Clean documentation can make the product easier to operate, licence, pause or relaunch. Keep user commitments and data responsibilities in view whichever route you choose; a lack of revenue does not remove obligations to people who already use the service.'
      ]]
    ]
  },

  '/guides/how-to-sell-an-app': {
    category: 'Selling Digital Projects',
    title: 'How to Sell a Mobile App: Ownership, Code and Transfer | Searya',
    description: 'Prepare a mobile app for potential buyers with clear ownership, store, code, user, monetization, documentation and transfer details.',
    h1: 'How to Sell a Mobile App',
    intro: 'Selling a mobile app involves more than handing over source code. Store rules, signing credentials, user data, subscriptions, backend services and intellectual property can all affect whether the product continues to work after a transfer. A strong process begins by mapping what the app depends on and which of those assets can actually move to a new owner.',
    links: ['/sell-your-app', '/mobile-apps-for-sale', '/guides/buy-app-vs-build-from-scratch'],
    cta: ['Ready to introduce your mobile app?', 'Create a clear listing that explains the app, its current stage and the assets you can transfer.', '/sell-your-app', 'List your app'],
    sections: [
      ['Confirm ownership before marketing the app', [
        'Identify who owns the source code, interface designs, brand, domain, content, backend and store listing. If co-founders, employees, agencies or freelancers contributed, check the agreements that assign their work. A payment receipt does not always establish intellectual-property ownership.',
        'Review third-party components, fonts, photos, music, datasets and SDKs. Some licences permit use but not transfer; others require attribution or source disclosure. Document these conditions so a buyer can understand what continues after the handover.',
        'If the app name or logo is registered, include accurate trademark information. If it is not registered, do not present it as protected. Resolve obvious naming conflicts before inviting a buyer to inherit them.'
      ]],
      ['Map the store and account constraints', [
        'Apple and Google maintain their own app-transfer requirements, and those rules can change. Check the current official documentation for account eligibility, app status, agreements, identifiers and features that may prevent transfer. Do not promise that an app-store account itself will be handed over when the platform expects the app to move between accounts.',
        'Record bundle identifiers, package names, signing arrangements, certificates, provisioning profiles, push-notification keys and associated domains. Identify subscriptions, in-app purchases, merchant accounts and tax settings that require special handling. A successful listing transfer does not automatically migrate every connected service.',
        'Also list review history, policy warnings, rejected releases and unresolved compliance issues. A buyer should not discover a store risk after access changes.'
      ]],
      ['Prepare the code and infrastructure', [
        'Organize the repositories and provide reproducible build instructions. Specify the required operating system, development tools, SDK versions, package managers and environment variables. Test a clean build from a new machine or clean environment before claiming the documentation works.',
        'Map the backend, database, file storage, authentication, analytics, crash reporting, email, notifications and external APIs. Explain costs and usage limits. If the app relies on a personal cloud account or manually renewed credential, plan a safer replacement.',
        'Document known bugs, outdated dependencies and upcoming store requirements. Buyers can budget for technical work when it is visible. Hidden instability affects both trust and price.'
      ]],
      ['Explain users, monetization and obligations', [
        'Show active users and retention over defined periods, not only total downloads. Downloads can include people who never opened the app or stopped using it years ago. Describe geography, platform mix, acquisition sources and meaningful product events without exposing personal information.',
        'Break down revenue from paid downloads, subscriptions, advertising, in-app purchases or services. Include refunds, store commissions, advertising costs and backend expenses. Explain trials, lifetime plans and obligations that a new owner must continue serving.',
        'Review the privacy policy, consent flows, data retention and permissions. A transfer involving user data may create legal and platform obligations. Obtain appropriate professional guidance where needed rather than treating the database as a simple asset.'
      ]],
      ['Create a buyer-ready information package', [
        'Your public listing should cover the app’s purpose, supported platforms, current status, technology, monetization, operating workload, asking-price logic and assets included. Use current screenshots and make clear whether they show the production version, a beta or a prototype.',
        'Prepare deeper evidence for qualified conversations: read-only analytics, financial summaries, store dashboards, a live demonstration, architecture notes and selected code access. Remove secrets and customer data from anything shared. Keep a record of who receives confidential material.',
        'Answer the likely operational question: what must the buyer do during the first week? A concise runbook for support, releases, monitoring and incident response often matters more than a long feature list.'
      ]],
      ['Plan communication and transfer in stages', [
        'Qualify potential buyers by asking about their technical capability, intended use and timing. Agree on what they need to verify and share evidence gradually. If the app has a public user base, decide when and how ownership changes will be communicated.',
        'Build a transfer checklist for code, store records, domains, backend, databases, documentation, support channels, vendor accounts and credentials. Rotate secrets and verify each step from the buyer’s account. Define the transition support you will provide and when your access ends.',
        'Searya helps app owners and potential buyers find one another and communicate directly. It does not process the purchase, hold funds, guarantee store approval or manage the transfer. The parties must independently verify the app and choose suitable agreements, payment arrangements and professional advice.'
      ]],
      ['Prepare for the first month after transfer', [
        'A handover is successful only when the app still builds, reaches its backend and serves users after ownership changes. Schedule the transfer away from a major release when possible. Keep a tested rollback or recovery route, confirm current backups and identify which party responds if an outage occurs during the transition.',
        'Give the buyer a calendar of certificate expirations, subscription renewals, store deadlines, vendor invoices and planned releases. Include support templates and escalation contacts without disclosing personal information unnecessarily. The buyer should know which events require action before they become emergencies.',
        'After the agreed support period, verify that the buyer controls every required asset and that your access has been removed. Retain only records you are legally entitled or required to keep. A clean exit protects users, the buyer and the seller.'
        , 'Document completion with a final inventory acknowledged by both sides. Note any open store review, vendor migration or customer issue and assign responsibility and a due date. This simple written record meaningfully reduces avoidable uncertainty after the founder is no longer involved in daily operation.'
      ]]
    ]
  },

  '/guides/how-to-sell-a-side-project': {
    category: 'Founder Guides',
    title: 'How to Sell a Side Project Instead of Letting It Sit | Searya',
    description: 'Turn a working side project into a clear, transferable opportunity without pretending every project is abandoned or distressed.',
    h1: 'How to Sell a Side Project Instead of Letting It Sit',
    intro: 'A side project can become hard to justify even when it is useful. You may have changed priorities, reached the limit of your distribution skills, reduced your workload or built the product specifically to sell. That does not make the project a failure. A responsible sale process gives another operator a chance to evaluate what exists while giving you a structured way to move on.',
    links: ['/sell-your-digital-project', '/guides/how-to-find-buyers-for-a-digital-project', '/guides/selling-a-saas-with-no-revenue'],
    cta: ['Is your side project ready for a new operator?', 'Describe the working product, included assets and honest next steps in a Searya listing.', '/sell-your-digital-project', 'List your digital project'],
    sections: [
      ['Decide whether selling is the right outcome', [
        'Selling is one option alongside continuing, pausing, open-sourcing, licensing or shutting the project down. Consider how much maintenance it requires, whether users depend on it, what opportunity cost it creates and whether a transfer would be responsible. A project with serious privacy or ownership problems may need repair before it should be offered.',
        'Be clear about your motivation. Founders sell because they want to focus, need a different skill set, received unexpected interest, designed an asset for resale or no longer want the operating work. Avoid the assumption that every side project is unfinished or abandoned. The current stage is a fact to describe, not a moral judgement.',
        'Set a practical goal for the process. Do you want a quick asset transfer, a buyer who will support existing users, or the strongest possible price? The answer affects the information you prepare, the channels you use and the time you are willing to spend.'
      ]],
      ['Inventory what the buyer would receive', [
        'Create a line-by-line asset list: source code, domains, branding, design files, content, documentation, databases, analytics, email audiences, social accounts and vendor relationships. Mark ownership and transfer restrictions. Remove assets that belong to a client, employer or collaborator unless you have clear permission.',
        'List operating dependencies and costs. Include hosting, APIs, licences, support, content updates, billing and recurring manual tasks. A small project can be attractive because it is simple, but only if the buyer understands the true workload.',
        'Document users and commitments. Free users, lifetime customers, promised features and support expectations still matter even when revenue is small. A buyer is taking on relationships, not merely files.'
      ]],
      ['Finish the parts that reduce uncertainty', [
        'You do not need to complete every feature before listing. Focus on improvements that help another person evaluate and operate the product: a reliable demo, clean setup, working authentication, basic monitoring, backups and clear instructions. Cosmetic work matters less when the core cannot be run.',
        'Remove secrets, test accounts and personal data from repositories. Update dependencies where a known security issue creates immediate risk. Write down known bugs instead of quietly hoping the buyer will not notice them.',
        'If the project is a prototype, say so and show the boundary between functioning software and design concepts. A transparent prototype can still save time; a mockup presented as a finished system damages trust.'
      ]],
      ['Explain the opportunity in concrete language', [
        'A useful listing answers six questions: who the project serves, what problem it solves, what works today, what evidence of interest exists, what is included and what needs attention. This is more persuasive than a long story about market size or “unlimited potential.”',
        'Show measured usage, revenue or traffic with dates and definitions. If none exists, focus on product quality, niche insight, domain value, integrations and development time saved. Do not convert social likes or a waitlist into implied customers.',
        'Explain the reason for sale briefly. Buyers mainly need to know whether there is a hidden problem or an obligation they cannot see. A direct explanation such as “I am focusing on another company and cannot maintain two products” is enough when it is true.'
      ]],
      ['Price the project you have, not the dream', [
        'Consider verified financial performance, usable assets, replacement effort, distribution, technical condition and owner workload. Your development hours can help describe scope but do not automatically determine value. A buyer may need to redo work that does not fit their operation.',
        'Choose an asking price or range that leaves room for discussion without becoming meaningless. Identify which assumptions support it and which risks could change it. For a new product, the price may be driven more by asset quality and saved time than by future revenue forecasts.',
        'Be prepared for different buyer logic. One person may want the domain and audience; another may value the code; a third may want a functioning product in a niche they already serve. That does not mean every offer is fair, but it explains why value is not identical for all buyers.'
      ]],
      ['Find buyers and hand over responsibly', [
        'Use channels that match the project: digital-project discovery platforms, founder communities, niche groups, your network and selective direct outreach. A focused message to operators who understand the audience is often more useful than broad promotion to people who like startup content.',
        'Qualify interest before sharing private records or full repository access. Demonstrate the product, answer operational questions and agree on a due-diligence checklist. Protect customer data and rotate credentials during transfer.',
        'Searya lets project owners publish listings and speak directly with potential buyers. It does not process payments, provide escrow, verify every claim or become a party to an agreement. Use independent contracts, verification and professional advice appropriate to the project. A good outcome is not only finding a buyer; it is making sure both sides understand what is changing hands.'
      ]],
      ['Know when to pause the process', [
        'Pause if you cannot prove ownership, if important collaborators disagree, or if active users would be exposed to an unsafe transfer. Resolve these issues before accepting urgency from a potential buyer. A fast transaction is not useful when the project cannot be transferred cleanly.',
        'Also pause when a buyer refuses basic identity checks, pressures you to bypass written terms or asks for production credentials before a reasonable review. Curiosity does not create entitlement to sensitive access. A legitimate evaluation can be staged through demonstrations, redacted evidence and limited technical review.',
        'If interest is consistently weak, revisit the presentation, price and buyer profile before assuming the product is unsellable. You can improve documentation, continue operating, seek a licence arrangement or decide that an orderly shutdown is the better outcome.'
      ]]
    ]
  },

  '/guides/how-to-buy-a-small-saas': {
    category: 'Buying Digital Projects',
    title: 'How to Buy a Small SaaS Project: A Buyer Guide | Searya',
    description: 'A practical process for buying a small SaaS, from budget and sourcing to metrics, technical review, due diligence and handover.',
    h1: 'How to Buy a Small SaaS Project',
    intro: 'Buying a small SaaS can shorten the path to a working product, customers and operating knowledge, but it also concentrates decisions that are easy to underestimate. You are evaluating code, a business, customer promises and a transfer process at the same time. A disciplined search begins with your own limits before it begins with attractive listings.',
    links: ['/saas-for-sale', '/micro-saas-for-sale', '/guides/what-to-check-before-buying-a-saas'],
    cta: ['Explore small SaaS opportunities', 'Browse public projects, compare their scope and contact owners directly when there may be a fit.', '/micro-saas-for-sale', 'Discover micro SaaS projects'],
    sections: [
      ['Define your acquisition thesis', [
        'Write down your budget, preferred niche, technical skills, weekly operating capacity and growth strengths. Decide whether you want revenue, a user base, a technical foundation or a product that complements something you already operate. Without this filter, every polished listing can look temporarily attractive.',
        'Include post-purchase resources. The asking price is not the full cost. You may need legal review, infrastructure migration, design work, security fixes, customer support, marketing and several months of operating cash. Keep a reserve rather than spending the complete budget on the headline price.',
        'Identify your non-negotiables. You might require a particular stack, low founder involvement, no regulated data, documented deployment or customers in a specific geography. A short rejection list saves time and makes your questions more consistent.'
      ]],
      ['Source projects without lowering your standards', [
        'You can find opportunities through marketplaces, discovery platforms, founder communities, direct outreach and your professional network. Each source provides leads, not proof. A project appearing on a platform does not remove the need to verify identity, ownership and claims.',
        'Read the complete listing before contacting the owner. Compare the product stage, business model, technology, included assets, asking price and reason for sale with your thesis. Prepare questions based on missing information instead of sending a generic request for “more details.”',
        'Searya offers public SaaS and micro SaaS discovery pages and direct messaging with owners. It does not select investments for you or validate a project’s commercial quality. Treat each listing as the beginning of research.'
      ]],
      ['Understand revenue and customer behaviour', [
        'Request a monthly revenue and expense history with clear categories. Reconcile summaries to appropriate source records when the conversation becomes serious. Separate subscriptions from services, one-time payments and taxes. Confirm refunds, failed payments, annual-plan obligations and payment fees.',
        'Review customer count, plan distribution, churn, concentration and usage. A product with many dormant subscribers has a different risk from one with active daily workflows. If one customer dominates revenue, understand the contract, renewal and relationship.',
        'Ask how customers are acquired and why they leave. Paid growth that stops when advertising stops may require continuing capital. Organic traffic can also be fragile if it depends on a few rankings or a founder’s personal audience. Verify the source and durability rather than assigning a label such as “organic” or “recurring.”'
      ]],
      ['Measure the owner’s real involvement', [
        'Ask the owner to list weekly, monthly and exceptional tasks. Include support, sales, development, billing exceptions, vendor management, content, compliance and incident response. Compare claimed hours with support tickets, release history and the complexity of the product.',
        'Identify tacit knowledge: undocumented customer preferences, manual database fixes, private scripts and personal relationships. A product can appear automated while the founder quietly solves edge cases every day. Request a walkthrough of a normal operating week.',
        'Decide what work you can perform and what must be hired. Convert that into a realistic operating budget. A profitable product can become unprofitable when founder labour is replaced at market cost.'
      ]],
      ['Review technology and security', [
        'Have a qualified person inspect the architecture, code, deployment, database, backups, monitoring, dependencies and external services. Confirm that the product can be built and deployed using documented steps. Look for secrets in repositories, shared personal accounts and unsupported software.',
        'Review data access, permissions, encryption, logs, incidents and privacy obligations. Understand what user data exists and whether it can lawfully transfer. Check open-source and commercial licences, contractor assignments and ownership of key components.',
        'Estimate the first ninety days of technical work. Separate urgent security or reliability tasks from optional improvements. This estimate should affect both your offer and transition plan.'
      ]],
      ['Structure due diligence, agreement and handover', [
        'Use a checklist covering identity, legal ownership, financial records, customers, code, infrastructure, domains, intellectual property, contracts, liabilities and transfer restrictions. Record what was verified, what remains uncertain and which representations need to appear in an agreement. This guide is educational, not legal or financial advice.',
        'Compare the complete economics of any offer: price, payment timing, contingencies, transition support, retained obligations and what happens if a required asset cannot transfer. Choose independent legal, tax and payment support appropriate to the size and jurisdiction.',
        'Create a staged handover plan. Move repositories, domains, vendor services and credentials in an order that keeps the product operating. Rotate secrets, verify backups and communicate with customers when required. Searya does not process the transaction or hold funds; buyer and seller arrange due diligence, contracts, payment and transfer independently.'
      ]],
      ['Plan the first ninety days as the new owner', [
        'Before completing a purchase, write a ninety-day operating plan. The first phase should preserve service: obtain access, monitor stability, meet important customers and learn recurring tasks. Avoid changing pricing, infrastructure and positioning simultaneously unless an urgent risk requires it.',
        'The second phase can address critical technical debt, documentation gaps and acquisition experiments. Define a small set of measures such as activation, retention, support volume, reliability and cash flow. They help you distinguish transition noise from a genuine change in business quality.',
        'Decide in advance how much additional capital and time you will commit if performance weakens. An acquisition thesis needs downside boundaries as well as growth ideas. A purchase should remain one considered option among building, partnering or continuing to search.'
        , 'Arrange access so you can operate without depending on the seller’s personal accounts. Test billing, password recovery, backups, deployment and support from the new owner’s credentials. Complete these checks before the transition window closes, while the person with historical knowledge is still available to explain unexpected behaviour.'
      ]]
    ]
  },

  '/guides/what-to-check-before-buying-a-saas': {
    category: 'Valuation & Due Diligence',
    title: 'What to Check Before Buying a SaaS: Due Diligence Guide | Searya',
    description: 'A practical SaaS due diligence checklist covering finances, customers, traffic, code, infrastructure, security, ownership and transferability.',
    h1: 'What to Check Before Buying a SaaS',
    intro: 'Due diligence is the process of testing whether a SaaS matches the story, numbers and assets presented by its owner. It cannot eliminate every risk, but it can expose assumptions before they become expensive. The depth of review should match the project’s size, complexity, data sensitivity and your ability to absorb a problem.',
    links: ['/saas-for-sale', '/guides/how-to-buy-a-small-saas', '/legal/transfer-checklist.html'],
    cta: ['Use the checklist on a real opportunity', 'Browse SaaS listings and start a direct conversation when a project fits your acquisition criteria.', '/saas-for-sale', 'Explore SaaS projects'],
    sections: [
      ['Verify revenue, expenses and cash obligations', [
        'Request monthly revenue by type and compare it with payment-processor, bank or accounting evidence at an appropriate stage. Distinguish subscriptions, services, one-time fees, taxes, refunds and chargebacks. Check whether annual plans create future support obligations for cash already received.',
        'List every operating expense: hosting, APIs, email, contractors, software, advertising, payment fees, support and compliance. Look for founder-paid costs that never entered the business account. Estimate the cost of replacing essential founder labour rather than assuming it remains free.',
        'Understand liabilities and commitments. Customer credits, lifetime plans, prepaid contracts, vendor minimums and promised custom work may not appear in a simple profit statement. Review the proposed transfer structure with qualified advisers when necessary.'
      ]],
      ['Examine customer concentration and churn', [
        'Calculate how much revenue comes from the largest customers and whether their contracts can continue after a transfer. High concentration is not automatically unacceptable, but it means one cancellation can materially change the economics.',
        'Review customer and revenue churn over consistent periods, with the underlying counts. Ask about upgrades, downgrades, failed payments, reactivations and cohorts. A single blended percentage can hide important differences between new and established customers.',
        'Inspect support themes and cancellation reasons. Repeated complaints about reliability, missing features or pricing reveal future workload. Protect customer privacy during this review; use redacted records and controlled access rather than downloading unnecessary personal data.'
      ]],
      ['Validate traffic and acquisition', [
        'Use read-only analytics where possible to verify traffic volume, geography, sources, landing pages and conversion events. Look across enough time to see seasonality and isolated spikes. Confirm that the analytics property belongs to the product and that filters or tracking changes have not distorted comparisons.',
        'For search traffic, inspect which pages and queries drive visits and whether a few rankings create most of the volume. For paid acquisition, review spend, attribution, payback and what happens when campaigns stop. For partnerships or founder audiences, check whether the relationship is transferable.',
        'Do not treat followers, impressions or total visits as customers. Connect acquisition sources to sign-ups, activation, payment and retention. If attribution is weak, model uncertainty instead of filling the gap with optimistic assumptions.'
      ]],
      ['Review code, infrastructure and dependencies', [
        'A technical reviewer should examine architecture, code quality, test coverage, deployment, monitoring, backups, database design and scaling constraints. Verify that the repository builds and that production can be deployed from documented instructions. Identify manual operations and single points of failure.',
        'List external APIs, cloud services, authentication, email, analytics and payment providers. Check cost, quotas, account ownership and transfer rules. A core integration that cannot move may require a costly replacement immediately after purchase.',
        'Inspect licences for open-source and commercial components. Confirm contractor and employee assignments. Review known vulnerabilities, incident history and unsupported versions. Create a prioritized remediation estimate rather than a vague technical-debt label.'
      ]],
      ['Check legal ownership, privacy and security', [
        'Confirm who owns the company, source code, brand, domains, content, designs and data rights. Review relevant incorporation records, contributor agreements, trademark information and material contracts. Make sure the seller has authority to transfer the proposed assets.',
        'Understand what personal or sensitive data the SaaS stores, why it is collected, where it is hosted and who can access it. Review privacy notices, consent, deletion processes, processors and security controls. Data transfer can create obligations that require jurisdiction-specific advice.',
        'Ask about security incidents, unresolved reports, access logs, secrets, encryption and backup restoration. Do not rely solely on the absence of reported breaches. Evaluate whether the controls fit the data and risk involved.'
      ]],
      ['Test transferability and write a handover plan', [
        'Confirm that domains, repositories, cloud projects, payment relationships, email services, analytics, support systems and vendor accounts can transfer or be recreated. Document the exact method for each. A seller’s willingness to share a password does not make an account transfer compliant or safe.',
        'Create an acceptance checklist and sequence. Verify backups, transfer ownership, rotate credentials, test critical workflows and remove the seller’s access at the agreed time. Define transition support, customer communication and responsibility for issues discovered after handover.',
        'This guide is general educational information, not legal, financial, tax or security advice. Searya helps buyers discover projects and contact owners, but it does not verify claims, process the acquisition, hold funds or provide escrow. Use independent specialists where the risk warrants them.'
      ]],
      ['Turn findings into a decision record', [
        'Summarize each material finding as verified, partially verified, unverified or contradicted. Record the source, impact and proposed response. This keeps one impressive demonstration or one uncomfortable detail from dominating the complete decision.',
        'Convert risks into actions: reduce the offer, require remediation, change the transfer sequence, add an appropriate contractual protection or walk away. Some uncertainty is normal; unmanaged uncertainty is a choice. Set a deadline for missing evidence so the process does not continue indefinitely.',
        'Have technical, legal and financial reviewers communicate across their areas. A vendor-account restriction may affect the architecture, economics and contract at the same time. The final decision should reflect the combined operating reality rather than three isolated reports.'
        , 'Keep the decision record after the transfer. It becomes the first risk register for the new owner and shows which assumptions require monitoring. If you decide not to proceed, it also helps refine the criteria for the next opportunity instead of repeating the same investigation from zero. Record the reason clearly, while the evidence is still fresh, and distinguish a problem with this particular project from a change to your broader acquisition plan. Assign an owner and review date to every accepted risk so that a known weakness does not quietly become an unmanaged operating problem.'
      ]]
    ]
  },

  '/guides/buy-app-vs-build-from-scratch': {
    category: 'Buying Digital Projects',
    title: 'Buy an Existing App or Build From Scratch? | Searya',
    description: 'Compare buying an existing app with building from scratch across time, cost, validation, flexibility, technical debt, risk and maintenance.',
    h1: 'Buy an Existing App or Build From Scratch?',
    intro: 'Buying an app is not automatically faster, and building from scratch is not automatically safer. The right choice depends on what has already been validated, how well the existing asset fits your plan and whether your team can understand and operate it. Compare the complete path to a reliable product, not just the purchase price against the first development estimate.',
    links: ['/mobile-apps-for-sale', '/guides/how-to-sell-an-app', '/guides/what-to-check-before-buying-a-saas'],
    cta: ['Want to evaluate existing mobile products?', 'Explore app listings, review what each owner includes and start a direct conversation when there may be a fit.', '/mobile-apps-for-sale', 'Discover mobile app projects'],
    sections: [
      ['Compare the real cost of each path', [
        'A new build includes research, design, engineering, backend work, testing, store preparation, analytics, legal documents and project management. It also includes the cost of wrong decisions discovered after users arrive. A purchase includes price, review, legal support, migration, refactoring, transition and operating capital.',
        'Create two budgets with the same destination and time horizon. If the purchased app needs a redesign and backend replacement, include them. If the new build needs six months before testing demand, include the team cost and lost time. Avoid comparing a finished acquisition with a rough prototype estimate.',
        'Consider opportunity cost. Reaching the market earlier can matter, but only when the existing product is close enough to your intended use. Speed has little value if you spend the next year undoing unsuitable foundations.'
      ]],
      ['Decide how much validation you are buying', [
        'An existing app may provide users, reviews, retention data, support history and revenue. Those signals can reduce uncertainty about the problem and audience. They do not guarantee future performance under new ownership or after major product changes.',
        'Verify activation, retention and meaningful usage rather than relying on total downloads. Read both positive and negative reviews. Understand acquisition sources and whether they continue without the founder. A dormant user base or one-time launch spike may offer less validation than it first appears.',
        'A new build gives you no inherited usage, but it lets you validate deliberately with interviews, prototypes and small experiments. If the existing app has not tested the assumptions central to your plan, its age alone is not evidence.'
      ]],
      ['Evaluate technical fit and debt', [
        'Buying can provide a functioning codebase, store presence and infrastructure. It can also bring outdated dependencies, weak tests, security gaps and undocumented decisions. Have someone capable inspect the complete system and estimate urgent work before you commit.',
        'Building gives you control over architecture and standards, but new code is not automatically high quality. Your team can still choose poorly, underestimate edge cases or create debt under deadline. The advantage is alignment: the architecture can be designed around your known requirements and skills.',
        'Ask whether your team can maintain the existing stack. A technically sound app in an unfamiliar ecosystem may be slower for you than building in a stack you operate well. Conversely, rewriting solely for familiarity can destroy the time advantage you intended to buy.'
      ]],
      ['Compare flexibility with inherited constraints', [
        'A new build lets you shape the brand, workflow, data model and business model from the beginning. This is valuable when differentiation depends on a distinctive experience or when regulation requires specific controls.',
        'An existing app comes with user expectations, store history, identifiers, subscriptions and technical choices. Changing them may affect reviews, retention or platform approval. Those constraints can be assets when they represent trust, but liabilities when your plan requires a different product.',
        'Write the first-year roadmap and mark which items the current app supports, blocks or makes irrelevant. If most of the product must change, buying may be an expensive detour. If the core workflow and audience already fit, acquisition may remove substantial execution risk.'
      ]],
      ['Account for operational and transfer risk', [
        'An acquisition requires proof of ownership, transferable store records, code rights, vendor accounts, privacy compliance and a careful credential handover. Existing customers create support and service obligations on day one. The transition can fail even when the app itself is good.',
        'A new build avoids inherited liabilities but creates its own risks: store rejection, missing demand, schedule overruns and no existing support knowledge. You still need privacy, security, monitoring and operational processes before launch.',
        'Score both paths against the risks your team is equipped to manage. A growth-focused buyer may accept technical cleanup; a strong engineering team may prefer to build but lack distribution. The answer depends on comparative advantage, not a universal rule.'
      ]],
      ['Use a decision framework instead of momentum', [
        'Define the outcome, deadline, budget, essential features, target user and success evidence. Then assess build and buy options across total cost, time to validation, technical fit, user value, flexibility, operating workload and downside. Use ranges where information is uncertain.',
        'If buying, set a due-diligence threshold and walk away when ownership, code, data or store transfer cannot be verified. If building, set validation milestones that can stop the project before the full budget is spent. Both routes benefit from explicit exit conditions.',
        'Searya can help you discover mobile apps and speak directly with their owners. It does not recommend a specific acquisition, inspect the app, process payment or manage transfer. Treat listings as starting points, verify claims independently and select legal, technical and financial support appropriate to the decision.'
      ]],
      ['Run a small proof before making the full commitment', [
        'When building, test the hardest assumption with a prototype, landing page or manual workflow before funding the entire roadmap. Measure whether the target users understand the value and take a meaningful next step. A proof should answer a defined question, not merely produce encouraging comments.',
        'When buying, request a product demonstration and controlled access to relevant evidence. A technical reviewer can test a build, examine architecture and validate key integrations without receiving unrestricted production credentials. Confirm that the workflow you value is real and maintainable.',
        'Use what you learn to update cost, timing and risk ranges for both options. The purpose is not to prove the route you already prefer. It is to make the least reversible decision with better information.'
      ]]
    ]
  },

  '/guides/how-to-find-buyers-for-a-digital-project': {
    category: 'Founder Guides',
    title: 'How to Find Buyers for a Digital Project | Searya',
    description: 'Find potential buyers for a SaaS, app, website or digital project through marketplaces, communities, outreach, users and buyer requests.',
    h1: 'How to Find Potential Buyers for a Digital Project',
    intro: 'Finding a buyer is a matching problem. The best audience is rarely everyone who follows startup news; it is the smaller group that understands the users, technology or distribution and has the resources to operate the project. A clear buyer profile, credible information and focused outreach usually matter more than raw exposure.',
    links: ['/sell-your-digital-project', '/guides/where-to-sell-a-saas', '/guides/how-to-sell-a-side-project'],
    cta: ['Make your project discoverable', 'Create an accurate Searya listing and let potential buyers contact you directly.', '/sell-your-digital-project', 'List your digital project'],
    sections: [
      ['Define the likely buyer before choosing channels', [
        'Describe the skills, audience and operating capacity the project needs. A developer tool may suit another technical founder; a niche content site may suit an operator with advertising relationships; a mobile app may appeal to a company with an existing acquisition channel. This profile guides where you search and what you emphasize.',
        'Identify strategic buyers as well as individual operators. A company may value technology, content, users, a domain, an integration or access to a niche. The connection must be specific. “This could make money” is not a strategic thesis.',
        'Set qualification criteria for budget, timing, technical ability and intent. You are not trying to reject everyone quickly; you are preventing sensitive information and time from flowing into conversations that cannot progress.'
      ]],
      ['Use marketplaces and discovery platforms thoughtfully', [
        'A marketplace or discovery platform can reach people already looking for projects. Choose one whose audience matches the asset and understand its role. Some platforms broker transactions; others provide listings and direct communication. Review fees, eligibility, confidentiality and whether any verification is actually performed.',
        'Write a listing that explains the user, problem, product stage, technology, evidence, workload, included assets and limitations. Use a specific title and current screenshots. An accurate listing attracts fewer but more relevant questions than a page built from superlatives.',
        'Searya supports two-way discovery: owners can list projects, while buyers can publish Looking to Buy requests. That can help a founder find people whose stated criteria match the project. Searya facilitates discovery and messaging only; it does not process the transaction or hold funds.'
      ]],
      ['Participate in relevant communities', [
        'Founder, developer and niche-industry communities can provide context and referrals. Contribute according to the community rules and explain the project in language members use. A useful post states what exists and what kind of operator would be a fit rather than presenting a vague investment opportunity.',
        'Smaller communities can outperform large ones when members understand the problem. Consider technology groups, industry associations, product communities and local founder networks. Avoid posting confidential customer or financial details in public threads.',
        'Move serious interest into a documented private process. Community reputation is a helpful signal but not a substitute for identity checks, due diligence or appropriate agreements.'
      ]],
      ['Ask your network and existing users', [
        'Former colleagues, contractors, partners, investors, agency owners and other founders may know suitable buyers. Give them a short, forwardable description and define the type of person you hope to meet. Specific requests are easier to act on than “please share this everywhere.”',
        'Existing users may include capable operators or companies with a strategic reason to own the product. Approach this carefully. A sale conversation can create concern about continuity, so do not broadcast sensitive plans without considering customer relationships and confidentiality.',
        'If a customer expresses interest, maintain clear boundaries between their service relationship and the acquisition discussion. A large customer may have commercial leverage, and independent advice can be useful before sharing detailed terms.'
      ]],
      ['Run selective direct outreach', [
        'Build a short list of people or companies with an identifiable reason to care. Research their products, markets and acquisition history. Contact the person likely responsible for product, strategy or ownership rather than sending a mass message to generic addresses.',
        'A good first note names the project category, states that you are exploring a transfer, explains one relevant connection and asks whether a short summary would be useful. Do not attach repositories, customer lists or private dashboards. The goal is permission for a conversation, not completion of the sale in one email.',
        'Track outreach and follow up once when appropriate. A low response rate does not necessarily mean the project has no value; it may mean the target or message is wrong. Refine the buyer thesis before simply increasing volume.'
      ]],
      ['Turn attention into a reliable process', [
        'Prepare a consistent information pack, staged evidence and answers to common questions. Track each contact, source, status, documents shared and next step. This reduces contradictory answers and protects confidential material.',
        'Qualify interest before deep due diligence. Ask about the buyer’s experience, funding, intended use, timeline and technical plan. At the same time, answer legitimate questions directly and disclose known risks. Trust is reciprocal.',
        'When a conversation becomes serious, agree on verification, scope, timing, transition support and the professionals involved. Choose independent payment and legal arrangements; never assume the discovery channel protects the transaction. The goal is not the highest message count. It is a small set of informed buyers who can understand, verify and operate what you built.'
      ]],
      ['Improve the process using buyer questions', [
        'Track questions that appear repeatedly. If several credible buyers cannot understand the revenue mix, transfer scope or workload, improve the listing or information pack. These patterns are useful feedback even when a particular conversation ends.',
        'Separate objections you can resolve from mismatches you cannot. Better documentation may address technical uncertainty, but it will not make a consumer app fit a buyer seeking enterprise software. Refine targeting before changing the project simply to satisfy one person.',
        'Keep public information current while you search. Update material changes in users, revenue, price, product status and included assets. Close the listing when the project is no longer available. Reliable discovery depends on owners presenting the same current reality to every potential buyer.'
        , 'Measure the funnel from suitable exposure to qualified conversation, not just clicks. Record which channel produced each credible contact and why discussions stopped. Over time, this reveals whether the limitation is targeting, evidence, price, transferability or buyer readiness, giving you a specific area to improve.'
      ]]
    ]
  }
});
