import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sermons from './pages/Sermons';
import Events from './pages/Events';
import BiblePlanAdmin from './pages/BiblePlanAdmin';
import Settings from './pages/Settings';
import GroupsAdmin from './pages/GroupsAdmin';
import DevotionsAdmin from './pages/DevotionsAdmin';
import ClipsAdmin from './pages/ClipsAdmin';
import Layout from './components/Layout';
import { clearAdminToken, fetchCurrentAdmin } from './api';
import { ADMIN_NAME } from './branding';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    setLoading(true);
    try {
      const payload = await fetchCurrentAdmin();
      setUser(payload.user || null);
    } catch (_error) {
      clearAdminToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const handleLogout = () => {
    clearAdminToken();
    setUser(null);
  };

  if (loading) {
    return (
      <div className='screen-shell'>
        <div className='panel glass-panel center-panel'>
          <p className='eyebrow'>{ADMIN_NAME}</p>
          <h1>Loading console</h1>
          <p className='muted'>Checking authentication and admin access.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={loadUser} />;
  }

  if (user.role !== 'admin' || user.isActive !== true) {
    return (
      <div className='screen-shell'>
        <div className='panel glass-panel center-panel'>
          <p className='eyebrow'>Access Required</p>
          <h1>This account is not an active admin.</h1>
          <p className='muted'>
            Update the user record in Postgres so the account has <code>role = admin</code> and <code>is_active = true</code>.
          </p>
          <p className='muted'>Signed in as {user.email}</p>
          <button className='btn-secondary' type='button' onClick={handleLogout}>Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <Routes>
        <Route path='/' element={<Dashboard />} />
        <Route path='/sermons' element={<Sermons />} />
        <Route path='/events' element={<Events />} />
        <Route path='/bible-plan' element={<BiblePlanAdmin />} />
        <Route path='/groups' element={<GroupsAdmin />} />
        <Route path='/devotions' element={<DevotionsAdmin />} />
        <Route path='/clips' element={<ClipsAdmin />} />
        <Route path='/settings' element={<Settings />} />
        <Route path='*' element={<Navigate to='/' />} />
      </Routes>
    </Layout>
  );
}
