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
    console.log("Stacked Bar Chart - To be implemented");
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
    console.log("Update Stacked Bar Chart");
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
