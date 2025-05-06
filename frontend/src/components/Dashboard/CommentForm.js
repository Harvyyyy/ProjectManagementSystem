import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext'; // Adjust path if needed
import { API_BASE_URL } from '../../App'; // Adjust path if needed
import { Form, Button, Spinner, Alert } from 'react-bootstrap';

function CommentForm({ taskId, onCommentAdded }) {
    const { token } = useAuth();
    const [body, setBody] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!body.trim()) {
            setError('Comment cannot be empty.');
            return;
        }
        setError(null);
        setIsSubmitting(true);

        const url = `${API_BASE_URL}/tasks/${taskId}/comments`; // POST endpoint

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ body: body }), // Send comment body
            });

            if (!response.ok) {
                let message = `Error ${response.status}`;
                try {
                    const errData = await response.json();
                    message = errData.errors ? Object.values(errData.errors).flat().join(' ') : (errData.message || message);
                } catch (jsonError) { console.error("Failed to parse error JSON"); }
                throw new Error(message);
            }

            // const newComment = await response.json(); // Optional: use new comment data if needed

            setBody(''); // Clear the form
            if (onCommentAdded) {
                onCommentAdded(); // Notify parent to refresh comment list
            }

        } catch (err) {
            console.error("Failed to submit comment:", err);
            setError(err.message || "Failed to add comment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form onSubmit={handleSubmit} className="mt-4">
            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
            <Form.Group controlId="commentBody">
                <Form.Label className="text-light">Add a Comment</Form.Label>
                <Form.Control
                    as="textarea"
                    rows={3}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Enter your comment..."
                    required
                    className="bg-secondary text-white border-secondary mb-2"
                    disabled={isSubmitting}
                />
            </Form.Group>
            <Button variant="primary" type="submit" disabled={isSubmitting || !body.trim()}>
                {isSubmitting ? <Spinner as="span" animation="border" size="sm" /> : 'Submit Comment'}
            </Button>
        </Form>
    );
}

export default CommentForm;