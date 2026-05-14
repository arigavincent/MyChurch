import React, { useEffect, useState } from 'react';
import { Church, Radio, Save, Sparkles } from 'lucide-react';
import { buildAppConfigPayload, buildVerseOfDayPayload } from '../../../shared/contentModel';
import { BRAND_NAME, resolveChurchName } from '../branding';
import {
  fetchAdminAppConfig,
  fetchAdminVerseOfDay,
  saveAdminAppConfig,
  saveAdminVerseOfDay,
} from '../api';

const initialAppForm = {
  churchName: BRAND_NAME,
  tagline: '',
  city: '',
  country: '',
  primaryContactEmail: '',
  primaryContactPhone: '',
  address: '',
  youtubeUrl: '',
  instagramUrl: '',
  facebookUrl: '',
  whatsappUrl: '',
  liveStreamId: '',
  liveStreamEnabled: false,
  heroHeadline: '',
  heroSubheadline: '',
};

const initialVerseForm = {
  text: '',
  reference: '',
  theme: '',
};

export default function Settings() {
  const [appForm, setAppForm] = useState(initialAppForm);
  const [verseForm, setVerseForm] = useState(initialVerseForm);
  const [savingApp, setSavingApp] = useState(false);
  const [savingVerse, setSavingVerse] = useState(false);
  const [appSaved, setAppSaved] = useState(false);
  const [verseSaved, setVerseSaved] = useState(false);

  useEffect(() => {
    Promise.all([fetchAdminAppConfig(), fetchAdminVerseOfDay()])
      .then(([configPayload, versePayload]) => {
        if (configPayload.config) {
          setAppForm((current) => ({
            ...current,
            ...configPayload.config,
            churchName: resolveChurchName(configPayload.config.churchName),
          }));
        }
        if (versePayload.verse) {
          setVerseForm((current) => ({ ...current, ...versePayload.verse }));
        }
      })
      .catch(() => {});
  }, []);

  const setAppField = (field, value) => setAppForm((current) => ({ ...current, [field]: value }));
  const setVerseField = (field, value) => setVerseForm((current) => ({ ...current, [field]: value }));

  const flashSaved = (setter) => {
    setter(true);
    window.setTimeout(() => setter(false), 2400);
  };

  const handleSaveApp = async (event) => {
    event.preventDefault();
    setSavingApp(true);
    try {
      const payload = buildAppConfigPayload(appForm);
      await saveAdminAppConfig(payload);
      flashSaved(setAppSaved);
    } finally {
      setSavingApp(false);
    }
  };

  const handleSaveVerse = async (event) => {
    event.preventDefault();
    setSavingVerse(true);
    try {
      const payload = buildVerseOfDayPayload(verseForm);
      await saveAdminVerseOfDay(payload);
      flashSaved(setVerseSaved);
    } finally {
      setSavingVerse(false);
    }
  };

  return (
    <div className='page-grid'>
      <div className='page-header'>
        <div>
          <p className='eyebrow'>Settings</p>
          <h2>Control the church’s identity, hero language, and live stream from one durable config surface.</h2>
          <p>These documents now live in Postgres and drive the mobile app through the API.</p>
        </div>
      </div>

      <form className='form-panel' onSubmit={handleSaveApp}>
        <div className='page-header' style={{ marginBottom: 20 }}>
          <div>
            <p className='eyebrow'>App Identity</p>
            <h2 style={{ fontSize: 22, lineHeight: '30px' }}>Church profile, hero content, contact surface, and stream controls.</h2>
          </div>
          <div className='badge'>
            <Church className='w-4 h-4' />
            Core config
          </div>
        </div>

        <div className='form-grid'>
          <div className='field-stack'>
            <label>Church Name</label>
            <input className='field' value={appForm.churchName} onChange={(e) => setAppField('churchName', e.target.value)} required />
          </div>
          <div className='field-stack'>
            <label>Tagline</label>
            <input className='field' value={appForm.tagline} onChange={(e) => setAppField('tagline', e.target.value)} placeholder='A short phrase that frames the ministry voice' />
          </div>
        </div>

        <div className='form-grid' style={{ marginTop: 16 }}>
          <div className='field-stack'>
            <label>City</label>
            <input className='field' value={appForm.city} onChange={(e) => setAppField('city', e.target.value)} />
          </div>
          <div className='field-stack'>
            <label>Country</label>
            <input className='field' value={appForm.country} onChange={(e) => setAppField('country', e.target.value)} />
          </div>
        </div>

        <div className='field-stack' style={{ marginTop: 16 }}>
          <label>Hero Headline</label>
          <input className='field' value={appForm.heroHeadline} onChange={(e) => setAppField('heroHeadline', e.target.value)} placeholder='The large statement used on the mobile home screen' />
        </div>

        <div className='field-stack' style={{ marginTop: 16 }}>
          <label>Hero Subheadline</label>
          <textarea className='textarea' value={appForm.heroSubheadline} onChange={(e) => setAppField('heroSubheadline', e.target.value)} placeholder='A short support paragraph under the headline' />
        </div>

        <div className='form-grid-3' style={{ marginTop: 16 }}>
          <div className='field-stack'>
            <label>Primary Email</label>
            <input className='field' type='email' value={appForm.primaryContactEmail} onChange={(e) => setAppField('primaryContactEmail', e.target.value)} />
          </div>
          <div className='field-stack'>
            <label>Primary Phone</label>
            <input className='field' value={appForm.primaryContactPhone} onChange={(e) => setAppField('primaryContactPhone', e.target.value)} />
          </div>
          <div className='field-stack'>
            <label>Address</label>
            <input className='field' value={appForm.address} onChange={(e) => setAppField('address', e.target.value)} />
          </div>
        </div>

        <div className='form-grid-3' style={{ marginTop: 16 }}>
          <div className='field-stack'>
            <label>YouTube URL</label>
            <input className='field' type='url' value={appForm.youtubeUrl} onChange={(e) => setAppField('youtubeUrl', e.target.value)} placeholder='https://youtube.com/@channel' />
          </div>
          <div className='field-stack'>
            <label>Instagram URL</label>
            <input className='field' type='url' value={appForm.instagramUrl} onChange={(e) => setAppField('instagramUrl', e.target.value)} placeholder='https://instagram.com/...' />
          </div>
          <div className='field-stack'>
            <label>Facebook URL</label>
            <input className='field' type='url' value={appForm.facebookUrl} onChange={(e) => setAppField('facebookUrl', e.target.value)} placeholder='https://facebook.com/...' />
          </div>
        </div>

        <div className='form-grid' style={{ marginTop: 16 }}>
          <div className='field-stack'>
            <label>WhatsApp URL</label>
            <input className='field' type='url' value={appForm.whatsappUrl} onChange={(e) => setAppField('whatsappUrl', e.target.value)} placeholder='https://wa.me/254...' />
          </div>
          <div className='field-stack'>
            <label>Live Stream YouTube ID or URL</label>
            <input className='field' value={appForm.liveStreamId} onChange={(e) => setAppField('liveStreamId', e.target.value)} placeholder='Paste the YouTube live URL or the 11-char ID' />
          </div>
        </div>

        <label className='checkbox-row'>
          <input type='checkbox' checked={appForm.liveStreamEnabled} onChange={(e) => setAppField('liveStreamEnabled', e.target.checked)} />
          Enable live stream playback in the app
        </label>

        <div className='button-row'>
          {appSaved ? <span className='badge'>Saved</span> : null}
          <button className='btn-primary' type='submit' disabled={savingApp}>
            <Save className='w-4 h-4' />
            {savingApp ? 'Saving...' : 'Save app config'}
          </button>
        </div>
      </form>

      <form className='form-panel' onSubmit={handleSaveVerse}>
        <div className='page-header' style={{ marginBottom: 20 }}>
          <div>
            <p className='eyebrow'>Verse Of The Day</p>
            <h2 style={{ fontSize: 22, lineHeight: '30px' }}>One canonical verse source for Home, Verse, and devotion-adjacent surfaces.</h2>
          </div>
          <div className='badge'>
            <Sparkles className='w-4 h-4' />
            Shared verse
          </div>
        </div>

        <div className='field-stack'>
          <label>Verse Text</label>
          <textarea className='textarea' value={verseForm.text} onChange={(e) => setVerseField('text', e.target.value)} required />
        </div>

        <div className='form-grid' style={{ marginTop: 16 }}>
          <div className='field-stack'>
            <label>Reference</label>
            <input className='field' value={verseForm.reference} onChange={(e) => setVerseField('reference', e.target.value)} placeholder='e.g. Romans 12:2' required />
          </div>
          <div className='field-stack'>
            <label>Theme</label>
            <input className='field' value={verseForm.theme} onChange={(e) => setVerseField('theme', e.target.value)} placeholder='Renewal, courage, faithfulness...' />
          </div>
        </div>

        <div className='button-row'>
          {verseSaved ? <span className='badge'>Saved</span> : null}
          <button className='btn-primary' type='submit' disabled={savingVerse}>
            <Radio className='w-4 h-4' />
            {savingVerse ? 'Saving...' : 'Save verse'}
          </button>
        </div>
      </form>
    </div>
  );
}
