import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminPinsClient from "./AdminPinsClient";

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/");
  return <AdminPinsClient session={session} />;
}
