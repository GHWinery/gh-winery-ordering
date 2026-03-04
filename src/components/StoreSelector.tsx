"use client";

import { useRouter } from "next/navigation";
import type { Store } from "@/lib/types";
import { MapPin } from "lucide-react";

export function StoreSelector({
  stores,
  currentStoreId,
}: {
  stores: Store[];
  currentStoreId: string;
}) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const storeId = e.target.value;
    document.cookie = `store_id=${storeId};path=/;max-age=${60 * 60 * 24 * 365}`;
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1">
      <MapPin className="w-3 h-3 text-white/50" />
      <select
        value={currentStoreId}
        onChange={handleChange}
        className="bg-transparent text-white/80 text-xs font-medium
          border-none outline-none cursor-pointer appearance-none
          pr-4 -ml-0.5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='rgba(255,255,255,0.5)' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right center",
        }}
      >
        {stores.map((store) => (
          <option key={store.id} value={store.id} className="text-charcoal bg-white">
            {store.name}
          </option>
        ))}
      </select>
    </div>
  );
}
