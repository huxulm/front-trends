"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
  FC,
} from "react";

import { DataShape, refresh, render, SelectionRef } from "@/components/viz";
import { scaleLinear, scaleOrdinal, scaleUtc } from "d3-scale";
import { min, max, sort, sum } from "d3-array";
import { utcDay, utcMonth } from "d3-time";
import useSWR from "swr";
import { schemeCategory10 } from "d3-scale-chromatic";

export interface TrendSetProps {
  pkgs: string[];
  title?: string;
  width: number;
  height: number;
}

interface Data {
  package: string;
  start: string;
  end: string;
  downloads: DataShape[];
}

// add 20 tailwindcss bg colors
const legendBgColors = [
  "bg-red-500",
  "bg-yellow-500",
  "bg-green-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-red-400",
  "bg-yellow-400",
  "bg-green-400",
  "bg-blue-400",
  "bg-indigo-400",
  "bg-purple-400",
  "bg-pink-400",
  "bg-red-300",
  "bg-yellow-300",
  "bg-green-300",
  "bg-blue-300",
  "bg-indigo-300",
  "bg-purple-300",
];

const Panel = ({
  pkgs,
  ticks,
  width,
  height,
}: {
  width: number;
  height: number;
  ticks: any;
  pkgs: string[];
}) => {
  const [brushSelection, setBrushSelection] = useState<[Date, Date] | null>(
    null
  );
  const fetchers = pkgs.map((pkg) =>
    fetch(`./data/${pkg.replace("/", "-")}/y.json`).then<Data>((r) => r.json())
  );
  const { data = [] } = useSWR<Data[]>(
    `/api/${encodeURIComponent(pkgs.join("-"))}`,
    async () => {
      const results = await Promise.all(fetchers)
        .then((res) => res)
        .catch((e) => []);
      return sort(
        results,
        (a, b) =>
          max(b.downloads, (v) => v.downloads)! -
          max(a.downloads, (v) => v.downloads)!
      );
    }
  );
  const filteredData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      downloads: item.downloads.filter(
        (d) =>
          !brushSelection ||
          (new Date(d.day) >= brushSelection[0] &&
            new Date(d.day) <= brushSelection[1])
      ),
    }));
  }, [brushSelection, data]);

  const brushHeight = useMemo<number>(() => {
    return min([height * 0.1, 80]) as number;
  }, [height]);

  const brushMargin = 40;

  const onBrush = useCallback((selection: any) => {
    setBrushSelection(selection);
  }, []);

  const xDomain = useMemo(() => {
    return brushSelection
      ? brushSelection
      : [
          min(data, (d) => min(d.downloads, (v) => new Date(v.day))),
          max(data, (d) => max(d.downloads, (v) => new Date(v.day))),
        ];
  }, [brushSelection, data]);

  const yDomain = useMemo(() => {
    return [
      min(filteredData, (d) => min(d.downloads, (v) => v.downloads)),
      max(filteredData, (d) => max(d.downloads, (v) => v.downloads)),
    ];
  }, [data, filteredData]);

  const xScale = useMemo(() => {
    return scaleUtc()
      .domain(xDomain as [Date, Date])
      .range([0, width]);
  }, [width, height, xDomain]);

  const yScale = useMemo(() => {
    return scaleLinear()
      .domain(yDomain as [number, number])
      .range([height - brushHeight - brushMargin, 0]);
  }, [width, height, yDomain]);

  const xDomainBrush = useMemo(() => {
    return [
      min(data, (d) => min(d.downloads, (v) => new Date(v.day))),
      max(data, (d) => max(d.downloads, (v) => new Date(v.day))),
    ];
  }, [data]);

  const yDomainBrush = useMemo(() => {
    return [
      min(data, (d) => min(d.downloads, (v) => v.downloads)),
      max(data, (d) => max(d.downloads, (v) => v.downloads)),
    ];
  }, [data]);

  const xScaleBrush = useMemo(() => {
    return scaleUtc()
      .domain(xDomainBrush as [Date, Date])
      .range([0, width]);
  }, [width, height, xDomainBrush]);

  const yScaleBrush = useMemo(() => {
    return scaleLinear()
      .domain(yDomainBrush as [number, number])
      .range([height - brushMargin, height - brushHeight - brushMargin]);
  }, [width, height, yDomainBrush]);

  const xValueFn = useCallback(() => {
    return (d: DataShape) => new Date(d.day);
  }, []);

  const yValueFn = useCallback(() => {
    return (d: DataShape) => d.downloads;
  }, []);

  const selectionRef = useRef<SelectionRef | null>(null);
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (width > 0 && height > 0 && !selectionRef.current && data.length > 0) {
      selectionRef.current = render({
        ref,
        filteredData,
        data,
        ticks,
        width,
        height,
        brushHeight,
        xScale,
        yScale,
        xScaleBrush,
        yScaleBrush,
        onBrush,
        brushMargin,
        xValue: xValueFn(),
        yValue: yValueFn(),
      });
    } else if (selectionRef && selectionRef.current && data.length > 0) {
      refresh({
        selectionRef: selectionRef.current,
        xScale,
        yScale,
        xScaleBrush,
        yScaleBrush,
        filteredData,
        data,
        ticks,
        xValue: xValueFn(),
        yValue: yValueFn(),
      });
    }
  }, [
    data,
    filteredData,
    width,
    height,
    xScale,
    yScale,
    xScaleBrush,
    yScaleBrush,
    filteredData,
    ticks,
  ]);

  const colorFn = useMemo(() => {
    return scaleOrdinal(schemeCategory10).domain(data.map((d) => d.package));
  }, [data]);
  return (
    <>
      <div className="w-full h-[50px] flex flex-wrap gap-1 dark:bg-slate-900">
        {data.map((item, idx) => (
          <span
            key={`legend-${idx}`}
            className={`h-5 p-[2px] rounded-sm text-xs`}
            style={{ background: colorFn(item.package) }}
          >
            {item.package}
          </span>
        ))}
      </div>
      <svg width={width} height={height - 50} fill="none" ref={ref}>
        <pattern
          id="brush_pattern"
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
        >
          <path
            className="brush-pattern-line"
            d="M 0,8 l 8,-8 M -2,2 l 4,-4
             M 6,10 l 4,-4"
            stroke="#2e7af3"
            strokeWidth="1"
            strokeLinecap="square"
            shapeRendering="auto"
          ></path>
        </pattern>
      </svg>
    </>
  );
};

type DataType = "w" | "m" | "y";

export const TrendSet: FC<TrendSetProps> = ({
  width,
  height,
  pkgs,
}: TrendSetProps) => {
  const [type] = useState<DataType>("y");
  return (
    <Suspense
      fallback={
        <div className="size-full flex justify-center items-center text-center text-5xl">
          Downloading...
        </div>
      }
    >
      <Panel
        width={width}
        height={height}
        pkgs={pkgs}
        ticks={
          type === "w"
            ? utcDay.every(1)
            : type === "m"
            ? utcDay.every(4)
            : utcMonth.every(1)
        }
      />
    </Suspense>
  );
};
