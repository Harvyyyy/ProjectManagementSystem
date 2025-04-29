import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../App';
// Ensure Row and Col are imported
import { Modal, Button, Form, Badge, Table, Spinner, Alert, Row, Col } from 'react-bootstrap';
// Assuming formatCurrency is correctly imported
import { formatCurrency } from '../../utils/formatting'; // Adjust path if needed

// Helper functions (define outside or import)
const getTaskStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending': return 'secondary';
    case 'in progress': return 'info';
    case 'completed': return 'success';
    default: return 'light';
  }
};

const getTaskPriorityColor = (priority) => {
  switch (priority) {
    case 'low': return 'success';
    case 'medium': return 'warning';
    case 'high': return 'danger';
    default: return 'light';
  }
};


function TaskTable() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // For general fetch/delete errors
  const [modalError, setModalError] = useState(null); // Separate state for modal errors


  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    assigned_user_id: '', // Use empty string for select default
    due_date: '',
    actual_cost: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Arrays are now USED below ---
  const taskStatuses = ['pending', 'in progress', 'completed'];
  const taskPriorities = ['low', 'medium', 'high'];
  // ---

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksResponse, projectsResponse, usersResponse] = await Promise.all([
        // IMPORTANT: Ensure your API loads project with currency for task list display
        // e.g., in Laravel: Task::with('project:id,name,currency', ...)->get();
        fetch(`${API_BASE_URL}/tasks`, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } }),
        fetch(`${API_BASE_URL}/projects`, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } }),
        fetch(`${API_BASE_URL}/users`, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } }),
      ]);

      if (!tasksResponse.ok) throw new Error(`Task fetch failed: ${tasksResponse.status} ${tasksResponse.statusText}`);
      if (!projectsResponse.ok) throw new Error(`Project fetch failed: ${projectsResponse.status} ${projectsResponse.statusText}`);
      if (!usersResponse.ok) throw new Error(`User fetch failed: ${usersResponse.status} ${usersResponse.statusText}`);

      const tasksData = await tasksResponse.json();
      const projectsData = await projectsResponse.json();
      const usersData = await usersResponse.json();

      // Ensure tasksData received has the project relation loaded, including currency
      setTasks(Array.isArray(tasksData) ? tasksData : (tasksData?.data && Array.isArray(tasksData.data) ? tasksData.data : []));

      if (projectsData && Array.isArray(projectsData.data)) { setProjects(projectsData.data); }
      else if (Array.isArray(projectsData)) { setProjects(projectsData); }
      else { console.error("API did not return expected projects structure:", projectsData); setProjects([]); setError(prev => prev ? `${prev}\nCould not load projects.` : 'Could not load projects.'); }

      setUsers(Array.isArray(usersData) ? usersData : (usersData?.data && Array.isArray(usersData.data) ? usersData.data : []));

    } catch (e) {
      console.error('Failed to fetch data:', e);
      setError(`Failed to load data: ${e.message}.`);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Modal Handlers ---
  const handleShowCreateModal = () => {
    if (projects.length === 0 && !loading) {
        setError('Cannot add tasks: No projects available. Please create a project first.');
        return;
    }
    if (projects.length > 0) {
        setIsEditing(false);
        setCurrentTask(null);
        setModalError(null);
        setIsSubmitting(false);
        setFormData({ // Reset form data
            project_id: projects[0]?.id || '',
            title: '',
            description: '',
            status: 'pending',
            priority: 'medium',
            assigned_user_id: '',
            due_date: '',
            actual_cost: '',
        });
        setShowModal(true);
    } else if (!loading) {
         setError('No projects found to assign tasks to.');
    }
  };

  const handleShowEditModal = (task) => {
    setIsEditing(true);
    setCurrentTask(task);
    setModalError(null);
    setIsSubmitting(false);
    setFormData({ // Populate form data
      project_id: task.project_id,
      title: task.title,
      description: task.description || '',
      status: task.status || 'pending',
      priority: task.priority || 'medium',
      assigned_user_id: task.assigned_user_id || '',
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      actual_cost: task.actual_cost !== null && task.actual_cost !== undefined ? String(task.actual_cost) : '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setShowModal(false);
    setCurrentTask(null);
    setModalError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);

    // Frontend Validation
    if (!formData.title.trim()) { setModalError('Task title cannot be empty.'); return; }
    if (!formData.project_id) { setModalError('Please select a project.'); return; }
    if (formData.due_date && isNaN(Date.parse(formData.due_date))) { setModalError('Invalid Due Date format.'); return; }
    const costValue = formData.actual_cost !== '' ? parseFloat(formData.actual_cost) : null;
    if (formData.actual_cost !== '' && (isNaN(costValue) || costValue < 0)) {
        setModalError('Actual Cost must be empty or a non-negative number.');
        return;
    }

    setIsSubmitting(true);

    const url = isEditing ? `${API_BASE_URL}/tasks/${currentTask.id}` : `${API_BASE_URL}/tasks`;
    const method = isEditing ? 'PUT' : 'POST';

    // Prepare Payload
    const payload = { ...formData };
    payload.assigned_user_id = formData.assigned_user_id === '' || formData.assigned_user_id === null ? null : parseInt(formData.assigned_user_id, 10);
    payload.project_id = parseInt(formData.project_id, 10);
    if (!formData.due_date) { delete payload.due_date; }
    payload.description = formData.description || '';
    payload.actual_cost = costValue;

    console.log('Payload sending:', JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = `HTTP error: ${response.status}`;
         try {
             const errorData = await response.json();
             message = errorData.errors ? Object.values(errorData.errors).flat().join(' ') : (errorData.message || message);
         } catch(jsonError) { console.error("Non-JSON error response: ", await response.text()); }
        throw new Error(message);
      }
      fetchData(); // Refresh data on success
      handleCloseModal(); // Close modal on success
    } catch (e) {
      console.error('Failed to save task:', e);
      setModalError(`Failed to save task: ${e.message}`);
    } finally {
       setIsSubmitting(false);
    }
  };

  // --- Deletion Handler ---
  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to permanently delete this task?')) {
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        });

        if (!response.ok && response.status !== 204) {
           let message = `HTTP error: ${response.status}`;
            try { const errorData = await response.json(); message = errorData.message || message; }
            catch(jsonError) { /* Use default message */ }
            throw new Error(message);
        }
        fetchData(); // Refresh data on success
      } catch (e) {
        console.error('Failed to delete task:', e);
        setError(`Failed to delete task: ${e.message}`);
      }
    }
  };

  // --- Render Logic ---
  if (loading) return ( <div className="d-flex justify-content-center align-items-center text-light vh-100"><Spinner animation="border" className="me-2"/> Loading...</div> );
  if (error && !showModal) return ( <Alert variant="danger" className="bg-dark text-light border-danger">{error}</Alert> );

  return (
    <div className="p-md-4" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #232323, #1a1a1a)' }}>
      <div className="bg-dark p-4 rounded shadow mb-4">
        {/* Header and Create Button */}
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
          <h2 className="text-light mb-2 mb-md-0">Tasks</h2>
          <Button variant="primary" onClick={handleShowCreateModal} disabled={projects.length === 0 && !loading}>
            <i className="bi bi-plus-lg me-1"></i> Create New Task
          </Button>
        </div>

         {/* Display Errors/Info Messages */}
         {error && !showModal && <Alert variant="danger" className="bg-dark text-light border-danger">{error}</Alert>}
         {projects.length === 0 && !loading && <Alert variant="warning" className="bg-dark text-warning border-warning">Create a project before adding tasks.</Alert>}
         {tasks.length === 0 && projects.length > 0 && !loading && <Alert variant="info" className="bg-dark text-info border-info mt-3">No tasks found. Click 'Create New Task' to add one.</Alert>}

        {/* Task Table */}
        {tasks.length > 0 && (
          <div className="table-responsive">
            <Table variant="dark" striped hover responsive="sm" className="align-middle">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Assignee</th>
                  {/* ADDED Cost Header */}
                  <th className="text-end">Cost</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id}>
                    <td className="fw-bold">{task.title}</td>
                    <td>{task.project?.name || <span className="text-muted">N/A</span>}</td>
                    <td><Badge bg={getTaskStatusColor(task.status)} className="text-capitalize p-2">{task.status || 'N/A'}</Badge></td>
                    <td><Badge bg={getTaskPriorityColor(task.priority)} className="text-capitalize p-2">{task.priority || 'N/A'}</Badge></td>
                    <td>{task.due_date ? new Date(task.due_date).toLocaleDateString() : <span className="text-muted">N/A</span>}</td>
                    <td>{task.assigned_user?.name || <span className="text-muted">Unassigned</span>}</td>
                    {/* ADDED Cost Cell */}
                    <td className="text-end">
                      {task.actual_cost !== null && task.actual_cost > 0
                        // Format using project's currency, fallback to USD
                        ? formatCurrency(task.actual_cost, task.project?.currency || 'USD')
                        : <span className="text-muted">-</span> // Display dash if no cost
                      }
                    </td>
                    {/* END Cost Cell */}
                    <td className="text-center">
                      <Button variant="outline-light" size="sm" onClick={() => handleShowEditModal(task)} className="me-2 py-1 px-2" title="Edit Task Details">
                         <i className="bi bi-pencil-fill me-1"></i> Edit
                       </Button>
                       <Button variant="outline-danger" size="sm" onClick={() => handleDelete(task.id)} title="Delete Task" className="py-1 px-2">
                         <i className="bi bi-trash-fill me-1"></i> Delete
                       </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </div>

      {/* --- Task Modal --- */}
      <Modal show={showModal} onHide={handleCloseModal} backdrop="static" keyboard={false} centered>
        <Modal.Header closeButton={!isSubmitting} closeVariant="white" className="bg-dark border-secondary">
          <Modal.Title className="text-light">{isEditing ? 'Edit Task' : 'Create New Task'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="bg-dark text-light">
             {modalError && <Alert variant="danger" className="bg-dark text-light border-danger" onClose={() => setModalError(null)} dismissible>{modalError}</Alert>}

             {/* Project */}
             <Form.Group className="mb-3" controlId="taskProjectId">
               <Form.Label>Project <span className="text-danger">*</span></Form.Label>
               <Form.Select name="project_id" value={formData.project_id} onChange={handleInputChange} required className="bg-secondary text-white border-secondary focus-ring focus-ring-primary" disabled={isSubmitting}>
                 <option value="" disabled={formData.project_id !== ''}>-- Select a project --</option>
                 {projects.map(proj => (<option key={proj.id} value={proj.id}>{proj.name}</option>))}
               </Form.Select>
             </Form.Group>

             {/* Title */}
             <Form.Group className="mb-3" controlId="taskTitle">
               <Form.Label>Title <span className="text-danger">*</span></Form.Label>
               <Form.Control type="text" name="title" value={formData.title} onChange={handleInputChange} required placeholder="Enter task title" className="bg-secondary text-white border-secondary focus-ring focus-ring-primary" disabled={isSubmitting}/>
             </Form.Group>

             {/* Description */}
             <Form.Group className="mb-3" controlId="taskDescription">
               <Form.Label>Description</Form.Label>
               <Form.Control as="textarea" name="description" rows={3} value={formData.description} onChange={handleInputChange} placeholder="Enter task description (optional)" className="bg-secondary text-white border-secondary" disabled={isSubmitting}/>
             </Form.Group>

             {/* Status & Priority */}
             <Row className="mb-3">
                <Col md={6}>
                     <Form.Group controlId="taskStatus">
                       <Form.Label>Status</Form.Label>
                       <Form.Select name="status" value={formData.status} onChange={handleInputChange} className="bg-secondary text-white border-secondary" disabled={isSubmitting}>
                         {taskStatuses.map(s => (<option key={s} value={s} className="text-capitalize">{s}</option>))}
                       </Form.Select>
                     </Form.Group>
                </Col>
                 <Col md={6}>
                     <Form.Group controlId="taskPriority">
                       <Form.Label>Priority</Form.Label>
                       <Form.Select name="priority" value={formData.priority} onChange={handleInputChange} className="bg-secondary text-white border-secondary" disabled={isSubmitting}>
                         {taskPriorities.map(p => (<option key={p} value={p} className="text-capitalize">{p}</option>))}
                       </Form.Select>
                     </Form.Group>
                 </Col>
             </Row>

             {/* Due Date & Assignee */}
             <Row className="mb-3">
                 <Col md={6}>
                     <Form.Group controlId="taskDueDate">
                       <Form.Label>Due Date</Form.Label>
                       <Form.Control type="date" name="due_date" value={formData.due_date} onChange={handleInputChange} className="bg-secondary text-white border-secondary" disabled={isSubmitting}/>
                     </Form.Group>
                </Col>
                <Col md={6}>
                     <Form.Group controlId="taskAssignee">
                       <Form.Label>Assignee</Form.Label>
                       <Form.Select name="assigned_user_id" value={formData.assigned_user_id || ''} onChange={handleInputChange} className="bg-secondary text-white border-secondary" disabled={isSubmitting}>
                         <option value="">-- Unassigned --</option>
                         {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                       </Form.Select>
                     </Form.Group>
                </Col>
             </Row>

             {/* Actual Cost */}
             <Row>
                 <Col md={6}>
                     <Form.Group className="mb-3" controlId="taskActualCost">
                       <Form.Label>Actual Cost</Form.Label>
                       <Form.Control
                           type="number"
                           name="actual_cost"
                           value={formData.actual_cost}
                           onChange={handleInputChange}
                           placeholder="e.g., 150.50"
                           step="0.01"
                           min="0"
                           className="bg-secondary text-white border-secondary focus-ring focus-ring-primary"
                           disabled={isSubmitting}
                       />
                       <Form.Text muted> Cost incurred for this task (optional). </Form.Text>
                     </Form.Group>
                 </Col>
             </Row>

          </Modal.Body>
          <Modal.Footer className="bg-dark border-secondary">
            <Button variant="secondary" onClick={handleCloseModal} disabled={isSubmitting}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
               {isSubmitting ? (<><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/> Saving...</>) : (isEditing ? 'Save Changes' : 'Create Task')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default TaskTable;