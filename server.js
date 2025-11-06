import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const PROVIDER = process.env.PROVIDER || "blockstream";

app.get("/api/wallet/:address", async (req, res) => {
  const { address } = req.params;
  const limit = Math.max(1, Math.min(parseInt(req.query.limit || "10", 10), 50));
  const cursor = req.query.cursor || null;

  try {
    if (PROVIDER === "blockstream") {
      const infoRes = await fetch(`https://blockstream.info/api/address/${address}`);
      if (!infoRes.ok) {
        const text = await infoRes.text();
        return res.status(502).json({ error: "provider error (info)", detail: text.slice(0, 200) });
      }
      const info = await infoRes.json();
      if (!info || info.error) {
        return res.status(502).json({ error: info?.error || "provider error (info-json)" });
      }

      const txsUrl = cursor
        ? `https://blockstream.info/api/address/${address}/txs/chain/${cursor}`
        : `https://blockstream.info/api/address/${address}/txs`;

      const txsRes = await fetch(txsUrl);
      if (!txsRes.ok) {
        const text = await txsRes.text();
        return res.status(502).json({ error: "provider error (txs)", detail: text.slice(0, 200) });
      }

      let txs = await txsRes.json();
      if (!Array.isArray(txs)) txs = [];

      const page = txs.slice(0, limit);

      const nextCursor =
        page.length > 0 && txs.length > limit
          ? page[page.length - 1].txid
          : null;

      const unified = {
        total_received: info.chain_stats?.funded_txo_sum ?? 0,
        total_sent: info.chain_stats?.spent_txo_sum ?? 0,
        final_balance:
          (info.chain_stats?.funded_txo_sum ?? 0) -
          (info.chain_stats?.spent_txo_sum ?? 0),
        nextCursor,
        txs: page.map((tx) => ({
          hash: tx.txid,
          inputs: (tx.vin || []).map((vin) => ({
            addresses: [vin.prevout?.scriptpubkey_address].filter(Boolean),
          })),
          outputs: (tx.vout || []).map((vout) => ({
            addresses: [vout.scriptpubkey_address].filter(Boolean),
          })),
          confirmations: tx.status?.confirmed ? 1 : 0,
        })),
      };

      return res.json(unified);
    }

    if (PROVIDER === "blockcypher") {
      const token = process.env.BCYPHER_TOKEN ? `&token=${process.env.BCYPHER_TOKEN}` : "";
      const url = `https://api.blockcypher.com/v1/btc/main/addrs/${address}/full?limit=50${token}`;
      const r = await fetch(url);
      if (!r.ok) {
        const text = await r.text();
        return res.status(502).json({ error: "provider error (blockcypher)", detail: text.slice(0, 200) });
      }
      const data = await r.json();
      if (!data || data.error) {
        return res.status(502).json({ error: data?.error || "provider error (blockcypher-json)" });
      }
      return res.json(data);
    }

    return res.status(500).json({ error: "Unknown provider" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error", detail: String(e) });
  }
});

app.listen(5000, () =>
  console.log("Proxy server running on port 5000 (provider:", PROVIDER, ")")
);
