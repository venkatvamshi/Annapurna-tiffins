'use client';

import React, { useEffect } from 'react';
import { SerializedPromotion, SerializedCategory, SerializedMenuItem } from '@/lib/types';

interface PromotionModalProps {
  isOpen: boolean;
  promotion: SerializedPromotion | null;
  onClose: () => void;
  onAddSpecial: (itemCode: string) => void;
  categories?: (SerializedCategory & { items: SerializedMenuItem[] })[];
}

export default function PromotionModal({
  isOpen,
  promotion,
  onClose,
  onAddSpecial,
  categories,
}: PromotionModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Compute live price of special dish from menu data
  const itemCode = promotion?.primaryBtnAction?.startsWith('ADD_ITEM:')
    ? promotion.primaryBtnAction.replace('ADD_ITEM:', '')
    : null;

  const currentSpecialItem = React.useMemo(() => {
    if (!itemCode || !categories) return null;
    for (const cat of categories) {
      const found = cat.items.find((i) => i.code === itemCode);
      if (found) return found;
    }
    return null;
  }, [itemCode, categories]);

  if (!isOpen || !promotion) return null;

  const isSpecialDish = promotion.type === 'SPECIAL_DISH';
  const isSoldOut = isSpecialDish && currentSpecialItem ? !currentSpecialItem.isAvailable : false;

  const handlePrimaryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSoldOut) return; // Prevent adding sold out item
    if (promotion.primaryBtnAction) {
      if (promotion.primaryBtnAction.startsWith('ADD_ITEM:')) {
        const code = promotion.primaryBtnAction.replace('ADD_ITEM:', '');
        onAddSpecial(code);
        return;
      } else if (promotion.primaryBtnAction.startsWith('http')) {
        window.open(promotion.primaryBtnAction, '_blank');
      }
    }
    onClose();
  };

  const handleSecondaryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  // Primary button label
  const primaryButtonLabel = isSpecialDish
    ? 'Add Special Item to Cart'
    : promotion.primaryBtnText || 'Explore Offer';

  return (
    <div className="promo-backdrop" onClick={onClose}>
      <div className="promo-arch-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="promo-close-cross"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close promotion"
        >
          ✕
        </button>

        {/* Hero Arch Stage with Pure Vegetarian Dish Image or Gift Icon */}
        <div className="promo-hero-arch">
          <div className="promo-dish-img-stage" style={{ position: 'relative' }}>
            <span className="promo-sparkle sparkle-1">✨</span>
            <span className="promo-sparkle sparkle-2">✦</span>
            <span className="promo-sparkle sparkle-3">★</span>

            {isSpecialDish ? (
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    promotion.imageUrl ||
                    (promotion.title.toLowerCase().includes('dosa')
                      ? '/images/dishes/masala-dosa.jpg'
                      : '/images/dishes/thatte-idly.jpg')
                  }
                  alt={promotion.title}
                  className="promo-special-img"
                  style={isSoldOut ? { filter: 'grayscale(0.6) contrast(0.9)', opacity: 0.7 } : {}}
                />
                {isSoldOut && (
                  <div className="promo-sold-out-stamp">
                    SOLD OUT
                  </div>
                )}
              </div>
            ) : (
              <div className="promo-pedestal-stage">
                <div className="promo-pedestal-base"></div>
                <div className="promo-icon-3d">🎁</div>
              </div>
            )}
          </div>
        </div>

        {/* Promotion Body */}
        <div className="promo-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
            {isSoldOut ? (
              <span className="promo-sold-out-pill">
                🔴 SOLD OUT FOR TODAY
              </span>
            ) : (
              <span className="promo-pill-badge">
                {promotion.badge || "★ TODAY'S SPECIAL"}
              </span>
            )}
          </div>

          {/* Prominent Dish Title */}
          <h3 className="promo-title">
            {currentSpecialItem ? currentSpecialItem.nameEn : (promotion.subtitle || promotion.title)}
          </h3>

          {/* Bilingual Kannada Name if available */}
          {currentSpecialItem?.nameKn && (
            <div className="kannada" style={{ fontSize: '0.94rem', color: 'var(--text-muted)', marginTop: '-4px', marginBottom: '8px', fontWeight: 600 }}>
              {currentSpecialItem.nameKn}
            </div>
          )}

          {promotion.description && (
            <p className="promo-desc">{promotion.description}</p>
          )}

          {/* Action Buttons: Handle In-Stock vs Sold Out cleanly */}
          {isSoldOut ? (
            <>
              {/* Disabled Sold Out Button */}
              <button
                type="button"
                className="promo-btn-disabled"
                disabled
                title="This special dish is currently marked sold out in the kitchen"
              >
                <span>🔴</span>
                <span>Currently Sold Out</span>
              </button>

              {/* Helpful Divider */}
              <div className="promo-divider">TRY OTHER DISHES</div>

              {/* Active Secondary Button to explore rest of menu */}
              <button
                type="button"
                className="promo-btn-primary"
                onClick={handleSecondaryClick}
              >
                <span>📋</span>
                <span>Explore Available Menu</span>
              </button>
            </>
          ) : (
            <>
              {/* Primary Action Button (Add Special Item to Cart) */}
              <button
                type="button"
                className="promo-btn-primary"
                onClick={handlePrimaryClick}
              >
                <span>{isSpecialDish ? '⚡' : '🚀'}</span>
                <span>{primaryButtonLabel}</span>
              </button>

              {/* OR Divider */}
              <div className="promo-divider">OR</div>

              {/* Secondary Action Button (Rich Saffron Amber) */}
              <button
                type="button"
                className="promo-btn-secondary"
                onClick={handleSecondaryClick}
              >
                <span>{isSpecialDish ? '📋' : '✨'}</span>
                <span>{promotion.secondaryBtnText || 'Explore Full Menu'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
