/**
 * University Placement Strategic Dashboard
 * Main JavaScript file - Application entry point
 */

// Debounce utility function for performance optimization
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

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

// View 2: Filters
let scatterPlacementFilter = 'all';   // 'all', 'placed', 'not-placed'
let scatterInternshipFilter = 'all';  // 'all', 'yes', 'no'

// View 3: Sort and Search
let sortMode = 'count';  // 'count' or 'rate'
let collegeSearchQuery = '';

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
    setupScatterFilters();             // View 2 placement/internship filters
    setupSwapViewsButton();            // Swap button
    setupClearSelectionButton();       // Clear selection button
    setupSortSelect();                 // View 3 sort select
    setupCollegeSearch();              // View 3 college search
    setupResetButton();                // Reset all filters
    
    // Initial updates
    updateStatusPanel();
    updateEmptyStates();
    updateInsightsPanel();

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

  // Immediate UI update (no debounce for visual feedback)
  function updateSliderUI() {
    let minVal = parseFloat(sliderMin.value);
    let maxVal = parseFloat(sliderMax.value);

    if (minVal > maxVal) {
      [sliderMin.value, sliderMax.value] = [maxVal, minVal];
      [minVal, maxVal] = [maxVal, minVal];
    }

    rangeMin.textContent = minVal.toFixed(1);
    rangeMax.textContent = maxVal.toFixed(1);

    // Update ARIA attributes
    sliderMin.setAttribute('aria-valuenow', minVal);
    sliderMax.setAttribute('aria-valuenow', maxVal);

    const percent1 = ((minVal - 4) / 7) * 100;
    const percent2 = ((maxVal - 4) / 7) * 100;
    rangeSelected.style.left = percent1 + '%';
    rangeSelected.style.width = (percent2 - percent1) + '%';

    cgpaRange = [minVal, maxVal];
  }

  // Use requestAnimationFrame for smooth updates
  let rafId = null;
  let pendingUpdate = false;
  
  function handleSliderInput() {
    updateSliderUI();
    
    // Cancel any pending animation frame
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    
    // Use requestAnimationFrame for smooth rendering
    rafId = requestAnimationFrame(() => {
      updateAllViews(true); // CGPA change only - use fast path
      rafId = null;
    });
  }

  sliderMin.addEventListener('input', handleSliderInput);
  sliderMax.addEventListener('input', handleSliderInput);
  
  // Initial update
  updateSliderUI();
  updateAllViews();
}

// View 2: sampling slider
function setupScatterSampleInteraction() {
  const slider = document.getElementById('scatter-sample-slider');
  const pctLabel = document.getElementById('scatter-percent');
  const selectedBar = document.getElementById('scatter-range-selected');

  if (!slider || !pctLabel || !selectedBar) return;

  // Immediate UI update
  function updateScatterSamplingUI() {
    scatterSamplePct = +slider.value;
    pctLabel.textContent = `${scatterSamplePct}%`;
    selectedBar.style.left = '0%';
    selectedBar.style.width = `${scatterSamplePct}%`;
    
    // Update ARIA attribute
    slider.setAttribute('aria-valuenow', scatterSamplePct);
  }

  // Debounced chart update for performance
  const debouncedScatterUpdate = debounce(() => {
    updateScatterPlot();
    updateStatusPanel();
    updateEmptyStates();
  }, 100);

  slider.addEventListener('input', () => {
    updateScatterSamplingUI();
    debouncedScatterUpdate();
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
function updateAllViews(cgpaChangeOnly = false) {
  filteredData = data.filter(d => d.cgpa >= cgpaRange[0] && d.cgpa <= cgpaRange[1]);

  updateStackedBarChart();
  
  // For CGPA-only changes with many points, use fast opacity update
  if (cgpaChangeOnly && scatterSamplePct > 30) {
    updateScatterPlot(true); // opacity-only mode
  } else {
    updateScatterPlot(false);
  }
  
  updateHorizontalBarChart();
  updateBoxPlot();
  updateStatusPanel();
  updateEmptyStates();
  updateInsightsPanel();
}

// Update Key Insights Panel
function updateInsightsPanel() {
  const total = filteredData.length;
  const placed = filteredData.filter(d => d.placement === "Yes");
  const placedCount = placed.length;
  const placementRate = total > 0 ? (placedCount / total * 100).toFixed(1) : 0;
  
  // Students with internship
  const withInternship = filteredData.filter(d => d.internship === "Yes");
  const withInternshipPlaced = withInternship.filter(d => d.placement === "Yes").length;
  const internshipPlacementRate = withInternship.length > 0 
    ? (withInternshipPlaced / withInternship.length * 100).toFixed(1) : 0;
  
  // Students without internship
  const noInternship = filteredData.filter(d => d.internship === "No");
  const noInternshipPlaced = noInternship.filter(d => d.placement === "Yes").length;
  const noInternshipPlacementRate = noInternship.length > 0 
    ? (noInternshipPlaced / noInternship.length * 100).toFixed(1) : 0;
  
  // Average CGPA of placed students
  const avgCgpaPlaced = placedCount > 0 
    ? (d3.mean(placed, d => d.cgpa)).toFixed(2) : "-";
  
  // Update DOM
  const totalEl = document.getElementById('insight-total');
  const rateEl = document.getElementById('insight-placement-rate');
  const internshipEl = document.getElementById('insight-internship-rate');
  const noInternshipEl = document.getElementById('insight-no-internship-rate');
  const avgCgpaEl = document.getElementById('insight-avg-cgpa');
  
  if (totalEl) totalEl.textContent = total.toLocaleString();
  if (rateEl) rateEl.textContent = `${placementRate}%`;
  if (internshipEl) internshipEl.textContent = `${internshipPlacementRate}%`;
  if (noInternshipEl) noInternshipEl.textContent = `${noInternshipPlacementRate}%`;
  if (avgCgpaEl) avgCgpaEl.textContent = avgCgpaPlaced;
}

// Check and update empty state messages for all views
function updateEmptyStates() {
  const placedCount = filteredData.filter(d => d.placement === "Yes").length;
  const scatterPointCount = scatterSampleCount;
  
  // View 1: Stacked bar chart (show if no data at all)
  const view1Empty = document.getElementById('view1-empty');
  const view1Chart = document.getElementById('stacked-bar-chart');
  if (view1Empty && view1Chart) {
    if (filteredData.length === 0) {
      view1Empty.style.display = 'flex';
      view1Chart.style.display = 'none';
    } else {
      view1Empty.style.display = 'none';
      view1Chart.style.display = 'flex';
    }
  }
  
  // View 2: Scatter plot (show if no points to display)
  const view2Empty = document.getElementById('view2-empty');
  const view2Chart = document.getElementById('scatter-plot');
  if (view2Empty && view2Chart) {
    if (scatterPointCount === 0) {
      view2Empty.style.display = 'flex';
      view2Chart.style.display = 'none';
    } else {
      view2Empty.style.display = 'none';
      view2Chart.style.display = 'flex';
    }
  }
  
  // View 3: Horizontal bar chart (show if no placed students or no search results)
  const view3Empty = document.getElementById('view3-empty');
  const view3Chart = document.getElementById('bar-chart');
  const view3EmptyText = view3Empty ? view3Empty.querySelector('p') : null;
  if (view3Empty && view3Chart) {
    // Check if search yields no results
    const hasSearchNoResults = collegeSearchQuery && placedCount > 0;
    
    if (placedCount === 0) {
      view3Empty.style.display = 'flex';
      view3Chart.style.display = 'none';
      if (view3EmptyText) view3EmptyText.textContent = 'No placed students in the current filter range';
    } else {
      view3Empty.style.display = 'none';
      view3Chart.style.display = 'flex';
    }
  }
  
  // View 4: Box plot (show if no placed students)
  const view4Empty = document.getElementById('view4-empty');
  const view4Chart = document.getElementById('box-plot');
  if (view4Empty && view4Chart) {
    if (placedCount === 0) {
      view4Empty.style.display = 'flex';
      view4Chart.style.display = 'none';
    } else {
      view4Empty.style.display = 'none';
      view4Chart.style.display = 'flex';
    }
  }
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

// View 2: Scatter plot filter setup
function setupScatterFilters() {
  const placementSelect = document.getElementById('placement-filter');
  const internshipSelect = document.getElementById('internship-filter');
  
  if (placementSelect) {
    placementSelect.addEventListener('change', () => {
      scatterPlacementFilter = placementSelect.value;
      updateScatterPlot();
      updateStatusPanel();
      updateEmptyStates();
    });
  }
  
  if (internshipSelect) {
    internshipSelect.addEventListener('change', () => {
      scatterInternshipFilter = internshipSelect.value;
      updateScatterPlot();
      updateStatusPanel();
      updateEmptyStates();
    });
  }
}

// View 3: Sort mode setup
function setupSortSelect() {
  const select = document.getElementById('sort-select');
  if (!select) return;
  
  select.addEventListener('change', () => {
    sortMode = select.value;
    updateHorizontalBarChart();
  });
}

// View 3: College search setup
function setupCollegeSearch() {
  const searchInput = document.getElementById('college-search');
  const clearBtn = document.getElementById('clear-search-btn');
  
  if (!searchInput) return;
  
  // Debounced search update
  const debouncedSearch = debounce(() => {
    collegeSearchQuery = searchInput.value.trim().toLowerCase();
    updateHorizontalBarChart();
    
    // Show/hide clear button
    if (clearBtn) {
      clearBtn.style.display = collegeSearchQuery ? 'flex' : 'none';
    }
  }, 200);
  
  searchInput.addEventListener('input', debouncedSearch);
  
  // Clear search button
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      collegeSearchQuery = '';
      clearBtn.style.display = 'none';
      updateHorizontalBarChart();
    });
  }
}

// Reset all filters to default
function setupResetButton() {
  const btn = document.getElementById('reset-filters-btn');
  if (!btn) return;
  
  btn.addEventListener('click', () => {
    // Reset CGPA range
    cgpaRange = [4, 11];
    const sliderMin = document.getElementById('cgpa-slider-min');
    const sliderMax = document.getElementById('cgpa-slider-max');
    const rangeMin = document.getElementById('range-min');
    const rangeMax = document.getElementById('range-max');
    const rangeSelected = document.querySelector('#view1-container .range-selected');
    
    if (sliderMin) sliderMin.value = 4;
    if (sliderMax) sliderMax.value = 11;
    if (rangeMin) rangeMin.textContent = '4.0';
    if (rangeMax) rangeMax.textContent = '11.0';
    if (rangeSelected) {
      rangeSelected.style.left = '0%';
      rangeSelected.style.width = '100%';
    }
    
    // Reset scatter sample
    scatterSamplePct = 5;
    const sampleSlider = document.getElementById('scatter-sample-slider');
    const samplePercent = document.getElementById('scatter-percent');
    const sampleSelected = document.getElementById('scatter-range-selected');
    
    if (sampleSlider) sampleSlider.value = 5;
    if (samplePercent) samplePercent.textContent = '5%';
    if (sampleSelected) {
      sampleSelected.style.left = '0%';
      sampleSelected.style.width = '5%';
    }
    
    // Reset View 2 filters
    scatterPlacementFilter = 'all';
    scatterInternshipFilter = 'all';
    const placementFilter = document.getElementById('placement-filter');
    const internshipFilter = document.getElementById('internship-filter');
    if (placementFilter) placementFilter.value = 'all';
    if (internshipFilter) internshipFilter.value = 'all';
    
    // Reset View 3 filters
    sortMode = 'count';
    collegeSearchQuery = '';
    const sortSelect = document.getElementById('sort-select');
    const searchInput = document.getElementById('college-search');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    if (sortSelect) sortSelect.value = 'count';
    if (searchInput) searchInput.value = '';
    if (clearSearchBtn) clearSearchBtn.style.display = 'none';
    
    // Clear selection
    selectedCollege = null;
    
    // Update all views
    filteredData = [...data];
    updateAllViews(false);
    
    // Visual feedback
    btn.textContent = '✓ Reset!';
    btn.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
    setTimeout(() => {
      btn.textContent = '↺ Reset Filters';
      btn.style.background = '';
    }, 1000);
  });
}

document.addEventListener("DOMContentLoaded", init);
