import {
  AlignLeftIcon,
  AudioLinesIcon,
  ImageIcon,
  MicIcon,
  RefreshCwIcon,
  Trash2Icon,
  EllipsisIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { useAnalysis } from '@/features/library/hooks/use-analysis';
import { useSongs } from '@/features/library/queries/use-songs';
import { useMenuFocus } from '@/features/menu/providers/menu-focus-context';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { cn } from '@/shared/utils/cn';

export const BulkActionsMenu = () => {
  const {
    enqueueAll,
    realignAll,
    reanalyzeAllFull,
    reanalyzeAllTranscript,
    reanalyzeAllForceTranscribe,
    refreshMetadataAll,
    deleteSongCacheAll,
  } = useAnalysis();
  const { data } = useSongs();
  const analyzedCount = data?.pages[0]?.analyzed_count ?? 0;

  const [open, setOpen] = useState(false);
  const { focus, actionsRef } = useMenuFocus();

  useEffect(() => {
    const actions = actionsRef.current;
    actions.onConfirmActions = () => setOpen(true);

    return () => {
      actions.onConfirmActions = null;
    };
  }, [actionsRef]);

  const isActionsFocused = focus.active && focus.panel === 'songList' && focus.actionsFocused;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          tabIndex={-1}
          variant="outline"
          size="icon"
          data-actions-focus="true"
          aria-label="Actions on filtered songs"
          title="Actions"
          className={cn(
            'border-input bg-input/20 focus-visible:border-transparent focus-visible:ring-0 dark:bg-input/30',
            isActionsFocused && 'ring-2 ring-primary',
          )}
        >
          <EllipsisIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel>All songs</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => void enqueueAll()}>
          <AudioLinesIcon />
          Analyze all
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void refreshMetadataAll()}>
          <ImageIcon />
          Refresh metadata
        </DropdownMenuItem>
        {analyzedCount > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Analyzed songs ({analyzedCount})</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => void realignAll()}>
              <AlignLeftIcon />
              Realign
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void reanalyzeAllTranscript()}>
              <RefreshCwIcon />
              Refetch lyrics & align
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void reanalyzeAllForceTranscribe()}>
              <MicIcon />
              Force transcribe
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void reanalyzeAllFull()}>
              <AudioLinesIcon />
              Full reanalysis
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => void deleteSongCacheAll()}>
              <Trash2Icon />
              Delete cache
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
