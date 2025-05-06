import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../App';
import { Table, Button, Spinner, Alert } from 'react-bootstrap'; // Modal removed from here, handled by form
import ExpenditureForm from './ExpenditureForm'; // Import the modal form
// Ensure formatting utilities are correctly imported
import { formatCurrency, formatDate } from '../../utils/formatting'; // Adjust path if needed

function ExpendituresTable({ projectId, onExpenditureUpdate }) { // Receive projectId and callback
  const { token } = useAuth();
  const [expenditures, setExpenditures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for Add Modal
  const [showAddModal, setShowAddModal] = useState(false);

  // State for Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [expenditureToEdit, setExpenditureToEdit] = useState(null);


  const fetchExpenditures = useCallback(async () => {
    if (!projectId) return; // Don't fetch if no project is selected

    setLoading(true);
    setError(null);
    try {
      // Use the nested route to get expenditures for the specific project
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/expenditures`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      if (!response.ok) {
          // Try to parse error message from backend if possible
          let errorMsg = `HTTP error ${response.status}`;
          try {
              const errData = await response.json();
              errorMsg = errData.message || errorMsg;
          } catch(e) {
              // Ignore if response wasn't JSON
          }
          throw new Error(`${errorMsg}: Could not fetch expenditures.`);
      }
      const data = await response.json();
      // Assuming backend returns paginated data or direct array
      setExpenditures(data.data ? data.data : (Array.isArray(data) ? data : []));
    } catch (e) {
      console.error("Fetch expenditures error:", e);
      setError(e.message || 'Failed to load expenditures.');
      setExpenditures([]); // Clear expenditures on error
    } finally {
      setLoading(false);
    }
  }, [projectId, token]);

  useEffect(() => {
    fetchExpenditures();
  }, [fetchExpenditures]); // Re-run when projectId changes

  // --- Modal Handlers ---
  const handleShowAddModal = () => {
      setExpenditureToEdit(null); // Ensure edit state is clear
      setShowAddModal(true);
  };
  const handleCloseAddModal = () => setShowAddModal(false);

  // --- Edit Modal Handlers ---
  const handleShowEditModal = (expenditure) => {
      setExpenditureToEdit(expenditure); // Set the expenditure to edit
      setShowEditModal(true); // Show the edit modal
  };
  const handleCloseEditModal = () => {
      setShowEditModal(false);
      setExpenditureToEdit(null); // Clear selection on close
  };
  // --- END Edit Handlers ---

  // Unified Save Success Handler (for both Add and Edit)
  const handleSaveSuccess = () => {
    setShowAddModal(false); // Close Add modal if open
    setShowEditModal(false); // Close Edit modal if open
    setExpenditureToEdit(null); // Clear edit selection
    fetchExpenditures();    // Refresh the expenditures list for this project
    if (onExpenditureUpdate) {
         onExpenditureUpdate(); // Call the callback passed from ProjectsTable to refresh project list
    }
  };

  // --- Delete Handler ---
  const handleDeleteExpenditure = async (expenditureId) => {
      if (!window.confirm("Are you sure you want to delete this expenditure?")) return;
      // Optional: Set a specific deleting state for the row/button
      setError(null); // Clear previous errors
      try {
          // Use the non-nested route for delete (assuming shallow or separate resource route)
          // Example: DELETE /api/expenditures/{expenditureId}
          const response = await fetch(`${API_BASE_URL}/expenditures/${expenditureId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          });
          if (!response.ok && response.status !== 204) { // Allow 204 No Content
              let msg = `HTTP error ${response.status}`;
              try { const err = await response.json(); msg = err.message || msg; } catch(e) {}
              throw new Error(msg);
          }
          fetchExpenditures(); // Refresh list
          if (onExpenditureUpdate) {
              onExpenditureUpdate(); // Refresh project list
          }
      } catch (e) {
          console.error("Delete expenditure error:", e);
          // Display error specific to this table/action
          setError(`Failed to delete expenditure: ${e.message}`);
      } finally {
          // Optional: Unset deleting state
      }
  }
  // --- End Delete ---


  // --- Render Logic ---
  if (loading) return <div className="text-center text-light"><Spinner animation="border" size="sm" /> Loading Expenditures...</div>;
  // Display error specific to this table
  if (error) return <Alert variant="warning" className="bg-dark text-warning border-warning">{error}</Alert>;

  return (
    <>
      <div className="d-flex justify-content-end mb-3">
        <Button variant="primary" onClick={handleShowAddModal}>
          <i className="bi bi-plus-lg me-1"></i> Add Expenditure
        </Button>
      </div>

      {expenditures.length === 0 && !loading && <Alert variant="secondary" className="bg-dark text-secondary border-secondary">No expenditures recorded for this project yet.</Alert>}

      {expenditures.length > 0 && (
        <Table variant="dark" striped hover responsive="sm" size="sm">
          <thead>
            <tr>
              <th>Description</th>
              <th className="text-end">Amount</th>
              <th>Date</th>
              <th>Recorded By</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenditures.map(exp => (
              <tr key={exp.id}>
                <td>{exp.description}</td>
                {/* Use appropriate currency - assumes API provides project.currency or a default */}
                <td className="text-end">{formatCurrency(exp.amount, exp.project?.currency || 'USD')}</td>
                <td>{formatDate(exp.expense_date)}</td>
                <td>{exp.recorder?.name || 'N/A'}</td>
                <td className="text-center">
                   {/* --- UPDATED Edit Button --- */}
                   <Button
                       variant="outline-light"
                       size="sm" // Changed from xs to sm
                       className="me-2" // Added margin-end for spacing
                       onClick={() => handleShowEditModal(exp)} // Call edit handler
                       title="Edit Expenditure"
                   >
                       <i className="bi bi-pencil-fill me-1"></i> Edit {/* Added Text & icon margin */}
                   </Button>
                   {/* --- END Edit Button --- */}

                   {/* --- UPDATED Delete Button --- */}
                   <Button
                       variant="outline-danger"
                       size="sm" // Changed from xs to sm
                       onClick={() => handleDeleteExpenditure(exp.id)} // Call delete handler
                       title="Delete Expenditure"
                    >
                       <i className="bi bi-trash-fill me-1"></i> Delete {/* Added Text & icon margin */}
                   </Button>
                   {/* --- END Delete Button --- */}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Render the Expenditure Form Modal for ADDING */}
      <ExpenditureForm
         show={showAddModal}
         handleClose={handleCloseAddModal}
         projectId={projectId} // Pass the current project ID for adding
         onSaveSuccess={handleSaveSuccess} // Pass the success callback
         // expenditureToEdit is null here, form identifies as 'create' mode
      />

      {/* Render the Expenditure Form Modal for EDITING */}
      {expenditureToEdit && ( // Only render if an expenditure is selected for editing
          <ExpenditureForm
             show={showEditModal} // Controlled by separate state
             handleClose={handleCloseEditModal} // Use edit modal closer
             // projectId might not be needed by form if PUT is /expenditures/{id}
             expenditureToEdit={expenditureToEdit} // Pass the data to edit
             onSaveSuccess={handleSaveSuccess} // Re-use same success callback
          />
      )}
    </>
  );
}

export default ExpendituresTable;