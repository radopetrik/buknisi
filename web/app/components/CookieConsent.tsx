'use client';

import { useState, useEffect } from 'react';
import styles from './CookieConsent.module.css';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <p className={styles.text}>
          Táto stránka používa cookies na zlepšenie vášho zážitku. Používaním stránky súhlasíte s ich používaním.
        </p>
        <button onClick={handleAccept} className={styles.button}>
          Rozumiem
        </button>
      </div>
    </div>
  );
}
