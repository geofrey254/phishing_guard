export type RiskClassification =
  | "Low Risk"
  | "Suspicious"
  | "Potential Phishing";

export type AnalysisType = "URL" | "Email" | "Website";

export interface DetectionRule {
  id: string;
  label: string;
  score: number;
  description: string;
  triggered: boolean;
}

export interface ScanResult {
  url: string;
  score: number;
  classification: RiskClassification;
  triggeredRules: DetectionRule[];
  rules: DetectionRule[];
  summary: string;
  timestamp: string;
}

export interface HistoryEntry {
  id: string;
  type: AnalysisType;
  label: string;
  score: number;
  classification: RiskClassification;
  timestamp: string;
  summary: string;
}

const SUSPICIOUS_KEYWORDS = [
  "login",
  "verify",
  "secure",
  "account",
  "password",
];

const BRAND_VARIANTS = [
  "google",
  "microsoft",
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

function collapseRepeatedChars(value: string) {
  return value.replace(/(.)\1+/g, "$1");
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

function looksLikeBrandImpersonation(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/^www\./, "");
  const hostWithoutTld = normalized.replace(/\.[a-z0-9-]+$/, "");
  const cleanHost = hostWithoutTld.replace(/[^a-z]/g, "");
  const collapsedHost = collapseRepeatedChars(cleanHost);

  return BRAND_VARIANTS.some((brand) => {
    const cleanBrand = brand.replace(/[^a-z]/g, "");

    const officialHostnames = [
      `${cleanBrand}.com`,
      `${cleanBrand}.co`,
      `${cleanBrand}.net`,
      `www.${cleanBrand}.com`,
      `www.${cleanBrand}.co`,
      `www.${cleanBrand}.net`,
      `login.${cleanBrand}.com`,
      `account.${cleanBrand}.com`,
    ];

    if (officialHostnames.includes(normalized)) {
      return false;
    }

    if (cleanHost === cleanBrand || cleanHost.includes(cleanBrand)) {
      return false;
    }

    const hostAgainstBrand = collapsedHost.includes(cleanBrand);
    const brandAgainstHost = cleanBrand.includes(collapsedHost);
    const nearMatch =
      Math.abs(collapsedHost.length - cleanBrand.length) <= 1 &&
      levenshteinDistance(collapsedHost, cleanBrand) <= 1;

    return hostAgainstBrand || brandAgainstHost || nearMatch;
  });
}

const RISK_META: Record<
  RiskClassification,
  { description: string; action: string }
> = {
  "Low Risk": {
    description:
      "No strong phishing indicators were found in the URL structure alone. This does not guarantee the destination is safe, so the context still matters.",
    action:
      "Proceed with caution. Verify the destination in the browser and avoid entering credentials unless you intended to visit this domain.",
  },
  Suspicious: {
    description:
      "The URL contains several characteristics that are commonly associated with impersonation or deceptive pages.",
    action:
      "Double-check the site before entering any login details. Confirm the domain through official channels and watch for urgent requests.",
  },
  "Potential Phishing": {
    description:
      "This URL shows multiple phishing-style signals and should be treated as high risk.",
    action:
      "Do not enter personal information or credentials. Report the link or avoid opening it entirely.",
  },
};

function buildRule(
  id: string,
  label: string,
  score: number,
  description: string,
  triggered: boolean,
): DetectionRule {
  return { id, label, score, description, triggered };
}

export function getRiskClassification(
  score: number,
  hasBrandImpersonation = false,
): RiskClassification {
  if (hasBrandImpersonation) return "Potential Phishing";
  if (score >= 60) return "Potential Phishing";
  if (score >= 30) return "Suspicious";
  return "Low Risk";
}

export function generateHistoryId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function validateUrlInput(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("Please enter a URL to analyse.");
  }

  try {
    const normalizedInput = trimmed.includes("://")
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(normalizedInput);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Only http:// and https:// URLs are supported.");
    }

    if (!parsed.hostname) {
      throw new Error("This URL does not include a valid hostname.");
    }

    if (!parsed.hostname.includes(".") && parsed.hostname !== "localhost") {
      throw new Error(
        "Enter a valid URL or domain name, such as https://example.com or www.example.com.",
      );
    }

    return parsed.href;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }

    throw new Error(
      "Enter a valid URL or domain name, such as https://example.com or www.example.com.",
    );
  }
}

export function scanUrl(rawUrl: string): ScanResult {
  const validatedUrl = validateUrlInput(rawUrl);
  const parsed = new URL(validatedUrl);
  const hostname = parsed.hostname.toLowerCase();
  const fullUrl = parsed.href.toLowerCase();
  const pathAndQuery = `${parsed.pathname}${parsed.search}`.toLowerCase();

  let score = 0;

  const rules: DetectionRule[] = [];

  const addRule = (
    id: string,
    label: string,
    scoreValue: number,
    description: string,
  ) => {
    const triggered = true;
    score += scoreValue;
    rules.push(buildRule(id, label, scoreValue, description, triggered));
  };

  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(":")) {
    addRule(
      "ip-hostname",
      "IP address used as hostname",
      25,
      "The hostname is an IP address instead of a normal domain name, which is commonly used in phishing and credential-harvesting links.",
    );
  } else {
    rules.push(
      buildRule(
        "ip-hostname",
        "IP address used as hostname",
        25,
        "No IP-based hostname was detected.",
        false,
      ),
    );
  }

  const matchedKeywords = SUSPICIOUS_KEYWORDS.filter((keyword) =>
    fullUrl.includes(keyword),
  );

  if (matchedKeywords.length > 0) {
    addRule(
      "suspicious-keywords",
      "Suspicious keywords",
      15,
      `The URL contains suspicious keywords such as ${matchedKeywords.join(", ")}, which are often used to create urgent or deceptive login experiences.`,
    );
  } else {
    rules.push(
      buildRule(
        "suspicious-keywords",
        "Suspicious keywords",
        15,
        "No suspicious authentication or security keywords were detected in the URL.",
        false,
      ),
    );
  }

  const hasBrandImpersonation = looksLikeBrandImpersonation(hostname);
  if (hasBrandImpersonation) {
    addRule(
      "brand-impersonation",
      "Brand typo-squatting",
      35,
      "The domain name closely resembles a major brand but contains a visual typo or altered spelling, a common phishing technique designed to fool users into thinking they are on a trusted site.",
    );
  } else {
    rules.push(
      buildRule(
        "brand-impersonation",
        "Brand typo-squatting",
        35,
        "The hostname does not closely resemble a known brand through a visual typo or spelling variation.",
        false,
      ),
    );
  }

  const domainLabels = hostname.split(".").filter(Boolean);
  const subdomainCount = Math.max(0, domainLabels.length - 2);

  if (subdomainCount > 2) {
    addRule(
      "excessive-subdomains",
      "Excessive subdomains",
      15,
      `The hostname contains ${subdomainCount} levels of subdomains, which can be used to imitate trusted brands and hide the real destination.`,
    );
  } else {
    rules.push(
      buildRule(
        "excessive-subdomains",
        "Excessive subdomains",
        15,
        "The hostname does not show an unusually high number of subdomains.",
        false,
      ),
    );
  }

  const hyphenCount = (hostname + pathAndQuery).split("-").length - 1;
  if (hyphenCount >= 3) {
    addRule(
      "multiple-hyphens",
      "Multiple hyphens",
      10,
      `The URL contains ${hyphenCount} hyphen characters, which are frequently used to mimic legitimate domains while remaining visually similar.`,
    );
  } else {
    rules.push(
      buildRule(
        "multiple-hyphens",
        "Multiple hyphens",
        10,
        "The URL does not contain a high number of hyphenated segments.",
        false,
      ),
    );
  }

  const specialChars = (pathAndQuery.match(/[^a-z0-9/._-]/g) || []).length;
  if (specialChars >= 5) {
    addRule(
      "special-characters",
      "Excessive special characters",
      10,
      `The URL contains ${specialChars} non-standard special characters, which is often associated with obfuscation or deceptive link construction.`,
    );
  } else {
    rules.push(
      buildRule(
        "special-characters",
        "Excessive special characters",
        10,
        "The URL does not show abnormal special-character obfuscation.",
        false,
      ),
    );
  }

  if (parsed.protocol === "http:") {
    addRule(
      "http-usage",
      "HTTP instead of HTTPS",
      5,
      "The link uses HTTP instead of HTTPS, which means the traffic is not encrypted and the destination is less trustworthy.",
    );
  } else {
    rules.push(
      buildRule(
        "http-usage",
        "HTTP instead of HTTPS",
        5,
        "The URL uses HTTPS, which provides encrypted transport and is more consistent with a legitimate destination.",
        false,
      ),
    );
  }

  if (fullUrl.includes("@")) {
    addRule(
      "at-symbol",
      "@ character in URL",
      20,
      "The URL includes an @ symbol, which can confuse the browser and obscure the real destination host.",
    );
  } else {
    rules.push(
      buildRule(
        "at-symbol",
        "@ character in URL",
        20,
        "The URL does not contain an @ symbol, which helps avoid host confusion.",
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
      ? "The URL structure does not strongly resemble a phishing pattern, but this is not a guarantee of safety. Review the destination carefully before entering any credentials."
      : `${classification} detected: ${triggeredRules.length} phishing indicators were triggered from the URL structure.`;

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

export function getRiskInfo(classification: RiskClassification) {
  return RISK_META[classification];
}
