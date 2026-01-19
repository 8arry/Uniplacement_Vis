/**
 * Scatter Plot - View 2
 * IQ vs CGPA with Internship Status
 */

function createScatterPlot() {
    const container = d3.select("#scatter-plot");
    const width = 500;
    const height = 350;

    // Reserve space on the right for the legend (keeps legend outside axes box)
    const legendWidth = 140;
    const plotRight = width - margin.right - legendWidth;

    // Create SVG
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("id", "svg-scatter");

    // Create groups
    svg.append("g").attr("class", "points-group");
    svg.append("g").attr("class", "x-axis");
    svg.append("g").attr("class", "y-axis");

    // Axis labels
    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", margin.left + (plotRight - margin.left) / 2)
        .attr("y", height - 5)
        .attr("text-anchor", "middle")
        .text("IQ Score");

    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .text("CGPA");

    // Legend (placed in the reserved right-side space)
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${plotRight + 15}, ${margin.top})`);

    const legendData = [
        { label: "Has Internship", color: "#27ae60" },
        { label: "No Internship", color: "#e74c3c" }
    ];

    legendData.forEach((d, i) => {
        const g = legend.append("g").attr("transform", `translate(0, ${i * 22})`);
        g.append("circle").attr("cx", 8).attr("cy", 8).attr("r", 6).attr("fill", d.color);
        g.append("text").attr("x", 22).attr("y", 12).text(d.label).style("font-size", "11px");
    });

    updateScatterPlot();
}

function updateScatterPlot() {
    const svg = d3.select("#svg-scatter");
    const width = 500;
    const height = 350;

    // Must match createScatterPlot() so scales/legend align
    const legendWidth = 140;
    const plotRight = width - margin.right - legendWidth;

    // Scales
    const xScale = d3.scaleLinear()
        .domain([d3.min(data, d => d.iq) - 5, d3.max(data, d => d.iq) + 5])
        .range([margin.left, plotRight]);

    const yScale = d3.scaleLinear()
        .domain([d3.min(data, d => d.cgpa) - 0.5, d3.max(data, d => d.cgpa) + 0.5])
        .range([height - margin.bottom, margin.top]);

    // Update axes
    svg.select(".x-axis")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .transition().duration(500)
        .call(d3.axisBottom(xScale).ticks(8));

    svg.select(".y-axis")
        .attr("transform", `translate(${margin.left}, 0)`)
        .transition().duration(500)
        .call(d3.axisLeft(yScale).ticks(6));

    // Bind data to points
    const pointsGroup = svg.select(".points-group");

    const points = pointsGroup.selectAll("circle")
        .data(data, d => d.college_id + d.iq + d.cgpa);

    // Enter
    const pointsEnter = points.enter()
        .append("circle")
        .attr("r", 0)
        .attr("cx", d => xScale(d.iq))
        .attr("cy", d => yScale(d.cgpa))
        .attr("fill", d => d.internship === "Yes" ? "#27ae60" : "#e74c3c")
        .attr("opacity", 0.7)
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .on("mouseover", function (event, d) {
            d3.select(this).attr("stroke", "#333").attr("stroke-width", 2);
            showTooltip(event, `
                <strong>College:</strong> ${d.college_id}<br>
                <strong>IQ:</strong> ${d.iq}<br>
                <strong>CGPA:</strong> ${d.cgpa.toFixed(2)}<br>
                <strong>Internship:</strong> ${d.internship}<br>
                <strong>Placement:</strong> ${d.placement}
            `);
        })
        .on("mouseout", function () {
            d3.select(this).attr("stroke", "#fff").attr("stroke-width", 0.5);
            hideTooltip();
        });

    pointsEnter
        .transition().duration(500)
        .attr("r", 5);

    // Update (positions + ghosting effect)
    const allPoints = pointsEnter.merge(points);

    allPoints
        .transition().duration(300)
        .attr("cx", d => xScale(d.iq))
        .attr("cy", d => yScale(d.cgpa))
        .attr("opacity", d => {
            const inRange = d.cgpa >= cgpaRange[0] && d.cgpa <= cgpaRange[1];
            return inRange ? 0.8 : 0.1;
        })
        .attr("r", d => {
            const inRange = d.cgpa >= cgpaRange[0] && d.cgpa <= cgpaRange[1];
            return inRange ? 5 : 3;
        });

    // Exit
    points.exit()
        .transition().duration(300)
        .attr("r", 0)
        .remove();
}
