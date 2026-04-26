  import { calculateInterest } from "./interestService.js";
  import {
    generateDeterministicCandidateReply,
    generateAICandidateReply
  } from "./llmService.js";

  /* --------------------------------
    Detect recruiter questions
  ---------------------------------*/
  export function detectStructuredQuestionCoverage(messages) {
    const recruiterText = messages
      .filter((m) => m.role === "recruiter")
      .map((m) => m.content)
      .join(" ")
      .toLowerCase();

    return {
      interest: /(interested|motivation|why.*role)/i.test(recruiterText),
      salary: /(salary|ctc|compensation)/i.test(recruiterText),
      availability: /(availability|notice|join)/i.test(recruiterText),
      location: /(location|remote|hybrid|onsite)/i.test(recruiterText)
    };
  }

  /* --------------------------------
    🔥 NEW: Interest scoring from chat
  ---------------------------------*/
  function getInterestDelta(text) {
    const t = text.toLowerCase();

    let delta = 0;

    if (/interested|excited|keen/.test(t)) delta += 15;
    if (/open|available/.test(t)) delta += 10;
    if (/salary|ctc/.test(t)) delta += 5;

    if (/not interested|no thanks|not looking/.test(t)) delta -= 25;
    if (/busy|later/.test(t)) delta -= 10;

    return delta;
  }

  /* --------------------------------
    MAIN CHAT TURN
  ---------------------------------*/
  export async function runChatTurn({
    candidateId,
    jobDescription,
    messages,
    matchScore = 0
  }) {
    let reply;

    const useAI = !!process.env.OPENROUTER_API_KEY;

    try {
      reply = useAI
        ? await generateAICandidateReply({
            candidateId,
            jobDescription,
            messages
          })
        : generateDeterministicCandidateReply({
            candidateId,
            jobDescription,
            messages
          });
    } catch (err) {
      console.error("Chat error:", err);

      reply = generateDeterministicCandidateReply({
        candidateId,
        jobDescription,
        messages
      });
    }

    const allMessages = [
      ...messages,
      { role: "candidate", content: reply }
    ];

    /* --------------------------------
      🔥 Base scoring
    ---------------------------------*/
    const baseScoring = calculateInterest(candidateId, allMessages, matchScore);

    /* --------------------------------
      🔥 Adjust interest from latest reply
    ---------------------------------*/
    const delta = getInterestDelta(reply);

    const updatedInterest = Math.max(
      0,
      Math.min(100, baseScoring.interestScore + delta)
    );

    /* --------------------------------
      🔥 Recompute final score
    ---------------------------------*/
    const finalScore = Math.round(
      0.7 * matchScore + 0.3 * updatedInterest
    );

    const scoring = {
      ...baseScoring,
      interestScore: updatedInterest,
      finalScore
    };

    const askedTopics = detectStructuredQuestionCoverage(allMessages);

    return {
      reply,
      messages: allMessages,
      askedTopics,
      ...scoring
    };
  }