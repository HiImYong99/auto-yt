import React from "react";
import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { Sample } from "./Sample";
import { Thumbnail } from "./Thumbnail";
import syncData from "../data/sync_data.json";

const FPS = 30;
// sync_data.json의 실제 길이 사용 (438초 = 13,144 프레임), fallback: 8분
const DURATION_FRAMES =
  syncData.duration_ms > 0
    ? Math.ceil((syncData.duration_ms / 1000) * FPS) + FPS // 여유 프레임 1초
    : FPS * 60 * 8;

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="MainVideo"
        component={MainVideo}
        durationInFrames={DURATION_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Sample"
        component={Sample}
        durationInFrames={450}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Thumbnail"
        component={Thumbnail}
        durationInFrames={1}
        fps={FPS}
        width={1280}
        height={720}
      />
    </>
  );
};
