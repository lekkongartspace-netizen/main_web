import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import EditClient from "./EditClient";

export default async function EditPage() {
  const session = await getSession();
  if (!session || !session.perms.includes("viewApplications")) redirect("/");
  return <EditClient session={session} />;
}
