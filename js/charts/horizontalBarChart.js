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

    // Aggregate data by college - count placed and total students
    const placedByCollege = d3.rollup(
        filteredData.filter(d => d.placement === "Yes"),
        v => v.length,
        d => d.college_id
    );
    
    const totalByCollege = d3.rollup(
        filteredData,
        v => v.length,
        d => d.college_id
    );

    // Convert to array with count and rate
    let collegeArray = Array.from(placedByCollege, ([college, count]) => {
        const total = totalByCollege.get(college) || 1;
        const rate = (count / total) * 100;
        return { college, count, total, rate };
    });
    
    // Apply search filter if there's a query
    if (collegeSearchQuery) {
        collegeArray = collegeArray.filter(d => 
            d.college.toLowerCase().includes(collegeSearchQuery)
        );
    }
    
    // Sort based on current mode
    if (sortMode === 'rate') {
        collegeArray.sort((a, b) => b.rate - a.rate);
    } else {
        collegeArray.sort((a, b) => b.count - a.count);
    }
    
    // Take top 10
    collegeArray = collegeArray.slice(0, 10);
    
    // Update subtitle with filter info
    const subtitle = document.getElementById('view3-subtitle');
    if (subtitle) {
        const totalPlaced = filteredData.filter(d => d.placement === "Yes").length;
        const sortLabel = sortMode === 'rate' ? 'by rate' : 'by count';
        const searchLabel = collegeSearchQuery ? `, search: "${collegeSearchQuery}"` : '';
        subtitle.textContent = `(${totalPlaced} placed, sorted ${sortLabel}${searchLabel})`;
    }
    
    // Update x-axis label based on sort mode
    const xAxisLabel = svg.select(".axis-label");
    xAxisLabel.text(sortMode === 'rate' ? "Placement Rate (%)" : "Number of placed students");

    // Get the value to display based on sort mode
    const getValue = d => sortMode === 'rate' ? d.rate : d.count;
    const maxValue = d3.max(collegeArray, getValue) || 1;

    // Scales
    const xScale = d3.scaleLinear()
        .domain([0, sortMode === 'rate' ? Math.min(100, maxValue * 1.1) : maxValue])
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
        .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => sortMode === 'rate' ? `${d}%` : d));

    svg.select(".y-axis")
        .attr("transform", `translate(${m.left}, 0)`)
        .transition().duration(500)
        .call(d3.axisLeft(yScale));

    // Calculate overall stats for comparison
    const overallPlaced = filteredData.filter(x => x.placement === "Yes").length;
    const overallTotal = filteredData.length;
    const overallRate = overallTotal > 0 ? (overallPlaced / overallTotal * 100) : 0;
    
    // Calculate rank
    const sortedByRate = [...collegeArray].sort((a, b) => b.rate - a.rate);
    const sortedByCount = [...collegeArray].sort((a, b) => b.count - a.count);
    
    // Tooltip content generator
    const getTooltipContent = d => {
        const rateRank = sortedByRate.findIndex(x => x.college === d.college) + 1;
        const countRank = sortedByCount.findIndex(x => x.college === d.college) + 1;
        const rateDiff = d.rate - overallRate;
        const rateDiffText = rateDiff >= 0 
            ? `<span class="text-green">+${rateDiff.toFixed(1)}%</span>` 
            : `<span class="text-red">${rateDiff.toFixed(1)}%</span>`;
        
        return `
            <strong>${d.college}</strong><br>
            Placed: ${d.count} / ${d.total}<br>
            Rate: ${d.rate.toFixed(1)}% <span class="tooltip-context">(vs avg ${overallRate.toFixed(1)}%: ${rateDiffText})</span><br>
            <span class="tooltip-context">Rank: #${countRank} by count, #${rateRank} by rate</span><br>
            <em class="tooltip-hint">Click to highlight in scatter plot</em>
        `;
    };

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
        .attr("fill", d => selectedCollege === d.college ? "#f39c12" : "#3498db")
        .attr("rx", 3)
        .attr("cursor", "pointer")
        .on("mouseover", function (event, d) {
            if (selectedCollege !== d.college) {
                d3.select(this).attr("fill", "#2980b9");
            }
            showTooltip(event, getTooltipContent(d));
        })
        .on("mouseout", function (event, d) {
            if (selectedCollege !== d.college) {
                d3.select(this).attr("fill", "#3498db");
            }
            hideTooltip();
        })
        .on("click", function (event, d) {
            selectCollege(d.college);
        })
        .transition().duration(500)
        .attr("width", d => Math.max(0, xScale(getValue(d)) - m.left));

    // Update
    bars
        .attr("fill", d => selectedCollege === d.college ? "#f39c12" : "#3498db")
        .on("mouseover", function (event, d) {
            if (selectedCollege !== d.college) {
                d3.select(this).attr("fill", "#2980b9");
            }
            showTooltip(event, getTooltipContent(d));
        })
        .on("mouseout", function (event, d) {
            if (selectedCollege !== d.college) {
                d3.select(this).attr("fill", "#3498db");
            }
            hideTooltip();
        })
        .on("click", function (event, d) {
            selectCollege(d.college);
        })
        .transition().duration(500)
        .attr("y", d => yScale(d.college))
        .attr("height", yScale.bandwidth())
        .attr("width", d => Math.max(0, xScale(getValue(d)) - m.left));

    // Exit
    bars.exit()
        .transition().duration(300)
        .attr("width", 0)
        .remove();

    // Add value labels
    const labels = barsGroup.selectAll(".bar-label")
        .data(collegeArray, d => d.college);

    const formatLabel = d => sortMode === 'rate' ? `${d.rate.toFixed(1)}%` : d.count;

    labels.enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", d => xScale(getValue(d)) + 5)
        .attr("y", d => yScale(d.college) + yScale.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("font-size", "11px")
        .attr("fill", "#333")
        .text(formatLabel);

    labels.transition().duration(500)
        .attr("x", d => xScale(getValue(d)) + 5)
        .attr("y", d => yScale(d.college) + yScale.bandwidth() / 2)
        .text(formatLabel);

    labels.exit().remove();
}
