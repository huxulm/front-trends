"use client";

import { VizTrend } from "@/components/viz/Viz";
import { useParentSize } from "@visx/responsive";

export default function Home() {
  const { parentRef, width, height } = useParentSize({ debounceTime: 150 });
  return (
    <div
      className="p-2 flex flex-wrap justify-center items-center w-screen h-screen"
      ref={parentRef}
    >
      <VizTrend width={width} height={height} />
    </div>
  );
}
