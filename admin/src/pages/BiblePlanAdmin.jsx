import React, { useEffect, useState } from 'react';
import { BookOpen, Pencil, Plus, Trash2, X } from 'lucide-react';
import { buildBiblePlanPayload } from '../../../shared/contentModel';
import {
  createAdminItem,
  deleteAdminItem,
  listAdminItems,
  updateAdminItem,
} from '../api';

const initialState = {
  day: '',
  title: '',
  reference: '',
  summary: '',
};

export default function BiblePlanAdmin() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialState);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadItems = async () => {
    const payload = await listAdminItems('bible-plan');
    setItems(payload.items || []);
  };

  useEffect(() => {
    loadItems().catch(() => {});
  }, []);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const reset = () => {
    setForm(initialState);
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = buildBiblePlanPayload(form);

    if (editing) {
      await updateAdminItem('bible-plan', editing.id, payload);
    } else {
      await createAdminItem('bible-plan', payload);
    }

    await loadItems();
    reset();
  };

  const handleEdit = (item) => {
    setForm({
      day: String(item.day || ''),
      title: item.title || '',
      reference: item.reference || '',
      summary: item.summary || '',
    });
    setEditing(item);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this plan day?')) {
      await deleteAdminItem('bible-plan', id);
      await loadItems();
    }
  };

  return (
    <div className='page-grid'>
      <div className='page-header'>
        <div>
          <p className='eyebrow'>Bible Plan</p>
          <h2>Publish a reading journey that the mobile app can track day by day.</h2>
          <p>The admin now manages Bible plan data through the API instead of an empty placeholder collection.</p>
        </div>
        <button className='btn-primary' type='button' onClick={() => setShowForm((current) => !current)}>
          {showForm ? <X className='w-4 h-4' /> : <Plus className='w-4 h-4' />}
          {showForm ? 'Close form' : 'New day'}
        </button>
      </div>

      {showForm && (
        <form className='form-panel' onSubmit={handleSubmit}>
          <div className='form-grid'>
            <div className='field-stack'>
              <label>Day Number</label>
              <input className='field' type='number' min='1' max='365' value={form.day} onChange={(e) => setField('day', e.target.value)} required />
            </div>
            <div className='field-stack'>
              <label>Title</label>
              <input className='field' value={form.title} onChange={(e) => setField('title', e.target.value)} required />
            </div>
          </div>

          <div className='field-stack' style={{ marginTop: 16 }}>
            <label>Reference</label>
            <input className='field' placeholder='e.g. John 1-2' value={form.reference} onChange={(e) => setField('reference', e.target.value)} required />
          </div>

          <div className='field-stack' style={{ marginTop: 16 }}>
            <label>Summary</label>
            <textarea className='textarea' value={form.summary} onChange={(e) => setField('summary', e.target.value)} placeholder='Optional reflection or reading note for this day' />
          </div>

          <div className='button-row'>
            <button className='btn-primary' type='submit'>{editing ? 'Update day' : 'Publish day'}</button>
            <button className='btn-secondary' type='button' onClick={reset}>Reset</button>
          </div>
        </form>
      )}

      <div className='table-list'>
        {items.map((item) => (
          <div key={item.id} className='table-row'>
            <div>
              <div className='badge'>day {item.day}</div>
              <h4 style={{ marginTop: 12 }}>{item.title}</h4>
              <p>{item.reference}</p>
              <p>{item.summary || 'No summary provided.'}</p>
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
        {items.length === 0 && (
          <div className='empty-panel'>
            <BookOpen className='w-10 h-10 mx-auto mb-3' />
            No Bible plan days published yet.
          </div>
        )}
      </div>
    </div>
  );
}
