import { MemoryWorldClient } from "@/components/world/MemoryWorldClient";
import { getMemoryWorldData } from "@/server/world";

export const dynamic = "force-dynamic";

export default async function WorldPage() {
  const data = await getMemoryWorldData();

  return <MemoryWorldClient data={data} />;
}
