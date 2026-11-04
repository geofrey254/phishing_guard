# PhisherMan

PhisherMan is a browser-based phishing awareness and triage dashboard. It
analyses URLs, pasted email messages, and website URL structures for common
phishing indicators, then presents a risk score, classification, triggered
rules, and a recommended action.

The project is designed for quick, explainable checks. It does not open or
fetch remote websites, inspect live page content, verify sender infrastructure,
or replace a security product or human investigation.

## Features

- URL scanning with explainable, rule-based indicators
- Email analysis for suspicious wording, links, financial requests, and
  impersonation
- Website URL analysis with additional brand-variant and hostname checks
- Risk classifications and recommended next steps
- Unified scan history with type and risk filters
- Local-only history storage in the browser
- Responsive dashboard UI for desktop and smaller screens

## How to run the project

### Requirements

- Node.js compatible with the installed Next.js version
- npm

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser.

### Other commands

```bash
npm run lint    # Run ESLint
npm run build   # Create a production build
npm run start   # Start the production server after building
```

## Using the dashboard

The sidebar provides five areas:

- **Dashboard** (`/`) - Overview of the available analysis tools and recent
  scan activity.
- **URL Scanner** (`/url-analysis`) - Analyse a URL or domain name.
- **Email Analysis** (`/email-analysis`) - Analyse an email subject and body.
- **Website Analysis** (`/website-analysis`) - Analyse website URL structure
  using website-focused rules.
- **Scan History** (`/history`) - Review, filter, and delete saved results.

Each completed URL, email, or website analysis is added to the history list.
The history keeps the 40 most recent entries.

## How each tool works

### URL Scanner

1. Enter a URL or domain, with or without `http://` or `https://`.
2. PhisherMan normalises domains without a protocol to `https://`.
3. The scanner parses the hostname, path, query string, and full URL.
4. It evaluates the following indicators:
   - IP address used as the hostname
   - Suspicious words such as `login`, `verify`, `secure`, `account`, or
     `password`
   - A URL containing an `@` symbol
   - Excessive subdomains
   - Suspicious terms in the path or query string
   - A hostname that resembles a known brand
5. The tool adds the score for each triggered rule, caps the result at 100,
   classifies the result, and displays the rule explanations.

Supported protocols are HTTP and HTTPS. Invalid or empty input is rejected
before analysis.

### Email Analysis

1. Paste the email subject and message body.
2. The analyser combines both fields and compares the text case-insensitively
   with rule lists.
3. It checks for:
   - Urgent or threatening language
   - Requests for passwords or sensitive information
   - External links
   - Payment or financial requests
   - Brand or trusted-organisation impersonation
   - Attachment or file references
   - Common misspellings associated with suspicious messages
   - Common phishing phrases such as “verify your account” or “click here”
4. Matching rules contribute points to the score. The result includes the
   warning signs found and a recommended response.

The email body is required. The subject may be blank, in which case the
analysis labels it as “No subject provided”.

### Website Analysis

Website Analysis is a URL-only inspection with a separate set of rules aimed
at deceptive website structures. It checks for:

- An IP address or other raw address used as the hostname
- Brand impersonation using lookalike names, repeated characters, digit
  substitutions, or small spelling differences
- Suspicious domain or path words such as `login`, `verify`, `payment`, or
  `support`
- More than two subdomain levels
- An `@` character in the full URL
- Credential-related or urgent wording in the path and query string

This tool does not download the website or analyse its HTML, scripts,
certificates, redirects, or hosting provider.

### Scan History

History combines results from all three analysis tools. Each record stores the
analysis type, reference label, score, classification, summary, and timestamp.
You can:

- Filter by analysis type: URL, Email, Website, or All
- Filter by classification: Low Risk, Suspicious, Potential Phishing, or All
- Select a record to view its score and summary
- Delete individual records

History is saved with the browser `localStorage` key
`phishing-guard-history`. It is not sent to a server and is specific to the
browser profile and device where the scan was performed.

## Risk scoring

All tools produce a score from 0 to 100 and use the following classifications:

| Classification         | Score and meaning                                                                   | Recommended response                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Low Risk**           | Below 30; no strong indicators were found in the supplied content or URL structure. | Continue cautiously and verify the destination before entering credentials.                       |
| **Suspicious**         | 30-59; several characteristics resemble deceptive activity.                         | Confirm the domain or sender through an official channel and avoid rushed actions.                |
| **Potential Phishing** | 60 or higher, or a strong brand-impersonation match.                                | Do not enter credentials or personal information; avoid the link and report it where appropriate. |

Scores are heuristic signals, not proof that a message or website is safe or
malicious. A low score can still represent a threat, and a high score should
be investigated using additional security controls.

## Technology

- [Next.js](https://nextjs.org/) 16 with the App Router
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/) for interface icons
- Browser `localStorage` for scan history

## Project structure

```text
app/
  page.tsx                    Dashboard
  url-analysis/page.tsx      URL Scanner
  email-analysis/page.tsx    Email Analysis
  website-analysis/page.tsx  Website Analysis
  history/page.tsx           Scan History
components/                  Shared UI components
lib/
  detection.ts               URL rules, scoring, and shared risk types
  email-analysis.ts          Email rules and scoring
  website-analysis.ts        Website URL rules and scoring
  history.ts                 Browser history persistence
```

## Safety and privacy notes

Do not paste real passwords, access tokens, private keys, or other secrets into
the application. Although history is stored locally, browser storage can be
read by other code running in the same browser origin. Treat results as
guidance for awareness and triage, not as a security guarantee.
