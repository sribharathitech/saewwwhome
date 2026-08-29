# Sri Bharathi SEO Strategy

## Positioning and entity model

`sribharathi.com` is the corporate entity hub. It defines the relationship between Sri Bharathi and its filtration, technology and chemicals businesses, provides cross-division context, and routes technical enquiries. Product-level filtration content remains on `filter.sribharathi.com`; detailed software and AI services remain on `tech.sribharathi.com`; detailed chemical services remain on `chemical.sribharathi.com`.

The shared `Organization` JSON-LD entity uses `https://sribharathi.com/#organization` on every indexable page. Division organizations are expressed as `subOrganization` entries with their official URLs. No rating, review, offer, certification or unverified legal-entity schema is used.

## Keyword and search-intent map

| URL | Primary topic | Intent | Secondary topics | H1 | Parent | Priority links |
|---|---|---|---|---|---|---|
| `/` | Sri Bharathi corporate group | Branded/corporate | filtration, technology, chemicals | Engineering clarity across industry and technology | — | all major sections and divisions |
| `/about/` | about Sri Bharathi | Corporate research | group structure, business divisions | One corporate identity. Three specialist businesses. | `/` | three division sites |
| `/businesses/` | Sri Bharathi businesses | Navigation/comparison | filtration, chemicals, software | Three businesses, clearly defined | `/` | all division pages and sites |
| `/filtration/` | industrial filtration solutions | Commercial investigation | filter pads, papers, cartridges, lenticular | Industrial filtration built around the process duty | `/businesses/` | filtration product and application pages |
| `/technology/` | enterprise software and AI services | Commercial investigation | mainframe, Java, AI, testing, mobile | Enterprise technology that respects operational reality | `/businesses/` | specialist technology service pages |
| `/chemicals/` | chemical manufacturing services | Commercial investigation | contract, custom, blending, private label | Chemical manufacturing services shaped by the specification | `/businesses/` | specialist chemical service pages |
| `/industries/` | industries served | Industry investigation | pharmaceutical, gelatin, food, oil, enterprise | Capabilities connected to industry challenges | `/` | relevant division/application pages |
| `/innovation/` | industrial and digital innovation | Informational/corporate | computer vision, trials, engineering | Innovation starts with a problem worth solving | `/` | technology, filtration resource |
| `/quality/` | Sri Bharathi quality approach | Trust/informational | requirements, verification, documentation | Quality is evidence against a defined requirement | `/` | filtration quality and documents |
| `/resources/` | technical resources | Informational/navigation | filtration guides, manufacturing, software | Technical context for better questions | `/` | guide and specialist libraries |
| `/resources/understanding-depth-filtration/` | depth filtration | Informational | media properties, trials, selection | Understanding depth filtration | `/resources/` | filtration overview and specialist selection pages |
| `/contact/` | contact Sri Bharathi | Contact/navigation | filtration enquiry, technology enquiry, chemical enquiry | Route your enquiry to the right team | `/` | all specialist contact routes |

## Internal-linking plan

- The persistent header exposes corporate sections in plain HTML; the footer exposes company, business and specialist-site routes.
- Homepage links to every major topic family, and each page includes a contact route.
- `/businesses/` links to all parent-level division pages and their specialist websites.
- `/industries/` links to the most relevant verified application or technology service page rather than forcing every division into every industry.
- Division pages deep-link to detailed specialist content using descriptive anchors.
- Resources link to their parent capability and to the detailed specialist library.

## URL and migration policy

- Directory URLs with consistent trailing slashes are canonical.
- GitHub Pages serves each route through a committed `index.html`.
- The repository had no prior production pages to redirect. The legacy live site exposed `/categories/` and `/tags/` only through a malformed Hugo sitemap; they contain no valuable corporate content and are not recreated or submitted.
- GitHub Pages cannot issue configurable server-side 301 redirects. If external backlink data later reveals a valuable retired URL, add a focused static compatibility page and configure an edge-level 301 if hosting infrastructure becomes available.

## Content guardrails

- Claims are restricted to the public corporate and division sites audited on 29 August 2026.
- The chemical site contains generic template links and a placeholder phone number; those were excluded.
- No certification is generalised from one division to the parent group.
- No customer names, capacity, revenue, employee count, awards, invented locations, ratings or prices are used.
