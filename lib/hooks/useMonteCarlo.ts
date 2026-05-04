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
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const run = useCallback((params: SimulationParams): Promise<void> => {
    // Terminate any running worker first
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    setIsLoading(true);
    setProgress(0);
    setResults(null);
    setError(null);

    return new Promise((resolve, reject) => {
      // ✅ CRITICAL: Handle basePath correctly for static export / GitHub Pages
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const worker = new Worker(`${basePath}/montecarlo.worker.js`);
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent) => {
        const { type } = e.data;

        if (type === 'progress') {
          setProgress((e.data.current / e.data.total) * 100);
        } else if (type === 'complete') {
          setResults(e.data.data as SimulationResults);
          setIsLoading(false);
          setProgress(100);
          worker.terminate();
          workerRef.current = null;
          resolve();
        }
      };

      worker.onerror = (err: ErrorEvent) => {
        const msg = err.message || 'Worker error';
        setError(msg);
        setIsLoading(false);
        worker.terminate();
        workerRef.current = null;
        reject(new Error(msg));
      };

      worker.postMessage(params);
    });
  }, []);

  const cancel = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsLoading(false);
    setProgress(0);
  }, []);

  return { run, cancel, isLoading, progress, results, error };
}
