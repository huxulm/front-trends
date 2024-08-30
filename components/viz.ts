import {
  select,
  scaleLinear,
  extent,
  axisLeft,
  axisBottom,
  line,
  curveCatmullRom,
  area,
  pointer,
  scaleUtc,
  bisector,
  max,
  min,
  schemeCategory10,
  scaleOrdinal,
  curveBasis,
} from "d3";

export interface DataShape {
  day: string;
  downloads: number;
}
export interface RenderFunction {
  (props: {
    ref?: React.RefObject<SVGSVGElement>;
    ticks: any;
    data: {
      name: string;
      downloads: DataShape[];
    }[];
    xValue: (d: DataShape) => Date;
    yValue: (d: any) => number;
  }): void;
}
export const render: RenderFunction = ({
  ref,
  xValue,
  yValue,
  data,
  ticks,
}) => {
  const [width, height] = [
    ref?.current?.clientWidth!,
    ref?.current?.clientHeight!,
  ];
  const xAxisLabel = "Time";
  const yAxisLabel = "Downloads";
  const svg = select(ref!.current);

  // clear panel
  svg.selectAll("*").remove();

  const margin = { top: 20, right: 20, bottom: 20, left: 20 };
  svg.attr(
    "style",
    `overflow: visible; margin: ${margin.top}px ${margin.right}px ${margin.bottom}px ${margin.left}px`
  );

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xDomain = [
    min(data, (d) => min(d.downloads, (v) => new Date(v.day))),
    max(data, (d) => max(d.downloads, (v) => new Date(v.day))),
  ];
  const yDomain = [
    min(data, (d) => min(d.downloads, (v) => v.downloads)),
    max(data, (d) => max(d.downloads, (v) => v.downloads)),
  ];

  const xScale = scaleUtc()
    .domain(xDomain as [Date, Date])
    .range([0, innerWidth]);

  const yScale = scaleLinear()
    .domain(yDomain as [number, number])
    .range([innerHeight, 0]);

  const color = scaleOrdinal(schemeCategory10).domain(data.map((d) => d.name));

  const g = svg.append("g").attr("fill", "white");

  const xAxis = axisBottom(xScale).ticks(ticks); //.tickSize(-innerHeight).tickPadding(15).;

  const yAxis = axisLeft(yScale).tickFormat((v, _) =>
    v.valueOf() >= 1000 ? `${v.valueOf() / 1000}K` : v.toString()
  ); // .tickSize(-innerWidth).tickPadding(10);

  const yAxisG = g.append("g").call(yAxis);
  //   yAxisG.selectAll(".domain").remove();

  yAxisG
    .append("text")
    .attr("class", "axis-label")
    .attr("y", -35)
    .attr("x", -innerHeight / 2)
    .attr("fill", "black")
    .attr("transform", `rotate(-90)`)
    .attr("text-anchor", "middle")
    .text(yAxisLabel);

  const xAxisG = g
    .append("g")
    .call(xAxis)
    .attr("transform", `translate(0,${innerHeight})`);

  // xAxisG.select(".domain").remove();
  // xAxisG.selectAll(".tick").remove();

  xAxisG
    .append("text")
    .attr("class", "axis-label")
    .attr("y", 30)
    .attr("x", innerWidth / 2)
    .attr("fill", "black")
    .text(xAxisLabel);

  const lineGenerator = line<DataShape>()
    .x((d) => xScale(xValue(d)))
    .y((d) => yScale(yValue(d)))
    .curve(curveCatmullRom);

  const areaGenerator = area<DataShape>()
    .x((d) => xScale(xValue(d)))
    .y0(innerHeight)
    .y1((d) => yScale(yValue(d)))
    .curve(curveCatmullRom);

  // add lengends
  g.append("g")
    // .attr("transform", "translate(10, -2)")
    .call((selection) => {
      selection
        .selectAll("rect")
        .data(data)
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
        .data(data)
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
  g.append("g")
    .selectAll("path")
    .data(data)
    .join("path")
    .attr("class", "line-path")
    .attr("fill", "none")
    .attr("stroke-width", 2)
    .attr("stroke", (v, idx) => color(v.name))
    .attr("d", (v) => lineGenerator(v.downloads));

  //   g.selectAll("path").data(data).join("path").attr("class", "area").attr("d", v => areaGenerator(v.downloads));

  // add points
  //   g.selectAll("circle")
  //     .data(data)
  //     .join("circle")
  //     .attr("cx", (d) => xScale(new Date(d.date)))
  //     .attr("cy", (d) => yScale(d.count))
  //     .attr("r", 5)
  //     .attr("fill", "none");

  // mouse
  const mouseG = svg
    .append("g")
    .classed("mouse", true)
    .style("display", "none");

  mouseG
    .append("rect")
    .attr("width", 2)
    .attr("height", height - margin.top - margin.bottom)
    .attr("stroke", "none")
    .attr("fill", "rgba(190, 167, 250, .8)");

  mouseG
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("data-id", (_, idx) => `p-${idx}`)
    .attr("cx", 1)
    .attr("r", 4)
    .attr("fill", "white")
    .attr("stroke-width", 1)
    .attr("stroke", "rgba(190, 167, 250, .8)");
  mouseG.append("text");

  svg.on("mouseover", function (e) {
    console.log("move over...");
    mouseG.style("display", "block");
  });

  svg.on("mousemove", function (e) {
    const x = pointer(e)[0];
    const current = xScale.invert(x);
    // use bisector to find the closest point
    const bisectDate = bisector<DataShape, Date>((d) => new Date(d.day)).center;
    const index = bisectDate(data[0].downloads, current);
    mouseG.attr(
      "transform",
      `translate(${xScale(new Date(data[0].downloads[index].day))}, 0)`
    );
    data.forEach((_, idx) => {
      const datum = data[idx].downloads[index];
      mouseG
        .select(`circle[data-id='p-${idx}']`)
        .attr("cy", yScale(datum.downloads));
    });
  });

  svg.on("mouseout", function (e) {
    mouseG.style("display", "none");
  });
};
