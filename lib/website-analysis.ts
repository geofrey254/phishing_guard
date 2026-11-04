import type { DetectionRule, RiskClassification } from "@/lib/detection";
import { getRiskClassification, validateUrlInput } from "@/lib/detection";

export interface WebsiteAnalysisResult {
  url: string;
  score: number;
  classification: RiskClassification;
  triggeredRules: DetectionRule[];
  rules: DetectionRule[];
  summary: string;
  timestamp: string;
}

const SUSPICIOUS_DOMAIN_KEYWORDS = [
  "login",
  "verify",
  "secure",
  "update",
  "confirm",
  "account",
  "alert",
  "support",
  "payment",
];

const BRAND_VARIANTS = [
  "microsoft",
  "google",
  "apple",
  "amazon",
  "paypal",
  "netflix",
  "dropbox",
  "icloud",
  "facebook",
  "bankofamerica",
  "office365",
];

function buildRule(
  id: string,
  label: string,
  score: number,
  description: string,
  triggered: boolean,
): DetectionRule {
  return { id, label, score, description, triggered };
}

function normalizeBrandInput(value: string) {
  const digitMap: Record<string, string> = {
    "0": "o",
    "1": "l",
    "3": "e",
    "4": "a",
    "5": "s",
    "7": "t",
    "8": "b",
    "9": "g",
  };

  return value
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/\.[a-z0-9-]+$/, "")
    .replace(/[^a-z]/g, "")
    .split("")
    .map((char) => digitMap[char] ?? char)
    .join("")
    .replace(/(.)\1+/g, "$1");
}

function levenshteinDistance(a: string, b: string) {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const previousRow = Array.from({ length: b.length + 1 }, (_, index) => index);
  const currentRow = new Array(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i += 1) {
    currentRow[0] = i;

    for (let j = 1; j <= b.length; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      currentRow[j] = Math.min(
        previousRow[j] + 1,
        currentRow[j - 1] + 1,
        previousRow[j - 1] + substitutionCost,
      );
    }

    for (let j = 0; j <= b.length; j += 1) {
      previousRow[j] = currentRow[j];
    }
  }

  return previousRow[b.length];
}

function looksLikeBrandVariant(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/^www\./, "");
  const baseHost = normalized.replace(/\.[a-z0-9-]+$/, "");
  const normalizedHost = normalizeBrandInput(baseHost);

  return BRAND_VARIANTS.some((brand) => {
    const cleanBrand = brand.replace(/[^a-z]/g, "");
    const brandPattern = new RegExp(`(^|\\.)${cleanBrand}(\\.|$)`);

    if (brandPattern.test(normalized) || normalizedHost === cleanBrand) {
      return false;
    }

    const hostAgainstBrand = normalizedHost.includes(cleanBrand);
    const brandAgainstHost = cleanBrand.includes(normalizedHost);
    const nearMatch =
      Math.abs(normalizedHost.length - cleanBrand.length) <= 2 &&
      levenshteinDistance(normalizedHost, cleanBrand) <= 2;

    return hostAgainstBrand || brandAgainstHost || nearMatch;
  });
}

export function analyseWebsite(rawUrl: string): WebsiteAnalysisResult {
  const validatedUrl = validateUrlInput(rawUrl);
  const parsed = new URL(validatedUrl);
  const hostname = parsed.hostname.toLowerCase();
  const pathAndQuery = `${parsed.pathname}${parsed.search}`.toLowerCase();
  const fullUrl = parsed.href.toLowerCase();

  let score = 0;
  const rules: DetectionRule[] = [];

  const addRule = (
    id: string,
    label: string,
    scoreValue: number,
    description: string,
  ) => {
    score += scoreValue;
    rules.push(buildRule(id, label, scoreValue, description, true));
  };

  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(":")) {
    addRule(
      "ip-hostname",
      "IP address used as hostname",
      25,
      "The hostname is an IP address instead of a normal domain, which is a common indicator of deceptive or malicious websites.",
    );
  } else {
    rules.push(
      buildRule(
        "ip-hostname",
        "IP address used as hostname",
        25,
        "The hostname does not use a raw IP address, which is more consistent with a regular site.",
        false,
      ),
    );
  }

  const hasBrandImpersonation = looksLikeBrandVariant(hostname);
  if (hasBrandImpersonation) {
    addRule(
      "brand-imitation",
      "Brand impersonation pattern",
      35,
      "The domain name resembles a well-known brand but is not presented as the official brand host, which is a classic phishing tactic.",
    );
  } else {
    rules.push(
      buildRule(
        "brand-imitation",
        "Brand impersonation pattern",
        35,
        "The hostname does not closely resemble a known brand variant.",
        false,
      ),
    );
  }

  const suspiciousDomainMatches = SUSPICIOUS_DOMAIN_KEYWORDS.filter(
    (keyword) => hostname.includes(keyword) || pathAndQuery.includes(keyword),
  );

  if (suspiciousDomainMatches.length > 0) {
    addRule(
      "suspicious-domain-words",
      "Suspicious website wording",
      16,
      `The site contains phrases like ${suspiciousDomainMatches.join(", ")}, which are common in login or verification scams.`,
    );
  } else {
    rules.push(
      buildRule(
        "suspicious-domain-words",
        "Suspicious website wording",
        16,
        "The hostname and path do not strongly resemble deceptive login or verification language.",
        false,
      ),
    );
  }

  const subdomainCount = hostname.split(".").filter(Boolean).length - 2;
  if (subdomainCount > 2) {
    addRule(
      "excessive-subdomains",
      "Excessive subdomains",
      15,
      `The hostname contains ${subdomainCount} subdomain levels, which is often used to imitate legitimate services while hiding the true destination.`,
    );
  } else {
    rules.push(
      buildRule(
        "excessive-subdomains",
        "Excessive subdomains",
        15,
        "The domain does not use an unusually high number of subdomains.",
        false,
      ),
    );
  }

  if (fullUrl.includes("@")) {
    addRule(
      "at-symbol",
      "@ character in URL",
      20,
      "The URL contains an @ symbol, which can mislead users into trusting a different web host than the browser actually navigates to.",
    );
  } else {
    rules.push(
      buildRule(
        "at-symbol",
        "@ character in URL",
        20,
        "The URL does not include an @ symbol, which helps avoid host confusion.",
        false,
      ),
    );
  }

  if (
    /(?:login|verify|secure|update|confirm|account|alert|support|payment)/i.test(
      pathAndQuery,
    )
  ) {
    addRule(
      "suspicious-path",
      "Deceptive path structure",
      12,
      "The page path includes urgent or credential-related language that is commonly used in phishing funnels.",
    );
  } else {
    rules.push(
      buildRule(
        "suspicious-path",
        "Deceptive path structure",
        12,
        "The path does not contain strong credential-harvesting language.",
        false,
      ),
    );
  }

  const cappedScore = Math.min(score, 100);
  const classification = getRiskClassification(
    cappedScore,
    hasBrandImpersonation,
  );
  const triggeredRules = rules.filter((rule) => rule.triggered);

  const summary =
    classification === "Low Risk"
      ? "The website structure does not strongly resemble a phishing pattern, but this is based only on the URL and should not be treated as a guarantee of safety."
      : `${classification} detected: ${triggeredRules.length} suspicious website indicators were identified from the URL structure.`;

  return {
    url: validatedUrl,
    score: cappedScore,
    classification,
    triggeredRules,
    rules,
    summary,
    timestamp: new Date().toISOString(),
  };
}
