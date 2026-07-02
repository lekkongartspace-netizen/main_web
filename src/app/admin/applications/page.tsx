import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ApplicationsClient from "./ApplicationsClient";

export default async function ApplicationsPage() {
  const session = await getSession();
  if (!session || !session.perms.includes("viewApplications")) redirect("/");
  return <ApplicationsClient session={session} />;
}
