import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminPinsClient from "./AdminPinsClient";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role !== "admin") redirect("/dashboard");
  return <AdminPinsClient userName={session.name} role={session.role} />;
}
