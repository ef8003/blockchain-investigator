import { createContext, useContext, useMemo, useState } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [graphLog, setGraphLog] = useState([]);    
    const [initialAddress, setInitialAddress] = useState("");
    const [graph, setGraph] = useState({ nodes: [], edges: [] });
    const [expanded, setExpanded] = useState(new Set());
    const [userArranged, setUserArranged] = useState(false);
    const [pageByAddress, setPageByAddress] = useState({});

    const value = useMemo(() => ({
        selectedNodeId, setSelectedNodeId,
        graphLog, setGraphLog,
        graph, setGraph,
        expanded, setExpanded,
        userArranged, setUserArranged,
        pageByAddress, setPageByAddress,
      }), [selectedNodeId, graphLog, graph, expanded, userArranged, pageByAddress]);
  
      const [hasMore, setHasMore] = useState({}); 
      const [cursors, setCursors] = useState({});
      const [logs, setLogs] = useState([]);

      return (
        <AppContext.Provider value={{
        pageByAddress,setPageByAddress,
          graph, setGraph,
          graphLog, setGraphLog,
          selectedNodeId, setSelectedNodeId,
          userArranged, setUserArranged,
          hasMore, setHasMore,
          cursors, setCursors,
          logs, setLogs,
        }}>
          {children}
        </AppContext.Provider>
      );
  }  

export const useApp = () => useContext(AppContext);
