/**
 * Scatter Plot - View 2
 * IQ vs CGPA with Internship Status (color) and Placement Status (shape)
 */

function createScatterPlot() {
    const container = d3.select("#scatter-plot");
    const width = 500;
    const height = 350;
  
    const legendWidth = 140;
    const plotRight = width - margin.right - legendWidth;
  
    const svg = container.append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("id", "svg-scatter");
  
    svg.append("g").attr("class", "points-group");
    svg.append("g").attr("class", "x-axis");
    svg.append("g").attr("class", "y-axis");
  
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
  
    // Create legend group
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${plotRight + 10}, ${margin.top})`);
  
    // Color legend (Internship)
    legend.append("text")
      .attr("x", 0).attr("y", 0)
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .style("fill", "#666")
      .text("Internship:");
    
    const colorLegend = [
      { label: "Yes", color: "#27ae60" },
      { label: "No", color: "#e74c3c" }
    ];
  
    colorLegend.forEach((d, i) => {
      const g = legend.append("g").attr("transform", `translate(0, ${12 + i * 18})`);
      g.append("circle").attr("cx", 8).attr("cy", 6).attr("r", 5).attr("fill", d.color);
      g.append("text").attr("x", 20).attr("y", 10).text(d.label).style("font-size", "10px");
    });
    
    // Shape legend (Placement)
    legend.append("text")
      .attr("x", 0).attr("y", 60)
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .style("fill", "#666")
      .text("Placement:");
    
    const shapeLegend = [
      { label: "Placed", shape: "circle" },
      { label: "Not Placed", shape: "cross" }
    ];
  
    shapeLegend.forEach((d, i) => {
      const g = legend.append("g").attr("transform", `translate(0, ${72 + i * 18})`);
      if (d.shape === "circle") {
        g.append("circle").attr("cx", 8).attr("cy", 6).attr("r", 5)
          .attr("fill", "#888").attr("stroke", "#333").attr("stroke-width", 1);
      } else {
        // Draw X mark
        g.append("path")
          .attr("d", d3.symbol().type(d3.symbolCross).size(60))
          .attr("transform", "translate(8, 6) rotate(45)")
          .attr("fill", "#888").attr("stroke", "#333").attr("stroke-width", 0.5);
      }
      g.append("text").attr("x", 20).attr("y", 10).text(d.label).style("font-size", "10px");
    });
  
    updateScatterPlot();
  }
  
  // Fast opacity-only update for CGPA range changes - uses CSS class for better performance
  function updateScatterPlotOpacityOnly() {
    const svg = d3.select("#svg-scatter");
    if (svg.empty()) return;
    
    const pointsGroup = svg.select(".points-group");
    const allPoints = pointsGroup.selectAll(".scatter-point");
    
    if (allPoints.empty()) return;
    
    // Use single DOM batch for all opacity updates
    allPoints.each(function(d) {
      const inRange = d.cgpa >= cgpaRange[0] && d.cgpa <= cgpaRange[1];
      const isSelected = selectedCollege && d.college_id === selectedCollege;
      
      let opacity, scale;
      if (selectedCollege) {
        if (isSelected) {
          opacity = inRange ? 1 : 0.4;
          scale = inRange ? 1.6 : 1.0;
        } else {
          opacity = inRange ? 0.2 : 0.08;
          scale = inRange ? 1.0 : 0.7;
        }
      } else {
        opacity = inRange ? 0.85 : 0.15;
        scale = inRange ? 1.0 : 0.7;
      }
      
      // Direct DOM manipulation for speed
      this.style.opacity = opacity;
      this.setAttribute("transform", `translate(${d._scatterX}, ${d._scatterY}) scale(${scale})`);
    });
  }

  function updateScatterPlot(opacityOnly = false) {
    const svg = d3.select("#svg-scatter");
    if (svg.empty()) return;
  
    const width = 500;
    const height = 350;
  
    const legendWidth = 140;
    const plotRight = width - margin.right - legendWidth;
  
    const xScale = d3.scaleLinear()
      .domain([d3.min(data, d => d.iq) - 5, d3.max(data, d => d.iq) + 5])
      .range([margin.left, plotRight]);
  
    const yScale = d3.scaleLinear()
      .domain([d3.min(data, d => d.cgpa) - 0.5, d3.max(data, d => d.cgpa) + 0.5])
      .range([height - margin.bottom, margin.top]);
  
    // Apply sampling first to determine point count for performance optimization
    const threshold = scatterSamplePct / 100;
    let dataToRender = data.filter(d => d._rand < threshold);
    
    // Apply placement filter
    if (scatterPlacementFilter === 'placed') {
      dataToRender = dataToRender.filter(d => d.placement === 'Yes');
    } else if (scatterPlacementFilter === 'not-placed') {
      dataToRender = dataToRender.filter(d => d.placement === 'No');
    }
    
    // Apply internship filter
    if (scatterInternshipFilter === 'yes') {
      dataToRender = dataToRender.filter(d => d.internship === 'Yes');
    } else if (scatterInternshipFilter === 'no') {
      dataToRender = dataToRender.filter(d => d.internship === 'No');
    }
    
    // Cache positions on ORIGINAL data objects for fast updates
    // This ensures positions persist between filter calls
    data.forEach(d => {
      d._scatterX = xScale(d.iq);
      d._scatterY = yScale(d.cgpa);
    });
  
    // Update globals for status panel
    scatterSampledData = dataToRender;
    scatterSampleCount = dataToRender.length;
    
    // If only opacity update is needed and points already exist, use fast path
    const pointsGroup = svg.select(".points-group");
    const existingPoints = pointsGroup.selectAll(".scatter-point");
    
    if (opacityOnly && !existingPoints.empty() && existingPoints.size() === dataToRender.length) {
      updateScatterPlotOpacityOnly();
      return;
    }
    
    // Performance optimization: reduce/skip animations for large datasets
    const pointCount = dataToRender.length;
    const useTransitions = pointCount < 200;
    const transitionDuration = pointCount < 80 ? 250 : (pointCount < 200 ? 100 : 0);
  
    // Update axes (skip transitions for large datasets)
    svg.select(".x-axis")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).ticks(8));
  
    svg.select(".y-axis")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale).ticks(6));
    
    // Symbol generators (pointsGroup already declared above)
    const circleSymbol = d3.symbol().type(d3.symbolCircle).size(80);
    const crossSymbol = d3.symbol().type(d3.symbolCross).size(80);
  
    // Use path elements instead of circles for different shapes
    const points = pointsGroup.selectAll(".scatter-point")
      .data(dataToRender, d => d._index);
  
    // Helper functions
    const getColor = d => d.internship === "Yes" ? "#27ae60" : "#e74c3c";
    const getSymbol = d => d.placement === "Yes" ? circleSymbol() : crossSymbol();
    
    const getOpacity = d => {
      const inRange = d.cgpa >= cgpaRange[0] && d.cgpa <= cgpaRange[1];
      if (selectedCollege) {
        if (d.college_id === selectedCollege) {
          return inRange ? 1 : 0.4;
        } else {
          return inRange ? 0.2 : 0.08;
        }
      }
      return inRange ? 0.85 : 0.15;
    };
    
    const getScale = d => {
      const inRange = d.cgpa >= cgpaRange[0] && d.cgpa <= cgpaRange[1];
      if (selectedCollege && d.college_id === selectedCollege) {
        return inRange ? 1.6 : 1.0;
      }
      return inRange ? 1.0 : 0.7;
    };
    
    const getStroke = d => {
      if (selectedCollege && d.college_id === selectedCollege) {
        return "#f39c12";
      }
      return "#fff";
    };
    
    const getStrokeWidth = d => {
      if (selectedCollege && d.college_id === selectedCollege) {
        return 2;
      }
      return 0.5;
    };
  
    // Enter - create new points
    const pointsEnter = points.enter()
      .append("path")
      .attr("class", "scatter-point")
      .attr("d", getSymbol)
      .attr("transform", d => useTransitions 
        ? `translate(${xScale(d.iq)}, ${yScale(d.cgpa)}) scale(0)` 
        : `translate(${xScale(d.iq)}, ${yScale(d.cgpa)}) scale(${getScale(d)})`)
      .attr("fill", getColor)
      .attr("opacity", useTransitions ? 0.7 : getOpacity)
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .attr("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke", "#333").attr("stroke-width", 2).raise();
        const placementIcon = d.placement === "Yes" ? "✓" : "✗";
        const internshipIcon = d.internship === "Yes" ? "✓" : "✗";
        const placementClass = d.placement === "Yes" ? "text-green" : "text-red";
        const internshipClass = d.internship === "Yes" ? "text-green" : "text-red";
        
        // Calculate percentiles for context
        const iqPercentile = Math.round(filteredData.filter(x => x.iq <= d.iq).length / filteredData.length * 100);
        const cgpaPercentile = Math.round(filteredData.filter(x => x.cgpa <= d.cgpa).length / filteredData.length * 100);
        
        showTooltip(event, `
          <strong>College:</strong> ${d.college_id}<br>
          <strong>IQ:</strong> ${d.iq} <span class="tooltip-context">(top ${100 - iqPercentile}%)</span><br>
          <strong>CGPA:</strong> ${d.cgpa.toFixed(2)} <span class="tooltip-context">(top ${100 - cgpaPercentile}%)</span><br>
          <strong>Internship:</strong> <span class="${internshipClass}">${internshipIcon} ${d.internship}</span><br>
          <strong>Placement:</strong> <span class="${placementClass}">${placementIcon} ${d.placement}</span><br>
          <em class="tooltip-hint">Click to highlight college</em>
        `);
      })
      .on("mouseout", function (event, d) {
        d3.select(this)
          .attr("stroke", getStroke(d))
          .attr("stroke-width", getStrokeWidth(d));
        hideTooltip();
      })
      .on("click", function (event, d) {
        selectCollege(d.college_id);
      });
  
    // Animate enter (only if using transitions)
    if (useTransitions) {
      pointsEnter.transition().duration(transitionDuration)
        .attr("transform", d => `translate(${xScale(d.iq)}, ${yScale(d.cgpa)}) scale(${getScale(d)})`);
    }
  
    // Merge and update
    const allPoints = pointsEnter.merge(points);
  
    // Update points - with or without transitions
    allPoints
      .attr("d", getSymbol)
      .attr("fill", getColor)
      .on("mouseout", function (event, d) {
        d3.select(this)
          .attr("stroke", getStroke(d))
          .attr("stroke-width", getStrokeWidth(d));
        hideTooltip();
      });
    
    if (useTransitions) {
      allPoints.transition().duration(transitionDuration)
        .attr("transform", d => `translate(${xScale(d.iq)}, ${yScale(d.cgpa)}) scale(${getScale(d)})`)
        .attr("opacity", getOpacity)
        .attr("stroke", getStroke)
        .attr("stroke-width", getStrokeWidth);
    } else {
      // No transitions - direct update for performance
      allPoints
        .attr("transform", d => `translate(${xScale(d.iq)}, ${yScale(d.cgpa)}) scale(${getScale(d)})`)
        .attr("opacity", getOpacity)
        .attr("stroke", getStroke)
        .attr("stroke-width", getStrokeWidth);
    }
  
    // Exit
    if (useTransitions) {
      points.exit()
        .transition().duration(transitionDuration)
        .attr("transform", d => `translate(${xScale(d.iq)}, ${yScale(d.cgpa)}) scale(0)`)
        .remove();
    } else {
      points.exit().remove();
    }
  }
  