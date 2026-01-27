/**
 * Violin Plot - View 4
 * Soft Skills Comparison (Placed Students)
 * Shows distribution shape using kernel density estimation
 */

// Kernel Density Estimation function
function kernelDensityEstimator(kernel, X) {
    return function(V) {
        return X.map(x => [x, d3.mean(V, v => kernel(x - v))]);
    };
}

function kernelEpanechnikov(k) {
    return function(v) {
        return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
}

function createBoxPlot() {
    const container = d3.select("#box-plot");
    const width = 800;
    const height = 350;

    // Create SVG
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("id", "svg-boxplot");

    // Create groups
    svg.append("g").attr("class", "violin-group");
    svg.append("g").attr("class", "x-axis");
    svg.append("g").attr("class", "y-axis");

    // Axis labels
    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height - 5)
        .attr("text-anchor", "middle")
        .text("Skill Category");

    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .text("Score");

    // Legend
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 120}, ${margin.top})`);

    const legendData = [
        { label: "Communication Skills", color: "#e67e22" },
        { label: "Extra Curricular", color: "#9b59b6" },
        { label: "Academic Performance", color: "#3498db" }
    ];

    legendData.forEach((d, i) => {
        const g = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
        g.append("rect").attr("width", 14).attr("height", 14).attr("fill", d.color).attr("opacity", 0.7).attr("rx", 2);
        g.append("text").attr("x", 20).attr("y", 11).text(d.label).style("font-size", "11px");
    });

    updateBoxPlot();
}

function updateBoxPlot() {
    const svg = d3.select("#svg-boxplot");
    const width = 800;
    const height = 350;

    // Filter to placed students only
    const placedData = filteredData.filter(d => d.placement === "Yes");

    // Prepare data for three categories
    const categories = [
        { name: "Communication Skills", key: "communication", color: "#e67e22" },
        { name: "Extra Curricular", key: "extra_curricular", color: "#9b59b6" },
        { name: "Academic Performance", key: "academic_perf", color: "#3498db" }
    ];

    // Calculate statistics and density for each category
    const violinData = categories.map(cat => {
        const values = placedData.map(d => d[cat.key]).filter(v => !isNaN(v)).sort(d3.ascending);
        const q1 = d3.quantile(values, 0.25) || 0;
        const median = d3.quantile(values, 0.5) || 0;
        const q3 = d3.quantile(values, 0.75) || 0;
        const min = d3.min(values) || 0;
        const max = d3.max(values) || 0;
        const mean = d3.mean(values) || 0;

        return {
            name: cat.name,
            color: cat.color,
            q1, median, q3, min, max, mean,
            values,
            count: values.length
        };
    });

    // Scales
    const xScale = d3.scaleBand()
        .domain(categories.map(c => c.name))
        .range([margin.left + 50, width - margin.right - 50])
        .padding(0.15);

    const yScale = d3.scaleLinear()
        .domain([0, 11])
        .range([height - margin.bottom, margin.top]);

    // Update axes
    svg.select(".x-axis")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .transition().duration(500)
        .call(d3.axisBottom(xScale));

    svg.select(".y-axis")
        .attr("transform", `translate(${margin.left + 50}, 0)`)
        .transition().duration(500)
        .call(d3.axisLeft(yScale).ticks(6));

    // Draw violin plots
    const violinGroup = svg.select(".violin-group");

    // Clear and redraw
    violinGroup.selectAll(".violin-element").remove();

    // Compute kernel density for each category
    const bandwidth = 0.8; // KDE bandwidth
    const resolution = 50; // Number of points for density curve
    const yDomain = yScale.domain();
    const yValues = d3.range(yDomain[0], yDomain[1], (yDomain[1] - yDomain[0]) / resolution);

    // Find max density for scaling
    let maxDensity = 0;
    const densities = violinData.map(d => {
        if (d.values.length === 0) return [];
        const kde = kernelDensityEstimator(kernelEpanechnikov(bandwidth), yValues);
        const density = kde(d.values);
        const maxD = d3.max(density, p => p[1]) || 0;
        if (maxD > maxDensity) maxDensity = maxD;
        return density;
    });

    // Width scale for violin (density -> pixels)
    const violinWidth = xScale.bandwidth() / 2;
    const widthScale = d3.scaleLinear()
        .domain([0, maxDensity])
        .range([0, violinWidth]);

    violinData.forEach((d, i) => {
        const g = violinGroup.append("g").attr("class", "violin-element");
        const center = xScale(d.name) + xScale.bandwidth() / 2;
        const density = densities[i];

        if (d.values.length === 0 || density.length === 0) return;

        // Create area generator for violin shape
        const areaGenerator = d3.area()
            .x0(p => center - widthScale(p[1]))
            .x1(p => center + widthScale(p[1]))
            .y(p => yScale(p[0]))
            .curve(d3.curveCatmullRom);

        // Draw violin shape
        g.append("path")
            .datum(density)
            .attr("class", "violin-area")
            .attr("d", areaGenerator)
            .attr("fill", d.color)
            .attr("fill-opacity", 0.6)
            .attr("stroke", d.color)
            .attr("stroke-width", 1.5)
            .on("mouseover", function (event) {
                d3.select(this).attr("fill-opacity", 0.8);
                showTooltip(event, `
                    <strong>${d.name}</strong><br>
                    <em>n = ${d.count} placed students</em><br>
                    Max: ${d.max.toFixed(1)}<br>
                    Q3 (75%): ${d.q3.toFixed(1)}<br>
                    Median: ${d.median.toFixed(1)}<br>
                    Mean: ${d.mean.toFixed(1)}<br>
                    Q1 (25%): ${d.q1.toFixed(1)}<br>
                    Min: ${d.min.toFixed(1)}
                `);
            })
            .on("mouseout", function () {
                d3.select(this).attr("fill-opacity", 0.6);
                hideTooltip();
            });

        // Draw inner box plot elements for reference
        const boxWidth = 8;

        // Inner quartile box (mini box plot)
        g.append("rect")
            .attr("class", "inner-box")
            .attr("x", center - boxWidth / 2)
            .attr("y", yScale(d.q3))
            .attr("width", boxWidth)
            .attr("height", Math.max(0, yScale(d.q1) - yScale(d.q3)))
            .attr("fill", "#333")
            .attr("fill-opacity", 0.3)
            .attr("stroke", "none");

        // Median line (white)
        g.append("line")
            .attr("class", "median-line")
            .attr("x1", center - boxWidth / 2 - 2)
            .attr("x2", center + boxWidth / 2 + 2)
            .attr("y1", yScale(d.median))
            .attr("y2", yScale(d.median))
            .attr("stroke", "white")
            .attr("stroke-width", 2.5);

        // Median dot
        g.append("circle")
            .attr("cx", center)
            .attr("cy", yScale(d.median))
            .attr("r", 3)
            .attr("fill", "white")
            .attr("stroke", "#333")
            .attr("stroke-width", 1);

        // Whisker line (min to max, thin)
        g.append("line")
            .attr("class", "whisker-line")
            .attr("x1", center)
            .attr("x2", center)
            .attr("y1", yScale(d.min))
            .attr("y2", yScale(d.max))
            .attr("stroke", "#333")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "2,2");
    });
}
