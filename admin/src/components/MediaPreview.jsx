import React from 'react';
import { getVideoPlaybackKind, getYouTubeEmbedUrl } from '../../../shared/contentModel';

export default function MediaPreview({ type = 'video', url, label = 'Preview' }) {
  if (!url) return null;

  if (type === 'audio') {
    return (
      <div className='media-preview-shell'>
        <p className='media-preview-label'>{label}</p>
        <audio className='media-preview media-preview-audio' controls src={url} />
      </div>
    );
  }

  const kind = getVideoPlaybackKind(url);
  const embedUrl = kind === 'youtube' ? getYouTubeEmbedUrl(url) : '';

  return (
    <div className='media-preview-shell'>
      <p className='media-preview-label'>{label}</p>
      {kind === 'youtube' && embedUrl ? (
        <iframe
          className='media-preview'
          src={embedUrl}
          title='Video preview'
          allow='autoplay; fullscreen; picture-in-picture'
          allowFullScreen
        />
      ) : null}

      {kind === 'file' ? (
        <video className='media-preview' controls src={url} />
      ) : null}

      {kind === 'external' ? (
        <div className='media-preview-note'>
          This video will open as an external link because it is not a YouTube or direct video file URL.
        </div>
      ) : null}
    </div>
  );
}
