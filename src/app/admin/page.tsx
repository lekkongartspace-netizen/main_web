import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminPinsClient from "./AdminPinsClient";

export default async function AdminPage() {
  const session = await getSession();
  if (!session || !session.perms.includes("managePins")) redirect("/");
  return <AdminPinsClient session={session} />;
}
