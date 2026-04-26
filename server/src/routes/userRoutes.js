import { Router } from "express";
import { User } from "../models/User.js";

const router = Router();

router.post("/sync", async (req, res) => {
  console.log("SYNC HIT:", req.body); // debug

  const { email } = req.body;

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({ email });
  }

  res.json(user);
});

export default router;