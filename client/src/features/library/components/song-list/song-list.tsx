import { useEffect, useMemo, useRef, type RefObject } from 'react';

import { useAnalysisQueue, useSongs } from '@/features/library/queries/use-songs';
import { useLibraryFilter } from '@/features/menu/hooks/use-library-filter';
import { useSearch } from '@/features/menu/hooks/use-search';
import { useMenuFocus } from '@/features/menu/providers/menu-focus-context';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/shared/components/ui/empty';
import { Separator } from '@/shared/components/ui/separator';
import { useConfig } from '@/shared/config/use-config';
import { useConfigMutation } from '@/shared/config/use-config-mutation';
import { useLatestRef } from '@/shared/hooks/use-latest-ref';
import { usePersistentScroll } from '@/shared/hooks/use-persistent-scroll';
import { cn } from '@/shared/utils/cn';
import type { Song } from '@/types/Song';

import { Filters, type SongListView } from './filters';
import { Progress } from './progress';
import { songKey } from './shared/song-key';
import { SongDetailsSidebar } from './song-details-sidebar';
import type { SongItemProps } from './types';
import { SongGrid } from './views/song-grid';
import { SongTable } from './views/song-table';

type SongCollectionProps = {
  songs: Song[];
  view: SongListView;
  loading: boolean;
  hasActiveFilter: boolean;
  getItemProps: (song: Song, index: number) => SongItemProps;
  setScrollContainer: (element: HTMLElement | null) => void;
  sentinelRef: RefObject<HTMLDivElement | null>;
};

const hasFilters = (values: readonly unknown[]): boolean =>
  values.some((value) => (typeof value === 'string' ? value.trim() !== '' : Boolean(value)));

const EmptySongs = ({ filtered }: { filtered: boolean }) => (
  <Empty className="px-4">
    <EmptyHeader>
      <EmptyTitle>{filtered ? 'No results' : 'No songs found'}</EmptyTitle>
      <EmptyDescription>
        {filtered
          ? 'No songs match your search or filters. Try adjusting them.'
          : 'This library is empty or still being scanned.'}
      </EmptyDescription>
    </EmptyHeader>
  </Empty>
);

const SongCollection = ({
  songs,
  view,
  loading,
  hasActiveFilter,
  getItemProps,
  setScrollContainer,
  sentinelRef,
}: SongCollectionProps) => {
  if (songs.length === 0 && !loading) {
    return <EmptySongs filtered={hasActiveFilter} />;
  }

  return (
    <div
      ref={setScrollContainer}
      data-song-layout={view}
      className="themed-scrollbar song-table-shell min-h-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      {view === 'table' ? (
        <SongTable songs={songs} getItemProps={getItemProps} />
      ) : (
        <SongGrid songs={songs} getItemProps={getItemProps} />
      )}
      <div ref={sentinelRef} className="h-1" aria-hidden="true" />
    </div>
  );
};

export const SongList = () => {
  const { data: queue } = useAnalysisQueue();
  const { data: config } = useConfig();
  const { mutate: saveConfig, isPending: isSavingView } = useConfigMutation();
  const { focus, actionsRef, setFocus, selectedSong, setSelectedSong } = useMenuFocus();
  const { setScrollContainer, resetScroll } = usePersistentScroll('songList');
  const { search } = useSearch();
  const { artist, album, playlist, query, status, transcript_source } = useLibraryFilter();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useSongs();
  const view: SongListView = config?.song_list_view === 'grid' ? 'grid' : 'table';
  const songs = useMemo(() => data?.pages.flatMap((page) => page.processed) ?? [], [data]);
  const selectedKey = selectedSong ? songKey(selectedSong) : null;
  const currentSelectedSong = songs.find((song) => songKey(song) === selectedKey) ?? selectedSong;
  const filterKey = JSON.stringify([
    search,
    artist,
    album,
    playlist,
    query,
    status,
    transcript_source,
  ]);
  const previousFilterKeyRef = useRef(filterKey);
  const songsRef = useLatestRef(songs);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (previousFilterKeyRef.current === filterKey) {
      return;
    }
    previousFilterKeyRef.current = filterKey;

    setSelectedSong(null);
    resetScroll();
    setFocus((previous) => ({ ...previous, songIndex: 0 }));
  }, [filterKey, resetScroll, setFocus, setSelectedSong]);

  useEffect(() => {
    actionsRef.current.songCount = songs.length;
  }, [songs.length, actionsRef]);

  useEffect(() => {
    const actions = actionsRef.current;
    actions.onConfirmSong = (index: number) => {
      const song = songsRef.current.at(index);
      if (!song) {
        return;
      }

      setSelectedSong(song);
    };
    return () => {
      actions.onConfirmSong = null;
    };
  }, [actionsRef, setSelectedSong, songsRef]);

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage === true && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const isSongListActive = focus.active && focus.panel === 'songList';
  const hasActiveFilter = hasFilters([
    search,
    artist,
    album,
    playlist,
    query,
    status,
    transcript_source,
  ]);
  const selectSong = (song: (typeof songs)[number]) => setSelectedSong(song);

  const getItemProps = (song: (typeof songs)[number], index: number): SongItemProps => ({
    song,
    queueStatus: queue?.entries[song.file_hash],
    index,
    isSelected: selectedKey === songKey(song),
    isFocused: isSongListActive && !focus.actionsFocused && focus.songIndex === index,
    onSelect: () => selectSong(song),
  });

  return (
    <div className="flex min-h-0 w-full flex-1 overflow-hidden">
      <main
        className={cn(
          'min-w-0 flex-1 flex-col gap-3 p-3 sm:p-4',
          currentSelectedSong ? 'hidden xl:flex' : 'flex',
        )}
      >
        <Filters
          view={view}
          isSavingView={isSavingView}
          onViewChange={(nextView) => saveConfig({ song_list_view: nextView })}
        />
        <Separator />
        <Progress />
        <SongCollection
          songs={songs}
          view={view}
          loading={isLoading}
          hasActiveFilter={hasActiveFilter}
          getItemProps={getItemProps}
          setScrollContainer={setScrollContainer}
          sentinelRef={sentinelRef}
        />
      </main>

      {currentSelectedSong ? (
        <SongDetailsSidebar
          key={songKey(currentSelectedSong)}
          song={currentSelectedSong}
          queueStatus={queue?.entries[currentSelectedSong.file_hash]}
          onClose={() => setSelectedSong(null)}
        />
      ) : null}
    </div>
  );
};
