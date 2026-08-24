import { useQuery } from '@tanstack/react-query';

import { loadProfiles } from '@/bridge/profile';
import { ProfileStore } from '@/types/ProfileStore';

import { PROFILES } from './keys';

export const useProfiles = () =>
  useQuery<ProfileStore>({
    queryKey: PROFILES,
    queryFn: loadProfiles,
  });
