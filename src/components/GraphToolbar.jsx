import { Stack, Button } from "@mui/material";
import { useReactFlow } from "@xyflow/react";
import { useApp } from "../context/AppContext.jsx";
import { circleLayout } from "../utils/layout";

export default function GraphToolbar({ onExpandSelected }) {
  const rf = useReactFlow();
  const { graph, setGraph, selectedNodeId, setUserArranged, userArranged } = useApp();

  const handleFit = () => rf.fitView({ padding: 0.2, includeHiddenNodes: true });

  const handleRelayout = () => {
    setUserArranged(false);
    setGraph(g => circleLayout(g, { radius: 320 }));
    rf.fitView({ padding: 0.2 });
  };

  return (
    <Stack direction="row" spacing={1}>
      <Button variant="outlined" onClick={handleFit}>Fit View</Button>
      <Button variant="outlined" onClick={handleRelayout}>Relayout</Button>
      <Button
        variant="contained"
        disabled={!selectedNodeId}
        onClick={() => onExpandSelected?.(selectedNodeId)}
      >
        Expand Selected
      </Button>
    </Stack>
  );
}
