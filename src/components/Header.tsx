"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { StoreSelector } from "./StoreSelector";
import type { Store } from "@/lib/types";
import { LogOut, Grape, User } from "lucide-react";

export function Header({
  stores,
  currentStoreId,
  userEmail,
}: {
  stores: Store[];
  currentStoreId: string;
  userEmail: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="bg-wine text-white no-print">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: Brand + Store */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <Grape className="w-5 h-5 text-white/90" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold tracking-tight leading-tight">
              GH Winery
            </h1>
            <StoreSelector stores={stores} currentStoreId={currentStoreId} />
          </div>
        </div>

        {/* Right: User + Logout */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-sm text-white/70 mr-1">
            <User className="w-3.5 h-3.5" />
            <span className="truncate max-w-[140px]">{userEmail}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20
              flex items-center justify-center transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
