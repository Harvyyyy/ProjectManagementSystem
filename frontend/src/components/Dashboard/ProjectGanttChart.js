import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext'; // Adjust path if needed
import { API_BASE_URL } from '../../App'; // Adjust path if needed
import { Spinner, Alert } from 'react-bootstrap';
import { Chart } from "react-google-charts"; // Import Google Chart component

// Define columns needed by Google Charts Gantt
const ganttColumns = [
  { type: "string", label: "Task ID" },
  { type: "string", label: "Task Name" },
  { type: "string", label: "Resource" }, // Using task status here
  { type: "date", label: "Start Date" },
  { type: "date", label: "End Date" },
  { type: "number", label: "Duration" }, // milliseconds (Google calculates)
  { type: "number", label: "Percent Complete" },
  { type: "string", label: "Dependencies" },
];

// Function to map task status to percentage for Gantt
const getTaskProgress = (status) => {
    switch (status?.toLowerCase()) {
        case 'completed': return 100;
        case 'in progress': return 50; // Estimate for in progress
        case 'pending': return 0;
        default: return 0;
    }
};

function ProjectGanttChart({ projectId }) {
  const { token } = useAuth();
  const [ganttData, setGanttData] = useState([ganttColumns]); // Start with columns header
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Data Fetching Logic ---
  const fetchProjectTasks = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    console.log(`Gantt: Fetching tasks for project ${projectId}`);

    try {
      // Fetch ALL tasks for this project
      // Ensure backend endpoint '/api/projects/{projectId}/tasks' returns tasks with created_at, due_date, completed_at, status, title, id
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/tasks`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: Could not fetch tasks for Gantt.`);
      }
      const tasks = await response.json(); // Expecting an array of tasks

      // --- Format Data for Google Charts ---
      const formattedData = tasks.map(task => {
        // Use created_at as Start Date - Ensure this is always present
        const startDate = task.created_at ? new Date(task.created_at) : new Date(); // Fallback, but created_at should exist
        // Use completed_at if available, otherwise due_date, otherwise start + 1 day
        let endDate = new Date(startDate.getTime() + 86400000); // Default to start + 1 day
        if (task.completed_at) {
            endDate = new Date(task.completed_at);
        } else if (task.due_date) {
            endDate = new Date(task.due_date);
        }

        // Ensure end date is strictly after start date for Gantt rendering
         if (endDate <= startDate) {
             // Set end date to be at least a small duration after start if invalid
             endDate.setTime(startDate.getTime() + 3600000); // e.g., 1 hour later
         }

        return [
          String(task.id),                // Task ID (string)
          task.title,                     // Task Name (string)
          task.status,                    // Resource (string - using status)
          startDate,                      // Start Date (Date object)
          endDate,                        // End Date (Date object)
          null,                           // Duration (null - let Google calculate)
          getTaskProgress(task.status),   // Percent Complete (number)
          null,                           // Dependencies (string - null for now)
        ];
      });

      // Combine headers and formatted task data
      setGanttData([ganttColumns, ...formattedData]);
      console.log("Gantt Data Prepared:", [ganttColumns, ...formattedData]);

    } catch (e) {
      console.error("Fetch Gantt tasks error:", e);
      setError(e.message || 'Failed to load task data for Gantt chart.');
      setGanttData([ganttColumns]); // Reset to just columns on error
    } finally {
      setLoading(false);
    }
  }, [projectId, token]);

  useEffect(() => {
    fetchProjectTasks();
  }, [fetchProjectTasks]); // Re-run when projectId changes


  // --- Gantt Chart Options ---
  const ganttOptions = {
      // Calculate height dynamically, ensure minimum height if no tasks
      height: ganttData.length > 1 ? ganttData.length * 40 + 50 : 200,
      gantt: {
          trackHeight: 35, // Height of each task row
          barCornerRadius: 2, // Slightly rounded bars
          // --- Custom Palette for Dark Theme ---
          palette: [
              // Define color sets. Google Charts cycles through these for different 'Resources'.
              // Order might matter more than explicit mapping by name.
              // Adjust these hex codes to match your theme.
              { // Corresponds potentially to 'pending' or first status encountered
                  "color": "#6c757d", // Bootstrap secondary grey
                  "dark": "#5a6268",
                  "light": "#adb5bd"
              },
              { // Corresponds potentially to 'in progress' or second status encountered
                  "color": "#0dcaf0", // Bootstrap info teal
                  "dark": "#0baccc",
                  "light": "#3ee6ff"
              },
              { // Corresponds potentially to 'completed' or third status encountered
                  "color": "#198754", // Bootstrap success green
                  "dark": "#146c43",
                  "light": "#1f9d67"
              },
               { // Example extra color if needed
                  "color": "#ffc107", // Bootstrap warning yellow
                  "dark": "#d39e00",
                  "light": "#ffca2c"
              }
          ],
          // --- End Custom Palette ---
          criticalPathEnabled: false, // Typically false for project tasks unless dependencies are set
          percentEnabled: true,       // Show completion percentage overlay
          percentDone: '.',           // Character used for the completed part of the bar
          labelStyle: {               // Style for task names on the left
            fontName: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', // Example font
            fontSize: 12,
            color: '#e9ecef',         // Light gray text for dark background
          },
          innerGridTrack: { fill: '#343a40' },    // Darker track background (Bootstrap dark gray)
          innerGridDarkTrack: { fill: '#212529' },// Even darker alternating track (Bootstrap darker gray)
          labelMaxWidth: 180,         // Limit width of task labels
          backgroundColor: {            // Chart area background
              fill: '#212529',         // Match dark theme background
              // stroke: '#495057',    // Optional border color
              // strokeWidth: 1
          },
           // Style the vertical grid lines
           gridlineColor: '#495057',    // Dark gray grid lines

           // Style the task bars text (percentage)
           barTextStyle: { color: '#ffffff', fontSize: 10 }, // White text on bars
           barHeight: 20, // Thinner bars

            // Default bar color if palette doesn't match (less useful with palette)
           // defaultBarColor: '#888888'
      },
       tooltip: { isHtml: true }, // Allow richer tooltips if needed later
  };
  // --- END Options ---


  // --- Render Logic ---
  if (loading) return <div className="text-center text-light py-3"><Spinner animation="border" size="sm" /> Loading Gantt Chart...</div>;
  if (error) return <Alert variant="warning" className="bg-dark text-warning border-warning">{error}</Alert>;
  // Check if there's actual task data, not just the header row
  if (ganttData.length <= 1) return <Alert variant="info" className="bg-dark text-info border-info">No task data available for Gantt Chart display.</Alert>;

  return (
    // Use a container - background set internally by chart options now
    <div className="gantt-chart-container" style={{border: '1px solid #495057', borderRadius: '0.375rem'}}> {/* Added border */}
      <Chart
        chartType="Gantt"
        width="100%"
        // Height is now controlled by options based on data length
        height={ganttOptions.height} // Pass calculated height
        data={ganttData}
        options={ganttOptions}
        loader={<div className="text-center">Loading Chart...</div>}
        // Optional: Define specific chart packages if needed (usually automatic)
        // chartPackages={['gantt']}
      />
    </div>
  );
}

export default ProjectGanttChart;