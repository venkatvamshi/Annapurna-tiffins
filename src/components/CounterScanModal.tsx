'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import QRCode from 'qrcode';
import { SerializedCategory } from '@/lib/types';

export interface CartItem {
  id: string;
  code: string;
  nameEn: string;
  price: number;
  qty: number;
  isBeverage?: boolean;
}

interface CounterScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Record<string, CartItem>;
  restaurantName: string;
  categories?: SerializedCategory[];
}

export interface QRChunk {
  chunkIndex: number;
  totalChunks: number;
  payload: string;
  byteLength: number;
  items: Array<{
    id: string;
    code: string;
    nameEn: string;
    qty: number;
    price: number;
    lineStr: string;
  }>;
}

export interface ReceiptGroup {
  id: 'FOOD' | 'BEVERAGE';
  receiptNumber: number;
  title: string;
  shortTitle: string;
  icon: string;
  tokenDestination: string;
  items: CartItem[];
  subtotal: number;
  chunks: QRChunk[];
}

/**
 * Checks if a cart item belongs to the Beverages counter
 */
function isItemBeverage(item: CartItem, categories?: SerializedCategory[]): boolean {
  if (typeof item.isBeverage === 'boolean') {
    return item.isBeverage;
  }
  if (categories && categories.length > 0) {
    for (const cat of categories) {
      if (cat.items && cat.items.some((i) => i.id === item.id || i.code === item.code)) {
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
  }
  const name = item.nameEn.toLowerCase();
  return name.includes('coffee') || name.includes('tea') || name.includes('badam milk');
}

/**
 * Splits items into QR chunks strictly <= maxBytes (default 30 bytes).
 * Ensures physical 2D scanner guns with 32-byte hardware buffers read every keystroke cleanly without truncation.
 * Uses Petpooja POS syntax: `${qty}*${code}\n` for qty > 1, or `${code}\n` for qty === 1.
 */
function splitItemsIntoQRChunks(items: CartItem[], maxBytes: number = 30): QRChunk[] {
  if (items.length === 0) return [];

  const chunks: QRChunk[] = [];
  let currentLines: string[] = [];
  let currentItems: QRChunk['items'] = [];
  let currentBytes = 0;

  const encoder = new TextEncoder();

  for (const item of items) {
    const lineStr = item.qty > 1 ? `${item.qty}*${item.code}` : `${item.code}`;
    const lineWithNewline = `${lineStr}\n`;
    const lineBytes = encoder.encode(lineWithNewline).length;

    // If adding this item would exceed the 30-byte limit, finalize current chunk
    if (currentLines.length > 0 && currentBytes + lineBytes > maxBytes) {
      chunks.push({
        chunkIndex: chunks.length,
        totalChunks: 0,
        payload: currentLines.join(''),
        byteLength: currentBytes,
        items: currentItems,
      });

      currentLines = [];
      currentItems = [];
      currentBytes = 0;
    }

    currentLines.push(lineWithNewline);
    currentItems.push({
      id: item.id,
      code: item.code,
      nameEn: item.nameEn,
      qty: item.qty,
      price: item.price,
      lineStr,
    });
    currentBytes += lineBytes;
  }

  if (currentLines.length > 0) {
    chunks.push({
      chunkIndex: chunks.length,
      totalChunks: 0,
      payload: currentLines.join(''),
      byteLength: currentBytes,
      items: currentItems,
    });
  }

  // Update totalChunks on each
  chunks.forEach((chunk) => {
    chunk.totalChunks = chunks.length;
  });

  return chunks;
}

export default function CounterScanModal({
  isOpen,
  onClose,
  cart,
  restaurantName,
  categories,
}: CounterScanModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [activeChunkIndex, setActiveChunkIndex] = useState(0);

  const cartList = useMemo(
    () => Object.values(cart).filter((item) => item.qty > 0),
    [cart]
  );

  const rawSubtotal = useMemo(
    () => cartList.reduce((acc, item) => acc + item.price * item.qty, 0),
    [cartList]
  );
  const gst = rawSubtotal * 0.05;
  const grandTotal = Math.round((rawSubtotal + gst) / 5) * 5;

  // Separate items into Food Dishes vs Beverages
  const foodItems = useMemo(
    () => cartList.filter((item) => !isItemBeverage(item, categories)),
    [cartList, categories]
  );
  const beverageItems = useMemo(
    () => cartList.filter((item) => isItemBeverage(item, categories)),
    [cartList, categories]
  );

  // Build physical receipt groups
  const receiptGroups: ReceiptGroup[] = useMemo(() => {
    const groups: ReceiptGroup[] = [];

    if (foodItems.length > 0) {
      const chunks = splitItemsIntoQRChunks(foodItems, 30);
      const subtotal = foodItems.reduce((acc, item) => acc + item.price * item.qty, 0);
      groups.push({
        id: 'FOOD',
        receiptNumber: 1,
        title: 'Food Items (Tiffins & Dishes)',
        shortTitle: 'Food Receipt',
        icon: '🍽️',
        tokenDestination: 'Kitchen / Tiffin Counter Token',
        items: foodItems,
        subtotal,
        chunks,
      });
    }

    if (beverageItems.length > 0) {
      const chunks = splitItemsIntoQRChunks(beverageItems, 30);
      const subtotal = beverageItems.reduce((acc, item) => acc + item.price * item.qty, 0);
      groups.push({
        id: 'BEVERAGE',
        receiptNumber: groups.length + 1,
        title: 'Beverages (Coffee & Tea)',
        shortTitle: 'Beverage Receipt',
        icon: '☕',
        tokenDestination: 'Coffee & Tea Counter Token',
        items: beverageItems,
        subtotal,
        chunks,
      });
    }

    return groups;
  }, [foodItems, beverageItems]);

  // Reset indices when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveGroupIndex(0);
      setActiveChunkIndex(0);
    }
  }, [isOpen]);

  // Current active group and chunk
  const safeGroupIndex = Math.min(activeGroupIndex, Math.max(0, receiptGroups.length - 1));
  const currentGroup = receiptGroups[safeGroupIndex];
  const safeChunkIndex = currentGroup
    ? Math.min(activeChunkIndex, Math.max(0, currentGroup.chunks.length - 1))
    : 0;
  const activeChunk = currentGroup?.chunks[safeChunkIndex];

  // Render QR Canvas for the currently active chunk
  useEffect(() => {
    if (!isOpen || !canvasRef.current || !activeChunk) return;

    QRCode.toCanvas(canvasRef.current, activeChunk.payload, {
      width: 200,
      margin: 1,
      color: {
        dark: '#1c1917',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    }).catch((err) => {
      console.error('Error generating QR code:', err);
    });
  }, [isOpen, activeChunk]);

  if (!isOpen || receiptGroups.length === 0) return null;

  // Navigation handlers
  const handlePrev = () => {
    if (safeChunkIndex > 0) {
      setActiveChunkIndex(safeChunkIndex - 1);
    } else if (safeGroupIndex > 0) {
      const prevGroup = receiptGroups[safeGroupIndex - 1];
      setActiveGroupIndex(safeGroupIndex - 1);
      setActiveChunkIndex(prevGroup.chunks.length - 1);
    }
  };

  const handleNext = () => {
    if (currentGroup && safeChunkIndex < currentGroup.chunks.length - 1) {
      setActiveChunkIndex(safeChunkIndex + 1);
    } else if (safeGroupIndex < receiptGroups.length - 1) {
      setActiveGroupIndex(safeGroupIndex + 1);
      setActiveChunkIndex(0);
    } else {
      setActiveGroupIndex(0);
      setActiveChunkIndex(0);
    }
  };

  const hasMultipleReceipts = receiptGroups.length > 1;
  const hasMultipleChunksInGroup = currentGroup && currentGroup.chunks.length > 1;
  const isLastChunkOfGroup = currentGroup && safeChunkIndex === currentGroup.chunks.length - 1;
  const isLastReceipt = safeGroupIndex === receiptGroups.length - 1;
  const isAbsoluteLast = isLastReceipt && isLastChunkOfGroup;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-top">
          <div>
            <h3>Counter Fast Scan Slip</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {restaurantName} • Cashier Billing Desk
            </span>
          </div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {/* DUAL RECEIPT NOTICE: Shown when order has both Food & Beverages */}
        {hasMultipleReceipts && (
          <div className="receipt-split-notice">
            <div className="receipt-split-notice-icon">🧾</div>
            <div>
              <div className="receipt-split-notice-title">
                2 Physical Paper Receipts Will Be Printed
              </div>
              <div className="receipt-split-notice-desc">
                Cashier scans <strong>🍽️ Food QR</strong> for your Tiffin token, then <strong>☕ Beverage QR</strong> for your Coffee token.
              </div>
            </div>
          </div>
        )}

        {/* RECEIPT SELECTOR TABS: Allows one-tap switching between Food & Beverage slips */}
        {hasMultipleReceipts && (
          <div className="receipt-type-tabs">
            {receiptGroups.map((group, idx) => {
              const isSelected = idx === safeGroupIndex;
              const totalItems = group.items.reduce((s, i) => s + i.qty, 0);
              return (
                <button
                  key={group.id}
                  type="button"
                  className={`receipt-type-tab ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    setActiveGroupIndex(idx);
                    setActiveChunkIndex(0);
                  }}
                  aria-label={`Switch to ${group.shortTitle}`}
                >
                  <div className="receipt-tab-badge">Receipt {idx + 1}</div>
                  <div className="receipt-tab-name">
                    {group.icon} {group.shortTitle}
                  </div>
                  <div className="receipt-tab-meta">
                    {totalItems} {totalItems === 1 ? 'item' : 'items'} • ₹{group.subtotal}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* MULTI-CHUNK STEPPER: If this category exceeds 30 bytes, show sub-parts */}
        {hasMultipleChunksInGroup && (
          <div style={{ marginBottom: '0.75rem' }}>
            <div className="multi-qr-alert" style={{ marginBottom: '8px' }}>
              <div className="multi-qr-alert-icon">⚡</div>
              <div>
                <div className="multi-qr-alert-title">
                  {currentGroup.shortTitle} Split into {currentGroup.chunks.length} Barcode Scans
                </div>
                <div className="multi-qr-alert-sub">
                  Order exceeds 30-byte scanner gun limit. Cashier must scan all {currentGroup.chunks.length} parts to enter all items.
                </div>
              </div>
            </div>

            <div className="qr-stepper-tabs">
              {currentGroup.chunks.map((chunk, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`qr-stepper-tab ${idx === safeChunkIndex ? 'active' : ''}`}
                  onClick={() => setActiveChunkIndex(idx)}
                  aria-label={`Show ${currentGroup.shortTitle} part ${idx + 1}`}
                >
                  <div className="qr-tab-title">
                    {idx === safeChunkIndex ? '👉 ' : ''}Part {idx + 1} of {currentGroup.chunks.length}
                  </div>
                  <div className="qr-tab-count">
                    {chunk.items.length} {chunk.items.length === 1 ? 'item' : 'items'} ({chunk.byteLength}B)
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2D SCANNER GUN TARGET CARD */}
        <div className="scan-target-card">
          <div className="qr-scan-badge">
            <span>🎯</span>
            <span>
              {currentGroup.icon} {currentGroup.shortTitle}
              {hasMultipleReceipts ? ` (Slip ${safeGroupIndex + 1} of ${receiptGroups.length})` : ''}
              {hasMultipleChunksInGroup ? ` • Part ${safeChunkIndex + 1} of ${currentGroup.chunks.length}` : ''}
            </span>
          </div>

          <div className="scan-target-sub">
            {currentGroup.id === 'FOOD'
              ? 'Cashier scans this into Petpooja to print your Kitchen Food Token'
              : 'Cashier scans this into Petpooja to print your Coffee/Tea Beverage Token'}
          </div>

          <div className="qr-box-wrapper">
            <canvas ref={canvasRef} style={{ display: 'block' }}></canvas>
          </div>

          {/* Items contained specifically in this QR scan */}
          {activeChunk && (
            <div className="qr-chunk-items-box">
              <div className="qr-chunk-items-label">
                Items in this Scan ({activeChunk.byteLength} bytes):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {activeChunk.items.map((it) => (
                  <span key={it.id} className="qr-item-chip">
                    <strong>{it.qty}×</strong> {it.nameEn}{' '}
                    <span style={{ color: 'var(--text-muted)' }}>#{it.code}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Action Bar */}
          <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '12px' }}>
            {(safeChunkIndex > 0 || safeGroupIndex > 0) && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handlePrev}
                style={{
                  flex: 1,
                  padding: '0.75rem 0.5rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                }}
              >
                ⬅ Prev
              </button>
            )}

            {!isAbsoluteLast ? (
              <button
                type="button"
                className="btn-primary"
                onClick={handleNext}
                style={{
                  flex: 2,
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                {!isLastChunkOfGroup ? (
                  <span>Next: Part {safeChunkIndex + 2} of {currentGroup.chunks.length} ➔</span>
                ) : (
                  <span>Next: {receiptGroups[safeGroupIndex + 1].icon} {receiptGroups[safeGroupIndex + 1].shortTitle} ➔</span>
                )}
              </button>
            ) : (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleNext}
                style={{
                  flex: 1,
                  padding: '0.75rem 0.5rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  background: '#f0fdf4',
                  borderColor: '#bbf7d0',
                  color: '#15803d',
                }}
              >
                ↺ Back to Slip 1 ({receiptGroups[0].shortTitle})
              </button>
            )}
          </div>
        </div>

        {/* ORDER BREAKDOWN GROUPED BY PAPER RECEIPT */}
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            Order Breakdown by Paper Token
          </div>

          {receiptGroups.map((grp) => (
            <div key={grp.id} className="receipt-group-box">
              <div className="receipt-group-header">
                <span className="receipt-group-title">
                  <span>{grp.icon} {grp.shortTitle}</span>
                  <span className="receipt-group-token">{grp.tokenDestination}</span>
                </span>
                <span className="receipt-group-subtotal">₹{grp.subtotal}</span>
              </div>

              <div style={{ padding: '2px 0' }}>
                {grp.items.map((item) => (
                  <div key={item.id} className="receipt-line" style={{ padding: '2px 0', fontSize: '0.84rem' }}>
                    <span>
                      {item.qty} × {item.nameEn}{' '}
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                        (POS #{item.code})
                      </span>
                    </span>
                    <span style={{ fontWeight: 600 }}>₹{item.price * item.qty}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Tax & Grand Total */}
        <div className="receipt-line">
          <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
          <span>₹{rawSubtotal}</span>
        </div>
        <div className="receipt-line">
          <span style={{ color: 'var(--text-muted)' }}>GST (5%)</span>
          <span>₹{gst.toFixed(2)}</span>
        </div>
        <div className="receipt-line total">
          <span>Total Order Value</span>
          <span style={{ color: 'var(--accent)' }}>₹{grandTotal}</span>
        </div>

        {/* Operational Flow Disclaimer */}
        <div className="receipt-disclaimer">
          📄 Cashier will generate 2 separate paper tokens at billing. Hand your Food token at the Tiffin Counter and Beverage token at the Coffee Counter to collect your items.
        </div>
      </div>
    </div>
  );
}

