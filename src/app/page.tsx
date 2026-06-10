import { getSession } from "@/lib/auth";
import DashboardClient from "./dashboard/DashboardClient";

export default async function HomePage() {
  const session = await getSession();
  return <DashboardClient session={session} />;
}
