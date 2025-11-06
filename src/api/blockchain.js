const API_BASE = "http://localhost:5000"; 

/**
 * @param {string} address
 * @param {{ before?: string|null, limit?: number }} opts
 */

export function normalizeToGraph(address, raw, {
  maxTxPerFetch = 15,
  maxNeighborsPerTx = 8
} = {}) {

  const centerId = address;
  const nodesMap = new Map([[centerId, { id: centerId, label: centerId }]]);
  const edges = [];

  const txs = (raw?.txs || []).slice(0, maxTxPerFetch);

  txs.forEach(tx => {
    const inputs  = (tx.inputs  || []).flatMap(i => i.addresses || []);
    const outputs = (tx.outputs || []).flatMap(o => o.addresses || []);

    const limitedInputs  = inputs.slice(0, maxNeighborsPerTx);
    const limitedOutputs = outputs.slice(0, maxNeighborsPerTx);

    limitedInputs.forEach(src => {
      if (!nodesMap.has(src)) nodesMap.set(src, { id: src, label: src });

      limitedOutputs.forEach(dst => {
        if (!nodesMap.has(dst)) nodesMap.set(dst, { id: dst, label: dst });

        edges.push({
          id: `${tx.hash}-${src.slice(0,6)}-${dst.slice(0,6)}`,
          source: src,
          target: dst,
          txid: tx.hash
        });
      });
    });
  });

  return {
    nodes: Array.from(nodesMap.values()),
    edges
  };
}

export async function fetchWalletData(address, { setGraphLog, limit = 10, cursor = null } = {}) {
  function logify(setGraphLog, msg, meta = null) {
    if (typeof setGraphLog !== "function") return;
    setGraphLog(prev => [...(prev || []), { ts: Date.now(), msg, meta }]);
  }
  
  const addr = String(address || "").trim();
  if (!addr) throw new Error("Missing address");

  logify(setGraphLog, `Fetching ${addr} (limit=${limit}, cursor=${cursor ?? "none"})`);

  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  if (cursor) qs.set("cursor", cursor);

  const url = `${API_BASE}/api/wallet/${encodeURIComponent(addr)}?${qs.toString()}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    logify(setGraphLog, `API error ${res.status}`, { body: text });
    throw new Error(`API error ${res.status}`);
  }

  const data = await res.json();

  const graph = normalizeToGraph(addr, data, {
    maxTxPerFetch: limit,
    maxNeighborsPerTx: 8,
  });

  const details = {
    address: addr,
    total_received: data?.total_received,
    total_sent:     data?.total_sent,
    balance:        data?.final_balance,
    txs: (Array.isArray(data?.txs) ? data.txs : []).map(tx => ({
      hash: tx?.hash,
      confirmations: tx?.confirmations ?? 0
    }))
  };

  const batchCount = Array.isArray(data?.txs) ? data.txs.length : 0;
  const nextCursor = data?.nextCursor ?? null;
  const totalTxs   = typeof data?.totalTxs === "number" ? data.totalTxs : undefined;

  return { graph, details, nextCursor, batchCount, totalTxs };
}