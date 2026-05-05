import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function TrendingSection() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [hashtags, setHashtags] = useState([]);

  useEffect(() => {
    api('/api/search?q=a&type=posts').then(data => {
      if (data.hashtags) setHashtags(data.hashtags);
    }).catch(() => {});
  }, []);

  const defaultTrends = [
    { tag: 'staticvoid', post_count: 42 },
    { tag: 'analoghorror', post_count: 38 },
    { tag: 'midnightbroadcast', post_count: 27 },
    { tag: 'channel37', post_count: 19 },
    { tag: 'theblacksignal', post_count: 15 },
  ];

  const trends = hashtags.length > 0 ? hashtags : defaultTrends;

  return (
    <div className="trending-topics">
      <h3>Trending Whispers</h3>
      {trends.map((t, i) => (
        <div key={t.tag} className="trending-item" onClick={() => navigate(`/hashtag/${t.tag}`)}>
          <div className="trending-tag">#{t.tag}</div>
          <div className="trending-count">{t.post_count} whispers</div>
        </div>
      ))}
    </div>
  );
}
