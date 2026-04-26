import { Router } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireRecruiter } from "../middleware/requireRecruiter.js";
import { Job } from "../models/Job.js";

const router = Router();

router.get(
  "/:jobId",
  requireRecruiter,
  asyncHandler(async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ shortlist: [] });
    }

    const job = await Job.findOne({ _id: req.params.jobId, recruiterId: req.recruiterId });

    if (!job) {
      const error = new Error("Job not found");
      error.status = 404;
      throw error;
    }

    res.json({ shortlist: job.shortlist });
  })
);

export default router;
