function clamp(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function parseDaysFromAvailability(text = "") {
  const normalized = String(text).toLowerCase();

  if (normalized.includes("immediate")) return 0;
  if (normalized.includes("week")) {
    const weekMatch = normalized.match(/(\d+)\s*week/);
    if (weekMatch) return Number(weekMatch[1]) * 7;
  }

  const dayMatch = normalized.match(/(\d+)\s*day/);
  if (dayMatch) return Number(dayMatch[1]);

  return 21;
}

function availabilityScoreFromDays(days) {
  if (days <= 7) return 95;
  if (days <= 14) return 85;
  if (days <= 21) return 75;
  if (days <= 30) return 65;
  if (days <= 45) return 45;
  return 35;
}

function scoreIntent(transcript) {
  const positiveSignals = [
    "interested",
    "open",
    "excited",
    "sounds good",
    "looks aligned",
    "happy to discuss",
    "yes"
  ];
  const negativeSignals = ["not interested", "pass", "decline", "not a fit", "no thanks"];

  const positive = positiveSignals.filter((signal) => transcript.includes(signal)).length;
  const negative = negativeSignals.filter((signal) => transcript.includes(signal)).length;
  return clamp(55 + positive * 10 - negative * 18);
}

function scoreSalaryFit(candidate, recruiterMessages, candidateMessages) {
  const recruiterText = recruiterMessages.join(" ").toLowerCase();
  const candidateText = candidateMessages.join(" ").toLowerCase();
  const expectedSalary = Number(candidate.expectedSalaryLpa || 0);

  const budgetMatch = recruiterText.match(/(\d+)\s*-\s*(\d+)\s*lpa|(\d+)\s*lpa/i);

  if (!budgetMatch || !expectedSalary) {
    return candidateText.includes("flexible") ? 78 : 70;
  }

  const min = budgetMatch[1] ? Number(budgetMatch[1]) : Number(budgetMatch[3]);
  const max = budgetMatch[2] ? Number(budgetMatch[2]) : Number(budgetMatch[3]);

  if (expectedSalary >= min && expectedSalary <= max) return 92;
  if (expectedSalary <= max + 2) return 76;
  if (expectedSalary <= max + 5) return 58;
  return 35;
}

function scoreLocationFit(candidate, recruiterMessages, candidateMessages) {
  const recruiterText = recruiterMessages.join(" ").toLowerCase();
  const candidateText = candidateMessages.join(" ").toLowerCase();
  const preferredLocations = (candidate.preferredLocations || []).map((location) => location.toLowerCase());
  const candidateLocation = String(candidate.location || "").toLowerCase();

  if (recruiterText.includes("remote")) {
    return preferredLocations.includes("remote") || candidateLocation === "remote" ? 95 : 70;
  }

  for (const location of preferredLocations) {
    if (location && recruiterText.includes(location)) return 92;
  }

  if (candidateText.includes("relocate") || candidateText.includes("hybrid")) return 76;
  return 68;
}

export function extractSignals(candidate, messages) {
  const recruiterMessages = messages
    .filter((message) => message.role === "recruiter")
    .map((message) => message.content);
  const candidateMessages = messages
    .filter((message) => message.role === "candidate")
    .map((message) => message.content);
  const candidateTranscript = candidateMessages.join(" ").toLowerCase();
  const availabilityDays = parseDaysFromAvailability(candidate.availability);

  return {
    intent: scoreIntent(candidateTranscript),
    salaryFit: scoreSalaryFit(candidate, recruiterMessages, candidateMessages),
    availability: availabilityScoreFromDays(availabilityDays),
    locationFit: scoreLocationFit(candidate, recruiterMessages, candidateMessages)
  };
}

export function calculateInterestFromSignals(signals) {
  return clamp(
    0.5 * signals.intent +
      0.2 * signals.availability +
      0.15 * signals.salaryFit +
      0.15 * signals.locationFit
  );
}

export function getInterestStatus(interestScore) {
  if (interestScore >= 85) return "Highly interested";
  if (interestScore >= 70) return "Warm";
  return "Needs nurturing";
}

export function calculateFinalScore(matchScore, interestScore) {
  return clamp(matchScore * 0.65 + interestScore * 0.35);
}
