import { useState } from "react";
import { Container, Grid, Alert, CircularProgress, Paper } from "@mui/material";
import SearchBar from "./components/SearchBar.jsx";
import GraphView from "./components/GraphView.jsx";
import DetailsPanel from "./components/DetailsPanel.jsx";
import LogPanel from "./components/LogPanel.jsx";
import { useWalletGraph } from "./hooks/useWalletGraph.js";
import { useApp } from "./context/AppContext.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx"

export default function App() {
  const [initialAddress, setInitialAddress] = useState("");

  const { setGraph, graphLog, setGraphLog, setPageByAddress } = useApp();

  const handleClear = () => {
    setGraphLog([]); 
    setInitialAddress(""); 
    setGraph({ nodes: [], edges: [] });
    setPageByAddress({});
  };

  const {
    isLoading,
    isError,
    error,
    loadMore,
    hasMore,
    expandIfNeeded,
  } = useWalletGraph(initialAddress);

  const handleSubmit = (addr) => {
    setGraph({ nodes: [], edges: [] });
    setInitialAddress(addr);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <SearchBar onSubmit={handleSubmit} />

      {isLoading && (
        <Alert icon={<CircularProgress size={16} />} severity="info" sx={{ my: 1 }}>
          Loading data...
        </Alert>
      )}
      {isError && (
        <Alert severity="error" sx={{ my: 1 }}>
          Loading error: {String(error)}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={8}>
          <ErrorBoundary onRetry={() => {
            setGraph({ nodes: [], edges: [] });
            if (initialAddress) setInitialAddress(initialAddress);
          }}>
            <Paper sx={{ p: 1, height: "70vh" }}>
              <GraphView onExpand={expandIfNeeded} />
            </Paper>
          </ErrorBoundary>
          <LogPanel logs={graphLog} loading={isLoading} onClear={handleClear} />
        </Grid>

        <Grid item xs={12} md={4}>
          <DetailsPanel onLoadMore={loadMore} hasMore={hasMore} />
        </Grid>
      </Grid>
    </Container>
  );
}
