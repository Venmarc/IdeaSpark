import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase/server";
import HomeClient from "@/components/idea-generator/HomeClient";

export default async function Page() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return <HomeClient />;
}
