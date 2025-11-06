import { useQuery } from "@tanstack/react-query";
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
} from "@mui/material";
import { useApp } from "../context/AppContext.jsx";
import { fetchWalletData } from "../api/blockchain";

export default function DetailsPanel({ onLoadMore, hasMore = {} }) {
  const { selectedNodeId, setGraphLog } = useApp();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["wallet-details", selectedNodeId],
    queryFn: () =>
      fetchWalletData(selectedNodeId, {
        setGraphLog,
        limit: 10,
        cursor: null,
      }),
    enabled: Boolean(selectedNodeId),
    staleTime: 0,
  });

  if (!selectedNodeId) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1">Select a node to view details.</Typography>
      </Paper>
    );
  }

  if (isLoading) {
    return (
      <Paper sx={{ p: 2 }}>
        <CircularProgress size={20} sx={{ mr: 1 }} />
        Loading details...
      </Paper>
    );
  }

  if (isError) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography color="error">שגיאה: {String(error)}</Typography>
      </Paper>
    );
  }

  const d = data?.details || {};
  const addr = d.address || selectedNodeId;

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Address Details
      </Typography>
      <Typography variant="body2">
        <b>Address:</b> {d.address ?? "-"}
      </Typography>
      <Typography variant="body2">
        <b>Balance:</b> {d.balance ?? "-"}
      </Typography>
      <Typography variant="body2">
        <b>Total Received:</b> {d.total_received ?? "-"}
      </Typography>
      <Typography variant="body2">
        <b>Total Sent:</b> {d.total_sent ?? "-"}
      </Typography>

      <Typography variant="subtitle2" sx={{ mt: 1 }}>
        Recent TXs:
      </Typography>
      <List dense>
        {(d.txs || []).map((tx) => (
          <ListItem key={tx.hash}>
            <ListItemText
              primary={tx.hash}
              secondary={`confirmations: ${tx.confirmations ?? 0}`}
            />
          </ListItem>
        ))}
      </List>

      {hasMore?.[addr] && (
        <Button
          variant="outlined"
          onClick={() => onLoadMore?.(addr)}
          sx={{ mt: 1, zIndex: 10 }}
        >
          Load more
        </Button>
      )}
    </Paper>
  );
}
