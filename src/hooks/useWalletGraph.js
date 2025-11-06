import { useEffect, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useApp } from "../context/AppContext.jsx";
import { fetchWalletData } from "../api/blockchain";
import { verticalLayout } from "../utils/layout.js";

const N = 2;

function mergeGraph(prev, incoming) {
  const next = {
    nodes: Array.isArray(prev?.nodes) ? [...prev.nodes] : [],
    edges: Array.isArray(prev?.edges) ? [...prev.edges] : [],
  };

  const seenNodes = new Set(next.nodes.map((n) => n.id));
  const seenEdges = new Set(next.edges.map((e) => e.id));

  (incoming?.nodes || []).forEach((n) => {
    if (!seenNodes.has(n.id)) {
      next.nodes.push(n);
      seenNodes.add(n.id);
    }
  });

  (incoming?.edges || []).forEach((e) => {
    if (!seenEdges.has(e.id)) {
      next.edges.push(e);
      seenEdges.add(e.id);
    }
  });

  return next;
}

export function useWalletGraph(initialAddress) {
  const {
    graph,
    setGraph,
    setGraphLog,
    expanded = new Set(),
    setExpanded,
    pageByAddress = {}, 
    setPageByAddress,
  } = useApp();

  const log = (msg) => {
    if (typeof setGraphLog === "function") {
      setGraphLog((prev = []) => [...prev, { message: msg }]);
    }
  };

  const {
    data: initialData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["wallet", initialAddress, "page0"],
    enabled: Boolean(initialAddress),
    staleTime: 0,
    queryFn: async () => {
      const res = await fetchWalletData(initialAddress, { setGraphLog, limit: N, cursor: null });    
      return res;
    },
    onError: (e) => {
      console.error("[Q] fetch error:", e);
    },
  });

  useEffect(() => {
    if (!initialAddress || !initialData?.graph) return;
  
    const merged = mergeGraph(
      { nodes: [], edges: [] },
      initialData.graph
    );
  
    const laidOut = verticalLayout(merged);
  
    setGraph(laidOut);
  
    const { nextCursor = null, batchCount = 0, totalTxs } = initialData;
    if (typeof setPageByAddress === "function") {
      setPageByAddress((prev = {}) => ({
        ...prev,
        [initialAddress]: {
          cursor: nextCursor,
          loaded: batchCount,
          total: (typeof totalTxs === "number" ? totalTxs : prev?.[initialAddress]?.total),
        },
      }));
    }
  }, [initialAddress, initialData, setGraph, setPageByAddress]);

  const expandMutation = useMutation({
    mutationFn: async ({ address }) => {
      const page = pageByAddress?.[address] || { cursor: null, loaded: 0 };
      return fetchWalletData(address, {
        setGraphLog,
        limit: N,
        cursor: page.cursor,
      });
    },
    onSuccess: (data, { address }) => {
      setGraph((g) => mergeGraph(g || { nodes: [], edges: [] }, data.graph));

      if (typeof setExpanded === "function") {
        setExpanded((prev = new Set()) => {
          const s = new Set(prev);
          s.add(address);
          return s;
        });
      }

      const { nextCursor = null, batchCount = 0, totalTxs } = data || {};
      if (typeof setPageByAddress === "function") {
        setPageByAddress((prev = {}) => ({
          ...prev,
          [address]: {
            cursor: nextCursor,
            loaded: (prev?.[address]?.loaded ?? 0) + (batchCount ?? 0),
            total: (typeof totalTxs === "number" ? totalTxs : prev?.[address]?.total),
          },
        }));
      }
    },
    onError: (e, { address }) => {
      log(`שגיאה בהרחבת ${address}: ${e?.message || e}`);
    },
  });

  const expandIfNeeded = (address) => {
    if (!address) return;
    if (!expanded?.has(address)) {
      expandMutation.mutate({ address });
    }
  };

  const loadMoreMutation = useMutation({
    mutationFn: async ({ address }) => {
      const page = pageByAddress?.[address] || { cursor: null, loaded: 0 };
      if (!page.cursor) {
        throw new Error("No more pages");
      }
      return fetchWalletData(address, {
        setGraphLog,
        limit: N,
        cursor: page.cursor,
      });
    },
    onSuccess: (data, { address }) => {
      setGraph((g) => mergeGraph(g || { nodes: [], edges: [] }, data.graph));

      const { nextCursor = null, batchCount = 0, totalTxs } = data || {};
      if (typeof setPageByAddress === "function") {
        setPageByAddress((prev = {}) => ({
          ...prev,
          [address]: {
            cursor: nextCursor,
            loaded: (prev?.[address]?.loaded ?? 0) + (batchCount ?? 0),
            total: (typeof totalTxs === "number" ? totalTxs : prev?.[address]?.total),
          },
        }));
      }
    },
    onError: (e, { address }) => {
      if (String(e?.message || e) === "No more pages") {
        log(`There are no more pages for${address}`);
      } else {
        log(`Error in 'Load More' for ${address}: ${e?.message || e}`);
      }
    },
  });

  const loadMore = (address) => {
    if (!address) return;
    loadMoreMutation.mutate({ address });
  };

  const hasMoreMap = useMemo(() => {
    const out = {};
    for (const [addr, info] of Object.entries(pageByAddress || {})) {
      const byCursor = Boolean(info?.cursor);
      const byCount =
        typeof info?.total === "number"
          ? (info?.loaded ?? 0) < info.total
          : false;
      out[addr] = byCursor || byCount;
    }
    return out;
  }, [pageByAddress]);

  return {
    graph,
    isLoading,
    isError,
    error,
    expandIfNeeded,
    loadMore,
    hasMore: hasMoreMap,
  };
}

export function placeBelow(graph, centerId, newNodeIds, { yGap = 140, xGap = 220 } = {}) {
  const nodes = graph.nodes.map(n => ({ ...n }));
  const center = nodes.find(n => n.id === centerId);
  if (!center) return graph;

  const inGraph = new Set(nodes.map(n => n.id));
  const fresh = newNodeIds.filter(id => inGraph.has(id));
  if (!fresh.length) return graph;

  const count = fresh.length;
  const totalWidth = (count - 1) * xGap;

  fresh.forEach((id, i) => {
    const idx = nodes.findIndex(n => n.id === id);
    if (idx === -1) return;
    nodes[idx] = {
      ...nodes[idx],
      position: {
        x: (center.position?.x ?? 0) - totalWidth / 2 + i * xGap,
        y: (center.position?.y ?? 0) + yGap,
      },
    };
  });

  return { nodes, edges: graph.edges };
}
