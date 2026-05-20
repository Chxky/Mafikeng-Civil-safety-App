import { useState, useEffect } from 'react';
import { onNetworkChange } from '../utils/helpers';

export function useNetwork() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const cleanup = onNetworkChange(setIsOnline);
    return cleanup;
  }, []);

  return { isOnline };
}
