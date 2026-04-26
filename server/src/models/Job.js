import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    recruiterId: { type: String, required: true, index: true },
    description: { type: String, required: true },
    shortlist: [
      {
        candidateId: String,
        name: String,
        title: String,
        matchScore: Number,
        interestScore: Number,
        finalScore: Number,
        matchBreakdown: {
          skillOverlap: Number,
          experienceMatch: Number,
          keywordRelevance: Number
        },
        signals: {
          intent: Number,
          salaryFit: Number,
          availability: Number,
          locationFit: Number
        },
        scoreBreakdown: {
          matchScore: Number,
          interestScore: Number,
          finalScore: Number
        },
        reasons: [String],
        status: String
      }
    ]
  },
  { timestamps: true }
);

export const Job = mongoose.model("Job", jobSchema);
