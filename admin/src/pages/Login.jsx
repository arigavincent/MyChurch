import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { loginAdmin } from '../api';
import { ADMIN_NAME, BRAND_NAME } from '../branding';

const BRAND_LOGO_URL = `${import.meta.env.BASE_URL}brand-logo.jpg`;

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await loginAdmin(email.trim(), password);
      await onLogin();
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='login-shell'>
      <div className='panel login-card'>
        <div className='login-brand'>
          <img className='login-logo' src={BRAND_LOGO_URL} alt={BRAND_NAME} />
          <div>
            <p className='eyebrow'>{ADMIN_NAME}</p>
            <h2 className='login-brand-name'>{BRAND_NAME}</h2>
          </div>
        </div>
        <h1>Publish the experience people will actually use.</h1>
        <p className='muted' style={{ marginBottom: 24 }}>
          Sign in with a Postgres-backed admin account.
        </p>

        {error ? <div className='error-banner'>{error}</div> : null}

        <form onSubmit={handleLogin} className='page-grid'>
          <div className='field-stack'>
            <label>Email</label>
            <input
              type='email'
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className='field'
              placeholder='ariga.dev@gmail.com'
              required
            />
          </div>
          <div className='field-stack'>
            <label>Password</label>
            <input
              type='password'
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className='field'
              placeholder='••••••••'
              required
            />
          </div>
          <button
            type='submit'
            disabled={loading}
            className='btn-primary'
            style={{ width: '100%', padding: '14px 18px' }}
          >
            {loading ? (
              <span className='flex items-center gap-2'>
                <span className='w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin' />
                Signing in...
              </span>
            ) : (
              <span className='flex items-center gap-2'>
                <LogIn className='w-4 h-4' />
                Sign In
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
