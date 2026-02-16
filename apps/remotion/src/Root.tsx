import React from 'react';
import { Composition } from 'remotion';
import { PremiumScoreDemo } from './compositions/PremiumScoreDemo';

/**
 * VidLuxe Remotion Root
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VidLuxeComposition"
        component={PremiumScoreDemo}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
