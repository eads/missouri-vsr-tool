<script lang="ts">
  import { Chart, Svg, Axis, Points, Tooltip, Highlight, Text } from "layerchart";
  import { scaleLinear } from "d3-scale";

  type ScatterPoint = {
    agency: string;
    year: number;
    x: number;
    y: number;
  };

  export let points: ScatterPoint[] = [];
  export let activePoint: ScatterPoint | null = null;
  export let formatValue: (value: number | null | undefined) => string = (value) =>
    value === null || value === undefined ? "—" : String(value);
  export let xLabel = "";
  export let yLabel = "";

  const axisTickStyle = "fill: #0f172a; font-size: 11px; font-weight: 600;";
  const axisXTickStyle = "fill: #64748b; font-size: 10px; font-weight: 500;";
  const axisLabelStyle = "fill: #0f172a; font-size: 10px; font-weight: 600;";
  $: yMax = points.reduce(
    (max, point) => (Number.isFinite(point.y) && point.y > max ? point.y : max),
    0
  );
  $: yTicks = (() => {
    const scale = scaleLinear().domain([0, yMax]).nice();
    const ticks = scale.ticks(4);
    return ticks.length ? ticks : [0];
  })();
</script>

<Chart
  data={points}
  x="x"
  y="y"
  xScale={scaleLinear()}
  yScale={scaleLinear()}
  xDomain={[0, null]}
  yDomain={[0, null]}
  yNice
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
    <Points data={points} x="x" y="y" r={2.8}>
      {#snippet children({ points })}
        {#each points as point}
          <circle
            cx={point.x}
            cy={point.y}
            r={point.r}
            class="fill-slate-500/80"
          />
        {/each}
      {/snippet}
    </Points>
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
        </Tooltip.List>
      {/if}
    {/snippet}
  </Tooltip.Root>
</Chart>
