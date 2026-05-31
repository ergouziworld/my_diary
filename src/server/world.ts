export type WorldNodeKind = "memory" | "quest" | "mood";

export type MemoryWorldNode = {
  id: string;
  kind: WorldNodeKind;
  title: string;
  summary: string;
  detail: string;
  date: string;
  x: number;
  y: number;
  color: string;
  glow: string;
  energy: number;
  tags: string[];
};

export type MemoryWorldData = {
  nodes: MemoryWorldNode[];
  stats: {
    memories: number;
    quests: number;
    moods: number;
  };
};

export async function getMemoryWorldData(): Promise<MemoryWorldData> {
  return getDemoWorldData();
}

function getDemoWorldData(): MemoryWorldData {
  const now = new Date().toISOString();

  return {
    nodes: [
      {
        id: "demo-memory-1",
        kind: "memory",
        title: "第一座记忆岛",
        summary: "这是演示节点。后面可以换成你的真实日记。",
        detail: "每篇日记都可以变成一个可探索的地点。先把 3D 手感跑稳，再接真实数据。",
        date: now,
        x: 50,
        y: 28,
        color: "#22d3ee",
        glow: "rgba(34, 211, 238, 0.38)",
        energy: 72,
        tags: ["demo", "memory"],
      },
      {
        id: "demo-quest-1",
        kind: "quest",
        title: "世界任务",
        summary: "提醒会从 AI 分析出的待办里浮现出来。",
        detail: "以后可以让任务变成地图路标，完成后解锁新的道路、地点或温柔的环境变化。",
        date: now,
        x: 28,
        y: 62,
        color: "#facc15",
        glow: "rgba(250, 204, 21, 0.34)",
        energy: 86,
        tags: ["todo", "high"],
      },
      {
        id: "demo-mood-1",
        kind: "mood",
        title: "平静",
        summary: "情绪节点会影响天空、颜色和地点氛围。",
        detail: "如果某天的日记偏开心，世界会更明亮；如果焦虑，远处可以出现风、雾或低云。",
        date: now,
        x: 72,
        y: 64,
        color: "#38bdf8",
        glow: "rgba(56, 189, 248, 0.32)",
        energy: 64,
        tags: ["情绪", "64%"],
      },
    ],
    stats: {
      memories: 1,
      quests: 1,
      moods: 1,
    },
  };
}
