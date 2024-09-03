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
        <div className="w-full h-full ms-5" ref={p1}>
          <CssTrend width={w1} height={h1} />
        </div>
      </div>
      <div style={{ width: "50%", height: "50%" }} className="bg-grey-50 p-10">
        <div className="w-full h-full ms-5" ref={p3}>
          <JsTrend width={w3} height={h3} />
        </div>
      </div>
      <div style={{ width: "50%", height: "50%" }} className="bg-grey-50 p-10">
        <div className="w-full h-full ms-5" ref={p4}>
          <VizTrend width={w4} height={h4} />
        </div>
      </div>
      <div style={{ width: "50%", height: "50%" }} className="bg-grey-50 p-10">
        <div className="w-full h-full ms-5" ref={p2}>
          <BuildTrend width={w2} height={h2} />
        </div>
      </div>
    </div>
  );
}

export default Page;
