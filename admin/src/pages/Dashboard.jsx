import React, { useEffect, useState } from 'react';
import { BookOpen, CalendarDays, Heart, Radio, Users, Video } from 'lucide-react';
import { fetchAdminDashboard } from '../api';
import { resolveChurchName } from '../branding';

const cards = [
  { key: 'sermons', label: 'Sermons', icon: BookOpen },
  { key: 'biblePlan', label: 'Bible Plan', icon: BookOpen },
  { key: 'devotions', label: 'Devotions', icon: Heart },
  { key: 'shortClips', label: 'Short Clips', icon: Video },
  { key: 'events', label: 'Events', icon: CalendarDays },
  { key: 'groups', label: 'Groups', icon: Users },
];

export default function Dashboard() {
  const [payload, setPayload] = useState({
    counts: {
      sermons: 0,
      biblePlan: 0,
      devotions: 0,
      shortClips: 0,
      events: 0,
      groups: 0,
    },
    recent: [],
    config: null,
  });

  useEffect(() => {
    fetchAdminDashboard().then(setPayload).catch(() => {});
  }, []);

  return (
    <div className='page-grid'>
      <div className='page-header'>
        <div>
          <p className='eyebrow'>Dashboard</p>
          <h2>Serve the house with faithfulness, clarity, and care.</h2>
          <p>Keep sermons, events, and ministry updates ready so the church family feels welcomed, informed, and connected.</p>
        </div>
        <div className='badge'>
          <Radio className='w-4 h-4' />
          {payload.config?.liveStreamEnabled && payload.config?.liveStreamId ? 'Live stream enabled' : 'Live stream offline'}
        </div>
      </div>

      <div className='cards-grid'>
        {cards.map((card) => (
          <div key={card.key} className='stat-card'>
            <card.icon className='w-5 h-5' />
            <div className='stat-value'>{payload.counts?.[card.key] || 0}</div>
            <h3>{card.label}</h3>
            <p>Published and visible in the mobile app.</p>
          </div>
        ))}
      </div>

      <div className='cards-grid'>
        <div className='content-card'>
          <p className='eyebrow'>Live Stream</p>
          <h3>{resolveChurchName(payload.config?.churchName)}</h3>
          <p>{payload.config?.heroHeadline || 'No hero headline configured yet.'}</p>
          <p className='muted'>Stream ID: {payload.config?.liveStreamId || 'Not configured'}</p>
        </div>

        <div className='content-card'>
          <p className='eyebrow'>Contact Surface</p>
          <h3>{payload.config?.primaryContactEmail || 'No email configured'}</h3>
          <p>{payload.config?.address || 'Address not configured yet.'}</p>
        </div>
      </div>

      <div className='content-card'>
        <p className='eyebrow'>Recent Content</p>
        <div className='table-list'>
          {payload.recent.length === 0 ? (
            <div className='empty-panel'>Recent content will appear here once sermons, devotions, clips, and events are published.</div>
          ) : (
            payload.recent.map((item) => (
              <div key={`${item.type}-${item.id}`} className='table-row'>
                <div>
                  <div className='badge'>{item.type}</div>
                  <h4 style={{ marginTop: 12 }}>{item.title}</h4>
                  <p>{item.meta || 'Recently updated'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
