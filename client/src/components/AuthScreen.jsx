import { SignInButton, SignUpButton } from "@clerk/react";
import { BriefcaseBusiness, Sparkles } from "lucide-react";

export default function AuthScreen() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      
      <section className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-12 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        
        {/* LEFT SIDE */}
        <div>
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center bg-black text-white rounded-xl shadow">
            <BriefcaseBusiness size={24} />
          </div>

          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-gray-900 sm:text-5xl">
            AI Recruiter Platform
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600">
            Instantly match candidates, simulate conversations, and build a smarter shortlist using AI-powered insights.
          </p>

          {/* CTA BUTTONS */}
          <div className="mt-8 flex flex-wrap gap-4">
            
            <SignInButton mode="modal">
              <button className="bg-black text-white px-6 py-3 rounded-xl font-semibold shadow hover:bg-gray-800 transition">
                Get Started
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button className="border border-gray-300 px-6 py-3 rounded-xl font-semibold hover:border-black hover:text-black transition">
                Create Account
              </button>
            </SignUpButton>

          </div>
        </div>

        {/* RIGHT SIDE PANEL */}
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:scale-[1.02] transition">
          
          <div className="flex items-center gap-3 border-b pb-4">
            <Sparkles className="text-purple-500" size={22} />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Recruiting workflow
              </p>
              <p className="text-sm text-gray-500">
                Match → Chat → Score → Shortlist
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {[
              "Paste job description",
              "View top 5 ranked candidates",
              "Simulate AI recruiter chat",
              "Generate shortlist with insights"
            ].map((item, index) => (
              <div key={item} className="flex items-center gap-4">
                
                <span className="flex h-9 w-9 items-center justify-center bg-gray-100 text-sm font-bold text-black rounded-lg">
                  {index + 1}
                </span>

                <span className="text-sm font-medium text-gray-700">
                  {item}
                </span>

              </div>
            ))}
          </div>

        </div>

      </section>

    </main>
  );
}