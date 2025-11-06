
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const N = 2;

let _graph, _setGraph, _setGraphLog, _expanded, _setExpanded, _pageByAddress, _setPageByAddress;

vi.mock('../src/context/AppContext.jsx', () => {
  return {
    useApp: () => ({
      graph: _graph,
      setGraph: _setGraph,
      setGraphLog: _setGraphLog,
      expanded: _expanded,
      setExpanded: _setExpanded,
      pageByAddress: _pageByAddress,
      setPageByAddress: _setPageByAddress,
    }),
  };
});

const fetchWalletDataMock = vi.fn();
vi.mock('../src/api/blockchain', () => ({
  fetchWalletData: (...args) => fetchWalletDataMock(...args),
}));

vi.mock('../src/utils/layout.js', () => ({
  verticalLayout: (g) => g,
}));

import { useWalletGraph } from '../src/hooks/useWalletGraph.js';

function withClient(children) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}


function createWrapper() {
  return ({ children }) => withClient(children);
}

beforeEach(() => {
  fetchWalletDataMock.mockReset();

  _graph = null;
  _setGraph = vi.fn((updater) => {
    _graph = typeof updater === 'function' ? updater(_graph) : updater;
  });

  _setGraphLog = vi.fn();

  _expanded = new Set();
  _setExpanded = vi.fn((updater) => {
    _expanded = typeof updater === 'function' ? updater(_expanded) : updater;
  });

  _pageByAddress = {}; 
  _setPageByAddress = vi.fn((updater) => {
    _pageByAddress = typeof updater === 'function' ? updater(_pageByAddress) : updater;
  });
});

afterEach(() => {
  // 
});

describe('useWalletGraph', () => {
  it('initial load: fetches with limit=N and cursor=null, sets graph and pagination', async () => {
    const addr = '1BoatSLRHt...tpyT';

    fetchWalletDataMock.mockResolvedValueOnce({
      graph: { nodes: [{ id: addr }], edges: [] },
      details: { address: addr, balance: 123 },
      nextCursor: 'CURSOR_1',
      batchCount: 2,
      totalTxs: 10,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useWalletGraph(addr), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchWalletDataMock).toHaveBeenCalledTimes(1);
    expect(fetchWalletDataMock).toHaveBeenCalledWith(addr, expect.objectContaining({
      limit: N,
      cursor: null,
      setGraphLog: expect.any(Function),
    }));

    expect(_setGraph).toHaveBeenCalled();
    expect(_graph).toEqual({ nodes: [{ id: addr }], edges: [] });

    expect(_setPageByAddress).toHaveBeenCalled();
    expect(_pageByAddress[addr]).toEqual({
      cursor: 'CURSOR_1',
      loaded: 2,
      total: 10,
    });
  });

  it('expandIfNeeded: fetches when address not yet expanded, and marks it expanded', async () => {
    const addr = 'bc1-expand-me';
    _pageByAddress = {};
  
    fetchWalletDataMock.mockResolvedValueOnce({
      graph: { nodes: [{ id: addr }], edges: [] },
      details: { address: addr },
      nextCursor: 'NEXT',
      batchCount: 2,
      totalTxs: 5,
    });
  
    const wrapper = createWrapper();
    const { result } = renderHook(() => useWalletGraph(''), { wrapper });
  
    await act(async () => {
      result.current.expandIfNeeded(addr);
    });
  
    await waitFor(() => {
      expect(_expanded.has(addr)).toBe(true);
    });
  
    const afterFirst = fetchWalletDataMock.mock.calls.length;
    expect(afterFirst).toBeGreaterThan(0);
  
    await act(async () => {
      result.current.expandIfNeeded(addr);
    });
  
    const afterSecond = fetchWalletDataMock.mock.calls.length;
    expect(afterSecond).toBe(afterFirst);
  });
  
  

  it('loadMore: when no cursor, logs "No more pages" flow (does not call fetch)', async () => {
    const addr = 'bc1-no-more';

    _pageByAddress = {
      [addr]: { cursor: null, loaded: 2, total: 2 },
    };

    const wrapper = createWrapper();
    const { result } = renderHook(() => useWalletGraph(''), { wrapper });

    await act(async () => {
      result.current.loadMore(addr);
    });

    expect(fetchWalletDataMock).not.toHaveBeenCalled();

    expect(_setGraphLog).toHaveBeenCalled();
    const updater = _setGraphLog.mock.calls[0][0];
    expect(typeof updater).toBe('function');

    const after = updater([]);
    const msg = after?.[0]?.message;
    expect(msg).toMatch(/There are no more pages for/);
    expect(msg).toContain(addr);
  });

  it('loadMore: with cursor, fetches next page and merges graph + updates pagination', async () => {
    const addr = 'bc1-has-more';
    _pageByAddress = {
      [addr]: { cursor: 'CUR_2', loaded: 2, total: 6 },
    };

    fetchWalletDataMock.mockResolvedValueOnce({
      graph: { nodes: [{ id: addr }, { id: 'N2' }], edges: [{ id: 'E1', source: addr, target: 'N2' }] },
      details: { address: addr },
      nextCursor: 'CUR_3',
      batchCount: 2,
      totalTxs: 6,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useWalletGraph(''), { wrapper });

    await act(async () => {
      result.current.loadMore(addr);
    });

    expect(fetchWalletDataMock).toHaveBeenCalledTimes(1);
    expect(fetchWalletDataMock).toHaveBeenCalledWith(addr, expect.objectContaining({
      limit: N,
      cursor: 'CUR_2',
      setGraphLog: expect.any(Function),
    }));

    expect(_setGraph).toHaveBeenCalled();
    expect(_graph.nodes.find(n => n.id === 'N2')).toBeTruthy();

    expect(_pageByAddress[addr]).toEqual({
      cursor: 'CUR_3',
      loaded: 4,
      total: 6,
    });
  });
});
