'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface RestaurantItem {
  id: string;
  slug: string;
  name: string;
  nameKn: string | null;
  subtitle: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    menuItems: number;
    categories: number;
    users: number;
  };
}

interface PromotionItem {
  id: string;
  restaurantId: string | null;
  restaurant?: { name: string; slug: string } | null;
  type: string;
  title: string;
  subtitle: string | null;
  badge: string | null;
  description: string | null;
  primaryBtnText: string | null;
  primaryBtnAction: string | null;
  isActive: boolean;
  priority: number;
}

export default function SuperadminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'restaurants' | 'ads'>('restaurants');
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New restaurant modal state
  const [showAddRestModal, setShowAddRestModal] = useState(false);
  const [restName, setRestName] = useState('');
  const [restNameKn, setRestNameKn] = useState('');
  const [restSlug, setRestSlug] = useState('');
  const [restSubtitle, setRestSubtitle] = useState('');
  const [ownerUsername, setOwnerUsername] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [addingRest, setAddingRest] = useState(false);
  const [restError, setRestError] = useState('');

  // New Ad modal state
  const [showAddAdModal, setShowAddAdModal] = useState(false);
  const [adTitle, setAdTitle] = useState('');
  const [adSubtitle, setAdSubtitle] = useState('');
  const [adBadge, setAdBadge] = useState('⚡ SPONSORED');
  const [adDesc, setAdDesc] = useState('');
  const [adBtnText, setAdBtnText] = useState('Claim Offer');
  const [adBtnAction, setAdBtnAction] = useState('URL:https://');
  const [adTargetRestaurant, setAdTargetRestaurant] = useState<string>('');
  const [addingAd, setAddingAd] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [restRes, promoRes] = await Promise.all([
        fetch('/api/superadmin/restaurants'),
        fetch('/api/superadmin/promotions'),
      ]);

      if (restRes.status === 401 || restRes.status === 403) {
        router.push('/superadmin/login');
        return;
      }

      const restJson = await restRes.json();
      const promoJson = await promoRes.json();

      setRestaurants(restJson.restaurants || []);
      setPromotions(promoJson.promotions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle new restaurant onboarding
  const handleOnboardRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingRest(true);
    setRestError('');

    try {
      const res = await fetch('/api/superadmin/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: restName,
          nameKn: restNameKn,
          slug: restSlug,
          subtitle: restSubtitle,
          ownerUsername,
          ownerPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to onboard restaurant');

      setShowAddRestModal(false);
      setRestName('');
      setRestNameKn('');
      setRestSlug('');
      setRestSubtitle('');
      setOwnerUsername('');
      setOwnerPassword('');
      loadData();
    } catch (err: unknown) {
      setRestError(err instanceof Error ? err.message : 'Error onboarding restaurant');
    } finally {
      setAddingRest(false);
    }
  };

  // Handle new Ad creation
  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingAd(true);

    try {
      const res = await fetch('/api/superadmin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: adTargetRestaurant || null,
          type: 'HYPERLOCAL_AD',
          title: adTitle,
          subtitle: adSubtitle,
          badge: adBadge,
          description: adDesc,
          primaryBtnText: adBtnText,
          primaryBtnAction: adBtnAction,
          isActive: true,
          priority: 5,
        }),
      });

      if (!res.ok) throw new Error('Failed to create ad');

      setShowAddAdModal(false);
      setAdTitle('');
      setAdSubtitle('');
      setAdDesc('');
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setAddingAd(false);
    }
  };

  const handleToggleAd = async (promo: PromotionItem) => {
    try {
      await fetch('/api/superadmin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: promo.id,
          title: promo.title,
          isActive: !promo.isActive,
        }),
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/superadmin/login');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '12px' }}>
        <div style={{ fontSize: '2.5rem' }}>💻</div>
        <div style={{ fontWeight: 800 }}>Loading Developer Superadmin...</div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh', paddingBottom: '3rem' }}>
      {/* Superadmin Header */}
      <header className="admin-header">
        <div className="admin-header-inner">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Platform Developer Console</h1>
              <span className="admin-badge" style={{ background: '#fef3c7', color: '#92400e' }}>Superuser</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Multi-Restaurant Onboarding &amp; Hyperlocal Ad Campaigns
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '900px', margin: '1.25rem auto', padding: '0 1rem' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
          <button
            className={activeTab === 'restaurants' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('restaurants')}
          >
            🏪 Onboarded Restaurants ({restaurants.length})
          </button>
          <button
            className={activeTab === 'ads' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('ads')}
          >
            📢 Hyperlocal Ads &amp; Promotions ({promotions.length})
          </button>
        </div>

        {/* RESTAURANTS TAB */}
        {activeTab === 'restaurants' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Live Restaurants</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Each restaurant gets an isolated menu URL and dedicated owner login.
                </p>
              </div>
              <button className="btn-primary" onClick={() => setShowAddRestModal(true)}>
                + Onboard New Restaurant
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {restaurants.map((r) => (
                <div key={r.id} className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>{r.name}</span>
                      {r.nameKn && <span className="kannada" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({r.nameKn})</span>}
                      <span style={{ fontSize: '0.7rem', background: 'var(--accent-light)', color: 'var(--accent)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        Active
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                      URL: <code>/{r.slug}</code> • {r._count.menuItems} Dishes in menu • {r._count.users} Owner account(s)
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a
                      href={`/${r.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary"
                      style={{ textDecoration: 'none', padding: '6px 12px', fontSize: '0.82rem' }}
                    >
                      Open Menu ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADS TAB */}
        {activeTab === 'ads' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Hyperlocal Ad Campaigns</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Monetize across restaurants by running sponsored promotions in the arch modal box.
                </p>
              </div>
              <button className="btn-primary" onClick={() => setShowAddAdModal(true)}>
                + Launch New Campaign
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {promotions.map((p) => (
                <div key={p.id} className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.98rem' }}>{p.title}</span>
                      <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 800, background: p.type === 'HYPERLOCAL_AD' ? '#fef3c7' : 'var(--accent-light)', color: p.type === 'HYPERLOCAL_AD' ? '#92400e' : 'var(--accent)' }}>
                        {p.type === 'HYPERLOCAL_AD' ? 'Hyperlocal Ad' : 'Special Dish'}
                      </span>
                      {p.restaurant ? (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Target: {p.restaurant.name}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Target: Platform-wide (All)
                        </span>
                      )}
                    </div>
                    {p.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.description}</div>}
                    {p.primaryBtnAction && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '3px' }}>
                        Action: <code>{p.primaryBtnAction}</code>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label className="stock-switch-label">
                      <input
                        type="checkbox"
                        style={{ display: 'none' }}
                        checked={p.isActive}
                        onChange={() => handleToggleAd(p)}
                      />
                      <span className="switch-toggle"></span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                        {p.isActive ? 'Active' : 'Off'}
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ONBOARD RESTAURANT MODAL */}
        {showAddRestModal && (
          <div className="modal-backdrop" onClick={() => setShowAddRestModal(false)}>
            <div className="modal-sheet" style={{ maxWidth: '500px', borderRadius: '20px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-top">
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Onboard New Restaurant</h3>
                <button className="btn-close" onClick={() => setShowAddRestModal(false)}>✕</button>
              </div>

              {restError && (
                <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '1rem' }}>
                  {restError}
                </div>
              )}

              <form onSubmit={handleOnboardRestaurant} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '3px' }}>
                    Restaurant Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Udupi Sri Krishna Bhavan"
                    value={restName}
                    onChange={(e) => {
                      setRestName(e.target.value);
                      if (!restSlug) {
                        setRestSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
                      }
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '3px' }}>
                    Kannada Name (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. ಶ್ರೀ ಕೃಷ್ಣ ಭವನ್"
                    value={restNameKn}
                    onChange={(e) => setRestNameKn(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '3px' }}>
                    Menu URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. udupi-bhavan"
                    value={restSlug}
                    onChange={(e) => setRestSlug(e.target.value)}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Customer link will be: /{restSlug || 'slug'}
                  </span>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    Owner Login Credentials
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Username</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="e.g. udupi_owner"
                        value={ownerUsername}
                        onChange={(e) => setOwnerUsername(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Password / PIN</label>
                      <input
                        type="password"
                        required
                        className="form-input"
                        placeholder="••••••••"
                        value={ownerPassword}
                        onChange={(e) => setOwnerPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '0.75rem', padding: '0.8rem' }}
                  disabled={addingRest}
                >
                  {addingRest ? 'Onboarding...' : 'Create & Launch Restaurant'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* CREATE AD MODAL */}
        {showAddAdModal && (
          <div className="modal-backdrop" onClick={() => setShowAddAdModal(false)}>
            <div className="modal-sheet" style={{ maxWidth: '500px', borderRadius: '20px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-top">
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Launch Hyperlocal Ad Campaign</h3>
                <button className="btn-close" onClick={() => setShowAddAdModal(false)}>✕</button>
              </div>

              <form onSubmit={handleCreateAd} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '3px' }}>
                    Target Restaurant
                  </label>
                  <select
                    className="form-input"
                    value={adTargetRestaurant}
                    onChange={(e) => setAdTargetRestaurant(e.target.value)}
                  >
                    <option value="">All Restaurants (Platform-wide)</option>
                    {restaurants.map((r) => (
                      <option key={r.id} value={r.id}>{r.name} (/{r.slug})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '3px' }}>
                    Campaign Headline *
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Bangalore Metro Smart Card"
                    value={adTitle}
                    onChange={(e) => setAdTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '3px' }}>
                    Subtitle / Offer
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Instant Recharge & 10% Cashback"
                    value={adSubtitle}
                    onChange={(e) => setAdSubtitle(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '3px' }}>
                    Badge
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. ⚡ SPONSORED"
                    value={adBadge}
                    onChange={(e) => setAdBadge(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '3px' }}>
                    Description
                  </label>
                  <textarea
                    rows={3}
                    className="form-input"
                    placeholder="Skip token queues at Metro stations! Recharge in 30 seconds..."
                    value={adDesc}
                    onChange={(e) => setAdDesc(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Button Text</label>
                    <input
                      type="text"
                      className="form-input"
                      value={adBtnText}
                      onChange={(e) => setAdBtnText(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Target URL Action</label>
                    <input
                      type="text"
                      className="form-input"
                      value={adBtnAction}
                      onChange={(e) => setAdBtnAction(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '0.75rem', padding: '0.8rem' }}
                  disabled={addingAd}
                >
                  {addingAd ? 'Launching...' : 'Activate Campaign'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
