"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addSupplyItem } from "@/app/(app)/actions/catalog";
import { CATEGORY_ORDER, CATEGORY_LABELS, type Store } from "@/lib/types";

export function CatalogClient({ stores }: { stores: Store[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await addSupplyItem(formData);

    if (result && "error" in result) {
      alert(result.error);
    } else {
      setShowForm(false);
      router.refresh();
    }
    setLoading(false);
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="text-sm bg-wine text-white px-3 py-1.5 rounded hover:bg-wine-dark transition-colors"
      >
        Add Item
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-cream-dark p-4">
      <h3 className="font-semibold text-brown mb-3">Add Supply Item</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-brown/70 mb-1">
            Name
          </label>
          <input
            name="name"
            required
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-wine"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-brown/70 mb-1">
            Category
          </label>
          <select
            name="category"
            required
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-wine"
          >
            {CATEGORY_ORDER.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-brown/70 mb-1">
            Recommended Stock
          </label>
          <input
            name="recommended_stock"
            type="number"
            min={0}
            defaultValue={0}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-wine"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-brown/70 mb-1">
            Unit
          </label>
          <input
            name="unit"
            required
            placeholder="cases, each, rolls..."
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-wine"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-brown/70 mb-1">
            Sort Order
          </label>
          <input
            name="sort_order"
            type="number"
            defaultValue={0}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-wine"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-brown/70 mb-1">
            Available At
          </label>
          <div className="flex flex-col gap-1">
            {stores.map((store) => (
              <label key={store.id} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  name="available_at"
                  value={store.id}
                  defaultChecked
                  className="accent-wine"
                />
                {store.name}
              </label>
            ))}
          </div>
        </div>
        <div className="col-span-2 flex gap-2 justify-end mt-2">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-wine text-white rounded hover:bg-wine-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Item"}
          </button>
        </div>
      </form>
    </div>
  );
}
