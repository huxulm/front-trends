"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { DataShape, refresh, render, SelectionRef } from "../../components/viz";
import { useParentSize } from "@visx/responsive";
import { scaleLinear, scaleUtc } from "d3-scale";
import { min, max } from "d3-array";
import { utcDay, utcMonth } from "d3-time";
import pkgs from "./pkg.json";

const weeklyPkgStats = pkgs.map(async (item) => {
  return await import(`../../data/${encodeURIComponent(item)}/w.json`).then(
    (res) => res.default
  );
});

const monthlyPkgStats = pkgs.map(async (item) => {
  return await import(`../../data/${encodeURIComponent(item)}/m.json`).then(
    (res) => res.default
  );
});

const yearlyPkgStats = pkgs.map(async (item) => {
  return await import(`../../data/${encodeURIComponent(item)}/y.json`).then(
    (res) => res.default
  );
});

const DownloadCard = ({
  data,
  ticks,
  width,
  height,
}: {
  width: number;
  height: number;
  ticks: any;
  data: {
    name: string;
    start: string;
    end: string;
    downloads: DataShape[];
  }[];
}) => {
  const [brushSelection, setBrushSelection] = useState<[Date, Date] | null>(
    null
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
  }, [brushSelection]);

  const yDomain = useMemo(() => {
    return [
      min(filteredData, (d) => min(d.downloads, (v) => v.downloads)),
      max(filteredData, (d) => max(d.downloads, (v) => v.downloads)),
    ];
  }, [filteredData]);

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
    if (!selectionRef.current) {
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
    } else if (selectionRef && selectionRef.current) {
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
    width,
    height,
    xScale,
    yScale,
    xScaleBrush,
    yScaleBrush,
    filteredData,
    ticks,
  ]);
  return (
    <svg width={width} height={height} fill="none" ref={ref}>
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
          stroke-width="1"
          stroke-linecap="square"
          shape-rendering="auto"
        ></path>
      </pattern>
    </svg>
  );
};

export const VizTrend = ({
  width,
  height,
}: {
  width: number;
  height: number;
}) => {
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
    <>
      {stats.length === pkgs.length && (
        <DownloadCard
          width={width}
          height={height}
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
    </>
  );
};
