import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import HandoverListClient from "./HandoverListClient";

export default async function HandoverPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/");
  return <HandoverListClient session={session} />;
}
