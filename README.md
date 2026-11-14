# PhishGuard

PhishGuard is a browser-based phishing email awareness and triage tool. It
analyses pasted email messages for common phishing indicators, then presents a
risk score, classification, triggered rules, and a recommended action.

The project is designed for quick, explainable checks. It does not open or
fetch remote websites, inspect live page content, verify sender infrastructure,
or replace a security product or human investigation.

## Features

- Email analysis for suspicious wording, links, financial requests, and
  impersonation
- Risk classifications and recommended next steps
- Local-only history storage in the browser

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

The application opens directly to **Email Analysis** (`/email-analysis`),
where you can analyse an email subject and body. Each completed analysis is
saved locally for continuity, but no other analysis modes are exposed in the
application navigation.

## How email analysis works

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

Analysis history is saved with the browser `localStorage` key
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
  page.tsx                    Redirect to Email Analysis
  email-analysis/page.tsx    Email Analysis
components/                  Shared UI components
lib/
  detection.ts               Shared risk types and scoring helpers
  email-analysis.ts          Email rules and scoring
  history.ts                 Browser history persistence
```

## Safety and privacy notes

Do not paste real passwords, access tokens, private keys, or other secrets into
the application. Although history is stored locally, browser storage can be
read by other code running in the same browser origin. Treat results as
guidance for awareness and triage, not as a security guarantee.
