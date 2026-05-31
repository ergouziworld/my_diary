import { MemoryWorld } from "@/components/world/MemoryWorld";
import { getMemoryWorldData } from "@/server/world";

export const dynamic = "force-dynamic";

export default async function WorldPage() {
  const data = await getMemoryWorldData();

  return <MemoryWorld data={data} />;
}
