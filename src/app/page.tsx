import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/adapters/supabase/client-server";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/inbox" : "/login");
}
