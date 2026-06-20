import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import HandoverEditClient from "./HandoverEditClient";

export default async function HandoverEditPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/");
  return <HandoverEditClient session={session} />;
}
