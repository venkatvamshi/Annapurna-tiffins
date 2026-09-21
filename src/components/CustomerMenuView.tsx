'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MenuApiResponse, SerializedMenuItem, SerializedPromotion } from '@/lib/types';
import PromotionModal from './PromotionModal';
import CounterScanModal from './CounterScanModal';

interface CartItem {
  id: string;
  code: string;
  nameEn: string;
  price: number;
  qty: number;
  isBeverage?: boolean;
}

interface CustomerMenuViewProps {
  initialSlug?: string;
}

export default function CustomerMenuView({ initialSlug = 'annapurna-tiffins' }: CustomerMenuViewProps) {
  const [menuData, setMenuData] = useState<MenuApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<Record<string, CartItem>>({});

  const [isSlipOpen, setIsSlipOpen] = useState(false);
  const [isPromoOpen, setIsPromoOpen] = useState(false);
  const [reviewCopied, setReviewCopied] = useState(false);

  // Track if we already checked the daily promo on initial mount
  const hasCheckedDailyPromo = useRef(false);

  // Fetch live menu
  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch(`/api/menu?restaurant=${encodeURIComponent(initialSlug)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: MenuApiResponse = await res.json();
      setMenuData(data);

      // Automatically open promotion modal on initial page load
      if (!hasCheckedDailyPromo.current && data.activePromotion && data.activePromotion.isActive) {
        hasCheckedDailyPromo.current = true;
        // Clear any old daily lockouts
        try {
          localStorage.removeItem(`promo_shown_date_${data.restaurant.slug}`);
          sessionStorage.removeItem(`promo_dismissed_${data.restaurant.slug}`);
        } catch {
          // ignore
        }
        setIsPromoOpen(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect';
      console.error('Menu load error:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [initialSlug]);

  useEffect(() => {
    fetchMenu();

    // Poll every 15 seconds for real-time stock toggles from owner
    const interval = setInterval(fetchMenu, 15000);
    return () => clearInterval(interval);
  }, [fetchMenu]);

  // Cart operations
  const isBeverageDish = (dish: SerializedMenuItem): boolean => {
    if (menuData) {
      const cat = menuData.categories.find((c) => c.id === dish.categoryId);
      if (cat) {
        const slug = cat.slug.toLowerCase();
        const title = cat.title.toLowerCase();
        if (
          slug.includes('beverage') ||
          slug.includes('coffee') ||
          slug.includes('tea') ||
          title.includes('beverage') ||
          title.includes('coffee') ||
          title.includes('tea')
        ) {
          return true;
        }
      }
    }
    const name = dish.nameEn.toLowerCase();
    return name.includes('coffee') || name.includes('tea') || name.includes('badam milk');
  };

  const addToCart = (dish: SerializedMenuItem) => {
    if (!dish.isAvailable) return;
    const isBeverage = isBeverageDish(dish);
    setCart((prev) => {
      const current = prev[dish.id]?.qty || 0;
      return {
        ...prev,
        [dish.id]: {
          id: dish.id,
          code: dish.code,
          nameEn: dish.nameEn,
          price: dish.price,
          qty: current + 1,
          isBeverage,
        },
      };
    });
  };

  const updateQuantity = (dishId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[dishId]?.qty || 0;
      const nextQty = current + delta;
      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[dishId];
        return copy;
      }
      return {
        ...prev,
        [dishId]: {
          ...prev[dishId],
          qty: nextQty,
        },
      };
    });
  };

  const handleClosePromo = () => {
    setIsPromoOpen(false);
  };

  // Add special dish from promotion modal, close modal, and display menu
  const handleAddSpecialFromPromo = (itemCode: string) => {
    if (menuData) {
      for (const cat of menuData.categories) {
        const found = cat.items.find((i) => i.code === itemCode);
        if (found && found.isAvailable) {
          addToCart(found);
          break;
        }
      }
    }
    handleClosePromo();
  };

  // Google Review Booster
  const handleGoogleReview = () => {
    const placeId = menuData?.restaurant?.placeId || 'ChIJIznANwAP6joRsC8ckf6OSuc';
    const reviewText =
      'Authentic, hygienic, and delicious South Indian breakfast! The Thatte Idly and Masala Dosa are crisp and full of authentic flavor. Super fast and clean self-service experience.';

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(reviewText).then(() => {
        setReviewCopied(true);
        setTimeout(() => {
          setReviewCopied(false);
          window.open(`https://search.google.com/local/writereview?placeid=${placeId}`, '_blank');
        }, 800);
      });
    } else {
      window.open(`https://search.google.com/local/writereview?placeid=${placeId}`, '_blank');
    }
  };

  // Total cart calculation
  const totalCount = Object.values(cart).reduce((acc, i) => acc + i.qty, 0);
  const rawSubtotal = Object.values(cart).reduce((acc, i) => acc + i.price * i.qty, 0);
  const grandTotal = Math.round((rawSubtotal * 1.05) / 5) * 5;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '14px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/dishes/thatte-idly.jpg"
          alt="Annapurna Pure Veg Tiffins"
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2.5px solid var(--primary)',
            boxShadow: 'var(--shadow-warm)',
          }}
        />
        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Loading Fresh Menu...
        </div>
        <span style={{ fontSize: '0.74rem', color: 'var(--accent)', fontWeight: 800, background: 'var(--accent-light)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--accent-border)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          100% Pure Veg
        </span>
      </div>
    );
  }

  if (error || !menuData) {
    return (
      <div className="mobile-container" style={{ textAlign: 'center', paddingTop: '3rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚠️</div>
        <h2 style={{ color: 'var(--danger)', fontWeight: 800, marginBottom: '0.5rem' }}>Menu Temporarily Unavailable</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
          We are having trouble loading the live menu. Please place your order directly at the counter.
        </p>
        <button className="btn-primary" onClick={() => window.location.reload()}>Retry Loading</button>
      </div>
    );
  }

  const { restaurant, categories, activePromotion } = menuData;

  // Filter items by category & search query
  const q = searchQuery.toLowerCase().trim();

  return (
    <>
      {/* App Header */}
      <header className="app-header">
        <div className="header-inner">
          <div>
            <div className="brand-title">
              <span>{restaurant.name}</span>
              <span className="brand-badge">Pure Veg</span>
            </div>
            {restaurant.nameKn && (
              <div className="brand-subtitle kannada">{restaurant.nameKn} • Fast Self-Service</div>
            )}
          </div>
          {activePromotion?.isActive && (
            <button
              onClick={() => setIsPromoOpen(true)}
              style={{
                background: 'var(--primary-light)',
                border: '1px solid var(--primary-border)',
                color: '#92400e',
                borderRadius: '20px',
                padding: '4px 10px',
                fontSize: '0.74rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              ⭐ Today&apos;s Special
            </button>
          )}
        </div>
      </header>

      <main className="mobile-container">
        {/* Fast Scanner Helper Tip */}
        <div className="helper-banner">
          <span>⚡</span>
          <span>Add breakfast items &amp; show your <strong>Fast Scan QR</strong> to the cashier gun!</span>
        </div>

        {/* Live Search */}
        <div className="search-box">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search dosa, idly, coffee, meals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Horizontal Navigation */}
        <nav className="category-scroller">
          <button
            className={`cat-chip ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`cat-chip ${selectedCategory === cat.slug ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.slug)}
            >
              {cat.title}
            </button>
          ))}
        </nav>

        {/* Categorized Menu List */}
        <div>
          {categories
            .filter((cat) => selectedCategory === 'all' || selectedCategory === cat.slug)
            .map((cat) => {
              const filteredItems = cat.items.filter((item) => {
                if (!q) return true;
                return (
                  item.nameEn.toLowerCase().includes(q) ||
                  (item.nameKn && item.nameKn.toLowerCase().includes(q)) ||
                  (item.description && item.description.toLowerCase().includes(q))
                );
              });

              if (filteredItems.length === 0) return null;

              return (
                <section key={cat.id} className="category-card">
                  <div className="category-header">
                    <h2>
                      <span>{cat.title}</span>
                      {cat.titleKn && (
                        <span className="kannada" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          / {cat.titleKn}
                        </span>
                      )}
                    </h2>
                    {cat.timing && <span className="timing-tag">{cat.timing}</span>}
                  </div>

                  <ul>
                    {filteredItems.map((dish) => {
                      const qty = cart[dish.id]?.qty || 0;

                      return (
                        <li key={dish.id} className={`dish-item ${!dish.isAvailable ? 'sold-out' : ''}`}>
                          <div className="dish-left">
                            <div className="veg-dot"></div>
                            <div className="dish-details">
                              <span className="dish-name-en">
                                {dish.nameEn}
                                {dish.badge && <span className="badge-tag">{dish.badge}</span>}
                                {!dish.isAvailable && <span className="sold-out-badge">Sold Out</span>}
                              </span>
                              {dish.nameKn && <span className="dish-name-kn kannada">{dish.nameKn}</span>}
                              {dish.description && <span className="dish-desc">{dish.description}</span>}
                            </div>
                          </div>

                          <div className="dish-right">
                            <span className="dish-price">₹{dish.price}</span>
                            {!dish.isAvailable ? (
                              <button className="btn-add" disabled>Sold Out</button>
                            ) : qty > 0 ? (
                              <div className="qty-stepper">
                                <button className="qty-step-btn" onClick={() => updateQuantity(dish.id, -1)}>−</button>
                                <span className="qty-value">{qty}</span>
                                <button className="qty-step-btn" onClick={() => updateQuantity(dish.id, 1)}>+</button>
                              </div>
                            ) : (
                              <button className="btn-add" onClick={() => addToCart(dish)}>+ Add</button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
        </div>

        {/* Google Review Booster Card */}
        <div className="review-box">
          <div style={{ fontSize: '1.25rem', marginBottom: '2px' }}>⭐ ⭐ ⭐ ⭐ ⭐</div>
          <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#78350f' }}>
            Enjoyed our authentic tiffins?
          </div>
          <button className="review-btn" onClick={handleGoogleReview}>
            <span>{reviewCopied ? '📋 Review Copied! Opening Maps...' : 'Rate us on Google Maps (Auto-Copies 5★ Review)'}</span>
          </button>
        </div>
      </main>

      {/* Floating Bottom Cart Bar */}
      {totalCount > 0 && (
        <aside className="cart-floating-bar">
          <div className="cart-bar-inner">
            <div className="cart-bar-info">
              <span className="cart-bar-count">{totalCount} item{totalCount > 1 ? 's' : ''} in slip</span>
              <span className="cart-bar-total">₹{grandTotal}</span>
            </div>
            <button className="cart-bar-btn" onClick={() => setIsSlipOpen(true)}>
              <span>Show Counter QR</span>
              <span>➔</span>
            </button>
          </div>
        </aside>
      )}

      {/* Promotion Modal (Screenshot-style, strictly zero blue/purple) */}
      <PromotionModal
        isOpen={isPromoOpen}
        promotion={activePromotion}
        onClose={handleClosePromo}
        onAddSpecial={handleAddSpecialFromPromo}
        categories={menuData?.categories}
      />

      {/* Counter Fast Scan QR Modal */}
      <CounterScanModal
        isOpen={isSlipOpen}
        onClose={() => setIsSlipOpen(false)}
        cart={cart}
        restaurantName={restaurant.name}
        categories={menuData?.categories}
      />
    </>
  );
}
