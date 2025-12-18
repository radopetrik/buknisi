'use client';

import { useState } from 'react';
import { registerCompany } from './actions';
import CitySelector, { City } from '../components/CitySelector';

export default function RegistrationForm({ cities, categories }: { cities: any[], categories: any[] }) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('register');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    
    if (selectedCity) {
        formData.set('city', selectedCity.id);
    } else {
        setError("Prosím vyberte mesto.");
        setLoading(false);
        return;
    }

    const result = await registerCompany(formData);
    
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-tabs">
        <button 
          className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
          onClick={() => setActiveTab('login')}
          type="button"
        >
          Prihlásenie
        </button>
        <button 
          className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
          onClick={() => setActiveTab('register')}
          type="button"
        >
          Registrácia firmy
        </button>
      </div>

      <div className="auth-content">
        {activeTab === 'login' ? (
          <div className="login-placeholder">
             <h2>Prihlásenie pre firmy</h2>
             <p>Pre správu vašej firmy prejdite do administračnej aplikácie.</p>
             <div style={{marginTop: '20px'}}>
                <a href="https://admin.buknisi.sk" className="btn-primary" target="_blank">Prejsť do adminu</a>
             </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="register-form">
            <h2>Nová registrácia firmy</h2>
            {error && <div className="error-msg">{error}</div>}
            
            <div className="form-group">
              <label>Názov firmy</label>
              <input name="companyName" type="text" required placeholder="Napr. Salón Krása" />
            </div>

            <div className="form-group">
              <label>Email (Login)</label>
              <input name="email" type="email" required placeholder="vas@email.com" />
            </div>

            <div className="form-group">
              <label>Heslo</label>
              <input name="password" type="password" required minLength={6} placeholder="******" />
            </div>

            <div className="form-group">
              <label>Kategória</label>
              <select name="category" required>
                <option value="">Vyberte kategóriu</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Mesto</label>
               <div style={{border: '1px solid #ddd', borderRadius: '8px', padding: '0 12px'}}>
                <CitySelector 
                    cities={cities} 
                    onSelect={setSelectedCity} 
                    placeholder="Začnite písať mesto..."
                />
               </div>
            </div>

            <div className="form-group">
              <label>Adresa</label>
              <input name="address" type="text" required placeholder="Ulica a číslo" />
            </div>

            <div style={{marginTop: '30px'}}>
                <button type="submit" className="btn-primary full-width" disabled={loading}>
                {loading ? 'Ukladám...' : 'Uložiť a vytvoriť'}
                </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
