import { useContext, useEffect, useRef } from 'react';

import { NavInputContext, type NavAction } from '@/contexts/nav-input-context';

export type { NavAction };

export function useNavInput(handler: (action: NavAction) => void) {
  const ctx = useContext(NavInputContext);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!ctx) return;
    return ctx.subscribe((action) => handlerRef.current(action));
  }, [ctx]);
}
