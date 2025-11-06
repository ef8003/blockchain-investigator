export function topDownLayout(
  graph,
  { rootId, xGap = 220, yGap = 140 } = {}
) {
  const nodesById = new Map(graph.nodes.map(n => [n.id, n]));
  const adj = new Map();     // שכנות קדימה: source -> [targets]
  const indeg = new Map();   // דרגת כניסה לכל צומת

  graph.nodes.forEach(n => {
    adj.set(n.id, []);
    indeg.set(n.id, 0);
  });

  graph.edges.forEach(e => {
    const s = e.source ?? e.from;
    const t = e.target ?? e.to;
    if (!nodesById.has(s) || !nodesById.has(t)) return;
    adj.get(s).push(t);
    indeg.set(t, (indeg.get(t) || 0) + 1);
  });

  // בחירת שורש: עדיף rootId אם קיים; אחרת נבחר צומת עם indegree=0; אחרת הראשון ברשימה
  let root = rootId && nodesById.has(rootId)
    ? rootId
    : [...indeg.entries()].find(([_, d]) => d === 0)?.[0] || graph.nodes[0]?.id;

  // BFS לקביעת רמות
  const level = new Map();  // id -> level
  const q = [];
  if (root) {
    level.set(root, 0);
    q.push(root);
  }

  while (q.length) {
    const u = q.shift();
    for (const v of adj.get(u) || []) {
      if (!level.has(v)) {
        level.set(v, level.get(u) + 1);
        q.push(v);
      }
    }
  }

  // ייתכן שיש קומפוננטות מנותקות; נשים אותן למטה ברמות נפרדות
  // כל צומת ללא רמה — נקצה רמה חדשה (גדולה) כדי שיופיעו מתחת
  const maxKnown = Math.max(0, ...level.values());
  let extraLevel = maxKnown + 1;
  graph.nodes.forEach(n => {
    if (!level.has(n.id)) {
      level.set(n.id, extraLevel);
      extraLevel += 1; // כל מנותק ברמה משלו (אפשר גם לקבץ; תלוי בטעם)
    }
  });

  // קיבוץ לרמות ופריסה במרווחים קבועים
  const byLevel = new Map(); // lvl -> ids[]
  level.forEach((lvl, id) => {
    if (!byLevel.has(lvl)) byLevel.set(lvl, []);
    byLevel.get(lvl).push(id);
  });

  const laidNodes = graph.nodes.map(n => ({ ...n })); // עותק
  byLevel.forEach((ids, lvl) => {
    // סידור יציב (לפי id) – שלא יקפוץ
    ids.sort((a, b) => String(a).localeCompare(String(b)));

    const count = ids.length;
    const totalWidth = (count - 1) * xGap;
    ids.forEach((id, i) => {
      const x = -totalWidth / 2 + i * xGap;
      const y = lvl * yGap; // lvl=0 למעלה, גדל כלפי מטה (כמו שקואורדינטות מסך עובדות)
      const idx = laidNodes.findIndex(nn => nn.id === id);
      if (idx >= 0) {
        laidNodes[idx] = {
          ...laidNodes[idx],
          position: { x, y },
        };
      }
    });
  });

  return { nodes: laidNodes, edges: graph.edges };
}

export function circleLayout(graph, { radius = 300, cx = 0, cy = 0 } = {}) {
    const N = graph.nodes.length || 1;
    const step = (2 * Math.PI) / N;
  
    const nodes = graph.nodes.map((n, i) => ({
      ...n,
      position: n.position ?? {
        x: cx + radius * Math.cos(i * step),
        y: cy + radius * Math.sin(i * step),
      },
    }));
  
    return { nodes, edges: graph.edges };
  }
  
  export function placeAround(graph, centerId, newNodeIds, { radius = 180 } = {}) {
    const center = graph.nodes.find(n => n.id === centerId);
    if (!center) return graph;
  
    const already = new Set(graph.nodes.map(n => n.id));
    const fresh = newNodeIds.filter(id => !already.has(id));
    if (fresh.length === 0) return graph;
  
    const step = (2 * Math.PI) / fresh.length;
    const nodes = graph.nodes.map(n => ({ ...n }));
  
    fresh.forEach((id, k) => {
      const angle = k * step;
      nodes.push({
        id,
        label: id,
        position: {
          x: (center.position?.x ?? 0) + radius * Math.cos(angle),
          y: (center.position?.y ?? 0) + radius * Math.sin(angle),
        },
      });
    });
  
    return { nodes, edges: graph.edges };
  }
  
  export function verticalLayout(graph, { gapY = 150, startX = 0, startY = 0 } = {}) {
    const nodes = graph.nodes.map((n, i) => ({
      ...n,
      position: {
        x: startX,
        y: startY + i * gapY,
      },
    }));
  
    return { nodes, edges: graph.edges };
  }

export function placeBelow(graph, centerId, newNodeIds, { yGap = 140, xGap = 200 } = {}) {
  const nodes = graph.nodes.map(n => ({ ...n }));
  const center = nodes.find(n => n.id === centerId);
  if (!center) return graph;

  const existing = new Set(graph.nodes.map(n => n.id));
  const fresh = newNodeIds.filter(id => existing.has(id));
  if (!fresh.length) return graph;

  const count = fresh.length;
  const totalWidth = (count - 1) * xGap;

  let i = 0;
  for (const id of fresh) {
    const idx = nodes.findIndex(n => n.id === id);
    if (idx === -1) continue;
    nodes[idx] = {
      ...nodes[idx],
      position: {
        x: (center.position?.x ?? 0) - totalWidth / 2 + i * xGap,
        y: (center.position?.y ?? 0) + yGap,
      },
    };
    i++;
  }

  return { nodes, edges: graph.edges };
}
