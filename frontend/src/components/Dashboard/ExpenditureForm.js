import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../App';
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

  useEffect(() => {
    if (show) {
      if (isEditing && expenditureToEdit) {
        setFormData({
          description: expenditureToEdit.description || '',
          amount: expenditureToEdit.amount || '',
          expense_date: expenditureToEdit.expense_date ? expenditureToEdit.expense_date.split('T')[0] : '',
        });
      } else {
        setFormData({
          description: '',
          amount: '',
          expense_date: new Date().toISOString().split('T')[0],
        });
      }
      setError(null);
    }
  }, [expenditureToEdit, isEditing, show]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

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

    const url = isEditing
      ? `${API_BASE_URL}/expenditures/${expenditureToEdit.id}`
      : `${API_BASE_URL}/projects/${projectId}/expenditures`;
    const method = isEditing ? 'PUT' : 'POST';

    const payload = {
        ...formData,
        amount: amountValue,
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
            message = errData.errors
                ? Object.values(errData.errors).flat().join(' ')
                : (errData.message || message);
        } catch (jsonError) {
            console.error("Failed to parse error response as JSON:", jsonError);
        }
        throw new Error(message);
      }

      onSaveSuccess();

    } catch (e) {
      console.error("Expenditure save error:", e);
      setError(`Failed to save expenditure: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={() => !isSubmitting && handleClose()} backdrop="static" keyboard={false}>
      <Modal.Header closeButton={!isSubmitting}>
        <Modal.Title>{isEditing ? 'Edit Expenditure' : 'Add New Expenditure'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              <p className="mb-0">{error}</p>
            </Alert>
          )}

          <Form.Group as={Row} className="mb-3" controlId="formExpenditureDescription">
            <Form.Label column sm={3}>Description *</Form.Label>
            <Col sm={9}>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                isInvalid={!!error && (error.toLowerCase().includes('description'))}
                disabled={isSubmitting}
                required
              />
               <Form.Control.Feedback type="invalid">
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
                step="0.01"
                min="0.01"
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
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Close
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
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
              isEditing ? 'Save Changes' : 'Add Expenditure'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default ExpenditureForm;