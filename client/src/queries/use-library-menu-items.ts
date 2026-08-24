import { useQuery } from '@tanstack/react-query';

import { loadLibraryMenuItems } from '@/bridge/library';

import { MENU } from './keys';

export const useLibraryMenuItems = () => {
  return useQuery({
    queryKey: MENU,
    queryFn: loadLibraryMenuItems,
  });
};
