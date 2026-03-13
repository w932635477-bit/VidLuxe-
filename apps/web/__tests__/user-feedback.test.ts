import { submitFeedback, getFeedback, getAverageRating, type FeedbackEntry } from '../lib/user-feedback';

describe('User Feedback System', () => {
  it('should submit feedback', async () => {
    const feedback = await submitFeedback({
      userId: 'user-1',
      imageId: 'img-1',
      rating: 4,
      comment: 'Great quality'
    });
    expect(feedback).toHaveProperty('id');
    expect(feedback.rating).toBe(4);
  });

  it('should retrieve feedback', async () => {
    await submitFeedback({
      userId: 'user-2',
      imageId: 'img-2',
      rating: 5,
      comment: 'Excellent'
    });
    const feedback = await getFeedback('img-2');
    expect(feedback.length).toBeGreaterThan(0);
  });
});
