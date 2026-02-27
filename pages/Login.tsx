import { useState } from "react";
import { supabase } from "../services/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  const handleAuth = async () => {
  console.log("AUTH CLICKED"); // ← ADD THIS LINE
  setLoading(true);

  try {
    if (!email || !password) {
      alert("Enter email and password");
      return;
    }

    console.log("Auth start", { email, isSignup });

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log("Signup response:", { data, error });

      if (error) throw error;

      alert("Signup successful. Check your email if confirmation is on.");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Login response:", { data, error });

      if (error) throw error;

      alert("Login success");
    }
  } catch (err: any) {
    console.error("AUTH ERROR:", err);
    alert(err.message || "Auth failed");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl border border-black/20 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">
          {isSignup ? "Create account" : "Welcome back"}
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-3 px-4 py-3 rounded-xl border border-black/20"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 px-4 py-3 rounded-xl border border-black/20"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleAuth}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-black text-white font-semibold"
        >
          {loading
            ? "Please wait..."
            : isSignup
            ? "Create account"
            : "Log in"}
        </button>

        <p className="text-sm text-center mt-4">
          {isSignup ? "Already have an account?" : "New here?"}{" "}
          <button
            className="font-semibold underline"
            onClick={() => setIsSignup(!isSignup)}
          >
            {isSignup ? "Log in" : "Create account"}
          </button>
        </p>
      </div>
    </div>
  );
}