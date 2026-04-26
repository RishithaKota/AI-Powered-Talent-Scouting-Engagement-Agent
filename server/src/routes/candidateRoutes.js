import { Router } from "express";
import { mockCandidates } from "../data/mockCandidates.js";
import { requireRecruiter } from "../middleware/requireRecruiter.js";

const router = Router();

router.get("/", requireRecruiter, (_req, res) => {
  res.json({ candidates: mockCandidates });
});

export default router;
