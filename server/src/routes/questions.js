import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireRecruiter } from "../middleware/requireRecruiter.js";

const router = Router();

const schema = z.object({
  candidateId: z.string(),
  jobDescription: z.string().min(10)
});

router.post(
  "/",
  requireRecruiter,
  asyncHandler(async (req, res) => {
    const { candidateId, jobDescription } = schema.parse(req.body);

    const questions = await generateInterviewQuestions({
      candidateId,
      jobDescription
    });

    res.json({ questions });
  })
);

export default router;