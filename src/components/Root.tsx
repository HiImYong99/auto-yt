import React from "react";
import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { SampleVideo } from "./SampleVideo";
import syncData from "../data/sync_data.json";

const FPS = 30;
const DURATION_FRAMES =
  syncData.duration_ms > 0
    ? Math.ceil((syncData.duration_ms / 1000) * FPS) + FPS
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
        id="SampleVideo"
        component={SampleVideo}
        durationInFrames={600}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
