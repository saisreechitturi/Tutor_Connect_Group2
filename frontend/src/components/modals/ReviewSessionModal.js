import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { reviewService } from '../../services';
import { useAuth } from '../../context/AuthContext';

const ReviewSessionModal = ({ isOpen, onClose, session, onSubmitted }) => {
    const { user } = useAuth();
    const [rating, setRating] = useState(5);
    const [text, setText] = useState('');
    const [wouldRecommend, setWouldRecommend] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen || !session) return null;

    const submit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            setSubmitting(true);

            // Determine who we're reviewing based on who the current user is NOT
            // If current user is the student, we review the tutor
            // If current user is the tutor, we review the student
            let revieweeId;
            if (user.id === session.student?.id) {
                // Current user is the student, so review the tutor
                revieweeId = session.tutor?.id;
            } else if (user.id === session.tutor?.id) {
                // Current user is the tutor, so review the student
                revieweeId = session.student?.id;
            }

            if (!revieweeId) {
                throw new Error('Could not determine who to review');
            }

            await reviewService.create({
                sessionId: session.id,
                revieweeId: revieweeId,
                rating,
                comment: text || null,
                wouldRecommend: wouldRecommend,
            });
            try {
                window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', title: 'Review submitted' } }));
            } catch { }
            onSubmitted?.({ rating, comment: text });
            onClose();
        } catch (e) {
            setError(e.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Rate Session</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={submit} className="p-4 space-y-4">
                    {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-2">{error}</div>}
                    <div>
                        <div className="text-sm text-gray-700 mb-1">Overall rating</div>
                        <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setRating(n)}
                                    className={`${n <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:scale-110 transition-transform`}
                                    aria-label={`Rate ${n}`}
                                >
                                    <Star className={`h-6 w-6 ${n <= rating ? 'fill-current' : ''}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Feedback (optional)</label>
                        <textarea
                            rows={4}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="What went well? What could be improved?"
                        />
                    </div>
                    <div>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={wouldRecommend}
                                onChange={(e) => setWouldRecommend(e.target.checked)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                I would recommend this {user.id === session.student?.id ? 'tutor' : 'student'} to others
                            </span>
                        </label>
                    </div>
                    <div className="flex justify-end space-x-2 pt-2 border-t">
                        <button type="button" onClick={onClose} className="btn-secondary" disabled={submitting}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={submitting}>
                            {submitting ? 'Submitting…' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewSessionModal;
