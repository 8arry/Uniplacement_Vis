/**
 * University Placement Strategic Dashboard
 * Main JavaScript file for D3.js visualizations
 */

// Global variables
let data = [];
let filteredData = [];
let cgpaRange = [4, 11];

// Chart dimensions
const margin = { top: 30, right: 30, bottom: 50, left: 60 };

// Color scales
const placementColor = d3.scaleOrdinal()
    .domain(["Yes", "No"])
    .range(["#27ae60", "#e74c3c"]);

const internshipColor = d3.scaleOrdinal()
    .domain(["Yes", "No"])
    .range(["#27ae60", "#e74c3c"]);

// Tooltip
const tooltip = d3.select("#tooltip");

// Load data and initialize dashboard
async function init() {
    try {
        data = await d3.csv("CollegePlacement.csv", d => ({
            college_id: d.College_ID,
            iq: +d.IQ,
            prev_sem: +d.Prev_Sem_Result,
            cgpa: +d.CGPA,
            academic_perf: +d.Academic_Performance,
            internship: d.Internship_Experience,
            extra_curricular: +d.Extra_Curricular_Score,
            communication: +d.Communication_Skills,
            projects: +d.Projects_Completed,
            placement: d.Placement
        }));

        filteredData = [...data];
        
        console.log("Data loaded:", data.length, "records");
        
        // Initialize all views
        createStackedBarChart();
        createScatterPlot();
        createHorizontalBarChart();
        createBoxPlot();
        
        // Setup interactions
        setupSliderInteraction();
        
    } catch (error) {
        console.error("Error loading data:", error);
    }
}

// Placeholder functions - will be implemented in subsequent commits
function createStackedBarChart() {
    const container = d3.select("#stacked-bar-chart");
    const width = 800;
    const height = 300;

    // Create SVG
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("id", "svg-stacked-bar");

    // Create groups for chart elements
    svg.append("g").attr("class", "bars-group");
    svg.append("g").attr("class", "x-axis");
    svg.append("g").attr("class", "y-axis");

    // Add axis labels
    svg.append("text")
        .attr("class", "axis-label x-label")
        .attr("x", width / 2)
        .attr("y", height - 5)
        .attr("text-anchor", "middle")
        .text("CGPA");

    svg.append("text")
        .attr("class", "axis-label y-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .text("Count");

    // Add legend
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 120}, ${margin.top})`);

    const legendData = [
        { label: "Placed", color: "#27ae60" },
        { label: "Not Placed", color: "#e74c3c" }
    ];

    legendData.forEach((d, i) => {
        const g = legend.append("g").attr("transform", `translate(0, ${i * 22})`);
        g.append("rect").attr("width", 16).attr("height", 16).attr("fill", d.color).attr("rx", 3);
        g.append("text").attr("x", 22).attr("y", 13).text(d.label).style("font-size", "12px");
    });

    // Initial render
    updateStackedBarChart();
}

function createScatterPlot() {
    const container = d3.select("#scatter-plot");
    const width = 500;
    const height = 350;

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
        .attr("x", width / 2)
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

    // Legend
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 140}, ${margin.top})`);

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

function createHorizontalBarChart() {
    const container = d3.select("#bar-chart");
    const width = 500;
    const height = 350;

    // Create SVG
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("id", "svg-bar");

    // Create groups
    svg.append("g").attr("class", "bars-group");
    svg.append("g").attr("class", "x-axis");
    svg.append("g").attr("class", "y-axis");

    // Axis labels
    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height - 5)
        .attr("text-anchor", "middle")
        .text("Student Count");

    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .text("College ID");

    updateHorizontalBarChart();
}

function createBoxPlot() {
    const container = d3.select("#box-plot");
    const width = 800;
    const height = 300;

    // Create SVG
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("id", "svg-boxplot");

    // Create groups
    svg.append("g").attr("class", "boxplot-group");
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
        .attr("transform", `translate(${width - 180}, ${margin.top})`);

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

function setupSliderInteraction() {
    const sliderMin = document.getElementById('cgpa-slider-min');
    const sliderMax = document.getElementById('cgpa-slider-max');
    const rangeMin = document.getElementById('range-min');
    const rangeMax = document.getElementById('range-max');
    const rangeSelected = document.querySelector('.range-selected');

    function updateSlider() {
        let minVal = parseFloat(sliderMin.value);
        let maxVal = parseFloat(sliderMax.value);

        // Prevent min from exceeding max
        if (minVal > maxVal) {
            [sliderMin.value, sliderMax.value] = [maxVal, minVal];
            [minVal, maxVal] = [maxVal, minVal];
        }

        // Update display values
        rangeMin.textContent = minVal.toFixed(1);
        rangeMax.textContent = maxVal.toFixed(1);

        // Update the colored range bar
        const percent1 = ((minVal - 4) / 7) * 100;
        const percent2 = ((maxVal - 4) / 7) * 100;
        rangeSelected.style.left = percent1 + '%';
        rangeSelected.style.width = (percent2 - percent1) + '%';

        // Update global range and refresh views
        cgpaRange = [minVal, maxVal];
        updateAllViews();
    }

    sliderMin.addEventListener('input', updateSlider);
    sliderMax.addEventListener('input', updateSlider);

    // Initialize slider display
    updateSlider();
}

// Update all views based on filter
function updateAllViews() {
    // Filter data based on CGPA range
    filteredData = data.filter(d => d.cgpa >= cgpaRange[0] && d.cgpa <= cgpaRange[1]);
    
    // Update each view
    updateStackedBarChart();
    updateScatterPlot();
    updateHorizontalBarChart();
    updateBoxPlot();
}

function updateStackedBarChart() {
    const svg = d3.select("#svg-stacked-bar");
    const width = 800;
    const height = 300;

    // Create CGPA bins (0.5 intervals from 4 to 11)
    const binEdges = d3.range(4, 11.5, 0.5);
    
    // Bin the data
    const binnedData = binEdges.slice(0, -1).map((edge, i) => {
        const binMin = edge;
        const binMax = binEdges[i + 1];
        const binData = filteredData.filter(d => d.cgpa >= binMin && d.cgpa < binMax);
        
        return {
            bin: binMin,
            binLabel: `${binMin.toFixed(1)}`,
            placed: binData.filter(d => d.placement === "Yes").length,
            notPlaced: binData.filter(d => d.placement === "No").length,
            total: binData.length
        };
    });

    // Scales
    const xScale = d3.scaleBand()
        .domain(binnedData.map(d => d.binLabel))
        .range([margin.left, width - margin.right])
        .padding(0.15);

    const maxCount = d3.max(binnedData, d => d.total) || 1;
    const yScale = d3.scaleLinear()
        .domain([0, maxCount])
        .nice()
        .range([height - margin.bottom, margin.top]);

    // Update axes
    svg.select(".x-axis")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .transition().duration(500)
        .call(d3.axisBottom(xScale).tickSizeOuter(0));

    svg.select(".y-axis")
        .attr("transform", `translate(${margin.left}, 0)`)
        .transition().duration(500)
        .call(d3.axisLeft(yScale).ticks(6));

    // Prepare stacked data
    const stackData = binnedData.map(d => ({
        bin: d.binLabel,
        placed: d.placed,
        notPlaced: d.notPlaced
    }));

    // Bars group
    const barsGroup = svg.select(".bars-group");

    // Bind data for each bin
    const barGroups = barsGroup.selectAll(".bar-group")
        .data(stackData, d => d.bin);

    // Enter
    const barGroupsEnter = barGroups.enter()
        .append("g")
        .attr("class", "bar-group");

    // Not Placed bars (bottom)
    barGroupsEnter.append("rect")
        .attr("class", "bar not-placed")
        .attr("fill", "#e74c3c");

    // Placed bars (top)
    barGroupsEnter.append("rect")
        .attr("class", "bar placed")
        .attr("fill", "#27ae60");

    // Merge and update
    const allBarGroups = barGroupsEnter.merge(barGroups);

    // Update Not Placed bars
    allBarGroups.select(".not-placed")
        .on("mouseover", function(event, d) {
            showTooltip(event, `CGPA: ${d.bin}<br>Not Placed: ${d.notPlaced}`);
        })
        .on("mouseout", hideTooltip)
        .transition().duration(500)
        .attr("x", d => xScale(d.bin))
        .attr("y", d => yScale(d.notPlaced))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - margin.bottom - yScale(d.notPlaced));

    // Update Placed bars (stacked on top)
    allBarGroups.select(".placed")
        .on("mouseover", function(event, d) {
            showTooltip(event, `CGPA: ${d.bin}<br>Placed: ${d.placed}`);
        })
        .on("mouseout", hideTooltip)
        .transition().duration(500)
        .attr("x", d => xScale(d.bin))
        .attr("y", d => yScale(d.notPlaced + d.placed))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - margin.bottom - yScale(d.placed));

    // Exit
    barGroups.exit().remove();
}

// Tooltip functions
function showTooltip(event, html) {
    tooltip
        .html(html)
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 10) + "px")
        .classed("visible", true);
}

function hideTooltip() {
    tooltip.classed("visible", false);
}

function updateScatterPlot() {
    const svg = d3.select("#svg-scatter");
    const width = 500;
    const height = 350;

    // Scales
    const xScale = d3.scaleLinear()
        .domain([d3.min(data, d => d.iq) - 5, d3.max(data, d => d.iq) + 5])
        .range([margin.left, width - margin.right]);

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
    points.enter()
        .append("circle")
        .attr("r", 0)
        .attr("cx", d => xScale(d.iq))
        .attr("cy", d => yScale(d.cgpa))
        .attr("fill", d => d.internship === "Yes" ? "#27ae60" : "#e74c3c")
        .attr("opacity", 0.7)
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .on("mouseover", function(event, d) {
            d3.select(this).attr("stroke", "#333").attr("stroke-width", 2);
            showTooltip(event, `
                <strong>College:</strong> ${d.college_id}<br>
                <strong>IQ:</strong> ${d.iq}<br>
                <strong>CGPA:</strong> ${d.cgpa.toFixed(2)}<br>
                <strong>Internship:</strong> ${d.internship}<br>
                <strong>Placement:</strong> ${d.placement}
            `);
        })
        .on("mouseout", function() {
            d3.select(this).attr("stroke", "#fff").attr("stroke-width", 0.5);
            hideTooltip();
        })
        .transition().duration(500)
        .attr("r", 5);

    // Update - apply ghosting effect based on filter
    pointsGroup.selectAll("circle")
        .transition().duration(300)
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

function updateHorizontalBarChart() {
    const svg = d3.select("#svg-bar");
    const width = 500;
    const height = 350;

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
        .range([margin.left, width - margin.right]);

    const yScale = d3.scaleBand()
        .domain(collegeArray.map(d => d.college))
        .range([margin.top, height - margin.bottom])
        .padding(0.2);

    // Update axes
    svg.select(".x-axis")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .transition().duration(500)
        .call(d3.axisBottom(xScale).ticks(5));

    svg.select(".y-axis")
        .attr("transform", `translate(${margin.left}, 0)`)
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
        .attr("x", margin.left)
        .attr("y", d => yScale(d.college))
        .attr("height", yScale.bandwidth())
        .attr("width", 0)
        .attr("fill", "#3498db")
        .attr("rx", 3)
        .on("mouseover", function(event, d) {
            d3.select(this).attr("fill", "#2980b9");
            showTooltip(event, `<strong>${d.college}</strong><br>Placed Students: ${d.count}`);
        })
        .on("mouseout", function() {
            d3.select(this).attr("fill", "#3498db");
            hideTooltip();
        })
        .transition().duration(500)
        .attr("width", d => xScale(d.count) - margin.left);

    // Update
    bars.transition().duration(500)
        .attr("y", d => yScale(d.college))
        .attr("height", yScale.bandwidth())
        .attr("width", d => xScale(d.count) - margin.left);

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

function updateBoxPlot() {
    const svg = d3.select("#svg-boxplot");
    const width = 800;
    const height = 300;

    // Filter to placed students only
    const placedData = filteredData.filter(d => d.placement === "Yes");

    // Prepare data for three categories
    const categories = [
        { name: "Communication Skills", key: "communication", color: "#e67e22" },
        { name: "Extra Curricular", key: "extra_curricular", color: "#9b59b6" },
        { name: "Academic Performance", key: "academic_perf", color: "#3498db" }
    ];

    // Calculate box plot statistics for each category
    const boxData = categories.map(cat => {
        const values = placedData.map(d => d[cat.key]).sort(d3.ascending);
        const q1 = d3.quantile(values, 0.25) || 0;
        const median = d3.quantile(values, 0.5) || 0;
        const q3 = d3.quantile(values, 0.75) || 0;
        const iqr = q3 - q1;
        const min = Math.max(d3.min(values) || 0, q1 - 1.5 * iqr);
        const max = Math.min(d3.max(values) || 0, q3 + 1.5 * iqr);

        return {
            name: cat.name,
            color: cat.color,
            q1, median, q3, min, max,
            values
        };
    });

    // Scales
    const xScale = d3.scaleBand()
        .domain(categories.map(c => c.name))
        .range([margin.left + 50, width - margin.right - 50])
        .padding(0.4);

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

    // Draw box plots
    const boxGroup = svg.select(".boxplot-group");

    // Clear and redraw
    boxGroup.selectAll(".box-element").remove();

    boxData.forEach(d => {
        const g = boxGroup.append("g").attr("class", "box-element");
        const center = xScale(d.name) + xScale.bandwidth() / 2;
        const boxWidth = xScale.bandwidth();

        // Vertical line (whiskers)
        g.append("line")
            .attr("class", "whisker")
            .attr("x1", center)
            .attr("x2", center)
            .attr("y1", yScale(d.min))
            .attr("y2", yScale(d.max))
            .attr("stroke", "#333")
            .attr("stroke-width", 1);

        // Min whisker cap
        g.append("line")
            .attr("x1", center - boxWidth / 4)
            .attr("x2", center + boxWidth / 4)
            .attr("y1", yScale(d.min))
            .attr("y2", yScale(d.min))
            .attr("stroke", "#333")
            .attr("stroke-width", 1);

        // Max whisker cap
        g.append("line")
            .attr("x1", center - boxWidth / 4)
            .attr("x2", center + boxWidth / 4)
            .attr("y1", yScale(d.max))
            .attr("y2", yScale(d.max))
            .attr("stroke", "#333")
            .attr("stroke-width", 1);

        // Box (Q1 to Q3)
        g.append("rect")
            .attr("class", "box")
            .attr("x", xScale(d.name))
            .attr("y", yScale(d.q3))
            .attr("width", boxWidth)
            .attr("height", yScale(d.q1) - yScale(d.q3))
            .attr("fill", d.color)
            .attr("fill-opacity", 0.7)
            .attr("stroke", "#333")
            .attr("stroke-width", 1.5)
            .on("mouseover", function(event) {
                showTooltip(event, `
                    <strong>${d.name}</strong><br>
                    Max: ${d.max.toFixed(1)}<br>
                    Q3: ${d.q3.toFixed(1)}<br>
                    Median: ${d.median.toFixed(1)}<br>
                    Q1: ${d.q1.toFixed(1)}<br>
                    Min: ${d.min.toFixed(1)}
                `);
            })
            .on("mouseout", hideTooltip);

        // Median line
        g.append("line")
            .attr("class", "median-line")
            .attr("x1", xScale(d.name))
            .attr("x2", xScale(d.name) + boxWidth)
            .attr("y1", yScale(d.median))
            .attr("y2", yScale(d.median))
            .attr("stroke", "#333")
            .attr("stroke-width", 2);
    });
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", init);
