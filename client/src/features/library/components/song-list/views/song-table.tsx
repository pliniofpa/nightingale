import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';

import { useBestScoresBySongForActiveProfile } from '@/features/profiles/hooks/use-best-scores-by-song';
import { cn } from '@/shared/utils/cn';
import type { Song } from '@/types/Song';
import type { SongSort } from '@/types/SongSort';
import type { SongSortColumn } from '@/types/SongSortColumn';

import { SONG_COLUMNS, type SongColumn } from '../song-columns';
import type { SongItemProps } from '../types';
import { SongTableRow } from './song-table-row';

type SongTableProps = {
  songs: Song[];
  sort: SongSort | null;
  sortingDisabled: boolean;
  onSort: (column: SongSortColumn) => void;
  getItemProps: (song: Song, index: number) => SongItemProps;
};

type SongTableHeaderProps = {
  column: SongColumn;
  sort: SongSort | null;
  sortingDisabled: boolean;
  onSort: (column: SongSortColumn) => void;
};

const SongTableHeader = ({ column, sort, sortingDisabled, onSort }: SongTableHeaderProps) => {
  const sortColumn = column.sortColumn;
  if (sortColumn === undefined) {
    return <th className={column.thClassName}>{column.header}</th>;
  }

  const activeDirection = sortColumn === sort?.column ? sort.direction : undefined;
  const ariaSort = activeDirection ?? 'none';
  let icon = null;
  if (activeDirection === 'ascending') {
    icon = <ArrowUpIcon className="size-3.5 shrink-0" aria-hidden="true" />;
  } else if (activeDirection === 'descending') {
    icon = <ArrowDownIcon className="size-3.5 shrink-0" aria-hidden="true" />;
  }

  return (
    <th className={column.thClassName} aria-sort={ariaSort}>
      <button
        type="button"
        disabled={sortingDisabled}
        className={cn(
          'flex w-full items-center gap-1 text-left outline-none focus-visible:text-foreground disabled:cursor-wait',
          column.id === 'status' && 'justify-end',
        )}
        onClick={() => onSort(sortColumn)}
      >
        {column.header}
        {icon}
      </button>
    </th>
  );
};

export const SongTable = ({
  songs,
  sort,
  sortingDisabled,
  onSort,
  getItemProps,
}: SongTableProps) => {
  const bestScores = useBestScoresBySongForActiveProfile();

  return (
    <table className="w-full table-fixed border-separate border-spacing-0 text-xs">
      <thead className="song-table-header">
        <tr className="text-left text-muted-foreground">
          {SONG_COLUMNS.map((column) => (
            <SongTableHeader
              key={column.id}
              column={column}
              sort={sort}
              sortingDisabled={sortingDisabled}
              onSort={onSort}
            />
          ))}
        </tr>
      </thead>
      <tbody>
        {songs.map((song, index) => (
          <SongTableRow
            key={song.file_hash}
            {...getItemProps(song, index)}
            bestScore={bestScores.get(song.file_hash)}
          />
        ))}
      </tbody>
    </table>
  );
};
