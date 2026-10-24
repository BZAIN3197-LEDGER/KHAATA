# KHAATA project audit

This package contains the source changes prepared during the project audit. They are not live until committed to the connected GitHub repository and deployed.

## Changes included

- Added Privacy Policy and Terms of Use pages describing AI processing, World Bank requests, hosting, advertising cookies, limitations and user responsibilities.
- Added legal links to the information pages and added homepage metadata/canonical URL.
- Added `robots.txt` and `sitemap.xml` for the public pages.
- Improved economic-indicator labels and formatting, displayed observation years, and replaced missing/null values with “Unavailable”.
- Changed AI-generated output rendering to use text nodes rather than interpolating generated strings into HTML.
- Explicitly referenced the manual-city input instead of relying on a browser's implicit global variable behaviour.
- Added input validation and an 8-second timeout to the city lookup API.
- Updated the local Express server to use the same API handlers as the serverless deployment.
- Added `npm start` and a static validation test suite (`npm test`).

## Validation performed

- `npm test` passes.
- `node --check` passes for `api/analyze.js`, `api/cities.js` and `server.js`.
- Inline homepage JavaScript syntax, local HTML links, required pages, `ads.txt`, `robots.txt` and `sitemap.xml` are checked by the test script.
- `sitemap.xml` parses as valid XML.

## Still requires owner action

1. Review the legal pages for accuracy and add a real support/contact address if you have one. No contact address was invented.
2. Commit/push the changed files to GitHub and deploy through Vercel. This package has not been pushed or deployed by this audit.
3. After deployment, check `/privacy.html`, `/terms.html`, `/robots.txt`, `/sitemap.xml` and test a second country through the live budget generator.
4. In AdSense, verify that the publisher ID in `ads.txt` matches the account and request another review only after the site is live. Policy approval is not guaranteed by technical fixes alone.

## Important note

KHAATA's budgets are AI-generated estimates, not verified local prices or professional financial advice. World Bank observations can have different years or be unavailable for a country/indicator.
