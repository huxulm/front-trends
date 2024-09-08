"use client";
import React from "react";
import { useParentSize } from "@visx/responsive";
import { BuildTrend } from "@/components/build/Build";
import { CssTrend } from "@/components/css/Css";
import { JsTrend } from "@/components/js/Js";
import { VizTrend } from "@/components/viz/Viz";

function Page() {
  const {
    parentRef: p1,
    width: w1,
    height: h1,
  } = useParentSize({ debounceTime: 150 });
  const {
    parentRef: p2,
    width: w2,
    height: h2,
  } = useParentSize({ debounceTime: 150 });
  const {
    parentRef: p3,
    width: w3,
    height: h3,
  } = useParentSize({ debounceTime: 150 });
  const {
    parentRef: p4,
    width: w4,
    height: h4,
  } = useParentSize({ debounceTime: 150 });

  return (
    <div className="flex flex-wrap w-screen h-screen">
      <div style={{ width: "50%", height: "50%" }} className="bg-grey-50 p-10">
        <div className="w-full h-full ms-5 relative" ref={p1}>
          <button className="absolute px-2 left-[-0.1rem] top-[-2rem] bg-purple-400 hover:bg-purple-200 rounded border border-purple-950">CSS Framework</button>
          <CssTrend width={w1} height={h1} />
        </div>
      </div>
      <div style={{ width: "50%", height: "50%" }} className="bg-grey-50 p-10">
        <div className="w-full h-full ms-5 relative" ref={p3}>
          <button className="absolute px-2 left-[-0.1rem] top-[-2rem] bg-cyan-400 hover:bg-cyan-200 rounded border border-cyan-950">Javascript Framework</button>
          <JsTrend width={w3} height={h3} />
        </div>
      </div>
      <div style={{ width: "50%", height: "50%" }} className="bg-grey-50 p-10">
        <div className="w-full h-full ms-5 relative" ref={p4}>
          <button className="absolute px-2 left-[-0.1rem] top-[-2rem] bg-orange-400 hover:bg-orange-200 rounded border border-orange-950">Visualization Framework</button>
          <VizTrend width={w4} height={h4} />
        </div>
      </div>
      <div style={{ width: "50%", height: "50%" }} className="bg-grey-50 p-10">
        <div className="w-full h-full ms-5 relative" ref={p2}>
          <button className="absolute px-2 left-[-0.1rem] top-[-2rem] bg-blue-400 hover:bg-blue-200 rounded border border-blue-950">Building & Bundling Tools</button>
          <BuildTrend width={w2} height={h2} />
        </div>
      </div>
    </div>
  );
}

export default Page;
