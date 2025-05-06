import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../App';
import { Modal, Button, Form, Badge, Table, Spinner, Alert, Row, Col } from 'react-bootstrap';
// Using only formatDate now
import { formatDate } from '../../utils/formatting'; // Adjust path if needed
// --- Added Comment Component Imports ---
import CommentList from './CommentList'; // Assuming it's in the same directory
import CommentForm from './CommentForm'; // Assuming it's in the same directory
// --- END Imports ---

// Helper functions
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
  const { token } = useAuth(); // Token is available in the component scope
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalError, setModalError] = useState(null);

  // State for Edit/Create Task Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [formData, setFormData] = useState({
    project_id: '', title: '', description: '', status: 'pending', priority: 'medium',
    assigned_user_id: '', due_date: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Loading states for row actions
  const [markingDoneTaskId, setMarkingDoneTaskId] = useState(null);
  const [undoingTaskId, setUndoingTaskId] = useState(null);

  // --- State for Comments ---
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState(null);
  // --- END State for Comments ---

  const taskStatuses = ['pending', 'in progress', 'completed'];
  const taskPriorities = ['low', 'medium', 'high'];

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
      setLoading(true); setError(null);
      try {
          const fetchOptions = { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } };
          const [tRes, pRes, uRes] = await Promise.all([
              fetch(`${API_BASE_URL}/tasks`, fetchOptions),
              fetch(`${API_BASE_URL}/projects`, fetchOptions),
              fetch(`${API_BASE_URL}/users`, fetchOptions),
          ]);
          if (!tRes.ok) throw new Error(`Task fetch failed: ${tRes.status} ${tRes.statusText}`);
          if (!pRes.ok) throw new Error(`Project fetch failed: ${pRes.status} ${pRes.statusText}`);
          if (!uRes.ok) throw new Error(`User fetch failed: ${uRes.status} ${uRes.statusText}`);

          // Safely parse JSON, provide defaults
          let tasksDataParsed = []; let projectsDataParsed = { data: [] }; let usersDataParsed = [];
          try { const tasksText = await tRes.text(); if (tasksText) tasksDataParsed = JSON.parse(tasksText); } catch (e) { console.error("Error parsing tasks JSON:", e); }
          try { const projectsText = await pRes.text(); if (projectsText) projectsDataParsed = JSON.parse(projectsText); } catch (e) { console.error("Error parsing projects JSON:", e); }
          try { const usersText = await uRes.text(); if (usersText) usersDataParsed = JSON.parse(usersText); } catch (e) { console.error("Error parsing users JSON:", e); }

          console.log("DEBUG TaskTable (MarkAsDone/Undo): First Task Received:", tasksDataParsed[0] || tasksDataParsed?.data?.[0]);

          setTasks(Array.isArray(tasksDataParsed) ? tasksDataParsed : (tasksDataParsed?.data ?? []));
          setProjects(projectsDataParsed?.data ?? (Array.isArray(projectsDataParsed) ? projectsDataParsed : []));
          setUsers(usersDataParsed?.data ?? (Array.isArray(usersDataParsed) ? usersDataParsed : []));
      } catch (e) { setError(`Failed to load data: ${e.message}.`); setTasks([]); setProjects([]); setUsers([]); }
      finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- Fetch Comments ---
  const fetchComments = useCallback(async (taskId) => {
      if (!taskId) { setComments([]); return; }
      setCommentsLoading(true); setCommentsError(null);
      try {
          const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/comments`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, });
          if (!response.ok) { throw new Error(`HTTP ${response.status}: Could not fetch comments.`); }
          const data = await response.json();
          setComments(data.data ? data.data : (Array.isArray(data) ? data : []));
      } catch (e) { setCommentsError(e.message || 'Failed to load comments.'); setComments([]); }
      finally { setCommentsLoading(false); }
  }, [token]);

  useEffect(() => { if (selectedTaskForDetails?.id) { fetchComments(selectedTaskForDetails.id); } else { setComments([]); } }, [selectedTaskForDetails, fetchComments]);

  // --- Modal Handlers ---
  const handleShowCreateModal = () => {
      if (projects.length === 0 && !loading) { setError('Cannot add tasks: No projects available.'); return; }
      if (projects.length > 0) { setIsEditing(false); setCurrentTask(null); setModalError(null); setIsSubmitting(false); setFormData({ project_id: projects[0]?.id || '', title: '', description: '', status: 'pending', priority: 'medium', assigned_user_id: '', due_date: '', }); setShowModal(true); }
      else if (!loading) { setError('No projects found.'); }
  };
  const handleShowEditModal = (task) => {
      setIsEditing(true); setCurrentTask(task); setModalError(null); setIsSubmitting(false);
      setFormData({ project_id: task.project_id, title: task.title, description: task.description || '', status: task.status || 'pending', priority: task.priority || 'medium', assigned_user_id: task.assigned_user_id || '', due_date: task.due_date ? task.due_date.split('T')[0] : '', });
      setShowModal(true);
  };
  const handleCloseModal = () => {
      if (isSubmitting) return;
      setShowModal(false); setCurrentTask(null); setModalError(null); setIsEditing(false);
  };
  const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault(); setModalError(null);
    if (!formData.title.trim() || !formData.project_id || (formData.due_date && isNaN(Date.parse(formData.due_date)))) { setModalError('Please check required fields and date format.'); return; }
    setIsSubmitting(true);
    const url = isEditing ? `${API_BASE_URL}/tasks/${currentTask.id}` : `${API_BASE_URL}/tasks`;
    const method = isEditing ? 'PUT' : 'POST';
    const payload = { ...formData };
    payload.assigned_user_id = !formData.assigned_user_id ? null : parseInt(formData.assigned_user_id, 10);
    payload.project_id = parseInt(formData.project_id, 10);
    payload.due_date = formData.due_date || null;
    payload.description = formData.description || '';

    try {
      const response = await fetch(url, { method, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) {
         let errorResponseMessage = `HTTP error: ${response.status}`; // Default message
         try {
             const errorData = await response.json();
             errorResponseMessage = errorData.errors ? Object.values(errorData.errors).flat().join(' ') : (errorData.message || errorResponseMessage);
         } catch(jsonError) { console.error("Non-JSON error response on save:", await response.text()); }
         throw new Error(errorResponseMessage); // Throw error with the potentially detailed message
      }
      fetchData(); handleCloseModal();
    } catch (e) { // Catch the error object 'e'
      console.error('Failed to save task:', e);
      setModalError(`Failed to save task: ${e.message}`); // *** CORRECTED ***
    } finally {
       setIsSubmitting(false);
    }
  };

  // --- Deletion Handler ---
  const handleDelete = async (taskId) => {
      if (!window.confirm('Are you sure?')) return;
      setError(null);
      try {
          const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } });
          if (!response.ok && response.status !== 204) {
             let errorResponseMessage = `HTTP error: ${response.status}`; // Default message
             try { const errorData = await response.json(); errorResponseMessage = errorData.message || errorResponseMessage; }
             catch(jsonError) { /* Use default message */ }
             throw new Error(errorResponseMessage); // Throw the detailed error
          }
          if (selectedTaskForDetails?.id === taskId) { setSelectedTaskForDetails(null); }
          fetchData();
      } catch (e) { // Catch the error object 'e'
          console.error('Failed to delete task:', e);
          setError(`Failed to delete task: ${e.message}`); // *** CORRECTED ***
      }
  };

  // --- Mark as Complete Handler ---
  const handleMarkAsComplete = async (taskId) => {
      setMarkingDoneTaskId(taskId); setError(null);
      const url = `${API_BASE_URL}/tasks/${taskId}/complete`;
      try {
          const response = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' } });
          if (!response.ok) {
               let errorResponseMessage = `HTTP error ${response.status}`;
               try{ const err = await response.json(); errorResponseMessage = err.message || errorResponseMessage; } catch(e){}
               throw new Error(errorResponseMessage); // Throw the detailed error
          }
          fetchData();
      } catch (e) { // Catch the error object 'e'
          console.error(`Failed to complete task ${taskId}:`, e);
          setError(`Failed to complete task: ${e.message}`); // *** CORRECTED ***
      } finally {
          setMarkingDoneTaskId(null);
      }
  };

  // --- Undo Complete Handler ---
  const handleUndoComplete = async (taskId) => {
      setUndoingTaskId(taskId); setError(null);
      const url = `${API_BASE_URL}/tasks/${taskId}/undo-complete`;
      try {
          const response = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' } });
          if (!response.ok) {
               let errorResponseMessage = `HTTP error ${response.status}`;
               try{ const err = await response.json(); errorResponseMessage = err.message || errorResponseMessage; } catch(e){}
               throw new Error(errorResponseMessage); // Throw the detailed error
          }
          fetchData();
      } catch (e) { // Catch the error object 'e'
          console.error(`Failed to undo task ${taskId}:`, e);
          setError(`Failed to undo task completion: ${e.message}`); // *** CORRECTED ***
      } finally {
          setUndoingTaskId(null);
      }
  };

  // --- Handler to Select Task for Details/Comments ---
  const handleSelectTaskForDetails = (task) => {
      if (selectedTaskForDetails?.id === task.id) { setSelectedTaskForDetails(null); }
      else { setSelectedTaskForDetails({ id: task.id, title: task.title }); }
  };

  // --- Callback for CommentForm ---
  const handleCommentAdded = useCallback(() => {
    if (selectedTaskForDetails?.id) { fetchComments(selectedTaskForDetails.id); }
  }, [selectedTaskForDetails, fetchComments]); // Dependencies are correct


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
         {tasks.length === 0 && projects.length > 0 && !loading && <Alert variant="info" className="bg-dark text-info border-info mt-3">No tasks found.</Alert>}

        {/* Task Table */}
        {tasks.length > 0 && (
          <div className="table-responsive">
            <Table variant="dark" striped hover responsive="sm" className="align-middle">
              <thead>
                <tr>
                  <th>Title</th><th>Project</th><th>Status</th><th>Priority</th><th>Due Date</th><th>Assignee</th>
                  <th className="text-end">Created</th>
                  <th className="text-end">Completed</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => {
                  const isCompleted = task.status === 'completed';
                  const isLoadingComplete = markingDoneTaskId === task.id;
                  const isLoadingUndo = undoingTaskId === task.id;
                  const isSelectedForDetails = selectedTaskForDetails?.id === task.id;
                  return (
                      <React.Fragment key={task.id}>
                          <tr>
                            <td className="fw-bold">{task.title}</td>
                            <td>{task.project?.name || <span className="text-muted">N/A</span>}</td>
                            <td><Badge bg={getTaskStatusColor(task.status)} className="text-capitalize p-2">{task.status || 'N/A'}</Badge></td>
                            <td><Badge bg={getTaskPriorityColor(task.priority)} className="text-capitalize p-2">{task.priority || 'N/A'}</Badge></td>
                            <td>{task.due_date ? new Date(task.due_date).toLocaleDateString() : <span className="text-muted">N/A</span>}</td>
                            <td>{task.assigned_user?.name || <span className="text-muted">Unassigned</span>}</td>
                            <td className="text-end">{formatDate(task.created_at)}</td>
                            <td className="text-end">{formatDate(task.completed_at)}</td>
                            <td className="text-center">
                               {/* Conditional "Mark as Done" / "Undo" Button */}
                               {!isCompleted ? ( <Button variant="outline-success" size="sm" onClick={() => handleMarkAsComplete(task.id)} className="me-2 py-1 px-2" title="Mark Done" disabled={isLoadingComplete || isLoadingUndo}> {isLoadingComplete ? <Spinner size="sm"/> : <><i className="bi bi-check2-circle me-1"></i> Done</>} </Button>)
                                : ( <Button variant="outline-warning" size="sm" onClick={() => handleUndoComplete(task.id)} className="me-2 py-1 px-2" title="Undo" disabled={isLoadingComplete || isLoadingUndo}> {isLoadingUndo ? <Spinner size="sm"/> : <><i className="bi bi-arrow-counterclockwise me-1"></i> Undo</>} </Button> )}
                               {/* Edit Button */}
                               <Button variant="outline-light" size="sm" onClick={() => handleShowEditModal(task)} className="me-2 py-1 px-2" title="Edit Task" disabled={isLoadingComplete || isLoadingUndo}><i className="bi bi-pencil-fill me-1"></i> Edit</Button>
                               {/* Comments/Details Button */}
                               <Button variant={isSelectedForDetails ? "info" : "outline-secondary"} size="sm" onClick={() => handleSelectTaskForDetails(task)} className="me-2 py-1 px-2" title={isSelectedForDetails ? "Hide Comments" : "View/Add Comments"} disabled={isLoadingComplete || isLoadingUndo}> <i className={`bi ${isSelectedForDetails ? 'bi-chat-dots-fill' : 'bi-chat-dots'} me-1`}></i> Comments </Button>
                               {/* Delete Button */}
                               <Button variant="outline-danger" size="sm" onClick={() => handleDelete(task.id)} title="Delete Task" className="py-1 px-2" disabled={isLoadingComplete || isLoadingUndo}><i className="bi bi-trash-fill me-1"></i> Delete</Button>
                            </td>
                          </tr>
                          {/* Conditionally Render Comments Below Row */}
                          {isSelectedForDetails && (
                              <tr className="task-comments-row">
                                  <td colSpan="9" className="p-3" style={{backgroundColor: '#3a3f44'}}>
                                      <h6 className="text-light mb-2">Comments for: {selectedTaskForDetails.title}</h6>
                                      <CommentList comments={comments} isLoading={commentsLoading} error={commentsError}/>
                                      <CommentForm taskId={selectedTaskForDetails.id} onCommentAdded={handleCommentAdded}/>
                                  </td>
                              </tr>
                          )}
                      </React.Fragment>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </div>

      {/* --- Task Edit/Create Modal (Complete Structure) --- */}
      <Modal show={showModal} onHide={handleCloseModal} backdrop="static" keyboard={false} centered>
        <Modal.Header closeButton={!isSubmitting} closeVariant="white" className="bg-dark border-secondary">
          <Modal.Title className="text-light">{isEditing ? 'Edit Task' : 'Create New Task'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="bg-dark text-light">
             {modalError && <Alert variant="danger" className="bg-dark text-light border-danger" onClose={() => setModalError(null)} dismissible>{modalError}</Alert>}
             <Form.Group className="mb-3" controlId="taskProjectId">
                 <Form.Label>Project <span className="text-danger">*</span></Form.Label>
                 <Form.Select name="project_id" value={formData.project_id} onChange={handleInputChange} required className="bg-secondary text-white border-secondary focus-ring focus-ring-primary" disabled={isSubmitting || isEditing}>
                     <option value="" disabled={formData.project_id !== ''}>-- Select a project --</option>
                     {projects.map(proj => (<option key={proj.id} value={proj.id}>{proj.name}</option>))}
                 </Form.Select>
             </Form.Group>
             <Form.Group className="mb-3" controlId="taskTitle">
                 <Form.Label>Title <span className="text-danger">*</span></Form.Label>
                 <Form.Control type="text" name="title" value={formData.title} onChange={handleInputChange} required placeholder="Enter task title" className="bg-secondary text-white border-secondary focus-ring focus-ring-primary" disabled={isSubmitting}/>
             </Form.Group>
             <Form.Group className="mb-3" controlId="taskDescription">
                 <Form.Label>Description</Form.Label>
                 <Form.Control as="textarea" name="description" rows={3} value={formData.description} onChange={handleInputChange} placeholder="Enter task description (optional)" className="bg-secondary text-white border-secondary" disabled={isSubmitting}/>
             </Form.Group>
             <Row className="mb-3">
                 {isEditing && (
                     <Col md={6}>
                         <Form.Group controlId="taskStatus">
                             <Form.Label>Status</Form.Label>
                             <Form.Select name="status" value={formData.status} onChange={handleInputChange} className="bg-secondary text-white border-secondary" disabled={isSubmitting}>
                                 {taskStatuses.map(s => (<option key={s} value={s} className="text-capitalize">{s}</option>))}
                             </Form.Select>
                         </Form.Group>
                     </Col>
                 )}
                 <Col md={isEditing ? 6 : 12}>
                     <Form.Group controlId="taskPriority">
                         <Form.Label>Priority</Form.Label>
                         <Form.Select name="priority" value={formData.priority} onChange={handleInputChange} className="bg-secondary text-white border-secondary" disabled={isSubmitting}>
                             {taskPriorities.map(p => (<option key={p} value={p} className="text-capitalize">{p}</option>))}
                         </Form.Select>
                     </Form.Group>
                 </Col>
             </Row>
             <Row className="mb-3">
                 <Col md={6}><Form.Group controlId="taskDueDate"><Form.Label>Due Date</Form.Label><Form.Control type="date" name="due_date" value={formData.due_date} onChange={handleInputChange} className="bg-secondary text-white border-secondary" disabled={isSubmitting}/></Form.Group></Col>
                 <Col md={6}><Form.Group controlId="taskAssignee"><Form.Label>Assignee</Form.Label><Form.Select name="assigned_user_id" value={formData.assigned_user_id || ''} onChange={handleInputChange} className="bg-secondary text-white border-secondary" disabled={isSubmitting}><option value="">-- Unassigned --</option>{users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}</Form.Select></Form.Group></Col>
             </Row>
             {/* No Actual Cost Field */}
          </Modal.Body>
          <Modal.Footer className="bg-dark border-secondary">
            <Button variant="secondary" onClick={handleCloseModal} disabled={isSubmitting}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
               {isSubmitting ? (<><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/> Saving...</>) : (isEditing ? 'Save Changes' : 'Create Task')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      {/* --- End Task Edit/Create Modal --- */}

    </div>
  );
}

export default TaskTable;