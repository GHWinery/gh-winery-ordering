import { createClient } from "@/lib/supabase/server";
import {
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  type SupplyItem,
  type SupplyCategory,
} from "@/lib/types";
import { CatalogClient } from "./CatalogClient";
import { ExternalLink } from "lucide-react";

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
        <h2 className="font-serif text-2xl font-bold text-charcoal">
          Supply Catalog
        </h2>
        <p className="text-sm text-charcoal-light mt-0.5">
          Manage the master list of supply items available for ordering.
        </p>
      </div>

      <CatalogClient stores={stores ?? []} />

      {Object.entries(grouped).map(([category, catItems]) => (
        <div
          key={category}
          className="bg-white rounded-2xl border border-cream-dark overflow-hidden"
        >
          <div className="bg-cream-dark/50 px-4 py-2.5 border-b border-cream-dark">
            <h3 className="font-semibold text-charcoal">
              {CATEGORY_LABELS[category as SupplyCategory]}
            </h3>
          </div>
          <div className="divide-y divide-cream-dark">
            {catItems.map((item) => (
              <div
                key={item.id}
                className="px-4 py-3 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm text-charcoal">
                      {item.name}
                    </span>
                    {item.order_url && (
                      <a
                        href={item.order_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-info hover:text-info/80 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  <div className="text-xs text-charcoal-light mt-0.5">
                    {item.recommended_stock > 0 && (
                      <span>
                        Rec: {item.recommended_stock} {item.unit}
                      </span>
                    )}
                    {item.recommended_stock === 0 && (
                      <span>{item.unit}</span>
                    )}
                    <span className="mx-1.5">&middot;</span>
                    <span>
                      {item.available_at
                        .map((sid) => {
                          const store = stores?.find((s) => s.id === sid);
                          return store?.name ?? sid;
                        })
                        .join(", ")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
