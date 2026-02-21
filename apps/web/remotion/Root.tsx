/**
 * Remotion Root - 注册所有视频合成
 */

import { Composition } from 'remotion';
import { VidLuxeVideo } from './compositions/VidLuxeVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* VidLuxe 视频合成 - 9:16 竖屏格式 */}
      <Composition
        id="VidLuxeVideo"
        component={VidLuxeVideo}
        durationInFrames={150} // 5秒 @ 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          backgroundUrl: '',
          foregroundUrl: '',
          styleType: 'magazine',
        }}
      />

      {/* 预览合成 - 用于测试 */}
      <Composition
        id="PreviewVideo"
        component={VidLuxeVideo}
        durationInFrames={90} // 3秒 @ 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          backgroundUrl: '',
          foregroundUrl: '',
          styleType: 'minimal',
        }}
      />
    </>
  );
};
