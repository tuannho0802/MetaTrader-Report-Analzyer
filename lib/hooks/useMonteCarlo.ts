import { useState, useCallback, useRef } from 'react';

export interface SimulationParams {
  trades: Array<{ profit: number }>;
  numSimulations: number;
  sampleSize: number;
  shuffle: boolean;
}

export interface SimulationResults {
  profits: number[];
  drawdowns: number[];
}

export function useMonteCarlo() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const runFallback = useCallback(async (params: SimulationParams): Promise<void> => {
    console.warn('[MonteCarlo] Falling back to main thread simulation');
    setIsFallback(true);
    const { trades, numSimulations, sampleSize, shuffle } = params;
    const profits: number[] = [];
    const drawdowns: number[] = [];
    const n = Math.min(sampleSize, trades.length);

    if (!shuffle) {
      let equity = 0;
      let maxEquity = 0;
      let maxDrawdown = 0;
      const sample = trades.slice(0, n);

      for (let k = 0; k < sample.length; k++) {
        equity += sample[k].profit;
        if (equity > maxEquity) maxEquity = equity;
        const dd = maxEquity - equity;
        if (dd > maxDrawdown) maxDrawdown = dd;
      }

      for (let i = 0; i < numSimulations; i++) {
        profits.push(equity);
        drawdowns.push(maxDrawdown);
      }
      setResults({ profits, drawdowns });
      setProgress(100);
      setIsLoading(false);
      return;
    }

    // Process in chunks to avoid blocking UI
    const CHUNK_SIZE = 500;
    for (let i = 0; i < numSimulations; i += CHUNK_SIZE) {
      const end = Math.min(i + CHUNK_SIZE, numSimulations);
      for (let j = i; j < end; j++) {
        // Bootstrap sample with replacement
        const sampleProfits = [];
        for (let s = 0; s < n; s++) {
          sampleProfits.push(trades[Math.floor(Math.random() * trades.length)].profit);
        }

        let equity = 0;
        let maxEquity = 0;
        let maxDrawdown = 0;
        for (const p of sampleProfits) {
          equity += p;
          if (equity > maxEquity) maxEquity = equity;
          const dd = maxEquity - equity;
          if (dd > maxDrawdown) maxDrawdown = dd;
        }
        profits.push(equity);
        drawdowns.push(maxDrawdown);
      }
      setProgress((end / numSimulations) * 100);
      // Yield to main thread
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    setResults({ profits, drawdowns });
    setIsLoading(false);
  }, []);

  const run = useCallback((params: SimulationParams): Promise<void> => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    setIsLoading(true);
    setIsFallback(false);
    setProgress(0);
    setResults(null);
    setError(null);

    return new Promise((resolve, reject) => {
      const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
      const workerUrl = `${basePath}/montecarlo.worker.js`;
      
      let worker: Worker | null = null;
      try {
        worker = new Worker(workerUrl);
      } catch (err) {
        console.error('[MonteCarlo] Failed to initialize worker:', err);
        runFallback(params).then(resolve).catch(reject);
        return;
      }
      
      if (!worker) {
        runFallback(params).then(resolve).catch(reject);
        return;
      }

      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent) => {
        const { type } = e.data;
        if (type === 'progress') {
          setProgress((e.data.current / e.data.total) * 100);
        } else if (type === 'complete') {
          setResults(e.data.data as SimulationResults);
          setIsLoading(false);
          setProgress(100);
          worker?.terminate();
          workerRef.current = null;
          resolve();
        }
      };

      worker.onerror = (err: ErrorEvent) => {
        console.error('[MonteCarlo] Worker error:', err);
        worker?.terminate();
        workerRef.current = null;
        runFallback(params).then(resolve).catch(reject);
      };

      worker.postMessage(params);
    });
  }, [runFallback]);

  const cancel = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsLoading(false);
    setIsFallback(false);
    setProgress(0);
  }, []);

  return { run, cancel, isLoading, isFallback, progress, results, error };
}
