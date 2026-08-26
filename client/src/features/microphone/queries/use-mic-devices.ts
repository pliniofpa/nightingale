import { useQuery } from '@tanstack/react-query';

import { microphoneAdapter, type MicrophoneAdapter } from '@/bridge/microphone';
import { MIC_DEVICES } from '@/shared/query-keys';
import type { MicrophoneInfo } from '@/types/MicrophoneInfo';

export type MicDevice = {
  deviceId: string;
  label: string;
};

const MIC_DEVICE_CACHE_MS = 60_000;

async function listMicDevices(adapter: MicrophoneAdapter): Promise<MicDevice[]> {
  const mics = await adapter.listDevices();
  return mics.map(({ name }: MicrophoneInfo) => ({
    deviceId: name,
    label: name,
  }));
}

export function useMicDevices(adapter: MicrophoneAdapter = microphoneAdapter) {
  return useQuery({
    queryKey: MIC_DEVICES,
    queryFn: () => listMicDevices(adapter),
    staleTime: MIC_DEVICE_CACHE_MS,
    cacheTime: MIC_DEVICE_CACHE_MS,
    initialData: [],
  }).data;
}
