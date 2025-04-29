import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../App';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import { formatCurrency, formatDate } from '../../utils/formatting'; // Import helpers
// Placeholder for TaskList and ExpenditureList components (to be created/imported)
// import TaskList from './TaskList'; // Assuming you might refactor TaskTable
import ExpenditureList from './ExpenditureList'; // We will create this

// Re-use or import from ProjectTable
const getStatusColor = (status) => {
  switch (status) {
    case 'Not Started': return 'secondary';
    case 'In Progress': return 'primary';
    case 'On Hold': return 'warning';
    case 'Completed': return 'success';
    default: return 'light';
  }
};

function ProjectDetail() {
  const { projectId } = useParams(); // Get project ID from URL
  const { token } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProjectDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Project not found.');
        }
        throw new Error(`HTTP error: ${response.status}`);
      }
      const data = await response.json();
      setProject(data);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to load project details.');
    } finally {
      setLoading(false);
    }
  }, [projectId, token]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  if (loading) return <div className="text-center mt-5 text-light"><Spinner animation="border" /> Loading Project...</div>;
  if (error) return <Alert variant="danger" className="bg-dark text-light border-danger mt-3">{error} <Link to="/dashboard/projects">Go back to projects</Link></Alert>;
  if (!project) return <Alert variant="warning" className="bg-dark text-light border-warning mt-3">Project data could not be loaded.</Alert>; // Should ideally be caught by error state

  const budgetDefined = project.budget !== null && project.budget !== undefined;
  const currency = project.currency || 'USD'; // Default currency if not set

  return (
    <Container fluid>
       {/* Back Button */}
       <Button variant="outline-secondary" size="sm" onClick={() => navigate('/dashboard/projects')} className="mb-3">
            <i className="bi bi-arrow-left me-1"></i> Back to Projects
        </Button>

      <Card className="bg-dark text-white border-secondary shadow-sm mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center border-secondary">
          <h3 className="mb-0">{project.name}</h3>
          <Badge bg={getStatusColor(project.status)} className="text-capitalize p-2">
            {project.status}
          </Badge>
        </Card.Header>
        <Card.Body>
          <Row>
            {/* Left Column: Details */}
            <Col md={7}>
              <Card.Title as="h5">Project Details</Card.Title>
              <p className="text-muted">{project.description || 'No description provided.'}</p>
              <Row className="mb-3">
                <Col sm={6}>
                  <strong>Start Date:</strong> {formatDate(project.start_date)}
                </Col>
                <Col sm={6}>
                  <strong>End Date:</strong> {formatDate(project.end_date)}
                </Col>
              </Row>
               <p>
                <strong>Created By:</strong> {project.owner?.name || 'N/A'}
               </p>
            </Col>

            {/* Right Column: Budget Summary */}
            <Col md={5}>
              <Card.Title as="h5">Budget Summary</Card.Title>
              {budgetDefined ? (
                <>
                  <p className="mb-1">
                    <strong>Total Budget:</strong>
                    <span className="float-end">{formatCurrency(project.budget, currency)}</span>
                  </p>
                  <p className="mb-1">
                    <strong>Total Spent:</strong>
                    <span className="float-end">{formatCurrency(project.total_expenditure, currency)}</span>
                  </p>
                  <hr className="border-secondary my-1"/>
                  <p className={`mb-0 fw-bold ${project.remaining_budget < 0 ? 'text-danger' : 'text-success'}`}>
                    <strong>Remaining:</strong>
                    <span className="float-end">{formatCurrency(project.remaining_budget, currency)}</span>
                  </p>
                </>
              ) : (
                <p className="text-muted">No budget defined for this project.</p>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Section for Expenditures */}
      <ExpenditureList projectId={projectId} projectCurrency={currency} />

      {/* Placeholder/Section for Tasks (Optional based on your structure) */}
      {/* <Card className="bg-dark text-white border-secondary shadow-sm mb-4">
        <Card.Header className="border-secondary"><h4 className="mb-0">Tasks</h4></Card.Header>
        <Card.Body>
           {/* You could potentially filter TaskTable component by projectId here
               or create a dedicated TaskList component similar to ExpenditureList *\/}
           <p className="text-muted">Task list would go here.</p>
        </Card.Body>
      </Card> */}

    </Container>
  );
}

export default ProjectDetail;