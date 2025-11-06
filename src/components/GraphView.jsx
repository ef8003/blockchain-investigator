import { useCallback, useMemo, useEffect } from "react";
import { ReactFlow, Background, Controls, MiniMap, Panel, Handle, Position } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { topDownLayout } from "../utils/layout.js";
import { useApp } from "../context/AppContext.jsx";

function AddressNode({ data }) {
    const canLoadMore = data.hasMoreFor(data.id);
  
    return (
      <div
        style={{
          position: "relative",
          padding: "8px 14px",
          background: "#ffffff",
          border: "1px solid #999",
          borderRadius: 6,
          minWidth: 120,
        }}
      >
        <div>{data.label}</div>

        <Handle type="source" position={Position.Bottom} id="out" />
        <Handle type="target" position={Position.Top} id="in" />


        {canLoadMore && (
          <button
            onClick={() => data.onLoadMore(data.id)}
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              padding: "2px 6px",
              fontSize: 10,
              cursor: "pointer",
              borderRadius: 4,
            }}
          >
            Load more
          </button>
        )}
      </div>
    );
  }  

export default function GraphView({ onExpand, hasMore = {}, onLoadMore }) {
    const { graph, setGraph, setUserArranged, setSelectedNodeId, selectedNodeId, userArranged, setGraphLog  } = useApp();
      
    const nodes = useMemo(() => {
      const baseNodes = (graph.nodes || []).map(n => ({
        id: n.id,
        type: "addressNode",
        data: {
          label: n.label,
          id: n.id,
          hasMoreFor: (id) => hasMore?.[id],
          onLoadMore,
        },
        position: n.position || { x: 0, y: 0 },
      }));
    
      const baseEdges = (graph.edges || []).map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: "smoothstep",
        sourceHandle: "out",
        targetHandle: "in",
      }));
    
      if (!userArranged && baseNodes.length && baseEdges.length) {
        const { nodes: laid } = topDownLayout(
          { nodes: baseNodes, edges: baseEdges },
          { rootId: /* initialAddress */ undefined, xGap: 240, yGap: 140 }
        );
        return laid;
      }
    
      return baseNodes;
    }, [graph.nodes, graph.edges, hasMore, onLoadMore, userArranged]);

    const edges = useMemo(
      () =>
        (graph.edges || [])
          .map((e) => {
            const source = e.source ?? e.from;
            const target = e.target ?? e.to;
            if (!source || !target) return null;
    
            const cleanHandle = (h) =>
              typeof h === "string" && h !== "null" && h !== "undefined" && h.trim() !== ""
                ? h
                : undefined;
    
            const edge = {
              id: e.id ?? `${e.txid ?? "tx"}-${String(source).slice(0, 6)}-${String(target).slice(0, 6)}`,
              source,
              target,
              type: "bezier",
              sourceHandle: "out",
            targetHandle: "in",
            };
    
            const sh = cleanHandle(e.sourceHandle);
            const th = cleanHandle(e.targetHandle);
            if (sh) edge.sourceHandle = sh;
            if (th) edge.targetHandle = th;
    
            return edge;
          })
          .filter(Boolean),
      [graph.edges]
    );
    useEffect(() => {
      console.log("EDGES IN GRAPHVIEW:", edges);
    }, [edges]);
    
    
    const onNodeClick = useCallback((_, node) => {
        setSelectedNodeId(node.id);
        onExpand?.(node.id);
    }, [setSelectedNodeId, onExpand, setGraphLog]);

    const onNodeDragStop = useCallback(
        (_, node) => {
        setUserArranged(true);
        setGraph((g) => ({
            ...g,
            nodes: g.nodes.map((n) =>
            n.id === node.id ? { ...n, position: node.position } : n
            ),
        }));
            },
            [setGraph, setUserArranged]
        );

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeClick={onNodeClick}
            onNodeDragStop={onNodeDragStop}
            nodeTypes={{ addressNode: AddressNode }}
            fitView
            nodesDraggable
            nodesConnectable={false}
            elementsSelectable
            selectionOnDrag
            panOnDrag
            panOnScroll
            zoomOnScroll
            minZoom={0.1}
            maxZoom={2}
            snapToGrid
            snapGrid={[15, 15]}
        >
            <Panel position="bottom-left">

            {selectedNodeId && hasMore?.[selectedNodeId] && (
            <button onClick={() => onLoadMore?.(selectedNodeId)}>Load More</button>
            )}

            <LoadMoreButton hasMore={hasMore} onLoadMore={onLoadMore} />
            </Panel>
            <Background />
            <MiniMap />
            <Controls />
        </ReactFlow>
    );
}

function LoadMoreButton({ hasMore, onLoadMore }) {
  const { selectedNodeId } = useApp();

  if (!selectedNodeId || !hasMore?.[selectedNodeId]) return null;

  return (
    <button
      onClick={() => onLoadMore?.(selectedNodeId)}
      style={{
        padding: "8px 12px",
        background: "#fff",
        border: "1px solid #c7c7c7",
        borderRadius: 8,
        fontWeight: 600,
        cursor: "pointer",
        boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
      }}
    >
      Load more
    </button>
  );
}

