/**
 * University Placement Strategic Dashboard
 * Main JavaScript file - Application entry point
 */

// Global variables
let data = [];
let filteredData = [];
let cgpaRange = [4, 11];

// View 2 sampling globals (IMPORTANT: must exist before scatterPlot.js reads them)
let scatterSamplePct = 5;      // default at first load
let scatterSampledData = [];
let scatterSampleCount = 0;

// Brushing & Linking: selected college
let selectedCollege = null;

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

// Load data and initialize dashboard
async function init() {
  try {
    data = await d3.csv("data/CollegePlacement.csv", (d, i) => ({
      _index: i,
      _rand: Math.random(),

      // Be tolerant to different header naming (your repo previously used different keys)
      college_id: d.College_ID ?? d.CollegeID ?? d.CollegeId ?? d.College_ID,
      iq: +(d.IQ ?? d.Iq),
      prev_sem: +(d.Prev_Sem_Result ?? d.PrevSemResult),
      cgpa: +(d.CGPA ?? d.Cgpa),
      academic_perf: +(d.Academic_Performance ?? d.AcademicPerformance),
      internship: (d.Internship_Experience ?? d.InternshipExperience),
      extra_curricular: +(d.Extra_Curricular_Score ?? d.ExtraCurricularScore),
      communication: +(d.Communication_Skills ?? d.CommunicationSkills),
      projects: +(d.Projects_Completed ?? d.ProjectsCompleted),
      placement: d.Placement
    }));

    filteredData = [...data];

    // Initialize all views
    createStackedBarChart();
    createScatterPlot();
    createHorizontalBarChart();
    createBoxPlot();

    // Setup interactions
    setupSliderInteraction();          // View 1 range filter
    setupScatterSampleInteraction();   // View 2 sampling slider
    setupSwapViewsButton();            // Swap button
    setupClearSelectionButton();       // Clear selection button
    
    // Initial status panel update
    updateStatusPanel();

  } catch (error) {
    console.error("Error loading data:", error);
  }
}

// View 1: CGPA range slider
function setupSliderInteraction() {
  const sliderMin = document.getElementById('cgpa-slider-min');
  const sliderMax = document.getElementById('cgpa-slider-max');
  const rangeMin = document.getElementById('range-min');
  const rangeMax = document.getElementById('range-max');

  const rangeSelected = document.querySelector('#view1-container .range-selected');

  function updateSlider() {
    let minVal = parseFloat(sliderMin.value);
    let maxVal = parseFloat(sliderMax.value);

    if (minVal > maxVal) {
      [sliderMin.value, sliderMax.value] = [maxVal, minVal];
      [minVal, maxVal] = [maxVal, minVal];
    }

    rangeMin.textContent = minVal.toFixed(1);
    rangeMax.textContent = maxVal.toFixed(1);

    const percent1 = ((minVal - 4) / 7) * 100;
    const percent2 = ((maxVal - 4) / 7) * 100;
    rangeSelected.style.left = percent1 + '%';
    rangeSelected.style.width = (percent2 - percent1) + '%';

    cgpaRange = [minVal, maxVal];
    updateAllViews();
  }

  sliderMin.addEventListener('input', updateSlider);
  sliderMax.addEventListener('input', updateSlider);
  updateSlider();
}

// View 2: sampling slider
function setupScatterSampleInteraction() {
  const slider = document.getElementById('scatter-sample-slider');
  const pctLabel = document.getElementById('scatter-percent');
  const selectedBar = document.getElementById('scatter-range-selected');

  if (!slider || !pctLabel || !selectedBar) return;

  function updateScatterSamplingUI() {
    scatterSamplePct = +slider.value;
    pctLabel.textContent = `${scatterSamplePct}%`;
    selectedBar.style.left = '0%';
    selectedBar.style.width = `${scatterSamplePct}%`;
  }

  slider.addEventListener('input', () => {
    updateScatterSamplingUI();
    updateScatterPlot();
    updateStatusPanel();
  });

  // Initialize to default (5%)
  updateScatterSamplingUI();
  updateScatterPlot();
}

// Swap views button
function setupSwapViewsButton() {
    const btn = document.getElementById('swap-views-btn');
    const dashboard = document.getElementById('dashboard');
    if (!btn || !dashboard) return;
  
    btn.addEventListener('click', () => {
      const is2 = dashboard.classList.contains('layout-2rows');
  
      dashboard.classList.toggle('layout-2rows', !is2);
      dashboard.classList.toggle('layout-3rows', is2);
    });
  }
  

// Update all views based on filter
function updateAllViews() {
  filteredData = data.filter(d => d.cgpa >= cgpaRange[0] && d.cgpa <= cgpaRange[1]);

  updateStackedBarChart();
  updateScatterPlot();
  updateHorizontalBarChart();
  updateBoxPlot();
  updateStatusPanel();
}

// Status Panel Update
function updateStatusPanel() {
  const totalCount = data.length;
  const filteredCount = filteredData.length;
  
  // Update records count
  const recordsEl = document.getElementById('status-records');
  if (recordsEl) {
    recordsEl.textContent = `${filteredCount} / ${totalCount}`;
  }
  
  // Update CGPA range
  const cgpaEl = document.getElementById('status-cgpa');
  if (cgpaEl) {
    cgpaEl.textContent = `${cgpaRange[0].toFixed(1)} - ${cgpaRange[1].toFixed(1)}`;
  }
  
  // Update sample percentage
  const sampleEl = document.getElementById('status-sample');
  if (sampleEl) {
    sampleEl.textContent = `${scatterSamplePct}% (${scatterSampleCount} pts)`;
  }
  
  // Update selection status
  const selectionContainer = document.getElementById('status-selection-container');
  const selectionTextEl = document.getElementById('status-selection-text');
  if (selectionContainer && selectionTextEl) {
    if (selectedCollege) {
      selectionContainer.style.display = 'flex';
      selectionTextEl.textContent = selectedCollege;
    } else {
      selectionContainer.style.display = 'none';
    }
  }
}

// Selection handling
function selectCollege(college) {
  if (selectedCollege === college) {
    // Clicking same college clears selection
    selectedCollege = null;
  } else {
    selectedCollege = college;
  }
  
  // Update all views to reflect selection
  updateScatterPlot();
  updateHorizontalBarChart();
  updateStatusPanel();
}

function clearSelection() {
  selectedCollege = null;
  updateScatterPlot();
  updateHorizontalBarChart();
  updateStatusPanel();
}

// Setup clear selection button
function setupClearSelectionButton() {
  const btn = document.getElementById('clear-selection-btn');
  if (btn) {
    btn.addEventListener('click', clearSelection);
  }
}

document.addEventListener("DOMContentLoaded", init);
