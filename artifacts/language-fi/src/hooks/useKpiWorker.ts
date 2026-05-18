import { useState, useEffect, useRef, useCallback } from "react";

export interface KpiResult {
  letter: string;
  text: string;
  generatedAt: number;
}

export interface WorkerState {
  ready: boolean;
  loading: boolean;
  progress: number;
  progressFile: string;
  results: Record<string, KpiResult>;
  marketNarrative: string;
  error: string | null;
}

export function useKpiWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<WorkerState>({
    ready: false,
    loading: true,
    progress: 0,
    progressFile: "Initializing…",
    results: {},
    marketNarrative: "",
    error: null,
  });

  useEffect(() => {
    const worker = new Worker(new URL("../workers/kpi.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === "ready") {
        setState((s) => ({ ...s, ready: true, loading: false }));
      } else if (msg.type === "progress") {
        setState((s) => ({ ...s, progress: msg.progress, progressFile: msg.file }));
      } else if (msg.type === "result") {
        if (msg.id === "market") {
          setState((s) => ({ ...s, marketNarrative: msg.text }));
        } else {
          setState((s) => ({ ...s, results: { ...s.results, [msg.id]: { letter: msg.id, text: msg.text, generatedAt: Date.now() } } }));
        }
      } else if (msg.type === "error") {
        setState((s) => ({ ...s, error: msg.message, loading: false }));
      }
    };

    return () => worker.terminate();
  }, []);

  const generateForLetter = useCallback((letter: string, price: number, momentum: number, volatility: string) => {
    workerRef.current?.postMessage({ type: "generate", letter, price, momentum, volatility });
  }, []);

  const generateMarketNarrative = useCallback((regime: string, topLetter: string, flux: number) => {
    workerRef.current?.postMessage({ type: "market_narrative", regime, topLetter, flux });
  }, []);

  return { state, generateForLetter, generateMarketNarrative };
}
