import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ApplyClient from "./ApplyClient";

export default async function ApplyPage() {
  const session = await getSession();
  if (!session) redirect("/");
  return <ApplyClient userName={session.name} role={session.role} />;
}
