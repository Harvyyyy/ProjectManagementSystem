import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../App';
import { Table, Button, Spinner, Alert, Card } from 'react-bootstrap';
import { formatCurrency, formatDate } from '../../utils/formatting';
import ExpenditureForm from './ExpenditureForm'; // Import the form modal

function ExpenditureList({ projectId, projectCurrency }) {
  const { token } = useAuth();
  const [expenditures, setExpenditures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for the modal form
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentExpenditure, setCurrentExpenditure] = useState(null);

  const fetchExpenditures = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the nested route: GET /api/projects/{projectId}/expenditures
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/expenditures`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      if (!response.ok) {
         throw new Error(`HTTP error: ${response.status}`);
      }
      const data = await response.json();
      // Adjust if backend sends paginated data
       setExpenditures(data.data ? data.data : data); // Handle both paginated and non-paginated
    } catch (e) {
      console.error(e);
      setError('Failed to load expenditures.');
    } finally {
      setLoading(false);
    }
  }, [projectId, token]);

  useEffect(() => {
    fetchExpenditures();
  }, [fetchExpenditures]);

  // Modal handlers
  const handleShowCreateModal = () => {
    setIsEditing(false);
    setCurrentExpenditure(null);
    setShowModal(true);
  };

  const handleShowEditModal = (expenditure) => {
    setIsEditing(true);
    setCurrentExpenditure(expenditure);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentExpenditure(null);
    // Optionally clear errors related to the modal form here if needed
  };

  const handleSaveSuccess = () => {
      fetchExpenditures(); // Refresh list on successful save/update
      handleCloseModal();
  };

   const handleDelete = async (expenditureId) => {
    if (!window.confirm('Are you sure you want to delete this expenditure?')) return;
    setError(null);
    try {
        // Using shallow route: DELETE /api/expenditures/{expenditureId}
        // If you didn't use .shallow() in Laravel routes, use:
        // `${API_BASE_URL}/projects/${projectId}/expenditures/${expenditureId}`
        const response = await fetch(`${API_BASE_URL}/expenditures/${expenditureId}`, {
             method: 'DELETE',
             headers: {
                 Authorization: `Bearer ${token}`,
                 Accept: 'application/json',
             },
        });
         if (!response.ok && response.status !== 204) {
             throw new Error(`HTTP error: ${response.status}`);
         }
         fetchExpenditures(); // Refresh list
     } catch (e) {
         console.error('Failed to delete expenditure:', e);
         setError('Failed to delete expenditure. Please try again.');
     }
 };


  return (
    <Card className="bg-dark text-white border-secondary shadow-sm mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center border-secondary">
        <h4 className="mb-0">Expenditures</h4>
        <Button variant="primary" size="sm" onClick={handleShowCreateModal}>
          <i className="bi bi-plus-lg me-1"></i> Add Expenditure
        </Button>
      </Card.Header>
      <Card.Body>
        {loading && <div className="text-center"><Spinner animation="border" size="sm" /> Loading...</div>}
        {error && <Alert variant="danger" className="bg-dark text-light border-danger">{error}</Alert>}

        {!loading && !error && expenditures.length === 0 && (
          <p className="text-secondary text-center">No expenditures recorded yet.</p>
        )}

        {!loading && !error && expenditures.length > 0 && (
          <div className="table-responsive">
            <Table variant="dark" striped hover responsive="sm">
              <thead>
                <tr>
                  <th>Description</th>
                  <th className="text-end">Amount</th>
                  <th>Date</th>
                  <th>Recorded By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenditures.map(exp => (
                  <tr key={exp.id}>
                    <td>{exp.description}</td>
                    <td className="text-end">{formatCurrency(exp.amount, projectCurrency)}</td>
                    <td>{formatDate(exp.expense_date)}</td>
                    <td>{exp.recorder?.name || 'N/A'}</td>
                    <td>
                       <Button
                            variant="outline-light"
                            size="sm"
                            onClick={() => handleShowEditModal(exp)}
                            className="me-2"
                            title="Edit Expenditure"
                       >
                            <i className="bi bi-pencil-fill"></i>
                       </Button>
                       <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(exp.id)}
                            title="Delete Expenditure"
                       >
                            <i className="bi bi-trash-fill"></i>
                       </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>

      {/* Expenditure Form Modal */}
      <ExpenditureForm
        show={showModal}
        handleClose={handleCloseModal}
        projectId={projectId}
        expenditureToEdit={currentExpenditure}
        onSaveSuccess={handleSaveSuccess} // Pass callback to refresh list
      />
    </Card>
  );
}

export default ExpenditureList;