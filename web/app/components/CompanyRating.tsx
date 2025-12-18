'use client'

import { useState } from 'react';
import { addCompanyRating } from '@/app/actions/rating';

export default function CompanyRating({ companyId, companyName, user, path }: { companyId: string, companyName: string, user: any, path: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  if (!user) {
    return (
      <div className="rating-login-message" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
        <p>Pre pridanie hodnotenia sa musíte <a href="/login" style={{color: 'var(--primary-color)', fontWeight: 'bold'}}>prihlásiť</a>.</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      setMessage({ text: "Prosím, vyberte počet hviezdičiek.", type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    const result = await addCompanyRating(companyId, rating, note, path);
    setIsSubmitting(false);

    if (result.error) {
      setMessage({ text: result.error, type: 'error' });
    } else {
      setMessage({ text: "Hodnotenie bolo úspešne pridané.", type: 'success' });
      setRating(0);
      setNote("");
    }
  };

  return (
    <div className="add-rating-form" style={{ marginTop: '30px', padding: '20px', border: '1px solid #eee', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '15px' }}>Ohodnoťte {companyName}</h3>
        <div className="star-rating" style={{ marginBottom: '15px' }}>
            {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;
                return (
                    <span 
                        key={index}
                        className={`star ${ratingValue <= (hover || rating) ? 'filled' : ''}`}
                        onClick={() => setRating(ratingValue)}
                        onMouseEnter={() => setHover(ratingValue)}
                        onMouseLeave={() => setHover(0)}
                        style={{ 
                            cursor: 'pointer', 
                            fontSize: '32px', 
                            color: ratingValue <= (hover || rating) ? '#ffc107' : '#e4e5e9',
                            marginRight: '5px'
                        }}
                    >
                        ★
                    </span>
                );
            })}
        </div>
        <textarea 
            placeholder="Napíšte vašu skúsenosť (voliteľné)..." 
            value={note} 
            onChange={(e) => setNote(e.target.value)}
            className="rating-note"
            rows={3}
            style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: '8px', 
                border: '1px solid #ddd',
                fontFamily: 'inherit',
                fontSize: '14px',
                resize: 'vertical'
            }}
        />
        <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="btn-primary"
                style={{ 
                    padding: '10px 20px',
                    backgroundColor: 'var(--primary-color, #000)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1
                }}
            >
                {isSubmitting ? 'Odosielam...' : 'Pridať hodnotenie'}
            </button>
            {message && (
                <div className={`message ${message.type}`} style={{ color: message.type === 'error' ? '#dc3545' : '#28a745', fontWeight: 500 }}>
                    {message.text}
                </div>
            )}
        </div>
    </div>
  );
}
