import React, { useEffect, useState } from 'react';
import { BookOpen, Pencil, Plus, Trash2, X } from 'lucide-react';
import { buildDevotionPayload, formatLongDateLabel } from '../../../shared/contentModel';
import {
  createAdminItem,
  deleteAdminItem,
  listAdminItems,
  updateAdminItem,
} from '../api';

const initialState = {
  title: '',
  reference: '',
  scriptureText: '',
  body: '',
  prayer: '',
  publishedAt: '',
  featured: false,
};

export default function DevotionsAdmin() {
  const [devotions, setDevotions] = useState([]);
  const [form, setForm] = useState(initialState);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadDevotions = async () => {
    const payload = await listAdminItems('devotions');
    setDevotions(payload.items || []);
  };

  useEffect(() => {
    loadDevotions().catch(() => {});
  }, []);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const reset = () => {
    setForm(initialState);
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = buildDevotionPayload({
      ...form,
      publishedAt: form.publishedAt ? new Date(`${form.publishedAt}T08:00:00`).toISOString() : '',
    });

    if (editing) {
      await updateAdminItem('devotions', editing.id, payload);
    } else {
      await createAdminItem('devotions', payload);
    }

    await loadDevotions();
    reset();
  };

  const handleEdit = (devotion) => {
    setForm({
      title: devotion.title || '',
      reference: devotion.reference || '',
      scriptureText: devotion.scriptureText || '',
      body: devotion.body || '',
      prayer: devotion.prayer || '',
      publishedAt: devotion.publishedAt ? new Date(devotion.publishedAt).toISOString().slice(0, 10) : '',
      featured: !!devotion.featured,
    });
    setEditing(devotion);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this devotion?')) {
      await deleteAdminItem('devotions', id);
      await loadDevotions();
    }
  };

  return (
    <div className='page-grid'>
      <div className='page-header'>
        <div>
          <p className='eyebrow'>Devotions</p>
          <h2>Shape daily reading with scripture, reflection, and prayer in one record.</h2>
          <p>The mobile app now reads these from the Postgres API with the same schema.</p>
        </div>
        <button className='btn-primary' type='button' onClick={() => setShowForm((current) => !current)}>
          {showForm ? <X className='w-4 h-4' /> : <Plus className='w-4 h-4' />}
          {showForm ? 'Close form' : 'New devotion'}
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
              <label>Reference</label>
              <input className='field' placeholder='e.g. Psalm 23:1-4' value={form.reference} onChange={(e) => setField('reference', e.target.value)} required />
            </div>
          </div>

          <div className='form-grid' style={{ marginTop: 16 }}>
            <div className='field-stack'>
              <label>Publish Date</label>
              <input className='field' type='date' value={form.publishedAt} onChange={(e) => setField('publishedAt', e.target.value)} required />
            </div>
            <div className='field-stack'>
              <label>Feature Slot</label>
              <label className='checkbox-row' style={{ marginTop: 10 }}>
                <input type='checkbox' checked={form.featured} onChange={(e) => setField('featured', e.target.checked)} />
                Highlight this devotion on the app
              </label>
            </div>
          </div>

          <div className='field-stack' style={{ marginTop: 16 }}>
            <label>Scripture Text</label>
            <textarea className='textarea' value={form.scriptureText} onChange={(e) => setField('scriptureText', e.target.value)} required />
          </div>

          <div className='field-stack' style={{ marginTop: 16 }}>
            <label>Reflection Body</label>
            <textarea className='textarea' value={form.body} onChange={(e) => setField('body', e.target.value)} required />
          </div>

          <div className='field-stack' style={{ marginTop: 16 }}>
            <label>Closing Prayer</label>
            <textarea className='textarea' value={form.prayer} onChange={(e) => setField('prayer', e.target.value)} required />
          </div>

          <div className='button-row'>
            <button className='btn-primary' type='submit'>{editing ? 'Update devotion' : 'Publish devotion'}</button>
            <button className='btn-secondary' type='button' onClick={reset}>Reset</button>
          </div>
        </form>
      )}

      <div className='table-list'>
        {devotions.map((devotion) => (
          <div key={devotion.id} className='table-row'>
            <div>
              <div className='badge'>{devotion.featured ? 'featured' : 'devotion'}</div>
              <h4 style={{ marginTop: 12 }}>{devotion.title}</h4>
              <p>{devotion.reference}</p>
              <p>{formatLongDateLabel(devotion.publishedAt)}</p>
              <p>{devotion.body}</p>
            </div>
            <div className='icon-actions'>
              <button className='icon-button' type='button' onClick={() => handleEdit(devotion)}>
                <Pencil className='w-4 h-4' />
              </button>
              <button className='icon-button' type='button' onClick={() => handleDelete(devotion.id)}>
                <Trash2 className='w-4 h-4' />
              </button>
            </div>
          </div>
        ))}
        {devotions.length === 0 && (
          <div className='empty-panel'>
            <BookOpen className='w-10 h-10 mx-auto mb-3' />
            No devotions published yet.
          </div>
        )}
      </div>
    </div>
  );
}
