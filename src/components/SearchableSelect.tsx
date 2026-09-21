'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  image?: string;
  badge?: string;
  group?: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search dishes or items...',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.label.toLowerCase().includes(q) ||
      (o.sublabel && o.sublabel.toLowerCase().includes(q)) ||
      (o.group && o.group.toLowerCase().includes(q))
    );
  });

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '0.75rem 0.9rem',
          borderRadius: 'var(--radius-md)',
          border: '1.5px solid var(--border)',
          background: 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: '0.92rem',
          color: selectedOption ? 'var(--text-main)' : 'var(--text-muted)',
          fontWeight: 600,
          boxShadow: 'var(--shadow-sm)',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          {selectedOption?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selectedOption.image}
              alt=""
              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
            />
          )}
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span>{selectedOption ? selectedOption.label : placeholder}</span>
            {selectedOption?.sublabel && (
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                ({selectedOption.sublabel})
              </span>
            )}
          </div>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'var(--surface)',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 100,
            maxHeight: '280px',
            overflowY: 'auto',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {/* Search Box */}
          <div style={{ padding: '8px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--surface)' }}>
            <input
              type="text"
              autoFocus
              className="form-input"
              style={{ padding: '6px 10px', fontSize: '0.84rem' }}
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options List */}
          <div style={{ padding: '4px 0' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                No matching items found
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  style={{
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: opt.value === value ? 'var(--primary-light)' : 'transparent',
                    borderBottom: '1px solid var(--border)',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {opt.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={opt.image}
                        alt=""
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    )}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {opt.label}
                        {opt.badge && (
                          <span style={{ fontSize: '0.68rem', marginLeft: '6px', background: 'var(--accent-light)', color: 'var(--accent)', padding: '1px 5px', borderRadius: '3px', fontWeight: 800 }}>
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.sublabel && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {opt.sublabel}
                        </div>
                      )}
                    </div>
                  </div>
                  {opt.value === value && (
                    <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1rem' }}>✓</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
