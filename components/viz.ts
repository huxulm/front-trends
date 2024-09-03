import { select, pointer, pointers, Selection, BaseType } from "d3-selection";
import { scaleOrdinal, ScaleTime, ScaleLinear } from "d3-scale";
import { axisLeft, axisBottom } from "d3-axis";
import { line, curveCatmullRom, area } from "d3-shape";

import { schemeCategory10 } from "d3-scale-chromatic";
import { bisector } from "d3-array";
import { brushX } from "d3-brush";

export interface DataShape {
  day: string;
  downloads: number;
}

export interface SelectionRef {
  xAxisG: Selection<SVGGElement, unknown, null, undefined>;
  yAxisG: Selection<SVGGElement, unknown, null, undefined>;
  chartG: Selection<SVGGElement, unknown, null, undefined>;
  chartLinesG: Selection<
    BaseType | SVGPathElement,
    {
      name: string;
      downloads: DataShape[];
    },
    SVGGElement,
    unknown
  >;
  rect: Selection<SVGRectElement, unknown, null, undefined>;
  mouseG: Selection<SVGGElement, unknown, null, undefined>;
  brushG: Selection<SVGGElement, unknown, null, undefined>;
}

export interface RenderFunction {
  (props: {
    ref?: React.RefObject<HTMLDivElement>;
    ticks: any;
    data: {
      name: string;
      downloads: DataShape[];
    }[];
    filteredData: {
      name: string;
      downloads: DataShape[];
    }[];
    width: number;
    height: number;
    brushHeight: number;
    xScale: ScaleTime<number, number, never>;
    yScale: ScaleLinear<number, number, never>;
    xScaleBrush: ScaleTime<number, number, never>;
    yScaleBrush: ScaleLinear<number, number, never>;
    xValue: (d: DataShape) => Date;
    yValue: (d: any) => number;
    onBrush: (selection: any) => void;
  }): SelectionRef;
}
export const render: RenderFunction = ({
  ref,
  xScale,
  yScale,
  xScaleBrush,
  yScaleBrush,
  width,
  height,
  brushHeight,
  xValue,
  yValue,
  filteredData,
  data,
  ticks,
  onBrush,
}) => {
  const xAxisLabel = "时间";
  const yAxisLabel = "下载量";
  const svg = select(ref!.current).select("svg");
  const chartWidth = width;
  const chartHeight = height - brushHeight;
  const selectionRef = {} as SelectionRef;

  svg.attr("style", `overflow: visible;`);

  function brushed(this: SVGGElement, event: any, d: any) {
    const selection = event.selection;
    if (selection === null) {
      return;
    }
    const [x0, x1] = selection.map(xScaleBrush.invert);
    onBrush([x0, x1]);
    console.log("brushed", x0, x1);
  }

  const brush = brushX()
    .extent([
      [0, height - brushHeight],
      [width, height],
    ])
    .on("start brush end", brushed);

  const color = scaleOrdinal(schemeCategory10).domain(data.map((d) => d.name));

  const rect = svg
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .attr("stroke", "none")
    .attr("fill", "rgba(0, 0, 0, 0.0001)");

  selectionRef.rect = rect;

  const g = svg.append("g");
  selectionRef.chartG = g;

  const xAxis = axisBottom<Date>(xScale)
    .ticks(ticks)
    .tickFormat((v, _) =>
      v.getUTCMonth() === 1
        ? v.toLocaleString(undefined, {
            year: "numeric",
          })
        : v.toLocaleString(undefined, { month: "short" })
    );

  const yAxis = axisLeft(yScale).tickFormat((v, _) =>
    v.valueOf() >= 1000 ? `${v.valueOf() / 1000}K` : v.toString()
  );

  const yAxisG = g.append("g").call(yAxis);

  yAxisG
    .append("text")
    .attr("class", "axis-label")
    .attr("y", -50)
    .attr("x", -innerHeight / 2)
    .attr("fill", "black")
    .attr("transform", `rotate(-90)`)
    .attr("text-anchor", "middle")
    .text(yAxisLabel);

  const xAxisG = g
    .append("g")
    .call(xAxis)
    .attr("transform", `translate(0,${chartHeight})`);

  selectionRef.xAxisG = xAxisG;
  selectionRef.yAxisG = yAxisG;

  xAxisG
    .append("text")
    .attr("class", "axis-label")
    .attr("y", 35)
    .attr("x", chartWidth / 2)
    .attr("fill", "black")
    .text(xAxisLabel);

  const lineGenerator = line<DataShape>()
    .x((d) => xScale(xValue(d)))
    .y((d) => yScale(yValue(d)))
    .curve(curveCatmullRom);

  const brushLineGenerator = line<DataShape>()
    .x((d) => xScaleBrush(xValue(d)))
    .y((d) => yScaleBrush(yValue(d)))
    .curve(curveCatmullRom);

  // add lengends
  g.append("g")
    // .attr("transform", "translate(10, -2)")
    .call((selection) => {
      selection
        .selectAll("rect")
        .data(filteredData)
        .join("rect")
        .attr("stroke", "none")
        .attr("x", (_, idx) => 50 * idx)
        .attr("y", (_, idx) => idx * 20 + 2.5)
        .attr("width", 50)
        .attr("height", 5)
        .attr("fill", (v) => color(v.name));
    })
    .call((selection) => {
      selection
        .selectAll("text")
        .data(filteredData)
        .join("text")
        .attr("fill", (v) => color(v.name))
        .attr("stroke", "none")
        .attr("x", (_, idx) => 50 * idx + 55)
        .attr("y", (_, idx) => idx * 20 - 2)
        .attr("text-anchor", "start")
        // add more attrs
        .attr("dominant-baseline", "hanging")
        .text((v) => v.name);
    });

  // add lines
  const chartLinesG = g
    .append("g")
    .selectAll("path")
    .data(filteredData)
    .join("path")
    .attr("class", "line-path")
    .attr("fill", "none")
    .attr("stroke-width", 2)
    .attr("stroke", (v, idx) => color(v.name))
    .attr("d", (v) => lineGenerator(v.downloads));

  selectionRef.chartLinesG = chartLinesG;

  // mouse
  const mouseG = svg
    .append("g")
    .classed("mouse", true)
    .style("display", "none");

  selectionRef.mouseG = mouseG;

  mouseG
    .append("rect")
    .attr("width", 2)
    .attr("height", chartHeight)
    .attr("stroke", "none")
    .attr("fill", "rgba(190, 167, 250, .8)");

  mouseG
    .selectAll("circle")
    .data(filteredData)
    .join("circle")
    .attr("data-id", (_, idx) => `p-${idx}`)
    .attr("cx", 1)
    .attr("r", 4)
    .attr("fill", "white")
    .attr("stroke-width", 1)
    .attr("stroke", "rgba(190, 167, 250, .8)");

  mouseG.append("text");

  rect.on("mouseover", function (e) {
    e.preventDefault();
    console.log("move over...");
    mouseG.style("display", "block");
  });

  rect.on("mousemove", function (e) {
    e.preventDefault();
    const x = pointer(e)[0];
    const current = xScale.invert(x);
    // use bisector to find the closest point
    const bisectDate = bisector<DataShape, Date>((d) => new Date(d.day)).center;
    const index = bisectDate(filteredData[0].downloads, current);
    mouseG.attr(
      "transform",
      `translate(${xScale(new Date(filteredData[0].downloads[index].day))}, 0)`
    );
    filteredData.forEach((_, idx) => {
      const datum = filteredData[idx].downloads[index];
      mouseG
        .select(`circle[data-id='p-${idx}']`)
        .attr("cy", yScale(datum.downloads));
    });
  });

  rect.on("mouseout", function (e) {
    e.preventDefault();
    mouseG.style("display", "none");
  });

  const renderBrushChart = (
    selection: Selection<SVGGElement, unknown, null, undefined>
  ) => {
    selection
      .append("g")
      .selectAll("path")
      .data(data)
      .join("path")
      .attr("d", (v) => brushLineGenerator(v.downloads))
      .attr("fill", "transparent")
      .attr("stroke", (v, _) => color(v.name))
      .attr("stroke-width", 1);
  };

  // brush
  const brushG = svg
    .append("g")
    .attr("class", "brush")
    .attr("transform", "translate(0, 40)")
    .call(brush)
    .on("mousedown touchstart", function beforebrushstarted(event) {
      const dx = chartWidth * 0.2; //xScale(new Date(data[0].downloads[0].day)) - xScale(new Date(data[0].downloads[1].day)); // Use a fixed width when recentering.
      const [[cx]] = pointers(event);
      const [x0, x1] = [cx - dx / 2, cx + dx / 2];
      const [X0, X1] = xScale.range();
      // @ts-ignore
      brushG.call(
        brush.move,
        x1 > X1 ? [X1 - dx, X1] : x0 < X0 ? [X0, X0 + dx] : [x0, x1]
      );
    })
    .call(renderBrushChart);

  selectionRef.brushG = brushG;
  return selectionRef;
};

export const refresh = ({
  selectionRef,
  xScale,
  yScale,
  xScaleBrush,
  yScaleBrush,
  ticks,
  xValue,
  yValue,
  data,
  filteredData,
}: {
  selectionRef: SelectionRef;
  ticks: any;
  xScale: ScaleTime<number, number, never>;
  yScale: ScaleLinear<number, number, never>;
  xValue: (d: DataShape) => Date;
  yValue: (d: any) => number;
  xScaleBrush: ScaleTime<number, number, never>;
  yScaleBrush: ScaleLinear<number, number, never>;
  filteredData: { name: string; downloads: DataShape[] }[];
  data: { name: string; downloads: DataShape[] }[];
}) => {
  // refresh axis
  const xAxis = axisBottom<Date>(xScale)
    .ticks(ticks)
    .tickFormat((v, _) =>
      v.getUTCMonth() === 1
        ? v.toLocaleString(undefined, {
            year: "numeric",
          })
        : v.toLocaleString(undefined, { month: "short" })
    );

  const yAxis = axisLeft(yScale).tickFormat((v, _) =>
    v.valueOf() >= 1000 ? `${v.valueOf() / 1000}K` : v.toString()
  );

  selectionRef.xAxisG.select(".domain").remove()
  selectionRef.yAxisG.select(".domain").remove()

  selectionRef.xAxisG.call(xAxis)
  selectionRef.yAxisG.call(yAxis)

  selectionRef.chartLinesG
    .data(filteredData)
    .attr("d", (v) =>
      line<DataShape>()
        .x((d) => xScale(xValue(d)))
        .y((d) => yScale(yValue(d)))(v.downloads)
    );

  // mouse listeners
  selectionRef.rect.on("mouseover", function (e) {
    e.preventDefault();
    console.log("move over...");
    selectionRef.mouseG.style("display", "block");
  });

  selectionRef.rect.on("mousemove", function (e) {
    e.preventDefault();
    const x = pointer(e)[0];
    const current = xScale.invert(x);
    // use bisector to find the closest point
    const bisectDate = bisector<DataShape, Date>((d) => new Date(d.day)).center;
    const index = bisectDate(filteredData[0].downloads, current);
    selectionRef.mouseG.attr(
      "transform",
      `translate(${xScale(new Date(filteredData[0].downloads[index].day))}, 0)`
    );
    filteredData.forEach((_, idx) => {
      const datum = filteredData[idx].downloads[index];
      selectionRef.mouseG
        .select(`circle[data-id='p-${idx}']`)
        .attr("cy", yScale(datum.downloads));
    });
  });

  selectionRef.rect.on("mouseout", function (e) {
    e.preventDefault();
    selectionRef.mouseG.style("display", "none");
  });
};
