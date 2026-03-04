"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Grape, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl shadow-wine/5 p-8 border border-cream-dark">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-wine/10 flex items-center justify-center mx-auto mb-4">
              <Grape className="w-7 h-7 text-wine" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-charcoal">
              GH Winery
            </h1>
            <p className="text-charcoal-light text-sm mt-1">
              Supply Ordering System
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-danger-light text-danger text-sm px-4 py-3 rounded-xl border border-danger/20">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-charcoal mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-cream-dark rounded-xl px-4 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-wine/20 focus:border-wine/30
                  transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-charcoal mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-cream-dark rounded-xl px-4 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-wine/20 focus:border-wine/30
                  transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-wine text-white py-2.5 rounded-xl font-semibold
                hover:bg-wine-light transition-all shadow-lg shadow-wine/20
                disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
