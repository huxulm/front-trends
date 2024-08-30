"use client";
import React, { use, useCallback, useEffect, useRef, useState } from "react";
import { DataShape, render } from "../components/viz";
import { Responsive } from "@qttdev/utils/responsive/Responsive";
import pkgs from "./pkg.json";
import { utcDay, utcMonth } from "d3";

const weeklyPkgStats = pkgs.map(async (item) => {
  return await import(`../data/${encodeURIComponent(item)}/w.json`).then(
    (res) => res.default
  );
});
const monthlyPkgStats = pkgs.map(async (item) => {
  return await import(`../data/${encodeURIComponent(item)}/m.json`).then(
    (res) => res.default
  );
});
const yearlyPkgStats = pkgs.map(async (item) => {
  return await import(`../data/${encodeURIComponent(item)}/y.json`).then(
    (res) => res.default
  );
});

const DownloadCard = ({
  data,
  ticks,
  width,
  height,
}: {
  width: number | string;
  height: number | string;
  ticks: any;
  data: {
    name: string;
    start: string;
    end: string;
    downloads: DataShape[];
  }[];
}) => {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    render({
      ref,
      data,
      xValue: (d) => new Date(d.day),
      yValue: (d) => d.downloads,
      ticks,
    });
  }, [ref.current, width, height]);
  return <svg ref={ref} width={width} height={height} fill="none" />;
};

export default function Home() {
  const [type, setType] = useState<"w" | "y" | "m">("y");
  const getStats = useCallback(async () => {
    return await Promise.all(
      type === "m"
        ? monthlyPkgStats
        : type === "y"
        ? yearlyPkgStats
        : weeklyPkgStats
    );
  }, [type]);
  const [stats, setStats] = React.useState<any[]>([]);
  useEffect(() => {
    getStats().then((res) => setStats(res));
  }, []);
  return (
    <div className="p-2 flex flex-wrap justify-center items-center min-h-screen min-w-full">
      {stats.length === pkgs.length && (
        <DownloadCard
          width={"80vw"}
          height={"80vh"}
          ticks={
            type === "w"
              ? utcDay.every(1)
              : type === "m"
              ? utcDay.every(4)
              : utcMonth.every(1)
          }
          data={stats.map((item, idx) => ({
            name: item["package"],
            ...item,
          }))}
        />
      )}
    </div>
  );
}
