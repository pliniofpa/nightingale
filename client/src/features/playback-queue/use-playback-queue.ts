import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import {
  addPlaybackQueueEntry,
  clearPlaybackQueue,
  loadPlaybackQueue,
  onPlaybackQueueChanged,
  removePlaybackQueueEntry,
  type PlaybackQueueEntry,
} from '@/bridge/playback-queue';
import {
  preparePlayback,
  type PreparePlaybackInput,
} from '@/features/playback/mutations/use-prepare-playback-mutation';
import { PLAYBACK_QUEUE } from '@/shared/query-keys';
import type { Song } from '@/types/Song';

export function usePlaybackQueueQuery() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: PLAYBACK_QUEUE, queryFn: loadPlaybackQueue });

  useEffect(() => {
    let cancelled = false;
    let unlisten: (() => void) | undefined;
    void onPlaybackQueueChanged((entries) => {
      queryClient.setQueryData(PLAYBACK_QUEUE, entries);
    }).then((stop) => {
      if (cancelled) {
        stop();
        return undefined;
      }
      unlisten = stop;
      void queryClient.invalidateQueries({ queryKey: PLAYBACK_QUEUE });
      return undefined;
    });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [queryClient]);

  return query;
}

export function useAddPlaybackQueueEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ song, tempo, keyOffset }: PreparePlaybackInput) =>
      addPlaybackQueueEntry(song.file_hash, tempo, keyOffset),
    onSuccess: (entries) => queryClient.setQueryData(PLAYBACK_QUEUE, entries),
    onError: (error: Error) => toast.error(`Could not add song to queue: ${error.message}`),
  });
}

export function useRemovePlaybackQueueEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removePlaybackQueueEntry,
    onSuccess: (entries) => queryClient.setQueryData(PLAYBACK_QUEUE, entries),
    onError: (error: Error) => toast.error(`Could not remove song from queue: ${error.message}`),
  });
}

export function useClearPlaybackQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearPlaybackQueue,
    onSuccess: (entries) => queryClient.setQueryData(PLAYBACK_QUEUE, entries),
    onError: (error: Error) => toast.error(`Could not clear queue: ${error.message}`),
  });
}

type StartResult = {
  id: string;
  song: Song;
  entries: PlaybackQueueEntry[];
};

export function useStartNextPlaybackQueueSong(entries: PlaybackQueueEntry[]) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate, isLoading } = useMutation({
    mutationFn: async (entry: PlaybackQueueEntry): Promise<StartResult> => {
      const song = await preparePlayback({
        song: entry.song,
        tempo: entry.tempo,
        keyOffset: entry.keyOffset,
      });
      const nextEntries = await removePlaybackQueueEntry(entry.id);
      return { id: entry.id, song, entries: nextEntries };
    },
    onSuccess: ({ id, song, entries: nextEntries }) => {
      queryClient.setQueryData(PLAYBACK_QUEUE, nextEntries);
      void navigate('/playback', {
        replace: true,
        state: { song, queuePlayback: true, playbackId: id },
      });
    },
    onError: (error: Error) => toast.error(`Could not start queued song: ${error.message}`),
  });

  const playNext = useCallback(() => {
    if (entries.length === 0 || isLoading) {
      return;
    }
    mutate(entries[0]);
  }, [entries, isLoading, mutate]);

  return { playNext, isPreparing: isLoading };
}
