import React, { useEffect, useState } from 'react';
import { CalendarDays, Pencil, Plus, Trash2, X } from 'lucide-react';
import { buildEventPayload } from '../../../shared/contentModel';
import {
  createAdminItem,
  deleteAdminItem,
  listAdminItems,
  updateAdminItem,
} from '../api';

const initialState = {
  title: '',
  summary: '',
  location: '',
  category: 'service',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  registrationUrl: '',
  featured: false,
};

export default function Events() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(initialState);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadEvents = async () => {
    const payload = await listAdminItems('events');
    setEvents(payload.items || []);
  };

  useEffect(() => {
    loadEvents().catch(() => {});
  }, []);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const reset = () => {
    setForm(initialState);
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = buildEventPayload(form);

    if (editing) {
      await updateAdminItem('events', editing.id, payload);
    } else {
      await createAdminItem('events', payload);
    }

    await loadEvents();
    reset();
  };

  const handleEdit = (item) => {
    const startsAt = item.startsAt ? new Date(item.startsAt) : null;
    const endsAt = item.endsAt ? new Date(item.endsAt) : null;
    setForm({
      title: item.title || '',
      summary: item.summary || '',
      location: item.location || '',
      category: item.category || 'service',
      startDate: startsAt ? startsAt.toISOString().slice(0, 10) : '',
      startTime: startsAt ? startsAt.toISOString().slice(11, 16) : '',
      endDate: endsAt ? endsAt.toISOString().slice(0, 10) : '',
      endTime: endsAt ? endsAt.toISOString().slice(11, 16) : '',
      registrationUrl: item.registrationUrl || '',
      featured: !!item.featured,
    });
    setEditing(item);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this event?')) {
      await deleteAdminItem('events', id);
      await loadEvents();
    }
  };

  return (
    <div className='page-grid'>
      <div className='page-header'>
        <div>
          <p className='eyebrow'>Events</p>
          <h2>Publish gatherings with one clean date and time model.</h2>
          <p>These records now come from the new API and stay aligned with the mobile event cards.</p>
        </div>
        <button className='btn-primary' type='button' onClick={() => setShowForm((current) => !current)}>
          {showForm ? <X className='w-4 h-4' /> : <Plus className='w-4 h-4' />}
          {showForm ? 'Close form' : 'New event'}
        </button>
      </div>

      {showForm && (
        <form className='form-panel' onSubmit={handleSubmit}>
          <div className='form-grid'>
            <div className='field-stack'>
              <label>Title</label>
              <input className='field' value={form.title} onChange={(e) => setField('title', e.target.value)} required />
            </div>
            <div className='field-stack'>
              <label>Location</label>
              <input className='field' value={form.location} onChange={(e) => setField('location', e.target.value)} required />
            </div>
          </div>

          <div className='field-stack' style={{ marginTop: 16 }}>
            <label>Summary</label>
            <textarea className='textarea' value={form.summary} onChange={(e) => setField('summary', e.target.value)} required />
          </div>

          <div className='form-grid-3' style={{ marginTop: 16 }}>
            <div className='field-stack'>
              <label>Category</label>
              <select className='select' value={form.category} onChange={(e) => setField('category', e.target.value)}>
                <option value='service'>Service</option>
                <option value='community'>Community</option>
                <option value='conference'>Conference</option>
                <option value='youth'>Youth</option>
                <option value='special'>Special</option>
              </select>
            </div>
            <div className='field-stack'>
              <label>Start Date</label>
              <input className='field' type='date' value={form.startDate} onChange={(e) => setField('startDate', e.target.value)} required />
            </div>
            <div className='field-stack'>
              <label>Start Time</label>
              <input className='field' type='time' value={form.startTime} onChange={(e) => setField('startTime', e.target.value)} required />
            </div>
          </div>

          <div className='form-grid' style={{ marginTop: 16 }}>
            <div className='field-stack'>
              <label>End Date</label>
              <input className='field' type='date' value={form.endDate} onChange={(e) => setField('endDate', e.target.value)} />
            </div>
            <div className='field-stack'>
              <label>End Time</label>
              <input className='field' type='time' value={form.endTime} onChange={(e) => setField('endTime', e.target.value)} />
            </div>
          </div>

          <div className='field-stack' style={{ marginTop: 16 }}>
            <label>Registration URL</label>
            <input className='field' type='url' value={form.registrationUrl} onChange={(e) => setField('registrationUrl', e.target.value)} placeholder='https://...' />
          </div>

          <label className='checkbox-row'>
            <input type='checkbox' checked={form.featured} onChange={(e) => setField('featured', e.target.checked)} />
            Feature this event on the app
          </label>

          <div className='button-row'>
            <button className='btn-primary' type='submit'>{editing ? 'Update event' : 'Publish event'}</button>
            <button className='btn-secondary' type='button' onClick={reset}>Reset</button>
          </div>
        </form>
      )}

      <div className='table-list'>
        {events.map((item) => (
          <div key={item.id} className='table-row'>
            <div>
              <div className='badge'>{item.category}</div>
              <h4 style={{ marginTop: 12 }}>{item.title}</h4>
              <p>{item.location}</p>
              <p>{item.summary}</p>
            </div>
            <div className='icon-actions'>
              <button className='icon-button' type='button' onClick={() => handleEdit(item)}>
                <Pencil className='w-4 h-4' />
              </button>
              <button className='icon-button' type='button' onClick={() => handleDelete(item.id)}>
                <Trash2 className='w-4 h-4' />
              </button>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className='empty-panel'>
            <CalendarDays className='w-10 h-10 mx-auto mb-3' />
            No events published yet.
          </div>
        )}
      </div>
    </div>
  );
}
