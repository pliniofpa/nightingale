import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { loadConfig, saveConfig } from '@/bridge/config';
import { CONFIG } from '@/queries/keys';
import { useConfig } from '@/queries/use-config';
import { AppConfig } from '@/types/AppConfig';

export const useConfigMutation = () => {
  const queryClient = useQueryClient();
  const { data: config } = useConfig();

  return useMutation({
    mutationFn: async (partialConfig: Partial<AppConfig>) => {
      const current = config ?? queryClient.getQueryData<AppConfig>(CONFIG) ?? (await loadConfig());
      return saveConfig({ ...current, ...partialConfig });
    },
    onSuccess: (savedConfig) => {
      queryClient.setQueryData(CONFIG, savedConfig);
      queryClient.invalidateQueries({ queryKey: CONFIG });
    },
    onError: (error: Error) => {
      toast.error(`Error updating the local config: ${error.message}`);
    },
  });
};
