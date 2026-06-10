import { getSession } from "@/lib/auth";
import ApplyClient from "./ApplyClient";

export default async function ApplyPage() {
  const session = await getSession();
  return <ApplyClient session={session} />;
}
