import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireRecruiter } from "../middleware/requireRecruiter.js";
import { CandidateInteraction } from "../models/CandidateInteraction.js";
import { runChatTurn } from "../services/chatService.js";

const router = Router();

/* -----------------------------
   Validation schemas
------------------------------*/
const messageSchema = z.object({
  role: z.enum(["recruiter", "candidate"]),
  content: z.string().min(1).max(1000)
});

const chatSchema = z.object({
  candidateId: z.string().min(1),
  jobId: z.string().optional(),
  matchScore: z.number().min(0).max(100).optional(),
  jobDescription: z.string().min(20),
  messages: z.array(messageSchema).min(1).max(20)
});

/* -----------------------------
   CHAT ENDPOINT
------------------------------*/
router.post(
  "/",
  requireRecruiter,
  asyncHandler(async (req, res) => {
    const payload = chatSchema.parse(req.body);

    // 🔥 Run chat logic (AI + scoring)
    const result = await runChatTurn({
      candidateId: payload.candidateId,
      jobDescription: payload.jobDescription,
      messages: payload.messages,
      matchScore: payload.matchScore || 0
    });

    // 🔥 Debug (optional but useful)
    console.log(
      "CHAT UPDATE →",
      payload.candidateId,
      "Interest:",
      result.interestScore,
      "Final:",
      result.finalScore
    );

    /* -----------------------------
       Save interaction (optional DB)
    ------------------------------*/
    if (mongoose.connection.readyState === 1) {
      await CandidateInteraction.create({
        recruiterId: req.recruiterId,
        candidateId: payload.candidateId,
        jobId: payload.jobId || null,
        messages: result.messages,
        interestScore: result.interestScore,
        finalScore: result.finalScore,
        signals: result.signals || {},
        status: result.status || "engaged",
        scoreBreakdown: result.scoreBreakdown || {}
      });
    }

    /* -----------------------------
       Response to frontend
    ------------------------------*/
    res.json({
      reply: result.reply,
      messages: result.messages,

      // 🔥 CRITICAL for UI update
      interestScore: result.interestScore,
      finalScore: result.finalScore,

      // 🔥 extra signals
      status: result.status,
      signals: result.signals,
      scoreBreakdown: result.scoreBreakdown,

      // 🔥 UI helpers
      askedTopics: result.askedTopics
    });
  })
);

export default router;