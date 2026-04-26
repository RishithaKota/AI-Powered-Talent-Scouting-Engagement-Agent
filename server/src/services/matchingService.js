import { mockCandidates } from "../data/mockCandidates.js";
import { uniqueTerms } from "./textService.js";
import { calculateFinalScore, getInterestStatus } from "./scoringService.js";

/* -------------------- UTIL -------------------- */
function clamp(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

/* -------------------- FALLBACK -------------------- */
function scoreCandidateFallback(candidate, jobDescription) {
  const jobTerms = uniqueTerms(jobDescription);
  const candidateTerms = uniqueTerms(
    `${candidate.title} ${candidate.skills.join(" ")} ${candidate.desiredRole} ${candidate.summary}`
  );

  const candidateSet = new Set(candidateTerms);
  const normalizedJob = jobDescription.toLowerCase();

  const matchedTerms = jobTerms.filter((term) => candidateSet.has(term));
  const skillHits = candidate.skills.filter((skill) =>
    normalizedJob.includes(skill.toLowerCase())
  );

  const matchScore = clamp(
    (skillHits.length / (candidate.skills.length || 1)) * 60 +
    (matchedTerms.length / (jobTerms.length || 1)) * 40
  );

  return {
    matchScore,
    reasons: [
      skillHits.length
        ? `Skill overlap: ${skillHits.join(", ")}`
        : "Limited direct skill overlap",
      `Keyword relevance: ${matchedTerms.length}/${jobTerms.length || 1}`
    ],
    matchedSkills: skillHits
  };
}

/* -------------------- OPENROUTER CALL -------------------- */
async function callOpenRouter(prompt) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini", // 🔥 fast + good
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7
    })
  });

  const data = await response.json();

  return data?.choices?.[0]?.message?.content || "";
}

/* -------------------- AI MATCH -------------------- */
async function aiMatchCandidate(candidate, jobDescription) {
  try {
    const prompt = `
    You are an AI recruiter.
    
    Compare candidate with job.
    
    Candidate:
    Name: ${candidate.name}
    Skills: ${candidate.skills.join(", ")}
    Experience: ${candidate.experienceYears} years
    Projects: ${candidate.projects.join("; ")}
    Personality: ${candidate.personality}
    Motivation: ${candidate.motivation}
    
    Job:
    ${jobDescription}
    
    Return ONLY JSON:
    {
      "matchScore": number (0-100),
      "reason": "specific explanation using skills/projects",
      "skillsMatched": ["skill1", "skill2"]
    }
    `;
    const text = await callOpenRouter(prompt);

    if (!text) throw new Error("Empty AI response");

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Invalid JSON from AI");
      parsed = JSON.parse(match[0]);
    }

    parsed.matchScore = clamp(parsed.matchScore || 50);

    return parsed;

  } catch (err) {
    console.error("OpenRouter match failed → using fallback:", err);
    return null;
  }
}

/* -------------------- MAIN SCORING -------------------- */
async function scoreCandidate(candidate, jobDescription) {
  const aiResult = await aiMatchCandidate(candidate, jobDescription);

  let matchScore, reasons, matchedSkills;

  if (aiResult) {
    matchScore = aiResult.matchScore;
    reasons = [aiResult.reason];
    matchedSkills = aiResult.skillsMatched || [];
  } else {
    const fallback = scoreCandidateFallback(candidate, jobDescription);
    matchScore = fallback.matchScore;
    reasons = fallback.reasons;
    matchedSkills = fallback.matchedSkills;
  }
  const interestScore = 0; // 🔥 no interest before chat
  const finalScore = matchScore; // 🔥 before chat = only match
  const status = getInterestStatus(interestScore);

  return {
    ...candidate,
    candidateId: candidate.id,
    matchScore,
    interestScore,
    finalScore,
    status,
    reasons,
    matchedSkills,

    scoreBreakdown: {
      matchScore,
      interestScore,
      finalScore
    }
  };
}

/* -------------------- EXPORTS -------------------- */

export async function rankCandidates(jobDescription) {
  const results = await Promise.all(
    mockCandidates.map((candidate) =>
      scoreCandidate(candidate, jobDescription)
    )
  );

  return results.sort((a, b) => b.finalScore - a.finalScore);
}

export function findCandidate(candidateId) {
  return mockCandidates.find((c) => c.id === candidateId);
}