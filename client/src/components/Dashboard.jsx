import { UserButton, useAuth } from "@clerk/react";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { apiRequest } from "../lib/api";

const sampleJob = `Senior Frontend Engineer

We need a React engineer with strong TypeScript, API integration, testing, performance tuning, and product collaboration experience. Bonus for Node.js and hiring platform experience.`;

export default function Dashboard() {
  const { getToken } = useAuth();

  const [jobDescription, setJobDescription] = useState(sampleJob);
  const [candidates, setCandidates] = useState([]);
  const [ranked, setRanked] = useState([]);
  const [activeCandidateId, setActiveCandidateId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("Would you be open to discussing this role?");
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState("");
  const chatEndRef = useRef(null);

  const activeCandidate = useMemo(
    () => ranked.find((c) => c.id === activeCandidateId) || ranked[0],
    [ranked, activeCandidateId]
  );

  const getSessionToken = useCallback(async () => {
    const token = await getToken({ template: "default" });
    if (!token) throw new Error("Login again.");
    return token;
  }, [getToken]);

  /* -----------------------------
     LOAD CANDIDATES
  ------------------------------*/
  useEffect(() => {
    async function loadCandidates() {
      try {
        const token = await getSessionToken();
        const data = await apiRequest("/candidates", { token });
        setCandidates(data.candidates);
      } catch (err) {
        setError(err.message);
      }
    }
    loadCandidates();
  }, [getSessionToken]);

  /* -----------------------------
     MATCH
  ------------------------------*/
  async function handleMatch() {
    setLoading(true);
    setError("");

    try {
      const token = await getSessionToken();
      const data = await apiRequest("/match", {
        token,
        method: "POST",
        body: { jobDescription }
      });

      setRanked(data.shortlist);
      setActiveCandidateId(data.shortlist[0]?.id || "");
      setMessages([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /* -----------------------------
     CHAT
  ------------------------------*/
  async function handleSend() {
    if (!activeCandidate || !draft.trim()) return;

    const recruiterMessage = {
      role: "recruiter",
      content: draft.trim()
    };

    const nextMessages = [...messages, recruiterMessage];

    setMessages(nextMessages);
    setDraft("");
    setChatLoading(true);

    try {
      const token = await getSessionToken();

      const data = await apiRequest("/chat", {
        
        token,
        method: "POST",
        body: {
          candidateId: activeCandidate.id,
          matchScore: activeCandidate.matchScore,
          jobDescription,
          messages: nextMessages
        }
  
      });
      console.log("CHAT RESPONSE:", data);

      // update chat
      setMessages([
        ...nextMessages,
        { role: "candidate", content: data.reply }
      ]);

      // update candidate + re-rank
      setRanked((prev) => {
        if (!prev.length) return prev;
      
        const updated = prev.map((c) =>
          c.id === activeCandidate.id
            ? {
                ...c,
                interestScore: data.interestScore,
                finalScore: data.finalScore,
                signals: data.signals || {},   // ✅ ADD THIS
                status: data.status
              }
            : c
        );
      
        return [...updated].sort((a, b) => b.finalScore - a.finalScore);
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100">

      {/* HEADER */}
      <header className="bg-white shadow px-6 py-4 flex justify-between">
        <h1 className="font-bold text-lg">AI Recruiter</h1>
        <UserButton />
      </header>

      {/* MAIN GRID */}
      <section className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6 p-6">

        {/* LEFT */}
        <div className="space-y-6">

          {/* JD */}
          <div className="bg-white p-5 rounded-xl shadow">
  
  <h3 className="font-semibold mb-1">Enter Job Description</h3>
  <p className="text-xs text-gray-500 mb-2">
    Paste a job description to match and rank candidates instantly
  </p>

  <textarea
    className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-black outline-none"
    rows={6}
    placeholder="e.g. We are looking for a React developer with TypeScript and API integration experience..."
    value={jobDescription}
    onChange={(e) => setJobDescription(e.target.value)}
  />

            <button
              onClick={handleMatch}
              className="mt-3 bg-black text-white px-4 py-2 rounded-lg"
            >
              {loading ? "Matching..." : "Match"}
            </button>

            {error && <p className="text-red-500 mt-2">{error}</p>}
          </div>

          {/* POOL */}
          <div className="bg-white p-5 rounded-xl shadow">
            <h3 className="font-semibold mb-3">Candidate Pool</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidates.map((c) => (
                <div
                key={c.id}
                className="border rounded-xl p-4 hover:bg-gray-50 transition cursor-pointer"
              >
                <p className="font-semibold text-sm">{c.name}</p>
                <p className="text-gray-500 text-xs">{c.title}</p>
              
                {/* 🔥 add skills if available */}
                {c.skills && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {c.skills.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="text-[10px] bg-gray-200 px-2 py-0.5 rounded"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT */}
        <div className="space-y-6">

          {/* TABLE */}
          <div className="bg-white p-5 rounded-xl shadow">
            <h3 className="font-semibold mb-3">Ranked Candidates</h3>

            {ranked.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Click "Match" to generate shortlist.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-gray-500 border-b">
                  <tr>
                    <th className="text-left py-2">#</th>
                    <th>Name</th>
                    <th>Match</th>
                    <th>Interest</th>
                    <th>Final</th>
                  </tr>
                </thead>

                <tbody>
                  {ranked.map((c, i) => (
                    <tr
                    key={c.id}
                    className={`border-b cursor-pointer hover:bg-gray-50 ${
                      c.id === activeCandidate?.id ? "bg-gray-100" : ""
                    }`}
                    onClick={() => setActiveCandidateId(c.id)}
                  >
                    <td className="py-2 px-2">{i + 1}</td>
                    <td className="px-2 font-medium">{c.name}</td>
                    <td className="text-center">{c.matchScore}</td>
                    <td className="text-center text-blue-600 font-medium">
                      {c.interestScore}
                    </td>
                    <td className="text-center font-bold">
                      {c.finalScore}
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {activeCandidate && (
  <div className="bg-white p-5 rounded-xl shadow grid grid-cols-2 gap-4">

    {/* MATCH EXPLANATION */}
    <div>
      <h4 className="text-sm font-semibold mb-2">Match Explanation</h4>
      <p className="text-xs text-gray-600">
        {activeCandidate.reasons?.join(". ") || "No explanation available"}
      </p>
    </div>

    {/* SCORE BREAKDOWN */}
    <div>
      <h4 className="text-sm font-semibold mb-2">Final Score Breakdown</h4>
      <p className="text-sm">Match: {activeCandidate.matchScore}</p>
      <p className="text-sm">Interest: {activeCandidate.interestScore}</p>
      <p className="text-sm font-semibold">
        Final: {activeCandidate.finalScore}
      </p>
    </div>

  </div>
)}

{/* 🔥 ADD THIS HERE */}
{activeCandidate?.signals && (
  <div className="bg-white p-5 rounded-xl shadow">
    <h4 className="text-sm font-semibold mb-2">Extracted Signals</h4>

    <div className="text-sm space-y-1">
      <p>Intent: {activeCandidate.signals.intent}</p>
      <p>Salary: {activeCandidate.signals.salaryFit}</p>
      <p>Availability: {activeCandidate.signals.availability}</p>
      <p>Location: {activeCandidate.signals.locationFit}</p>
    </div>
  </div>
)}

          {/* CHAT */}
          <div className="bg-white p-5 rounded-xl shadow">
            <h3 className="font-semibold mb-3">Chat Simulation</h3>

            <div className="border rounded-lg p-4 mb-3 text-sm bg-gray-50 space-y-2">

  {messages.length === 0 ? (
    <p className="text-gray-400 text-center mt-10">
      Select a candidate and start chatting to update interest score.
    </p>
  ) : (
    messages.map((m, i) => {
      const isRecruiter = m.role === "recruiter";
    
      return (
        <div
          key={i}
          className={`flex ${
            isRecruiter ? "justify-end" : "justify-start"
          } mb-4`}
        >
          <div className="flex flex-col max-w-xs">
    
            {/* 🔥 NAME LABEL */}
            <span
              className={`text-xs mb-1 ${
                isRecruiter ? "text-right text-gray-500" : "text-left text-gray-500"
              }`}
            >
              {isRecruiter
                ? "You"
                : activeCandidate?.name || "Candidate"}
            </span>
    
            {/* 🔥 CHAT BUBBLE */}
            <div
              className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${
                isRecruiter
                  ? "bg-black text-white"
                  : "bg-gray-200 text-black"
              }`}
            >
              {m.content}
            </div>
    
          </div>
        </div>
      );
    })
    
  )}
  <div ref={chatEndRef} />

</div>
{/* 🔥 PRE-GENERATED QUESTIONS */}
<div className="flex flex-wrap gap-2 mb-3">

  {[
    { key: "interest", label: "Ask Interest", text: "How interested are you in this role and why?" },
    { key: "salary", label: "Ask Salary", text: "What are your salary expectations?" },
    { key: "availability", label: "Ask Availability", text: "What is your notice period?" },
    { key: "location", label: "Ask Location", text: "Do you prefer remote, hybrid, or onsite?" }
  ].map((p) => (
    <button
      key={p.key}
      onClick={() => setDraft(p.text)}
      className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg"
    >
      {p.label}
    </button>
  ))}

</div>

            <div className="flex gap-2">
              <input
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />

              <button
                onClick={handleSend}
                className="bg-black text-white px-4 py-2 rounded-lg"
                disabled={chatLoading}
              >
                {chatLoading ? "..." : "Send"}
              </button>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}