import React, { useState } from 'react';

interface BookFlightButtonProps {
  groupId: string;
  bookingUrl: string;
}

const BookFlightButton: React.FC<BookFlightButtonProps> = ({ groupId, bookingUrl }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bookFlightAndRedirect = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Trigger booking on Railway
      const triggerResponse = await fetch('/api/book-flights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, booking_url: bookingUrl })
      });
      if (!triggerResponse.ok) {
        setError('Failed to start booking process. Please try again.');
        setLoading(false);
        return;
      }
      // 2. Poll for payment_link (every 5s, up to 2 minutes)
      const maxAttempts = 24;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (attempt > 0) {
          await new Promise(res => setTimeout(res, 5000));
        }
        const pollRes = await fetch('/api/check-payment-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupId })
        });
        const pollData = await pollRes.json();
        if (pollData.payment_link) {
          window.location.href = pollData.payment_link;
          return;
        }
      }
      setError('Payment link not available after 2 minutes. Please try again later.');
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={bookFlightAndRedirect}
        disabled={loading}
        className={`px-6 py-3 rounded-lg font-semibold ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
      >
        {loading ? 'Processing...' : 'Book Flight'}
      </button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
};

export default BookFlightButton; 