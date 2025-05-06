import React from 'react';
import { ListGroup, Spinner, Alert } from 'react-bootstrap';
import { formatDate } from '../../utils/formatting'; // Adjust path if needed

function CommentList({ comments, isLoading, error }) {

    if (isLoading) {
        return <div className="text-center p-3"><Spinner animation="border" size="sm" /> Loading comments...</div>;
    }

    if (error) {
        return <Alert variant="warning" className="mt-3">{error}</Alert>;
    }

    if (!comments || comments.length === 0) {
        return <p className="text-muted mt-3">No comments yet.</p>;
    }

    return (
        <ListGroup variant="flush" className="mt-3 comment-list">
            {comments.map(comment => (
                <ListGroup.Item key={comment.id} className="bg-dark text-light border-secondary px-0 py-2">
                    <div className="d-flex w-100 justify-content-between">
                        <strong className="mb-1 text-info">{comment.user?.name || 'Unknown User'}</strong>
                        <small className="text-muted">{formatDate(comment.created_at, { dateStyle: 'medium', timeStyle: 'short' })}</small>
                    </div>
                    <p className="mb-1" style={{ whiteSpace: 'pre-wrap' }}>{comment.body}</p> {/* Use pre-wrap to respect newlines */}
                </ListGroup.Item>
            ))}
        </ListGroup>
    );
}

export default CommentList;