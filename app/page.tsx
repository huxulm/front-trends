"use client";
import React, { ComponentProps, ReactElement, useCallback, useEffect, useState } from "react";
import { useParentSize } from "@visx/responsive";
import { SWRConfig } from "swr";
import { TrendSet } from "@/components/TrendSet";

const trendsNaming = ['CSS Frameworks', 'Javascript Libraries', 'Visualize Libraries', 'Building Tools', 'D3 Libraries']

function Page() {
  const getAllPkgs = useCallback(async () => {
    const results = await Promise.all(
      ["build", "css", "js", "viz", "d3"].map((item) =>
        import(`../components/pkgs/${item}.json`).then((res) => res.default)
      )
    );
    console.log(results)
    return results
  }, []);
  const [pkgs, setPkgs] = useState<any[]>([]);
  useEffect(() => {
    getAllPkgs().then(res => setPkgs(res));
  }, [] )
  return (
    <SWRConfig value={{ provider: () => new Map() }}>
      <div className="flex flex-wrap w-full h-[120vh] gap-5">
        {pkgs.map( (item, idx) => (<TrendSetWrapper title={trendsNaming[idx]} trendEle={TrendSet} pkgs={item} />))}
      </div>
    </SWRConfig>
  );
}

function TrendSetWrapper({
  trendEle,
  title = "",
  pkgs = [],
}: {
  title?: string;
  pkgs?: string[];
  trendEle: typeof TrendSet;
}) {
  const { parentRef, width, height } = useParentSize({ debounceTime: 150 });
  return (
    <div className="bg-grey-50 py-10 px-10 w-screen h-[100vw] max-h-[320px] sm:w-[32%] sm:h-[45%] sm:max-h-screen">
      <div className="w-full h-full ms-5 relative" ref={parentRef}>
        <button className="absolute px-2 text-slate-50 left-[-0.1rem] top-[-2rem] text-base bg-purple-400 hover:bg-purple-200 rounded border-purple-950 shadow-md shadow-purple-500">
          {title}
        </button>
        {trendEle({ width, height, pkgs })}
      </div>
    </div>
  );
}
export default Page;
