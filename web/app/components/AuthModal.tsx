'use client'

import { useBooking } from './BookingContext'
import LoginForm from '../login/LoginForm'

export default function AuthModal() {
    const { state, setAuthModalOpen } = useBooking()

    if (!state.isAuthModalOpen) return null

    return (
        <div className="modal-overlay" onClick={() => setAuthModalOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={() => setAuthModalOpen(false)}>×</button>
                <div style={{padding: '20px'}}>
                    <LoginForm 
                        onSuccess={() => setAuthModalOpen(false)} 
                        message="Pre dokončenie rezervácie sa musíte prihlásiť alebo zaregistrovať."
                    />
                </div>

            </div>
            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    backdrop-filter: blur(4px);
                }
                .modal-content {
                    background: white;
                    border-radius: 12px;
                    width: 100%;
                    max-width: 420px;
                    position: relative;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    animation: slideUp 0.3s ease-out;
                }
                .close-btn {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #999;
                    z-index: 10;
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    )
}
