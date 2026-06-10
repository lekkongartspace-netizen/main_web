import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ApplicationsClient from "./ApplicationsClient";

export default async function ApplicationsPage() {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role !== "admin") redirect("/dashboard");
  return <ApplicationsClient userName={session.name} role={session.role} />;
}
