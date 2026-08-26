import { memo } from 'react';

import { usePlaybackMicActions } from '@/features/playback/providers/playback-mic-context';
import { usePlaybackThemeState } from '@/features/playback/providers/playback-theme-context';
import { usePlaybackTransportState } from '@/features/playback/providers/playback-transport-context';

import { PixabayVideo } from './pixabay-video';
import { ShaderVisualizer } from './shader-visualizer';
import { loadingFragment } from './shaders';
import { SourceVideo } from './source-video';
import { SHADER_COUNT, themeMode } from './theme';

function ShaderBranch({ themeIndex, isPlaying }: { themeIndex: number; isPlaying: boolean }) {
  const { reactiveRef } = usePlaybackMicActions();
  return (
    <ShaderVisualizer
      shaderIndex={themeIndex % SHADER_COUNT}
      isPlaying={isPlaying}
      reactiveRef={reactiveRef}
    />
  );
}

function BackgroundImpl() {
  const { isReady, isPlaying } = usePlaybackTransportState();
  const { themeIndex, videoFlavor, sourceVideoPath } = usePlaybackThemeState();

  if (!isReady) {
    return (
      <div className="fixed inset-0">
        <ShaderVisualizer shaderIndex={0} isPlaying={true} customFragment={loadingFragment} />
      </div>
    );
  }

  const mode = themeMode(themeIndex);
  const showSourceVideo = mode === 'source';
  const playing = isPlaying;

  return (
    <div className="fixed inset-0">
      {typeof sourceVideoPath === 'string' && sourceVideoPath !== '' && (
        <SourceVideo isActive={showSourceVideo} />
      )}
      {mode === 'shader' && <ShaderBranch themeIndex={themeIndex} isPlaying={playing} />}
      {mode === 'pixabay' && <PixabayVideo flavor={videoFlavor} isPlaying={playing} />}
    </div>
  );
}

export const Background = memo(BackgroundImpl);
