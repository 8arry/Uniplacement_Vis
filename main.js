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
    console.log("Scatter Plot - To be implemented");
}

function createHorizontalBarChart() {
    console.log("Horizontal Bar Chart - To be implemented");
}

function createBoxPlot() {
    console.log("Box Plot - To be implemented");
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
    console.log("Update Scatter Plot");
}

function updateHorizontalBarChart() {
    console.log("Update Horizontal Bar Chart");
}

function updateBoxPlot() {
    console.log("Update Box Plot");
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", init);
