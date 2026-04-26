import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireRecruiter } from "../middleware/requireRecruiter.js";
import { Job } from "../models/Job.js";

const router = Router();

const jobSchema = z.object({
  description: z.string().min(20, "Job description must be at least 20 characters")
});

router.post(
  "/",
  requireRecruiter,
  asyncHandler(async (req, res) => {
    const payload = jobSchema.parse(req.body);

    if (mongoose.connection.readyState !== 1) {
      return res.status(201).json({
        job: {
          id: `local_${Date.now()}`,
          description: payload.description,
          shortlist: []
        }
      });
    }

    const job = await Job.create({
      recruiterId: req.recruiterId,
      description: payload.description,
      shortlist: []
    });

    res.status(201).json({ job });
  })
);

router.get(
  "/",
  requireRecruiter,
  asyncHandler(async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ jobs: [] });
    }

    const jobs = await Job.find({ recruiterId: req.recruiterId }).sort({ createdAt: -1 }).limit(20);
    res.json({ jobs });
  })
);

export default router;
