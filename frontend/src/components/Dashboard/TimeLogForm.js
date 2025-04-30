import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext'; // Adjust path if needed
import { API_BASE_URL } from '../../App'; // Adjust path if needed
import { Modal, Button, Form, Spinner, Alert, Row, Col } from 'react-bootstrap';

function TimeLogForm({ show, handleClose, taskId, taskTitle, onSaveSuccess }) {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    duration: '', // in minutes
    date_worked: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Reset form when the modal is shown for a new entry
  useEffect(() => {
    if (show) {
      setFormData({
        duration: '',
        date_worked: new Date().toISOString().split('T')[0], // Default to today
        description: '',
      });
      setError(null); // Clear previous errors
      setIsSubmitting(false);
    }
  }, [show]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Frontend Validation
    const durationValue = parseInt(formData.duration, 10);
    if (isNaN(durationValue) || durationValue <= 0) {
      setError('Duration must be a positive whole number (in minutes).');
      return;
    }
    if (!formData.date_worked) {
      setError('Date worked is required.');
      return;
    }
     try {
         if (new Date(formData.date_worked) > new Date()) {
             setError('Cannot log time for a future date.');
             return;
         }
     } catch (dateError) {
         setError('Invalid date format for Date Worked.');
         return;
     }

    setIsSubmitting(true);

    const url = `${API_BASE_URL}/tasks/${taskId}/time-entries`;
    const payload = {
        ...formData,
        duration: durationValue, // Send integer value
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = `HTTP error: ${response.status}`;
        try {
            const errData = await response.json();
            message = errData.errors ? Object.values(errData.errors).flat().join(' ') : (errData.message || message);
        } catch (jsonError) { console.error("Failed to parse error JSON:", jsonError); }
        throw new Error(message);
      }

      onSaveSuccess(); // Callback to refresh data and close modal

    } catch (e) {
      console.error("Time log error:", e);
      setError(`Failed to log time: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Corrected onHide prop as well
  return (
    <Modal show={show} onHide={() => !isSubmitting && handleClose()} backdrop="static" keyboard={false} centered>
      <Modal.Header closeButton={!isSubmitting} closeVariant="white" className="bg-dark border-secondary">
        <Modal.Title className="text-light">Log Time for: <span className="text-info">{taskTitle}</span></Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="bg-dark text-light">
          {error && <Alert variant="danger" className="bg-dark text-light border-danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

          <Row>
            <Col md={6}>
                <Form.Group className="mb-3" controlId="timeLogDuration">
                  <Form.Label>Duration (minutes) <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number" name="duration" value={formData.duration} onChange={handleInputChange}
                    min="1" step="1" required placeholder="e.g., 90"
                    className="bg-secondary text-white border-secondary focus-ring focus-ring-primary"
                    disabled={isSubmitting}
                  />
                </Form.Group>
            </Col>
             <Col md={6}>
                <Form.Group className="mb-3" controlId="timeLogDateWorked">
                  <Form.Label>Date Worked <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date" name="date_worked" value={formData.date_worked} onChange={handleInputChange}
                    required max={new Date().toISOString().split('T')[0]}
                    className="bg-secondary text-white border-secondary"
                    disabled={isSubmitting}
                  />
                </Form.Group>
             </Col>
          </Row>

          <Form.Group className="mb-3" controlId="timeLogDescription">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea" name="description" rows={3} value={formData.description} onChange={handleInputChange}
              placeholder="What did you work on? (optional)"
              className="bg-secondary text-white border-secondary"
              disabled={isSubmitting}
            />
          </Form.Group>

        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          {/* Corrected onClick handler */}
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (<><Spinner as="span" animation="border" size="sm" /> Saving...</>) : 'Log Time'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default TimeLogForm;