<script lang="ts">
  import { Chart, Svg, Axis, Points, Tooltip, Highlight, Text } from "layerchart";
  import { scaleLinear, scaleLog } from "d3-scale";

  type ScatterPoint = {
    agency: string;
    year: number;
    x: number;
    y: number;
    stops?: number;
  };

  export let points: ScatterPoint[] = [];
  export let activePoint: ScatterPoint | null = null;
  export let formatValue: (value: number | null | undefined) => string = (value) =>
    value === null || value === undefined ? "—" : String(value);
  export let xLabel = "";
  export let yLabel = "";
  export let sizeByStops = false;
  export let xScaleType: "linear" | "log" = "linear";
  export let yScaleType: "linear" | "log" = "linear";
  export let formatStops: (value: number | null | undefined) => string = (value) =>
    value === null || value === undefined ? "—" : String(value);

  const axisTickStyle = "fill: #0f172a; font-size: 11px; font-weight: 600;";
  const axisXTickStyle = "fill: #64748b; font-size: 10px; font-weight: 500;";
  const axisLabelStyle = "fill: #0f172a; font-size: 10px; font-weight: 600;";
  const baseRadius = 2.8;
  const minRadius = 4;
  const maxRadius = 30;
  const dotFill = "rgba(226, 232, 240, 0.28)";
  const dotStroke = "rgba(148, 163, 184, 0.55)";
  const dotStrokeWidth = 0.75;

  const getPositiveExtent = (data: ScatterPoint[], key: "x" | "y") => {
    let min = Infinity;
    let max = -Infinity;
    data.forEach((point) => {
      const value = point[key];
      if (!Number.isFinite(value) || value <= 0) return;
      min = Math.min(min, value);
      max = Math.max(max, value);
    });
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
    return { min, max };
  };

  $: xExtent = getPositiveExtent(points, "x");
  $: yExtent = getPositiveExtent(points, "y");
  $: resolvedXDomain =
    xScaleType === "log"
      ? [xExtent?.min ?? 1, xExtent?.max ?? 1]
      : [0, null];
  $: resolvedYDomain =
    yScaleType === "log"
      ? [yExtent?.min ?? 1, yExtent?.max ?? 1]
      : [0, null];

  $: yMax = points.reduce(
    (max, point) => (Number.isFinite(point.y) && point.y > max ? point.y : max),
    0
  );
  $: yTicks = (() => {
    if (yScaleType === "log") {
      const min = yExtent?.min ?? 1;
      const max = yExtent?.max ?? min;
      const scale = scaleLog().domain([min, max]);
      const ticks = scale.ticks(4);
      return ticks.length ? ticks : [min];
    }
    const scale = scaleLinear().domain([0, yMax]).nice();
    const ticks = scale.ticks(4);
    return ticks.length ? ticks : [0];
  })();
</script>

<Chart
  data={points}
  x="x"
  y="y"
  r={sizeByStops ? "stops" : undefined}
  rScale={sizeByStops ? scaleLog() : undefined}
  rRange={sizeByStops ? [minRadius, maxRadius] : undefined}
  xScale={xScaleType === "log" ? scaleLog() : scaleLinear()}
  yScale={yScaleType === "log" ? scaleLog() : scaleLinear()}
  xDomain={resolvedXDomain}
  yDomain={resolvedYDomain}
  yNice={yScaleType === "linear"}
  padding={{ left: 28, right: 10, bottom: 28, top: 6 }}
  tooltip={{ mode: "quadtree" }}
>
  <Svg>
    <Axis
      placement="left"
      grid={{ class: "stroke-slate-200/70" }}
      rule={{ class: "stroke-slate-400" }}
      tickLength={2}
      ticks={yTicks}
      format={(value) => formatValue(value)}
      tickLabelProps={{
        style: axisTickStyle,
      }}
    >
      {#snippet tickLabel({ props, index })}
        <Text
          {...props}
          value={
            index === yTicks.length - 1 && yLabel
              ? `${props.value} ${yLabel}`
              : props.value
          }
        />
      {/snippet}
    </Axis>
    <Axis
      placement="bottom"
      rule={{ class: "stroke-slate-400" }}
      tickLength={2}
      label={xLabel}
      labelPlacement="end"
      labelProps={{
        style: axisLabelStyle,
      }}
      tickLabelProps={{
        style: axisXTickStyle,
      }}
    />
    <Points
      data={points}
      x="x"
      y="y"
      r={baseRadius}
      fill={dotFill}
      stroke={dotStroke}
      strokeWidth={dotStrokeWidth}
    />
    {#if activePoint}
      <Points
        data={[activePoint]}
        x="x"
        y="y"
        r={5.5}
        class="fill-emerald-500 pointer-events-none"
        stroke="#0f172a"
        strokeWidth={1}
      />
    {/if}
    <Highlight lines />
  </Svg>
  <Tooltip.Root>
    {#snippet children({ data })}
      {#if data}
        <Tooltip.Header>{data.agency}</Tooltip.Header>
        <Tooltip.List>
          <Tooltip.Item
            label={xLabel}
            value={formatValue(data.x)}
            valueAlign="right"
          />
          <Tooltip.Item
            label={yLabel}
            value={formatValue(data.y)}
            valueAlign="right"
          />
          {#if Number.isFinite(data?.stops)}
            <Tooltip.Item
              label="Total stops"
              value={formatStops(data.stops)}
              valueAlign="right"
            />
          {/if}
        </Tooltip.List>
      {/if}
    {/snippet}
  </Tooltip.Root>
</Chart>
