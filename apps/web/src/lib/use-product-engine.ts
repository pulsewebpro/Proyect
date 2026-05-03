'use client';

import { useCallback, useState } from 'react';
import type { ProductEngineState } from '@/lib/product-engine-contract';

export function useProductEngine(projectId: string) {
  const [engine, setEngine] = useState<ProductEngineState | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/v1/projects/${projectId}/engine`);
    if (!res.ok) return;
    setEngine((await res.json()) as ProductEngineState);
  }, [projectId]);

  return { engine, refresh };
}
