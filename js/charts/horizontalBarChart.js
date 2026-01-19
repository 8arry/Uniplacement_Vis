/**
 * Horizontal Bar Chart - View 3
 * Top Performing Colleges
 */

function createHorizontalBarChart() {
    const container = d3.select("#bar-chart");
    const width = 500;
    const height = 350;

    // Use a larger left margin for this chart to make room for:
    // - y tick labels (College IDs)
    // - y-axis label ("College ID") without clipping
    const m = { ...margin, left: 110 };

    // Create SVG
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("id", "svg-bar");

    // Create groups
    svg.append("g").attr("class", "bars-group");
    svg.append("g").attr("class", "x-axis");
    svg.append("g").attr("class", "y-axis");

    // X-axis label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height - 5)
        .attr("text-anchor", "middle")
        .text("Number of placed students");

    // Y-axis label: rotate around a fixed point so positioning is stable.
    // Keep it clearly left of the y tick labels, but inside the SVG to avoid clipping.
    const yLabelX = 18;
    const yLabelY = height / 2;

    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", yLabelX)
        .attr("y", yLabelY)
        .attr("text-anchor", "middle")
        .attr("transform", `rotate(-90, ${yLabelX}, ${yLabelY})`)
        .text("College ID");

    updateHorizontalBarChart();
}

function updateHorizontalBarChart() {
    const svg = d3.select("#svg-bar");
    const width = 500;
    const height = 350;

    // Must match createHorizontalBarChart()
    const m = { ...margin, left: 100 };

    // Aggregate data by college - count placed students
    const collegeData = d3.rollup(
        filteredData.filter(d => d.placement === "Yes"),
        v => v.length,
        d => d.college_id
    );

    // Convert to array and sort by count (descending)
    let collegeArray = Array.from(collegeData, ([college, count]) => ({ college, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 colleges

    // Scales
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(collegeArray, d => d.count) || 1])
        .nice()
        .range([m.left, width - m.right]);

    const yScale = d3.scaleBand()
        .domain(collegeArray.map(d => d.college))
        .range([m.top, height - m.bottom])
        .padding(0.2);

    // Update axes
    svg.select(".x-axis")
        .attr("transform", `translate(0, ${height - m.bottom})`)
        .transition().duration(500)
        .call(d3.axisBottom(xScale).ticks(5));

    svg.select(".y-axis")
        .attr("transform", `translate(${m.left}, 0)`)
        .transition().duration(500)
        .call(d3.axisLeft(yScale));

    // Bind data
    const barsGroup = svg.select(".bars-group");

    const bars = barsGroup.selectAll(".h-bar")
        .data(collegeArray, d => d.college);

    // Enter
    bars.enter()
        .append("rect")
        .attr("class", "h-bar")
        .attr("x", m.left)
        .attr("y", d => yScale(d.college))
        .attr("height", yScale.bandwidth())
        .attr("width", 0)
        .attr("fill", "#3498db")
        .attr("rx", 3)
        .on("mouseover", function (event, d) {
            d3.select(this).attr("fill", "#2980b9");
            showTooltip(event, `<strong>${d.college}</strong><br>Placed Students: ${d.count}`);
        })
        .on("mouseout", function () {
            d3.select(this).attr("fill", "#3498db");
            hideTooltip();
        })
        .transition().duration(500)
        .attr("width", d => xScale(d.count) - m.left);

    // Update
    bars.transition().duration(500)
        .attr("y", d => yScale(d.college))
        .attr("height", yScale.bandwidth())
        .attr("width", d => xScale(d.count) - m.left);

    // Exit
    bars.exit()
        .transition().duration(300)
        .attr("width", 0)
        .remove();

    // Add count labels
    const labels = barsGroup.selectAll(".bar-label")
        .data(collegeArray, d => d.college);

    labels.enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", d => xScale(d.count) + 5)
        .attr("y", d => yScale(d.college) + yScale.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("font-size", "11px")
        .attr("fill", "#333")
        .text(d => d.count);

    labels.transition().duration(500)
        .attr("x", d => xScale(d.count) + 5)
        .attr("y", d => yScale(d.college) + yScale.bandwidth() / 2)
        .text(d => d.count);

    labels.exit().remove();
}
