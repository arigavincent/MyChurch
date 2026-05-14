import React, { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, Users, X } from 'lucide-react';
import { buildGroupPayload } from '../../../shared/contentModel';
import {
  createAdminItem,
  deleteAdminItem,
  listAdminItems,
  updateAdminItem,
} from '../api';

const initialState = {
  name: '',
  leader: '',
  description: '',
  meetingTimeLabel: '',
  location: '',
  contactPhone: '',
  category: 'community',
  featured: false,
};

export default function GroupsAdmin() {
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState(initialState);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadGroups = async () => {
    const payload = await listAdminItems('groups');
    setGroups(payload.items || []);
  };

  useEffect(() => {
    loadGroups().catch(() => {});
  }, []);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const reset = () => {
    setForm(initialState);
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = buildGroupPayload(form);

    if (editing) {
      await updateAdminItem('groups', editing.id, payload);
    } else {
      await createAdminItem('groups', payload);
    }

    await loadGroups();
    reset();
  };

  const handleEdit = (group) => {
    setForm({
      name: group.name || '',
      leader: group.leader || '',
      description: group.description || '',
      meetingTimeLabel: group.meetingTimeLabel || '',
      location: group.location || '',
      contactPhone: group.contactPhone || '',
      category: group.category || 'community',
      featured: !!group.featured,
    });
    setEditing(group);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this group?')) {
      await deleteAdminItem('groups', id);
      await loadGroups();
    }
  };

  return (
    <div className='page-grid'>
      <div className='page-header'>
        <div>
          <p className='eyebrow'>Groups</p>
          <h2>Move people from watching to belonging with structured community groups.</h2>
          <p>Every group now persists in Postgres and serves the same shape to mobile.</p>
        </div>
        <button className='btn-primary' type='button' onClick={() => setShowForm((current) => !current)}>
          {showForm ? <X className='w-4 h-4' /> : <Plus className='w-4 h-4' />}
          {showForm ? 'Close form' : 'New group'}
        </button>
      </div>

      {showForm && (
        <form className='form-panel' onSubmit={handleSubmit}>
          <div className='form-grid'>
            <div className='field-stack'>
              <label>Group Name</label>
              <input className='field' value={form.name} onChange={(e) => setField('name', e.target.value)} required />
            </div>
            <div className='field-stack'>
              <label>Leader</label>
              <input className='field' value={form.leader} onChange={(e) => setField('leader', e.target.value)} required />
            </div>
          </div>

          <div className='field-stack' style={{ marginTop: 16 }}>
            <label>Description</label>
            <textarea className='textarea' value={form.description} onChange={(e) => setField('description', e.target.value)} required />
          </div>

          <div className='form-grid-3' style={{ marginTop: 16 }}>
            <div className='field-stack'>
              <label>Meeting Time</label>
              <input className='field' placeholder='e.g. Wednesdays • 7:00 PM' value={form.meetingTimeLabel} onChange={(e) => setField('meetingTimeLabel', e.target.value)} required />
            </div>
            <div className='field-stack'>
              <label>Location</label>
              <input className='field' value={form.location} onChange={(e) => setField('location', e.target.value)} required />
            </div>
            <div className='field-stack'>
              <label>Contact Phone</label>
              <input className='field' placeholder='2547...' value={form.contactPhone} onChange={(e) => setField('contactPhone', e.target.value)} />
            </div>
          </div>

          <div className='form-grid' style={{ marginTop: 16 }}>
            <div className='field-stack'>
              <label>Category</label>
              <select className='select' value={form.category} onChange={(e) => setField('category', e.target.value)}>
                <option value='community'>Community</option>
                <option value='care'>Care</option>
                <option value='youth'>Youth</option>
                <option value='men'>Men</option>
                <option value='women'>Women</option>
              </select>
            </div>
            <div className='field-stack'>
              <label>Feature Slot</label>
              <label className='checkbox-row' style={{ marginTop: 10 }}>
                <input type='checkbox' checked={form.featured} onChange={(e) => setField('featured', e.target.checked)} />
                Prioritize this group in the app
              </label>
            </div>
          </div>

          <div className='button-row'>
            <button className='btn-primary' type='submit'>{editing ? 'Update group' : 'Publish group'}</button>
            <button className='btn-secondary' type='button' onClick={reset}>Reset</button>
          </div>
        </form>
      )}

      <div className='table-list'>
        {groups.map((group) => (
          <div key={group.id} className='table-row'>
            <div>
              <div className='badge'>{group.category || 'community'}</div>
              <h4 style={{ marginTop: 12 }}>{group.name}</h4>
              <p>{group.leader}</p>
              <p>{group.meetingTimeLabel} • {group.location}</p>
              <p>{group.description}</p>
            </div>
            <div className='icon-actions'>
              <button className='icon-button' type='button' onClick={() => handleEdit(group)}>
                <Pencil className='w-4 h-4' />
              </button>
              <button className='icon-button' type='button' onClick={() => handleDelete(group.id)}>
                <Trash2 className='w-4 h-4' />
              </button>
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <div className='empty-panel'>
            <Users className='w-10 h-10 mx-auto mb-3' />
            No groups published yet.
          </div>
        )}
      </div>
    </div>
  );
}
