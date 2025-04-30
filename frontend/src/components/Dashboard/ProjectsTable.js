import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../App';
import { Modal, Button, Form, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
// Assuming formatCurrency is correctly imported
import { formatCurrency } from '../../utils/formatting'; // Adjust path if needed
import { Row, Col } from 'react-bootstrap';

// Helper function for status colors
const getStatusColor = (status) => {
  switch (status) {
    case 'Not Started': return 'secondary';
    case 'In Progress': return 'primary';
    case 'On Hold': return 'warning';
    case 'Completed': return 'success';
    default: return 'light';
  }
};


function ProjectsTable() {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalError, setModalError] = useState(null);

  // State for modal, editing, form data, submitting
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', start_date: '', end_date: '', status: 'Not Started', budget: '', currency: 'PHP',
  });

  const projectStatuses = ['Not Started', 'In Progress', 'On Hold', 'Completed'];
  const currencies = ['USD', 'EUR', 'PHP', 'JPY', 'CAD'];

  // Fetching logic (Backend now sends total_task_cost and updated remaining_budget)
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      const data = await response.json();
      setProjects(data.data ? data.data : (Array.isArray(data) ? data : [])); // Handle pagination or direct array
    } catch (e) {
      console.error("Fetch projects error:", e);
      setError('Failed to load projects. Please check the network connection or try again later.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);


  // Modal/Delete Handlers (No changes needed in this logic)
  const handleShowCreateModal = () => {
        setIsEditing(false);
        setCurrentProject(null);
        setModalError(null);
        setIsSubmitting(false);
        setFormData({
            name: '', description: '', start_date: '', end_date: '',
            status: 'Not Started', budget: '', currency: 'USD',
        });
        setShowModal(true);
  };
  const handleShowEditModal = (project) => {
        setIsEditing(true);
        setCurrentProject(project);
        setModalError(null);
        setIsSubmitting(false);
        setFormData({
            name: project.name,
            description: project.description || '',
            start_date: project.start_date ? project.start_date.split('T')[0] : '',
            end_date: project.end_date ? project.end_date.split('T')[0] : '',
            status: project.status || 'Not Started',
            budget: project.budget !== null && project.budget !== undefined ? String(project.budget) : '',
            currency: project.currency || 'USD',
        });
        setShowModal(true);
  };
  const handleCloseModal = () => {
      if (isSubmitting) return;
        setShowModal(false);
        setCurrentProject(null);
        setModalError(null);
  };
  const handleInputChange = (e) => {
      const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleSubmit = async (e) => {
      e.preventDefault();
        setModalError(null);

        // Frontend Validation
        if (!formData.name.trim()) { setModalError('Project name cannot be empty.'); return; }
        if (formData.end_date && formData.start_date && new Date(formData.end_date) < new Date(formData.start_date)) {
            setModalError('End date cannot be before start date.'); return;
        }
        const budgetValue = formData.budget !== '' ? parseFloat(formData.budget) : null;
        if (formData.budget !== '' && (isNaN(budgetValue) || budgetValue < 0)) {
            setModalError('Budget must be empty or a non-negative number.'); return;
        }

        setIsSubmitting(true);

        const url = isEditing ? `${API_BASE_URL}/projects/${currentProject.id}` : `${API_BASE_URL}/projects`;
        const method = isEditing ? 'PUT' : 'POST';
        const payload = { ...formData, budget: budgetValue, start_date: formData.start_date || null, end_date: formData.end_date || null, };
        if (payload.budget === null) { delete payload.currency; }

        try {
            const response = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json', }, body: JSON.stringify(payload), });
            if (!response.ok) {
                 let message = `HTTP error: ${response.status}`;
                 try { const errData = await response.json(); message = errData.errors ? Object.values(errData.errors).flat().join(' ') : (errData.message || message); }
                 catch (jsonError) { console.error("Failed to parse error response as JSON:", jsonError); }
                 throw new Error(message);
            }
            fetchProjects();
            handleCloseModal();
        } catch (e) {
            console.error("Save project error:", e);
            setModalError(`Failed to save project: ${e.message}`);
        } finally {
            setIsSubmitting(false);
        }
  };
  const handleDelete = async (id) => {
      if (!window.confirm(`Are you sure you want to permanently delete project ID ${id}? This will also delete associated tasks and expenditures.`)) return;
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/projects/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, });
            if (!response.ok && response.status !== 204) {
                let message = `HTTP error: ${response.status}`;
                try { const errData = await response.json(); message = errData.message || message; }
                catch(jsonError) { /* Use default message */ }
                throw new Error(message);
            }
            fetchProjects();
        } catch (e) {
            console.error("Delete project error:", e);
            setError(`Failed to delete project: ${e.message}`);
        }
  };

  // --- Render Logic ---
  if (loading) return ( <div className="d-flex justify-content-center align-items-center text-light vh-100"><Spinner animation="border" className="me-2"/> Loading Projects...</div> );
  if (error && !showModal) return ( <Alert variant="danger" className="bg-dark text-light border-danger">{error}</Alert> );


  return (
    <>
      {/* Header and Create Button */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
        <h2 className="text-light mb-2 mb-md-0">Projects</h2>
        <Button variant="primary" onClick={handleShowCreateModal}>
          <i className="bi bi-plus-lg me-1"></i> Create New Project
        </Button>
      </div>

      {/* Display Errors/Info Messages */}
      {error && !showModal && <Alert variant="danger" className="bg-dark text-light border-danger">{error}</Alert>}
      {projects.length === 0 && !loading && <Alert variant="info" className="bg-dark text-info border-info">No projects found. Click 'Create New Project' to get started!</Alert>}

      {/* --- Projects Table - UPDATED --- */}
      {projects.length > 0 && (
        <div className="table-responsive">
          <Table variant="dark" striped hover responsive="sm" className="align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th className="text-end">Budget</th>
                {/* UPDATED Header */}
                <th className="text-end">Total Task Costs</th>
                <th className="text-end">Remaining Budget</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(proj => (
                <tr key={proj.id}>
                  {/* Name */}
                  <td>
                    <Link to={`/dashboard/projects/${proj.id}`} className="text-decoration-none text-info hover-underline fw-bold">{proj.name}</Link>
                     {proj.description && <div className="small text-muted">{proj.description.substring(0, 50)}{proj.description.length > 50 ? '...' : ''}</div>}
                  </td>
                  {/* Status */}
                  <td><Badge bg={getStatusColor(proj.status)} className="text-capitalize p-2">{proj.status || 'N/A'}</Badge></td>
                  {/* Budget */}
                  <td className="text-end">{proj.budget !== null ? formatCurrency(proj.budget, proj.currency) : <span className="text-secondary">N/A</span>}</td>
                  {/* Total Task Costs */}
                  <td className="text-end">
                      {/* UPDATED to use total_task_cost from backend */}
                      {proj.budget !== null ? formatCurrency(proj.total_task_cost ?? 0, proj.currency) : <span className="text-secondary">-</span>}
                  </td>
                   {/* Remaining Budget */}
                   <td className={`text-end fw-bold ${proj.budget !== null && (proj.remaining_budget ?? proj.budget) < 0 ? 'text-danger' : ''}`}>
                      {/* Uses remaining_budget from backend (logic already updated) */}
                      {proj.budget !== null ? formatCurrency(proj.remaining_budget ?? proj.budget, proj.currency) : <span className="text-secondary">-</span>}
                  </td>
                  {/* Actions */}
                  <td className="text-center">
                    <Button variant="outline-light" size="sm" onClick={() => handleShowEditModal(proj)} className="me-2 py-1 px-2" title="Edit Project Details">
                      <i className="bi bi-pencil-fill me-1"></i> Edit
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(proj.id)} title="Delete Project" className="py-1 px-2">
                      <i className="bi bi-trash-fill me-1"></i> Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* --- Project Modal (No changes needed in modal content for this update) --- */}
      <Modal show={showModal} onHide={handleCloseModal} backdrop="static" keyboard={false} centered>
        <Modal.Header closeButton={!isSubmitting} closeVariant="white" className="bg-dark border-secondary">
          <Modal.Title className="text-light"> {isEditing ? 'Edit Project' : 'Create New Project'} </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="bg-dark text-light">
             {modalError && <Alert variant="danger" className="bg-dark text-light border-danger" onClose={() => setModalError(null)} dismissible>{modalError}</Alert>}
             {/* Project Form Fields */}
             <Form.Group className="mb-3" controlId="projectName">
                <Form.Label>Project Name <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" name="name" value={formData.name} onChange={handleInputChange} required className="bg-secondary text-white border-secondary focus-ring focus-ring-primary" placeholder="Enter project name" disabled={isSubmitting} />
             </Form.Group>
             <Form.Group className="mb-3" controlId="projectDescription">
                 <Form.Label>Description</Form.Label>
                 <Form.Control as="textarea" name="description" rows={3} value={formData.description} onChange={handleInputChange} className="bg-secondary text-white border-secondary" placeholder="Enter project description (optional)" disabled={isSubmitting}/>
             </Form.Group>
             <Row className="mb-3">
                 <Col md={7}><Form.Group controlId="projectBudget"><Form.Label>Budget</Form.Label><Form.Control type="number" name="budget" value={formData.budget} onChange={handleInputChange} min="0" step="any" placeholder="e.g., 5000.00 (optional)" className="bg-secondary text-white border-secondary" disabled={isSubmitting}/></Form.Group></Col>
                 <Col md={5}><Form.Group controlId="projectCurrency"><Form.Label>Currency</Form.Label><Form.Select name="currency" value={formData.currency} onChange={handleInputChange} className="bg-secondary text-white border-secondary" disabled={isSubmitting || formData.budget === ''}>{currencies.map(curr => (<option key={curr} value={curr}>{curr}</option>))}</Form.Select></Form.Group></Col>
             </Row>
             <Row className="mb-3">
                 <Col md={6}><Form.Group controlId="projectStatus"><Form.Label>Status</Form.Label><Form.Select name="status" value={formData.status} onChange={handleInputChange} className="bg-secondary text-white border-secondary" disabled={isSubmitting}>{projectStatuses.map(status => (<option key={status} value={status}>{status}</option>))}</Form.Select></Form.Group></Col>
             </Row>
             <Row>
                 <Col md={6}><Form.Group className="mb-3" controlId="projectStartDate"><Form.Label>Start Date</Form.Label><Form.Control type="date" name="start_date" value={formData.start_date} onChange={handleInputChange} className="bg-secondary text-white border-secondary" disabled={isSubmitting} /></Form.Group></Col>
                 <Col md={6}><Form.Group className="mb-3" controlId="projectEndDate"><Form.Label>End Date</Form.Label><Form.Control type="date" name="end_date" value={formData.end_date} onChange={handleInputChange} min={formData.start_date || undefined} className="bg-secondary text-white border-secondary" disabled={isSubmitting} /></Form.Group></Col>
             </Row>
          </Modal.Body>
          <Modal.Footer className="bg-dark border-secondary">
            <Button variant="secondary" onClick={handleCloseModal} disabled={isSubmitting}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}> {isSubmitting ? (<><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/> Saving...</>) : (isEditing ? 'Save Changes' : 'Create Project')} </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}

export default ProjectsTable;