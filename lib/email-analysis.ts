import type { DetectionRule, RiskClassification } from "@/lib/detection";
import { getRiskClassification } from "@/lib/detection";

export interface EmailAnalysisResult {
  subject: string;
  body: string;
  score: number;
  classification: RiskClassification;
  triggeredRules: DetectionRule[];
  rules: DetectionRule[];
  summary: string;
  timestamp: string;
}

const URGENT_TERMS = [
  "urgent",
  "immediately",
  "final warning",
  "action required",
  "suspended",
  "account locked",
  "verify now",
  "deadline",
  "within 24 hours",
  "last chance",
];

const SENSITIVE_WORDS = [
  "password",
  "login",
  "pin",
  "bank account",
  "routing number",
  "social security",
  "ssn",
  "credit card",
  "card number",
  "security code",
  "otp",
  "one-time password",
  "verification code",
];

const PAYMENT_WORDS = [
  "payment",
  "wire transfer",
  "bank details",
  "gift card",
  "bitcoin",
  "refund",
  "invoice",
  "transaction",
  "send money",
  "pay now",
  "funds",
];

const IMPERSONATION_MARKERS = [
  "paypal",
  "microsoft",
  "apple",
  "amazon",
  "google",
  "bank of america",
  "chase",
  "netflix",
  "irs",
  "tax authority",
  "support team",
  "security team",
  "office365",
];

const PHISHING_PHRASES = [
  "click here",
  "verify your account",
  "confirm your identity",
  "update your details",
  "security alert",
  "suspicious activity",
  "reset your password",
  "access your account",
  "confirm password",
  "your account has been restricted",
  "validate your information",
];

const ATTACHMENT_MARKERS = [
  "attachment",
  "invoice",
  "document",
  "statement",
  "pdf",
  "zip",
  "excel",
  "xlsx",
  "docx",
  "exe",
  "file",
];

const COMMON_MISSPELLINGS = [
  "teh",
  "recieve",
  "securtiy",
  "verifiy",
  "accout",
  "paasword",
  "warrning",
  "immediatly",
  "paymnet",
  "otpp",
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

function countMatches(text: string, terms: string[]) {
  return terms.filter((term) => text.includes(term)).length;
}

export function validateEmailInput(subject: string, body: string) {
  const trimmedSubject = subject.trim();
  const trimmedBody = body.trim();

  if (!trimmedSubject && !trimmedBody) {
    throw new Error("Please enter the email subject and message content.");
  }

  if (!trimmedBody) {
    throw new Error("The email body is required for analysis.");
  }

  return {
    subject: trimmedSubject || "No subject provided",
    body: trimmedBody,
  };
}

export function analyseEmail(
  rawSubject: string,
  rawBody: string,
): EmailAnalysisResult {
  const { subject, body } = validateEmailInput(rawSubject, rawBody);
  const text = `${subject} ${body}`.toLowerCase();
  const rules: DetectionRule[] = [];
  let score = 0;

  const addRule = (
    id: string,
    label: string,
    scoreValue: number,
    description: string,
  ) => {
    score += scoreValue;
    rules.push(buildRule(id, label, scoreValue, description, true));
  };

  const urgentMatches = URGENT_TERMS.filter((term) => text.includes(term));
  if (urgentMatches.length > 0) {
    addRule(
      "urgent-language",
      "Urgent or threatening language",
      18,
      `The message contains urgency cues such as ${urgentMatches.join(", ")}, which are commonly used in phishing emails to pressure quick action.`,
    );
  } else {
    rules.push(
      buildRule(
        "urgent-language",
        "Urgent or threatening language",
        18,
        "No urgent or threatening language was found in the message.",
        false,
      ),
    );
  }

  const sensitiveMatches = SENSITIVE_WORDS.filter((term) =>
    text.includes(term),
  );
  if (sensitiveMatches.length > 0) {
    addRule(
      "sensitive-info-request",
      "Request for passwords or sensitive information",
      20,
      `The email requests sensitive details, including ${sensitiveMatches.join(", ")}, which suggests it may be trying to harvest credentials or personal data.`,
    );
  } else {
    rules.push(
      buildRule(
        "sensitive-info-request",
        "Request for passwords or sensitive information",
        20,
        "The message does not explicitly ask for passwords or sensitive account data.",
        false,
      ),
    );
  }

  const suspiciousLinks = Array.from(
    new Set(
      (body.match(/https?:\/\/[^\s]+/gi) || []).map((link) =>
        link.toLowerCase(),
      ),
    ),
  );
  if (suspiciousLinks.length > 0) {
    const linkText = suspiciousLinks.slice(0, 3).join(", ");
    addRule(
      "suspicious-links",
      "Suspicious links found",
      18,
      `The email includes external links such as ${linkText}. Phishing emails often use shortened or misleading destinations to hide the real target site.`,
    );
  } else {
    rules.push(
      buildRule(
        "suspicious-links",
        "Suspicious links found",
        18,
        "No direct external links were detected in the pasted message.",
        false,
      ),
    );
  }

  const paymentMatches = PAYMENT_WORDS.filter((term) => text.includes(term));
  if (paymentMatches.length > 0) {
    addRule(
      "financial-request",
      "Request for payment or financial details",
      15,
      `The message references financial requests or payment actions like ${paymentMatches.join(", ")}, which are common in fraud and invoice scams.`,
    );
  } else {
    rules.push(
      buildRule(
        "financial-request",
        "Request for payment or financial details",
        15,
        "The email does not request payment or financial details.",
        false,
      ),
    );
  }

  const impersonationMatches = IMPERSONATION_MARKERS.filter((term) =>
    text.includes(term),
  );
  if (impersonationMatches.length > 0) {
    addRule(
      "impersonation",
      "Organisation or trusted-service impersonation",
      16,
      `The message references brands or trusted institutions such as ${impersonationMatches.join(", ")}, which may be used to make the email appear legitimate.`,
    );
  } else {
    rules.push(
      buildRule(
        "impersonation",
        "Organisation or trusted-service impersonation",
        16,
        "No obvious impersonation of a brand or institution was detected in the message text.",
        false,
      ),
    );
  }

  const attachmentMatches = ATTACHMENT_MARKERS.filter((term) =>
    text.includes(term),
  );
  if (attachmentMatches.length > 0) {
    addRule(
      "attachments",
      "Suspicious attachments or files",
      12,
      `The email mentions attachments or file types such as ${attachmentMatches.join(", ")}. Attackers often use documents or archive files as phishing lures.`,
    );
  } else {
    rules.push(
      buildRule(
        "attachments",
        "Suspicious attachments or files",
        12,
        "No obvious attachment-based lure was detected in the email message.",
        false,
      ),
    );
  }

  const inconsistentMatches = COMMON_MISSPELLINGS.filter((term) =>
    text.includes(term),
  );
  if (inconsistentMatches.length > 0) {
    addRule(
      "spelling-issues",
      "Spelling and grammar inconsistencies",
      8,
      `The message includes inconsistencies such as ${inconsistentMatches.join(", ")}, which can be a sign of a low-effort phishing attempt.`,
    );
  } else {
    rules.push(
      buildRule(
        "spelling-issues",
        "Spelling and grammar inconsistencies",
        8,
        "No clear spelling or grammar anomalies stood out in the message.",
        false,
      ),
    );
  }

  const phishingPhraseMatches = PHISHING_PHRASES.filter((term) =>
    text.includes(term),
  );
  if (phishingPhraseMatches.length > 0) {
    addRule(
      "common-phishing-phrases",
      "Common phishing phrases",
      12,
      `The content uses familiar phishing language such as ${phishingPhraseMatches.join(", ")}, which is commonly associated with scam emails.`,
    );
  } else {
    rules.push(
      buildRule(
        "common-phishing-phrases",
        "Common phishing phrases",
        12,
        "No explicitly common phishing phrase patterns were detected.",
        false,
      ),
    );
  }

  const cappedScore = Math.min(score, 100);
  const classification = getRiskClassification(cappedScore);
  const triggeredRules = rules.filter((rule) => rule.triggered);

  return {
    subject,
    body,
    score: cappedScore,
    classification,
    triggeredRules,
    rules,
    summary:
      classification === "Low Risk"
        ? "The email does not strongly resemble a phishing message based on the typed content alone, but it cannot verify the actual sender or origin of the message."
        : `The email shows ${triggeredRules.length} warning signs commonly associated with phishing attempts. This assessment is based only on the pasted content and cannot confirm the sender's real identity.`,
    timestamp: new Date().toISOString(),
  };
}

export function getEmailRiskHint(score: number) {
  if (score >= 60) return "Potential phishing email";
  if (score >= 30) return "Suspicious email";
  return "Low-risk email";
}

export function getEmailAnalysisCount(text: string) {
  return countMatches(text.toLowerCase(), [
    "urgent",
    "verify",
    "password",
    "payment",
    "invoice",
    "attach",
    "support",
    "bank",
  ]);
}
