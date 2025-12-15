import { useState, useEffect, useCallback } from 'react';

// Configure your Python API endpoint here
const API_BASE_URL = 'http://localhost:5000';

export interface AnalyticsData {
  total_visitors: number;
  male_count: number;
  female_count: number;
  hourly_data: Array<{ hour: string; visitors: number }>;
  age_distribution: Record<string, number>;
  timestamp: string;
}

export interface Detection {
  id: string;
  type: string;
  confidence: number;
  camera: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface HeatmapZone {
  zone: string;
  visits: number;
  avgTime: number;
  density: number;
}

export interface APIStatus {
  status: 'online' | 'offline' | 'error';
  timestamp: string;
  cameras: Array<{ id: string; name: string; status: string }>;
  system_status: string;
}

export const usePythonAPI = (pollInterval = 5000) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapZone[]>([]);
  const [status, setStatus] = useState<APIStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (endpoint: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      throw err;
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await fetchData('/api/status');
      setStatus(data);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setIsConnected(false);
      setError('Python API not connected. Start your local server.');
    }
  }, [fetchData]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const data = await fetchData('/api/analytics');
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  }, [fetchData]);

  const fetchDetections = useCallback(async () => {
    try {
      const data = await fetchData('/api/detections');
      setDetections(data.detections || []);
    } catch (err) {
      console.error('Failed to fetch detections:', err);
    }
  }, [fetchData]);

  const fetchHeatmap = useCallback(async () => {
    try {
      const data = await fetchData('/api/heatmap');
      setHeatmap(data.zones || []);
    } catch (err) {
      console.error('Failed to fetch heatmap:', err);
    }
  }, [fetchData]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchStatus(),
      fetchAnalytics(),
      fetchDetections(),
      fetchHeatmap()
    ]);
  }, [fetchStatus, fetchAnalytics, fetchDetections, fetchHeatmap]);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, pollInterval);
    return () => clearInterval(interval);
  }, [refreshAll, pollInterval]);

  return {
    analytics,
    detections,
    heatmap,
    status,
    isConnected,
    error,
    refreshAll
  };
};
