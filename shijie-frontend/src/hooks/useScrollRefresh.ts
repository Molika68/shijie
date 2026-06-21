import { useCallback, useState } from 'react';

export function useScrollRefresh(refreshFn: () => void | Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresherRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshFn();
    } finally {
      setRefreshing(false);
    }
  }, [refreshFn]);

  return { refreshing, onRefresherRefresh };
}
