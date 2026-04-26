import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireRecruiter } from "../middleware/requireRecruiter.js";
import { Job } from "../models/Job.js";
import { rankCandidates } from "../services/matchingService.js";

const router = Router();

const matchSchema = z.object({
  jobDescription: z
    .string()
    .min(20, "Job description must be at least 20 characters"),
});

router.post(
  "/",
  requireRecruiter,
  asyncHandler(async (req, res) => {
    const payload = matchSchema.parse(req.body);

    // 🔥 Step 1: Get ranked candidates
    const ranked = await rankCandidates(payload.jobDescription);

    // 🔥 Step 2: Take top 5 (NO extra functions → no crashes)
    const shortlist = ranked.slice(0, 5);

    // 🔥 Step 3: Save job (optional DB)
    let job = null;

    if (mongoose.connection.readyState === 1) {
      job = await Job.create({
        recruiterId: req.recruiterId,
        description: payload.jobDescription,
        shortlist,
      });
    }

    // ✅ Final response
    res.json({
      jobId: job?._id || null,
      shortlist,
    });
  })
);

export default router;