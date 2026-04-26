import mongoose from "mongoose";

const candidateInteractionSchema = new mongoose.Schema(
  {
    recruiterId: { type: String, required: true, index: true },
    candidateId: { type: String, required: true, index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
    messages: [
      {
        role: { type: String, enum: ["recruiter", "candidate"], required: true },
        content: { type: String, required: true }
      }
    ],
    interestScore: { type: Number, required: true },
    signals: {
      intent: Number,
      salaryFit: Number,
      availability: Number,
      locationFit: Number
    },
    finalScore: Number,
    status: { type: String, required: true }
  },
  { timestamps: true }
);

export const CandidateInteraction = mongoose.model("CandidateInteraction", candidateInteractionSchema);
