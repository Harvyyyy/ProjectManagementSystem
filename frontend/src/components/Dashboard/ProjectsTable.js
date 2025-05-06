import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../App';
// Ensure all needed components are imported
import { Modal, Button, Form, Table, Badge, Spinner, Alert, ProgressBar, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatting'; // Adjust path if needed
import ExpendituresTable from './ExpendituresTable'; // Import ExpendituresTable
import ProjectGanttChart from './ProjectGanttChart'; // <-- IMPORT Gantt component - VERIFY PATH

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
  const [error, setError] = useState(null); // For fetch/delete errors
  const [modalError, setModalError] = useState(null); // For modal validation/save errors

  // State for Project Edit/Create Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Controls modal mode and conditional fields
  const [currentProject, setCurrentProject] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state for modal submit
  const [formData, setFormData] = useState({
    name: '', description: '', start_date: '', end_date: '', status: 'Not Started', budget: '', currency: 'PHP',
  });

  // State for Details Section
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedProjectName, setSelectedProjectName] = useState('');

  // Arrays used for dropdowns in the Modal
  const projectStatuses = ['Not Started', 'In Progress', 'On Hold', 'Completed'];
  const currencies = ['PHP','USD', 'EUR', 'GBP', 'JPY', 'CAD']; // Example currencies

  // Fetching logic (Ensure backend sends total_expenditure, remaining_budget, progress_percentage)
  const fetchProjects = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      const data = await response.json();
      const projectsArray = data.data ? data.data : (Array.isArray(data) ? data : []);
      console.log("DEBUG ProjectsTable: First Project Received:", projectsArray[0]); // Check for progress_percentage, total_expenditure etc.
      setProjects(projectsArray);
      setError(null); // Clear error on success
    } catch (e) {
      console.error("Fetch projects error:", e);
      setError('Failed to load projects. Please check the network connection or try again later.');
      setProjects([]); // Clear projects on error
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // Callback for refreshing project list after expenditure update
  const handleExpenditureUpdate = () => { fetchProjects(); };

  // --- Modal/Delete Handlers ---
  const handleShowCreateModal = () => {
        setIsEditing(false); // Set mode to Create
        setCurrentProject(null); setModalError(null); setIsSubmitting(false);
        setFormData({ // Reset form
            name: '', description: '', start_date: '', end_date: '',
            status: 'Not Started', // Internal default, field is hidden
            budget: '', currency: 'USD',
        });
        setShowModal(true);
  };
  const handleShowEditModal = (project) => {
        setIsEditing(true); // Set mode to Edit
        setCurrentProject(project); setModalError(null); setIsSubmitting(false);
        setFormData({ // Populate form for editing
            name: project.name,
            description: project.description || '',
            start_date: project.start_date ? project.start_date.split('T')[0] : '',
            end_date: project.end_date ? project.end_date.split('T')[0] : '',
            status: project.status || 'Not Started', // Populate status
            budget: project.budget !== null && project.budget !== undefined ? String(project.budget) : '',
            currency: project.currency || 'USD',
        });
        setShowModal(true);
  };
  const handleCloseModal = () => {
      if (isSubmitting) return;
        setShowModal(false); setCurrentProject(null); setModalError(null); setIsEditing(false); // Reset mode
  };
  // Handler for modal form inputs - NOW USED
  const handleInputChange = (e) => {
      const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
  };
  // Handler for modal form submission - NOW USES e.message correctly
  const handleSubmit = async (e) => {
      e.preventDefault(); setModalError(null);
      // Validation
      if (!formData.name.trim()) { setModalError('Project name cannot be empty.'); return; }
      if (formData.end_date && formData.start_date && new Date(formData.end_date) < new Date(formData.start_date)) { setModalError('End date cannot be before start date.'); return; }
      const budgetValue = formData.budget !== '' ? parseFloat(formData.budget) : null;
      if (formData.budget !== '' && (isNaN(budgetValue) || budgetValue < 0)) { setModalError('Budget must be empty or a non-negative number.'); return; }

      setIsSubmitting(true);
      const url = isEditing ? `${API_BASE_URL}/projects/${currentProject.id}` : `${API_BASE_URL}/projects`;
      const method = isEditing ? 'PUT' : 'POST';
      // Prepare payload
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
          fetchProjects(); handleCloseModal();
      } catch (e) {
          console.error("Save project error:", e);
          setModalError(`Failed to save project: ${e.message}`); // Use e.message
      } finally {
          setIsSubmitting(false);
      }
  };
  // Handler for deleting a project - NOW USES e.message correctly
  const handleDelete = async (id) => {
      if (!window.confirm(`Are you sure you want to permanently delete project ID ${id}? ...`)) return;
      setError(null);
      try {
          const response = await fetch(`${API_BASE_URL}/projects/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, });
          if (!response.ok && response.status !== 204) {
              let message = `HTTP error: ${response.status}`;
              try { const errData = await response.json(); message = errData.message || message; }
              catch(jsonError) { /* Use default message */ }
              throw new Error(message);
          }
          if (selectedProjectId === id) { setSelectedProjectId(null); setSelectedProjectName(''); }
          fetchProjects();
      } catch (e) {
          console.error("Delete project error:", e);
          setError(`Failed to delete project: ${e.message}`); // Use e.message
      }
  };

  // Handler to select project for viewing details (Expenditures & Gantt)
  const handleSelectProject = (projectId, projectName) => {
      if (selectedProjectId === projectId) {
          setSelectedProjectId(null); setSelectedProjectName('');
      } else {
          setSelectedProjectId(projectId); setSelectedProjectName(projectName);
      }
  };

  // --- Render Logic ---
  if (loading && !projects.length) return ( <div className="d-flex justify-content-center align-items-center text-light vh-100"><Spinner animation="border" className="me-2"/> Loading Projects...</div> );
  if (error && !showModal) return ( <Alert variant="danger" className="bg-dark text-light border-danger">{error}</Alert> );


  return (
    <>
      {/* Header and Create Button */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
        <h2 className="text-light mb-2 mb-md-0">Projects</h2>
        <Button variant="primary" onClick={handleShowCreateModal}><i className="bi bi-plus-lg me-1"></i> Create New Project</Button>
      </div>

      {/* Display Errors/Info Messages */}
      {error && !showModal && <Alert variant="danger" className="bg-dark text-light border-danger">{error}</Alert>}
      {!loading && projects.length === 0 && <Alert variant="info" className="bg-dark text-info border-info">No projects found. Click 'Create New Project' to get started!</Alert>}

      {/* --- Projects Table --- */}
      {projects.length > 0 && (
        <div className="table-responsive mb-5">
          <Table variant="dark" striped hover responsive="sm" className="align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th className="text-center" style={{minWidth: '150px'}}>Progress</th>
                <th className="text-end">Budget</th>
                <th className="text-end">Spent</th>
                <th className="text-end">Remaining Budget</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(proj => (
                <tr key={proj.id}>
                  {/* Name */}
                  <td><Link to={`/dashboard/projects/${proj.id}`} className="text-decoration-none text-info hover-underline fw-bold">{proj.name}</Link>{proj.description && <div className="small text-muted">{proj.description.substring(0, 50)}{proj.description.length > 50 ? '...' : ''}</div>}</td>
                  {/* Status */}
                  <td><Badge bg={getStatusColor(proj.status)} className="text-capitalize p-2">{proj.status || 'N/A'}</Badge></td>
                  {/* Progress Cell */}
                  <td>
                    <ProgressBar
                        now={proj.progress_percentage ?? 0} label={`${proj.progress_percentage ?? 0}%`}
                        variant={getStatusColor(proj.status)} striped={proj.status === 'In Progress'} animated={proj.status === 'In Progress'}
                        style={{height: '20px', fontSize: '0.75rem', backgroundColor: '#444'}}/>
                  </td>
                  {/* Budget */}
                  <td className="text-end">{proj.budget !== null ? formatCurrency(proj.budget, proj.currency) : <span className="text-secondary">N/A</span>}</td>
                  {/* Spent (Uses total_expenditure from backend) */}
                  <td className="text-end">{proj.budget !== null ? formatCurrency(proj.total_expenditure ?? 0, proj.currency) : <span className="text-secondary">-</span>}</td>
                   {/* Remaining Budget */}
                   <td className={`text-end fw-bold ${proj.budget !== null && (proj.remaining_budget ?? proj.budget) < 0 ? 'text-danger' : ''}`}>{proj.budget !== null ? formatCurrency(proj.remaining_budget ?? proj.budget, proj.currency) : <span className="text-secondary">N/A</span>}</td>
                  {/* Actions */}
                  <td className="text-center">
                     <Button variant={selectedProjectId === proj.id ? "info" : "outline-secondary"} size="sm" onClick={() => handleSelectProject(proj.id, proj.name)} className="me-2 py-1 px-2" title={selectedProjectId === proj.id ? "Hide Details" : "View Details"}> <i className={`bi ${selectedProjectId === proj.id ? 'bi-chevron-up' : 'bi-chevron-down'} me-1`}></i> Details </Button>
                     <Button variant="outline-light" size="sm" onClick={() => handleShowEditModal(proj)} className="me-2 py-1 px-2" title="Edit Project"><i className="bi bi-pencil-fill me-1"></i> Edit</Button>
                     <Button variant="outline-danger" size="sm" onClick={() => handleDelete(proj.id)} title="Delete Project" className="py-1 px-2"><i className="bi bi-trash-fill me-1"></i> Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
      {/* --- End Projects Table --- */}


      {/* --- Conditionally Render Details Section --- */}
      {selectedProjectId && (
          <div className="project-details-section mt-5">
              <h3 className="text-light mb-4 border-bottom pb-2">Details for: <span className="text-info">{selectedProjectName}</span></h3>
              {/* Expenditures Table */}
              <div className="mb-5 bg-dark p-4 rounded shadow">
                  <h4 className="text-light mb-3">Expenditures</h4>
                  <ExpendituresTable projectId={selectedProjectId} onExpenditureUpdate={handleExpenditureUpdate}/>
              </div>
              {/* Gantt Chart */}
               <div className="bg-dark p-4 rounded shadow">
                   <h4 className="text-light mb-3">Gantt Chart</h4>
                   <ProjectGanttChart projectId={selectedProjectId} />
               </div>
          </div>
      )}
      {/* --- End Details Section --- */}


      {/* --- Project Modal (Now includes full form content) --- */}
      <Modal show={showModal} onHide={handleCloseModal} backdrop="static" keyboard={false} centered>
        <Modal.Header closeButton={!isSubmitting} closeVariant="white" className="bg-dark border-secondary">
            <Modal.Title className="text-light"> {isEditing ? 'Edit Project' : 'Create New Project'} </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
            <Modal.Body className="bg-dark text-light">
                {modalError && <Alert variant="danger" className="bg-dark text-light border-danger" onClose={() => setModalError(null)} dismissible>{modalError}</Alert>}
                {/* Project Name */}
                <Form.Group className="mb-3" controlId="projectName">
                    <Form.Label>Project Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control type="text" name="name" value={formData.name} onChange={handleInputChange} required className="bg-secondary text-white border-secondary focus-ring focus-ring-primary" placeholder="Enter project name" disabled={isSubmitting} />
                </Form.Group>
                {/* Description */}
                <Form.Group className="mb-3" controlId="projectDescription">
                    <Form.Label>Description</Form.Label>
                    <Form.Control as="textarea" name="description" rows={3} value={formData.description} onChange={handleInputChange} className="bg-secondary text-white border-secondary" placeholder="Enter project description (optional)" disabled={isSubmitting}/>
                </Form.Group>
                {/* Budget & Currency */}
                <Row className="mb-3">
                    <Col md={7}><Form.Group controlId="projectBudget"><Form.Label>Budget</Form.Label><Form.Control type="number" name="budget" value={formData.budget} onChange={handleInputChange} min="0" step="any" placeholder="e.g., 5000.00 (optional)" className="bg-secondary text-white border-secondary" disabled={isSubmitting}/></Form.Group></Col>
                    <Col md={5}><Form.Group controlId="projectCurrency"><Form.Label>Currency</Form.Label><Form.Select name="currency" value={formData.currency} onChange={handleInputChange} className="bg-secondary text-white border-secondary" disabled={isSubmitting || formData.budget === ''}>{currencies.map(curr => (<option key={curr} value={curr}>{curr}</option>))}</Form.Select></Form.Group></Col>
                </Row>
                {/* Conditional Status */}
                {isEditing && (
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group controlId="projectStatus">
                                <Form.Label>Status</Form.Label>
                                <Form.Select name="status" value={formData.status} onChange={handleInputChange} className="bg-secondary text-white border-secondary" disabled={isSubmitting}>
                                    {projectStatuses.map(status => (<option key={status} value={status}>{status}</option>))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                )}
                {/* Dates */}
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
      {/* --- End Project Modal --- */}
    </>
  );
}

export default ProjectsTable;