import { findCandidate } from "./matchingService.js";

/* -----------------------------
   Fallback (rule-based)
------------------------------*/
function fallbackReply(candidate, jobDescription, messages) {
  const lastMessage = messages.at(-1)?.content || "";

  if (/salary|ctc/i.test(lastMessage)) {
    return `I’m targeting around ${candidate.expectedSalaryLpa} LPA, flexible depending on the role.`;
  }

  if (/notice|availability|join/i.test(lastMessage)) {
    return `My notice period is ${candidate.availability}.`;
  }

  if (/location|remote/i.test(lastMessage)) {
    return `I’m based in ${candidate.location} and open to suitable setups.`;
  }

  if (/project|worked on|experience/i.test(lastMessage)) {
    return `I’ve worked on ${candidate.projects.slice(0, 2).join(" and ")}.`;
  }

  if (/interest|why/i.test(lastMessage)) {
    return `It aligns well with my experience in ${candidate.skills.slice(0, 2).join(" and ")}.`;
  }

  return `Could you clarify a bit more?`;
}

/* -----------------------------
   Deterministic fallback (exported)
------------------------------*/
export function generateDeterministicCandidateReply({
  candidateId,
  jobDescription,
  messages
}) {
  const candidate = findCandidate(candidateId);
  if (!candidate) throw new Error("Candidate not found");

  return fallbackReply(candidate, jobDescription, messages);
}

/* -----------------------------
   🔥 OpenRouter AI Call
------------------------------*/
async function callOpenRouter(prompt) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AI Recruiter"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ OpenRouter HTTP ERROR:", text);
      throw new Error("OpenRouter failed");
    }

    const data = await response.json();

    console.log("✅ OpenRouter response:", data);

    return data?.choices?.[0]?.message?.content || "";
  } catch (err) {
    console.error("❌ OpenRouter crash:", err);
    throw err;
  }
}

/* -----------------------------
   🔥 MAIN AI REPLY
------------------------------*/
export async function generateAICandidateReply({
  candidateId,
  jobDescription,
  messages
}) {
  console.log("🔥 AI FUNCTION TRIGGERED");

  const candidate = findCandidate(candidateId);
  if (!candidate) throw new Error("Candidate not found");

  try {
    const prompt = `
You are a real job candidate.

STRICT RULES:
- Answer ONLY what is asked
- Be specific (use projects when relevant)
- Keep it 1–2 sentences
- Avoid repetition

Personality: ${candidate.personality}
Communication Style: ${candidate.communicationStyle}
Motivation: ${candidate.motivation}
Work Preference: ${candidate.workPreference}

Candidate Info:
Name: ${candidate.name}
Skills: ${candidate.skills.join(", ")}
Experience: ${candidate.experienceYears} years
Projects: ${candidate.projects.join("; ")}

Conversation:
${messages.map(m => `${m.role}: ${m.content}`).join("\n")}

Reply naturally to the LAST recruiter question.
`;

    const reply = await callOpenRouter(prompt);

    if (!reply || reply.length < 5) {
      console.log("⚠️ Empty AI response → fallback");
      return fallbackReply(candidate, jobDescription, messages);
    
    }

    console.log("✅ AI RESPONSE USED:", reply);

    return reply;

  } catch (err) {
    console.log("❌ Falling back:", err.message);

    return fallbackReply(candidate, jobDescription, messages);
  }
}
