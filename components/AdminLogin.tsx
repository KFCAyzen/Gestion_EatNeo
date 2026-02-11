'use client'

import React, { useState } from 'react';
import '@/styles/AdminLogin.css'
import '@/styles/Auth.css' 

interface AdminLoginProps {
  onLogin: (username: string, password: string) => Promise<boolean>
  onClose?: () => void
}

export default function AdminLogin({ onLogin, onClose }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const ok = await onLogin(username, password)
    if (ok) {
      // Connexion réussie
    } else {
      setError('Identifiants incorrects');
    }
  };

  return (
    <div className="admin-login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Administration</h1>
          <p>Eat Neo - Back Office</p>
        </div>
        
        <form onSubmit={handleLogin} className="admin-login-form">
          <div className="input-group">
            <label htmlFor="username">Email (ou identifiant hors ligne)</label>
            <input
              id="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin@domaine.com"
              type="text"
              required
              className="form-input"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              required
              className="form-input"
            />
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <div className="login-actions">
            <button type="submit" className="login-btn">
              Se connecter
            </button>
            {onClose && (
              <button type="button" onClick={onClose} className="cancel-btn">
                Annuler
              </button>
            )}
          </div>
          

        </form>
      </div>
    </div>
  );
}
