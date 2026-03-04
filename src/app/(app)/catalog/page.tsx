import { createClient } from "@/lib/supabase/server";
import {
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  type SupplyItem,
  type SupplyCategory,
} from "@/lib/types";
import { CatalogClient } from "./CatalogClient";

export default async function CatalogPage() {
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("supply_items")
    .select("*")
    .order("sort_order");

  const { data: stores } = await supabase
    .from("stores")
    .select("*")
    .order("name");

  const grouped = CATEGORY_ORDER.reduce(
    (acc, cat) => {
      const catItems = ((items as SupplyItem[]) ?? [])
        .filter((i) => i.category === cat)
        .sort((a, b) => a.sort_order - b.sort_order);
      if (catItems.length > 0) acc[cat] = catItems;
      return acc;
    },
    {} as Record<SupplyCategory, SupplyItem[]>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-brown">Supply Catalog</h2>
        <p className="text-sm text-brown/60">
          Manage the master list of supply items available for ordering.
        </p>
      </div>

      <CatalogClient stores={stores ?? []} />

      {Object.entries(grouped).map(([category, catItems]) => (
        <div
          key={category}
          className="bg-white rounded-lg border border-cream-dark overflow-hidden"
        >
          <div className="bg-cream px-4 py-2.5 border-b border-cream-dark">
            <h3 className="font-semibold text-brown">
              {CATEGORY_LABELS[category as SupplyCategory]}
            </h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream-dark">
                <th className="text-left px-4 py-2 font-medium text-brown/70">
                  Name
                </th>
                <th className="text-right px-4 py-2 font-medium text-brown/70">
                  Recommended Stock
                </th>
                <th className="text-left px-4 py-2 font-medium text-brown/70">
                  Unit
                </th>
                <th className="text-left px-4 py-2 font-medium text-brown/70">
                  Available At
                </th>
              </tr>
            </thead>
            <tbody>
              {catItems.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-cream-dark last:border-0"
                >
                  <td className="px-4 py-2">{item.name}</td>
                  <td className="px-4 py-2 text-right">
                    {item.recommended_stock}
                  </td>
                  <td className="px-4 py-2 text-brown/60">{item.unit}</td>
                  <td className="px-4 py-2 text-brown/60 text-xs">
                    {item.available_at
                      .map((sid) => {
                        const store = stores?.find((s) => s.id === sid);
                        return store?.name ?? sid;
                      })
                      .join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
