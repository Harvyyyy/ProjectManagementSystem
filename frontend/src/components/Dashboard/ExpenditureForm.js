import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext'; // Adjust path if needed
import { API_BASE_URL } from '../../App'; // Adjust path if needed
import { Modal, Button, Form, Spinner, Alert, Row, Col } from 'react-bootstrap';

function ExpenditureForm({ show, handleClose, projectId, expenditureToEdit, onSaveSuccess }) {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    expense_date: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isEditing = !!expenditureToEdit;

  // Effect to populate form when editing or reset when creating
  useEffect(() => {
    if (show) { // Only run logic when modal is intended to be shown
      if (isEditing && expenditureToEdit) {
        setFormData({
          description: expenditureToEdit.description || '',
          amount: expenditureToEdit.amount || '',
          // Ensure date from API (likely YYYY-MM-DDTHH:mm:ssZ) is formatted to YYYY-MM-DD for the input
          expense_date: expenditureToEdit.expense_date ? expenditureToEdit.expense_date.split('T')[0] : '',
        });
      } else {
        // Reset form for creating, default date to today
        setFormData({
          description: '',
          amount: '',
          expense_date: new Date().toISOString().split('T')[0],
        });
      }
      setError(null); // Clear error when modal opens or mode changes
    }
  }, [expenditureToEdit, isEditing, show]); // Depend on show to reset/populate correctly when opening

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Frontend Validation
    if (!formData.description.trim()) {
      setError('Description cannot be empty.');
      return;
    }
    const amountValue = parseFloat(formData.amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setError('Amount must be a positive number.');
      return;
    }
    if (!formData.expense_date) {
      setError('Expense date is required.');
      return;
    }

    setIsSubmitting(true);

    // Determine URL and Method
    const url = isEditing
      ? `${API_BASE_URL}/expenditures/${expenditureToEdit.id}`
      : `${API_BASE_URL}/projects/${projectId}/expenditures`;
    const method = isEditing ? 'PUT' : 'POST';

    // Prepare payload
    const payload = {
        ...formData,
        amount: amountValue, // Use the parsed numeric amount
        // If creating and backend requires project_id in payload:
        // ...( !isEditing && { project_id: projectId } )
    };

    try {
      const response = await fetch(url, {
        method,
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
            // Handle Laravel validation errors format
            message = errData.errors
                ? Object.values(errData.errors).flat().join(' ')
                : (errData.message || message); // Use specific message if available
        } catch (jsonError) {
            // If response is not JSON, use the initial HTTP error message
            console.error("Failed to parse error response as JSON:", jsonError);
        }
        throw new Error(message);
      }

      // Success: Call the callback provided by the parent component
      onSaveSuccess();

    } catch (e) {
      console.error("Expenditure save error:", e);
      // Display the error message to the user
      setError(`Failed to save expenditure: ${e.message}`);
    } finally {
      // Ensure spinner stops even if there was an error
      setIsSubmitting(false);
    }
  };

  // Render the Modal with Form
  return (
    // Prevent closing modal if submission is in progress
    <Modal show={show} onHide={() => !isSubmitting && handleClose()} backdrop="static" keyboard={false}>
      {/* Disable close button during submission */}
      <Modal.Header closeButton={!isSubmitting}>
        <Modal.Title>{isEditing ? 'Edit Expenditure' : 'Add New Expenditure'}</Modal.Title>
      </Modal.Header>
      {/* Use Form's native onSubmit */}
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {/* Error Alert: Displays API or validation errors */}
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              <p className="mb-0">{error}</p>
            </Alert>
          )}

          {/* Form Fields */}
          <Form.Group as={Row} className="mb-3" controlId="formExpenditureDescription">
            <Form.Label column sm={3}>Description *</Form.Label>
            <Col sm={9}>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                // Highlight field if error message relates to it
                isInvalid={!!error && (error.toLowerCase().includes('description'))}
                disabled={isSubmitting}
                required // Basic HTML5 validation
              />
               <Form.Control.Feedback type="invalid">
                 {/* Show specific error or generic message */}
                 {error && (error.toLowerCase().includes('description')) ? error : "Please provide a description."}
               </Form.Control.Feedback>
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" controlId="formExpenditureAmount">
            <Form.Label column sm={3}>Amount *</Form.Label>
            <Col sm={9}>
              <Form.Control
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                step="0.01" // Allow decimal values
                min="0.01" // Ensure positive amount
                isInvalid={!!error && (error.toLowerCase().includes('amount'))}
                disabled={isSubmitting}
                required
                placeholder='e.g., 150.75'
              />
               <Form.Control.Feedback type="invalid">
                  {error && (error.toLowerCase().includes('amount')) ? error : "Please enter a valid positive amount (e.g., 150.75)."}
               </Form.Control.Feedback>
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" controlId="formExpenditureDate">
            <Form.Label column sm={3}>Date *</Form.Label>
            <Col sm={9}>
              <Form.Control
                type="date"
                name="expense_date"
                value={formData.expense_date}
                onChange={handleInputChange}
                isInvalid={!!error && (error.toLowerCase().includes('date'))}
                disabled={isSubmitting}
                required
              />
               <Form.Control.Feedback type="invalid">
                 {error && (error.toLowerCase().includes('date')) ? error : "Please select a valid date."}
               </Form.Control.Feedback>
            </Col>
          </Form.Group>

        </Modal.Body>
        <Modal.Footer>
          {/* Action Buttons */}
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Close
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {/* Show spinner and different text during submission */}
            {isSubmitting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
                {' '} Saving...
              </>
            ) : (
              // Change button text based on editing or creating
              isEditing ? 'Save Changes' : 'Add Expenditure'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default ExpenditureForm;