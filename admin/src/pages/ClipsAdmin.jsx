import React, { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, Video, X } from 'lucide-react';
import { buildClipPayload, formatLongDateLabel } from '../../../shared/contentModel';
import MediaPreview from '../components/MediaPreview';
import {
  createAdminItem,
  deleteAdminItem,
  listAdminItems,
  updateAdminItem,
  uploadClipVideo,
} from '../api';

const initialState = {
  title: '',
  description: '',
  videoUrl: '',
  thumbnailUrl: '',
  publishedAt: '',
  featured: false,
};

export default function ClipsAdmin() {
  const [clips, setClips] = useState([]);
  const [form, setForm] = useState(initialState);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadClips = async () => {
    const payload = await listAdminItems('clips');
    setClips(payload.items || []);
  };

  useEffect(() => {
    loadClips().catch(() => {});
  }, []);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const reset = () => {
    setForm(initialState);
    setEditing(null);
    setShowForm(false);
    setVideoFile(null);
    setUploading(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setUploading(true);
    try {
      let uploadedVideoUrl = form.videoUrl;

      if (videoFile) {
        const uploadPayload = await uploadClipVideo(videoFile);
        uploadedVideoUrl = uploadPayload.url;
      }

      const payload = buildClipPayload({
        ...form,
        videoUrl: uploadedVideoUrl,
        publishedAt: form.publishedAt ? new Date(`${form.publishedAt}T08:00:00`).toISOString() : '',
      });

      if (editing) {
        await updateAdminItem('clips', editing.id, payload);
      } else {
        await createAdminItem('clips', payload);
      }

      await loadClips();
      reset();
    } catch (error) {
      window.alert(error.message || 'Could not save this clip.');
      setUploading(false);
    }
  };

  const handleEdit = (clip) => {
    setForm({
      title: clip.title || '',
      description: clip.description || '',
      videoUrl: clip.videoUrl || '',
      thumbnailUrl: clip.thumbnailUrl || '',
      publishedAt: clip.publishedAt ? new Date(clip.publishedAt).toISOString().slice(0, 10) : '',
      featured: !!clip.featured,
    });
    setEditing(clip);
    setShowForm(true);
    setVideoFile(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this clip?')) {
      await deleteAdminItem('clips', id);
      await loadClips();
    }
  };

  return (
    <div className='page-grid'>
      <div className='page-header'>
        <div>
          <p className='eyebrow'>Short Clips</p>
          <h2>Publish sharp short-form video without drifting away from the core content system.</h2>
          <p>Clips now read and write through the new Postgres API.</p>
        </div>
        <button className='btn-primary' type='button' onClick={() => setShowForm((current) => !current)}>
          {showForm ? <X className='w-4 h-4' /> : <Plus className='w-4 h-4' />}
          {showForm ? 'Close form' : 'New clip'}
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
              <label>Publish Date</label>
              <input className='field' type='date' value={form.publishedAt} onChange={(e) => setField('publishedAt', e.target.value)} required />
            </div>
          </div>

          <div className='field-stack' style={{ marginTop: 16 }}>
            <label>Description</label>
            <textarea className='textarea' value={form.description} onChange={(e) => setField('description', e.target.value)} required />
          </div>

          <div className='form-grid' style={{ marginTop: 16 }}>
            <div className='field-stack'>
              <label>Video URL</label>
              <input className='field' type='url' placeholder='https://youtube.com/watch?v=... or http://your-api/uploads/...' value={form.videoUrl} onChange={(e) => setField('videoUrl', e.target.value)} required />
              <p className='field-hint'>YouTube links and uploaded direct video files both play in the mobile app.</p>
            </div>
            <div className='field-stack'>
              <label>Thumbnail URL</label>
              <input className='field' type='url' placeholder='https://...' value={form.thumbnailUrl} onChange={(e) => setField('thumbnailUrl', e.target.value)} />
              <p className='field-hint'>Optional poster image for the app cards.</p>
            </div>
          </div>

          <div className='media-panel-grid' style={{ marginTop: 16 }}>
            <div className='upload-box'>
              <p className='upload-title'>Upload clip video</p>
              <p className='upload-copy'>Local MP4, MOV, M4V, and WEBM files are supported.</p>
              <input type='file' accept='video/mp4,video/quicktime,video/x-m4v,video/webm,video/*' onChange={(e) => setVideoFile(e.target.files[0] || null)} />
              {videoFile ? <p className='file-chip'>{videoFile.name}</p> : null}
            </div>
          </div>

          {form.videoUrl ? (
            <div className='preview-grid'>
              <MediaPreview type='video' url={form.videoUrl} label='Clip preview' />
            </div>
          ) : null}

          <label className='checkbox-row'>
            <input type='checkbox' checked={form.featured} onChange={(e) => setField('featured', e.target.checked)} />
            Feature this clip on the app
          </label>

          <div className='button-row'>
            <button className='btn-primary' type='submit' disabled={uploading}>{editing ? 'Update clip' : 'Publish clip'}</button>
            <button className='btn-secondary' type='button' onClick={reset}>Reset</button>
          </div>
        </form>
      )}

      <div className='table-list'>
        {clips.map((clip) => (
          <div key={clip.id} className='table-row'>
            <div>
              <div className='badge'>{clip.featured ? 'featured' : 'clip'}</div>
              <h4 style={{ marginTop: 12 }}>{clip.title}</h4>
              <p>{formatLongDateLabel(clip.publishedAt)}</p>
              <p>{clip.description}</p>
              <p className='muted' style={{ marginTop: 10 }}>{clip.thumbnailUrl ? 'Custom artwork' : 'No artwork yet'}</p>
            </div>
            <div className='icon-actions'>
              <button className='icon-button' type='button' onClick={() => handleEdit(clip)}>
                <Pencil className='w-4 h-4' />
              </button>
              <button className='icon-button' type='button' onClick={() => handleDelete(clip.id)}>
                <Trash2 className='w-4 h-4' />
              </button>
            </div>
          </div>
        ))}
        {clips.length === 0 && (
          <div className='empty-panel'>
            <Video className='w-10 h-10 mx-auto mb-3' />
            No clips published yet.
          </div>
        )}
      </div>
    </div>
  );
}
