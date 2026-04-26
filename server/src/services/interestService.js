import { findCandidate } from "./matchingService.js";

export function calculateInterest(candidateId, messages, matchScore = 0) {
  const text = messages.map(m => m.content.toLowerCase()).join(" ");

  let interestScore = 30; // base neutral

  /* --------------------------------
     🔥 NUMERIC SIGNALS (0–100 scale)
  ---------------------------------*/
  const signals = {
    intent: 50,        // neutral
    salaryFit: 50,
    availability: 50,
    locationFit: 50
  };

  /* --------------------------------
     🔥 INTENT
  ---------------------------------*/
  if (/interested|excited|love|great fit/.test(text)) {
    interestScore += 30;
    signals.intent = 90;
  } else if (/not interested|no thanks/.test(text)) {
    interestScore -= 20;
    signals.intent = 20;
  } else {
    signals.intent = 50;
  }

  /* --------------------------------
     🔥 SALARY
  ---------------------------------*/
  if (/lpa|salary|expected|ctc/.test(text)) {
    interestScore += 10;
    signals.salaryFit = 70;
  } else {
    signals.salaryFit = 50;
  }

  /* --------------------------------
     🔥 AVAILABILITY
  ---------------------------------*/
  if (/immediate|2 weeks|15 days/.test(text)) {
    interestScore += 10;
    signals.availability = 90;
  } else if (/30 days|notice/.test(text)) {
    signals.availability = 70;
  } else {
    signals.availability = 50;
  }

  /* --------------------------------
     🔥 LOCATION
  ---------------------------------*/
  if (/remote|hybrid/.test(text)) {
    interestScore += 5;
    signals.locationFit = 80;
  } else if (/onsite/.test(text)) {
    signals.locationFit = 60;
  } else {
    signals.locationFit = 50;
  }

  /* --------------------------------
     🔥 NORMALIZE SCORE
  ---------------------------------*/
  interestScore = Math.max(0, Math.min(100, interestScore));

  const finalScore = Math.round(
    (matchScore * 0.6) + (interestScore * 0.4)
  );

  return {
    interestScore,
    finalScore,
    signals,
    status:
      interestScore > 75
        ? "Highly Interested"
        : interestScore > 50
        ? "Moderately Interested"
        : "Low Interest",

    scoreBreakdown: {
      matchScore,
      interestScore,
      finalScore
    }
  };
}