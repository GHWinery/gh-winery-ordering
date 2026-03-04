import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Navigation } from "@/components/Navigation";
import { ToastProvider } from "@/components/Toast";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: stores } = await supabase
    .from("stores")
    .select("*")
    .order("name");

  const cookieStore = await cookies();
  const storeIdCookie = cookieStore.get("store_id")?.value;
  const currentStoreId =
    storeIdCookie && stores?.some((s) => s.id === storeIdCookie)
      ? storeIdCookie
      : stores?.[0]?.id ?? "";

  return (
    <ToastProvider>
      <div className="min-h-screen bg-cream">
        <Header
          stores={stores ?? []}
          currentStoreId={currentStoreId}
          userEmail={user.email ?? ""}
        />
        <Navigation />
        <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
      </div>
    </ToastProvider>
  );
}
