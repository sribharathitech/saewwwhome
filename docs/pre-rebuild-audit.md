# Pre-rebuild audit

Audit date: 29 August 2026

- The repository contained one tracked file, `SAE.html`, with the text “SAE is always great!”. It had no relationship to the public site and was removed in the rebuild.
- No CNAME, logo, favicon, robots.txt, redirects, analytics, verification token or production HTML existed in the repository.
- The deployed parent site was a separate legacy one-page Hugo build and was not represented in this repository.
- The legacy homepage used a relative canonical and relative Open Graph URLs.
- `robots.txt` returned 404.
- `sitemap.xml` used relative `<loc>` values and listed the thin `/categories/` and `/tags/` taxonomies.
- The deployed page relied on multiple legacy CSS/JavaScript libraries for a small gateway experience.
- The existing official Sri Bharathi logo was retained from the public technology division. The colour variant is used in the light header and converted to white through CSS in the dark footer.
- The filtration and technology specialist sites contain detailed, usable product/service paths and verified shared contact information.
- The chemical site contains generic placeholder links and a placeholder telephone URI; these were not carried into the parent site.
- No existing repository URL requires a migration redirect. The legacy live `/categories/` and `/tags/` are intentionally excluded from the new sitemap.
