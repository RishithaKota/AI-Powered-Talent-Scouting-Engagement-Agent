import { Show, SignInButton, UserButton, useUser } from "@clerk/react";
import { useEffect } from "react";

import AuthScreen from "./components/AuthScreen";
import Dashboard from "./components/Dashboard";

export default function App() {
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return;

    const alreadySynced = localStorage.getItem("syncedUser");

    // 🔥 prevent duplicate DB calls
    if (alreadySynced === email) return;

    fetch("http://localhost:5700/api/user/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    })
      .then(() => {
        localStorage.setItem("syncedUser", email);
      })
      .catch((err) => {
        console.error("User sync failed:", err);
      });

  }, [user]);

  return (
    <div className="min-h-screen bg-gray-100">

      {/* 🔥 NAVBAR */}
      <div className="flex justify-between items-center px-6 py-4 bg-white shadow">
        <h1 className="text-xl font-semibold">
          AI Recruiter
        </h1>

        <div>
          <Show when="signed-out">
            <SignInButton />
          </Show>

          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>

      {/* 🔥 MAIN CONTENT */}
      <div className="p-6">
        <Show when="signed-out">
          <AuthScreen />
        </Show>

        <Show when="signed-in">
          <Dashboard />
        </Show>
      </div>

    </div>
  );
}