import React, { useEffect, useState } from 'react';
import { Clapperboard, Pencil, Plus, Trash2, X } from 'lucide-react';
import { buildSermonPayload } from '../../../shared/contentModel';
import MediaPreview from '../components/MediaPreview';
import {
  createAdminItem,
  deleteAdminItem,
  listAdminItems,
  updateAdminItem,
  uploadSermonAudio,
  uploadSermonVideo,
} from '../api';

const initialState = {
  title: '',
  speaker: '',
  summary: '',
  publishedAt: '',
  durationLabel: '',
  audioUrl: '',
  videoUrl: '',
  artworkUrl: '',
  tags: '',
  featured: false,
};

export default function Sermons() {
  const [sermons, setSermons] = useState([]);
  const [form, setForm] = useState(initialState);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadSermons = async () => {
    const payload = await listAdminItems('sermons');
    setSermons(payload.items || []);
  };

  useEffect(() => {
    loadSermons().catch(() => {});
  }, []);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const reset = () => {
    setForm(initialState);
    setEditing(null);
    setShowForm(false);
    setAudioFile(null);
    setVideoFile(null);
    setUploading(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setUploading(true);
    try {
      let uploadedAudioUrl = form.audioUrl;
      let uploadedVideoUrl = form.videoUrl;

      if (audioFile) {
        const uploadPayload = await uploadSermonAudio(audioFile);
        uploadedAudioUrl = uploadPayload.url;
      }

      if (videoFile) {
        const uploadPayload = await uploadSermonVideo(videoFile);
        uploadedVideoUrl = uploadPayload.url;
      }

      const payload = buildSermonPayload({
        ...form,
        audioUrl: uploadedAudioUrl,
        videoUrl: uploadedVideoUrl,
        publishedAt: form.publishedAt ? new Date(`${form.publishedAt}T08:00:00`).toISOString() : '',
      });

      if (editing) {
        await updateAdminItem('sermons', editing.id, payload);
      } else {
        await createAdminItem('sermons', payload);
      }

      await loadSermons();
      reset();
    } catch (error) {
      window.alert(error.message || 'Could not save this sermon.');
      setUploading(false);
    }
  };

  const handleEdit = (sermon) => {
    setForm({
      title: sermon.title || '',
      speaker: sermon.speaker || '',
      summary: sermon.summary || '',
      publishedAt: sermon.publishedAt ? new Date(sermon.publishedAt).toISOString().slice(0, 10) : '',
      durationLabel: sermon.durationLabel || '',
      audioUrl: sermon.audioUrl || '',
      videoUrl: sermon.videoUrl || '',
      artworkUrl: sermon.artworkUrl || '',
      tags: Array.isArray(sermon.tags) ? sermon.tags.join(', ') : '',
      featured: !!sermon.featured,
    });
    setEditing(sermon);
    setShowForm(true);
    setAudioFile(null);
    setVideoFile(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this sermon?')) {
      await deleteAdminItem('sermons', id);
      await loadSermons();
    }
  };

  return (
    <div className='page-grid'>
      <div className='page-header'>
        <div>
          <p className='eyebrow'>Sermons</p>
          <h2>Publish audio sermons, video sermons, and hybrid messages.</h2>
          <p>The admin now writes to the Postgres API instead of Firebase.</p>
        </div>
        <button className='btn-primary' type='button' onClick={() => setShowForm((current) => !current)}>
          {showForm ? <X className='w-4 h-4' /> : <Plus className='w-4 h-4' />}
          {showForm ? 'Close form' : 'New sermon'}
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
              <label>Speaker</label>
              <input className='field' value={form.speaker} onChange={(e) => setField('speaker', e.target.value)} required />
            </div>
          </div>

          <div className='form-grid' style={{ marginTop: 16 }}>
            <div className='field-stack'>
              <label>Publish Date</label>
              <input className='field' type='date' value={form.publishedAt} onChange={(e) => setField('publishedAt', e.target.value)} required />
            </div>
            <div className='field-stack'>
              <label>Duration Label</label>
              <input className='field' placeholder='e.g. 48 min' value={form.durationLabel} onChange={(e) => setField('durationLabel', e.target.value)} />
            </div>
          </div>

          <div className='field-stack' style={{ marginTop: 16 }}>
            <label>Summary</label>
            <textarea className='textarea' value={form.summary} onChange={(e) => setField('summary', e.target.value)} required />
          </div>

          <div className='form-grid' style={{ marginTop: 16 }}>
            <div className='field-stack'>
              <label>Audio URL</label>
              <input className='field' type='url' placeholder='http://... or https://...' value={form.audioUrl} onChange={(e) => setField('audioUrl', e.target.value)} />
              <p className='field-hint'>Paste a hosted audio link or upload a file below.</p>
            </div>
            <div className='field-stack'>
              <label>Video URL</label>
              <input className='field' type='url' placeholder='https://youtube.com/watch?v=... or http://your-api/uploads/...' value={form.videoUrl} onChange={(e) => setField('videoUrl', e.target.value)} />
              <p className='field-hint'>YouTube, direct MP4 links, and uploaded local videos all work.</p>
            </div>
          </div>

          <div className='form-grid' style={{ marginTop: 16 }}>
            <div className='field-stack'>
              <label>Artwork URL</label>
              <input className='field' type='url' placeholder='https://...' value={form.artworkUrl} onChange={(e) => setField('artworkUrl', e.target.value)} />
            </div>
            <div className='field-stack'>
              <label>Tags</label>
              <input className='field' placeholder='faith, discipleship, worship' value={form.tags} onChange={(e) => setField('tags', e.target.value)} />
            </div>
          </div>

          <div className='media-panel-grid' style={{ marginTop: 16 }}>
            <div className='upload-box'>
              <p className='upload-title'>Upload sermon audio</p>
              <p className='upload-copy'>Recommended for MP3, M4A, WAV, and AAC files.</p>
              <input type='file' accept='audio/*' onChange={(e) => setAudioFile(e.target.files[0] || null)} />
              {audioFile ? <p className='file-chip'>{audioFile.name}</p> : null}
            </div>

            <div className='upload-box'>
              <p className='upload-title'>Upload sermon video</p>
              <p className='upload-copy'>Use local MP4, MOV, M4V, or WEBM files when you do not want to paste a YouTube link.</p>
              <input type='file' accept='video/mp4,video/quicktime,video/x-m4v,video/webm,video/*' onChange={(e) => setVideoFile(e.target.files[0] || null)} />
              {videoFile ? <p className='file-chip'>{videoFile.name}</p> : null}
            </div>
          </div>

          {(form.audioUrl || form.videoUrl) ? (
            <div className='preview-grid'>
              {form.audioUrl ? <MediaPreview type='audio' url={form.audioUrl} label='Audio preview' /> : null}
              {form.videoUrl ? <MediaPreview type='video' url={form.videoUrl} label='Video preview' /> : null}
            </div>
          ) : null}

          <label className='checkbox-row'>
            <input type='checkbox' checked={form.featured} onChange={(e) => setField('featured', e.target.checked)} />
            Feature this sermon on the app
          </label>

          <div className='button-row'>
            <button className='btn-primary' type='submit' disabled={uploading}>
              {editing ? 'Update sermon' : 'Publish sermon'}
            </button>
            <button className='btn-secondary' type='button' onClick={reset}>Reset</button>
          </div>
        </form>
      )}

      <div className='table-list'>
        {sermons.map((sermon) => (
          <div key={sermon.id} className='table-row'>
            <div>
              <div className='badge'>{sermon.mediaType || 'audio'}</div>
              <h4 style={{ marginTop: 12 }}>{sermon.title}</h4>
              <p>{sermon.speaker}</p>
              <p>{sermon.summary}</p>
              <p className='muted' style={{ marginTop: 10 }}>
                {sermon.videoUrl ? 'Video ready' : 'No video'}
                {sermon.audioUrl ? ' • Audio ready' : ' • No audio'}
              </p>
            </div>
            <div className='icon-actions'>
              <button className='icon-button' type='button' onClick={() => handleEdit(sermon)}>
                <Pencil className='w-4 h-4' />
              </button>
              <button className='icon-button' type='button' onClick={() => handleDelete(sermon.id)}>
                <Trash2 className='w-4 h-4' />
              </button>
            </div>
          </div>
        ))}
        {sermons.length === 0 && (
          <div className='empty-panel'>
            <Clapperboard className='w-10 h-10 mx-auto mb-3' />
            No sermons published yet.
          </div>
        )}
      </div>
    </div>
  );
}
