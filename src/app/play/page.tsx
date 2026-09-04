import { createClient } from "@/lib/supabase/server";
import PlayClient from "./play-client";

export default async function PlayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    username = profile?.username ?? null;
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 overflow-hidden px-4 py-4">
      <PlayClient userId={user?.id ?? null} username={username} />
    </main>
  );
}
