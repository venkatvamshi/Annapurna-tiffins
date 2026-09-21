'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { SerializedCategory, SerializedMenuItem, SerializedPromotion } from '@/lib/types';
import SearchableSelect, { SelectOption } from '@/components/SearchableSelect';

interface OwnerData {
  restaurant: {
    id: string;
    name: string;
    nameKn: string | null;
    slug: string;
  };
  categories: (SerializedCategory & { items: SerializedMenuItem[] })[];
  specialPromotion: SerializedPromotion | null;
}

const VISUAL_OPTIONS: SelectOption[] = [
  {
    value: '/images/dishes/thatte-idly.jpg',
    label: 'Steamed Thatte Idly & Ghee',
    sublabel: 'Steamed idly with podi & ghee',
    image: '/images/dishes/thatte-idly.jpg',
  },
  {
    value: '/images/dishes/masala-dosa.jpg',
    label: 'Golden Crisp Masala Dosa',
    sublabel: 'Crispy dosa with potato palya',
    image: '/images/dishes/masala-dosa.jpg',
  },
  {
    value: '/images/dishes/medu-vada.jpg',
    label: 'Crispy Golden Medu Vadas',
    sublabel: 'Fried vadas with coconut chutney',
    image: '/images/dishes/medu-vada.jpg',
  },
  {
    value: '/images/dishes/poori-saagu.jpg',
    label: 'Hot Puffed Poori Saagu',
    sublabel: 'Puffed pooris with potato curry',
    image: '/images/dishes/poori-saagu.jpg',
  },
  {
    value: '/images/dishes/kesari-bath.jpg',
    label: 'Pure Desi Ghee Kesari Bath',
    sublabel: 'Saffron halwa with cashews',
    image: '/images/dishes/kesari-bath.jpg',
  },
  {
    value: '/images/dishes/south-indian-meals.jpg',
    label: 'South Indian Meals Thali',
    sublabel: 'Full banana leaf thali',
    image: '/images/dishes/south-indian-meals.jpg',
  },
  {
    value: '/images/dishes/filter-coffee.jpg',
    label: 'Degree Filter Coffee',
    sublabel: 'Traditional brass davarah',
    image: '/images/dishes/filter-coffee.jpg',
  },
];

export default function OwnerDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<OwnerData | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Dish Modal (All Fields)
  const [editingItem, setEditingItem] = useState<SerializedMenuItem | null>(null);
  const [editNameEn, setEditNameEn] = useState('');
  const [editNameKn, setEditNameKn] = useState('');
  const [editCatId, setEditCatId] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCode, setEditCode] = useState('');
  const [editBadge, setEditBadge] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Menu Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');
  const [showSoldOutOnly, setShowSoldOutOnly] = useState(false);

  // Promo edit state
  const [selectedPromoItemId, setSelectedPromoItemId] = useState('');
  const [promoTitle, setPromoTitle] = useState('');
  const [promoSubtitle, setPromoSubtitle] = useState('');
  const [promoDesc, setPromoDesc] = useState('');
  const [promoImageUrl, setPromoImageUrl] = useState('/images/dishes/thatte-idly.jpg');
  const [promoBtnText, setPromoBtnText] = useState('Add Special Item to Cart');
  const [promoBtnAction, setPromoBtnAction] = useState('ADD_ITEM:102');
  const [promoActive, setPromoActive] = useState(true);
  const [savingPromo, setSavingPromo] = useState(false);
  const [promoSavedNotice, setPromoSavedNotice] = useState(false);

  // Add New Dish Modal state
  const [isAddDishOpen, setIsAddDishOpen] = useState(false);
  const [newDishNameEn, setNewDishNameEn] = useState('');
  const [newDishNameKn, setNewDishNameKn] = useState('');
  const [newDishCatId, setNewDishCatId] = useState('');
  const [newDishPrice, setNewDishPrice] = useState<number>(60);
  const [newDishCode, setNewDishCode] = useState('');
  const [newDishDesc, setNewDishDesc] = useState('');
  const [newDishBadge, setNewDishBadge] = useState('');
  const [addingDish, setAddingDish] = useState(false);
  const [dishNotice, setDishNotice] = useState<string | null>(null);

  // Delete confirmation modal state
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<SerializedMenuItem | null>(null);
  const [deletingDish, setDeletingDish] = useState(false);

  // Segmented view: 'menu' (fast counter stock/prices) or 'promo' (spotlight special)
  const [adminTab, setAdminTab] = useState<'menu' | 'promo'>('menu');

  // Change Password state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (!newPassword) {
      setPasswordError('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const resJson = await res.json();
      if (!res.ok) {
        setPasswordError(resJson.error || 'Failed to update password.');
        return;
      }
      setPasswordSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsChangePasswordOpen(false);
        setPasswordSuccess(null);
      }, 1400);
    } catch {
      setPasswordError('Network error. Please try again.');
    } finally {
      setSavingPassword(false);
    }
  };

  // PWA install prompt state
  const [installPrompt, setInstallPrompt] = useState<{ prompt: () => void; userChoice: Promise<{ outcome: string }> } | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as unknown as { prompt: () => void; userChoice: Promise<{ outcome: string }> });
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPwa = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
      setInstallPrompt(null);
    }
  };

  const loadOwnerData = useCallback(async () => {
    try {
      const res = await fetch('/api/owner/items');
      if (res.status === 401 || res.status === 403) {
        router.push('/admin/login');
        return;
      }
      const json: OwnerData = await res.json();
      setData(json);

      if (json.specialPromotion) {
        setPromoTitle(json.specialPromotion.title);
        setPromoSubtitle(json.specialPromotion.subtitle || '');
        setPromoDesc(json.specialPromotion.description || '');
        setPromoImageUrl(json.specialPromotion.imageUrl || '/images/dishes/thatte-idly.jpg');
        setPromoBtnText(json.specialPromotion.primaryBtnText || 'Add Special to Order');
        setPromoBtnAction(json.specialPromotion.primaryBtnAction || '');
        setPromoActive(json.specialPromotion.isActive);
      }
    } catch (err) {
      console.error('Failed to load owner data:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadOwnerData();
  }, [loadOwnerData]);

  // 1-Tap Stock Toggle
  const toggleStock = async (itemId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    // Optimistic UI update
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        categories: prev.categories.map((cat) => ({
          ...cat,
          items: cat.items.map((item) =>
            item.id === itemId ? { ...item, isAvailable: newStatus } : item
          ),
        })),
      };
    });

    try {
      const res = await fetch(`/api/owner/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update stock');
    } catch (err) {
      console.error(err);
      loadOwnerData();
    }
  };

  // Open Edit Dish Sheet (All Fields)
  const openEditDish = (item: SerializedMenuItem) => {
    setEditingItem(item);
    setEditNameEn(item.nameEn);
    setEditNameKn(item.nameKn || '');
    setEditCatId(item.categoryId);
    setEditPrice(item.price);
    setEditCode(item.code);
    setEditBadge(item.badge || '');
    setEditDesc(item.description || '');
    setEditError(null);
  };

  // Save Full Dish Edits (All Fields)
  const handleSaveDishEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingItem) return;
    setSavingEdit(true);
    setEditError(null);
    try {
      const finalCode = editCode.trim() || editingItem.code;
      const res = await fetch(`/api/owner/items/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameEn: editNameEn.trim(),
          nameKn: editNameKn.trim() || undefined,
          categoryId: editCatId,
          price: editPrice,
          code: finalCode,
          badge: editBadge.trim() || undefined,
          description: editDesc.trim() || undefined,
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        setEditError(resData.error || 'Failed to update dish');
        setSavingEdit(false);
        return;
      }
      const updatedItem = resData.item;

      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          categories: prev.categories.map((cat) => {
            if (cat.id === editCatId) {
              const exists = cat.items.some((i) => i.id === updatedItem.id);
              return {
                ...cat,
                items: exists
                  ? cat.items.map((i) => (i.id === updatedItem.id ? updatedItem : i))
                  : [...cat.items, updatedItem],
              };
            } else {
              return {
                ...cat,
                items: cat.items.filter((i) => i.id !== updatedItem.id),
              };
            }
          }),
        };
      });

      // Sync active promotion if this item is currently spotlighted
      if (promoBtnAction === `ADD_ITEM:${editingItem.code}`) {
        setPromoBtnAction(`ADD_ITEM:${finalCode}`);
        setPromoBtnText('Add Special Item to Cart');
      }

      setDishNotice(`✓ Saved "${updatedItem.nameEn}" (₹${updatedItem.price} • POS #${finalCode})`);
      setTimeout(() => setDishNotice(null), 3500);
      setEditingItem(null);
    } catch (err) {
      console.error(err);
      alert('Failed to update dish');
    } finally {
      setSavingEdit(false);
    }
  };

  // Add New Dish Handler
  const handleCreateDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishNameEn.trim() || !newDishCatId) return;
    setAddingDish(true);
    try {
      const res = await fetch('/api/owner/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameEn: newDishNameEn.trim(),
          nameKn: newDishNameKn.trim() || undefined,
          categoryId: newDishCatId,
          price: newDishPrice,
          code: newDishCode.trim() || undefined,
          description: newDishDesc.trim() || undefined,
          badge: newDishBadge.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add dish');
      }
      const { item: createdItem } = await res.json();

      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          categories: prev.categories.map((cat) => {
            if (cat.id === newDishCatId) {
              return {
                ...cat,
                items: [...cat.items, createdItem],
              };
            }
            return cat;
          }),
        };
      });

      setDishNotice(`✓ "${createdItem.nameEn}" added to live menu!`);
      setTimeout(() => setDishNotice(null), 4000);

      // Reset
      setNewDishNameEn('');
      setNewDishNameKn('');
      setNewDishDesc('');
      setNewDishBadge('');
      setNewDishCode('');
      setIsAddDishOpen(false);
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to add dish');
    } finally {
      setAddingDish(false);
    }
  };

  // Execute Delete from Confirmation Modal (Zero JS alert/confirm)
  const handleExecuteDelete = async () => {
    if (!deleteConfirmItem) return;
    setDeletingDish(true);
    try {
      const res = await fetch(`/api/owner/items/${deleteConfirmItem.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete item');

      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          categories: prev.categories.map((cat) => ({
            ...cat,
            items: cat.items.filter((i) => i.id !== deleteConfirmItem.id),
          })),
        };
      });

      setDishNotice(`✓ "${deleteConfirmItem.nameEn}" removed from menu.`);
      setTimeout(() => setDishNotice(null), 4000);
      setDeleteConfirmItem(null);
    } catch (err) {
      console.error(err);
      setDishNotice('Could not remove dish. Please try again.');
      setTimeout(() => setDishNotice(null), 4000);
    } finally {
      setDeletingDish(false);
    }
  };

  // Save Special Dish Promotion
  const handleSavePromotion = async () => {
    setSavingPromo(true);
    try {
      const res = await fetch('/api/owner/promotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: promoTitle,
          subtitle: promoSubtitle,
          description: promoDesc,
          imageUrl: promoImageUrl,
          primaryBtnText: promoBtnText,
          primaryBtnAction: promoBtnAction,
          isActive: promoActive,
        }),
      });
      if (res.ok) {
        setPromoSavedNotice(true);
        setTimeout(() => setPromoSavedNotice(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPromo(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  // Build searchable options for dishes
  const dishSelectOptions: SelectOption[] = useMemo(() => {
    if (!data) return [];
    const opts: SelectOption[] = [];
    for (const cat of data.categories) {
      for (const item of cat.items) {
        const name = item.nameEn.toLowerCase();
        let img = '/images/dishes/thatte-idly.jpg';
        if (name.includes('dosa')) img = '/images/dishes/masala-dosa.jpg';
        else if (name.includes('vada')) img = '/images/dishes/medu-vada.jpg';
        else if (name.includes('poori')) img = '/images/dishes/poori-saagu.jpg';
        else if (name.includes('kesari') || name.includes('bath') || name.includes('upma') || name.includes('pongal')) img = '/images/dishes/kesari-bath.jpg';
        else if (name.includes('meal') || name.includes('rice') || name.includes('roti')) img = '/images/dishes/south-indian-meals.jpg';
        else if (name.includes('coffee') || name.includes('tea') || name.includes('milk')) img = '/images/dishes/filter-coffee.jpg';

        opts.push({
          value: item.id,
          label: item.nameEn,
          sublabel: `₹${item.price} • POS ${item.code}`,
          image: img,
          badge: item.nameKn || undefined,
          group: cat.title,
        });
      }
    }
    return opts;
  }, [data]);

  // Build searchable options for categories
  const categorySelectOptions: SelectOption[] = useMemo(() => {
    if (!data) return [];
    return data.categories.map((cat) => {
      const slug = cat.slug.toLowerCase();
      let img = '/images/dishes/thatte-idly.jpg';
      if (slug.includes('dosa')) img = '/images/dishes/masala-dosa.jpg';
      else if (slug.includes('lunch') || slug.includes('meal')) img = '/images/dishes/south-indian-meals.jpg';
      else if (slug.includes('beverage') || slug.includes('coffee') || slug.includes('tea')) img = '/images/dishes/filter-coffee.jpg';
      else if (slug.includes('special')) img = '/images/dishes/poori-saagu.jpg';

      return {
        value: cat.id,
        label: cat.title,
        sublabel: cat.titleKn || undefined,
        image: img,
      };
    });
  }, [data]);

  // Real-time duplicate POS Code detection for Edit Dish
  const duplicateEditDish = useMemo(() => {
    if (!editingItem || !data || !editCode.trim()) return null;
    const trimmed = editCode.trim().toLowerCase();
    if (trimmed === editingItem.code.toLowerCase()) return null;
    for (const cat of data.categories) {
      for (const it of cat.items) {
        if (it.id !== editingItem.id && it.code.toLowerCase() === trimmed) {
          return it;
        }
      }
    }
    return null;
  }, [editingItem, data, editCode]);

  // Check if current spotlighted promo item is sold out in menu
  const selectedPromoItemData = useMemo(() => {
    if (!data || !selectedPromoItemId) return null;
    for (const cat of data.categories) {
      const it = cat.items.find((i) => i.id === selectedPromoItemId);
      if (it) return it;
    }
    return null;
  }, [data, selectedPromoItemId]);

  const totalItemsCount = useMemo(() => {
    if (!data) return 0;
    return data.categories.reduce((sum, cat) => sum + cat.items.length, 0);
  }, [data]);

  // Handle dish selection
  const handleSelectDish = (itemId: string) => {
    setSelectedPromoItemId(itemId);
    if (!data) return;
    for (const cat of data.categories) {
      const found = cat.items.find((i) => i.id === itemId);
      if (found) {
        const name = found.nameEn.toLowerCase();
        setPromoTitle(found.nameEn);
        setPromoSubtitle(found.nameEn);
        setPromoDesc(found.description || `${found.nameEn} prepared fresh with authentic ingredients!`);
        setPromoBtnText('Add Special Item to Cart');
        setPromoBtnAction(`ADD_ITEM:${found.code}`);

        if (name.includes('dosa')) setPromoImageUrl('/images/dishes/masala-dosa.jpg');
        else if (name.includes('vada')) setPromoImageUrl('/images/dishes/medu-vada.jpg');
        else if (name.includes('poori')) setPromoImageUrl('/images/dishes/poori-saagu.jpg');
        else if (name.includes('kesari') || name.includes('bath') || name.includes('upma') || name.includes('pongal')) setPromoImageUrl('/images/dishes/kesari-bath.jpg');
        else if (name.includes('meal') || name.includes('rice') || name.includes('roti')) setPromoImageUrl('/images/dishes/south-indian-meals.jpg');
        else if (name.includes('coffee') || name.includes('tea') || name.includes('milk')) setPromoImageUrl('/images/dishes/filter-coffee.jpg');
        else setPromoImageUrl('/images/dishes/thatte-idly.jpg');
        break;
      }
    }
  };

  // Filter items for stock management
  const filteredCategories = useMemo(() => {
    if (!data) return [];
    return data.categories
      .map((cat) => {
        if (catFilter !== 'ALL' && cat.id !== catFilter) return null;
        const matchingItems = cat.items.filter((item) => {
          if (showSoldOutOnly && item.isAvailable) return false;
          if (!searchQuery) return true;
          const q = searchQuery.toLowerCase();
          return (
            item.nameEn.toLowerCase().includes(q) ||
            (item.nameKn && item.nameKn.toLowerCase().includes(q)) ||
            item.code.toLowerCase().includes(q)
          );
        });
        if (matchingItems.length === 0) return null;
        return { ...cat, items: matchingItems };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);
  }, [data, catFilter, showSoldOutOnly, searchQuery]);

  // Total sold out count
  const soldOutCount = useMemo(() => {
    if (!data) return 0;
    return data.categories.reduce(
      (acc, cat) => acc + cat.items.filter((i) => !i.isAvailable).length,
      0
    );
  }, [data]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '12px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/dishes/thatte-idly.jpg"
          alt="Annapurna Pure Veg"
          style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }}
        />
        <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>Loading Owner Console...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', paddingBottom: '5rem', width: '100%', overflowX: 'hidden' }}>
      {/* Top App Header */}
      <header
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '0.85rem 1rem',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.25rem' }}>⚙️</span>
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.1 }}>
              {data.restaurant.name}
            </h1>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Live Kitchen &amp; Counter Manager
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => {
              setIsChangePasswordOpen(true);
              setPasswordError(null);
              setPasswordSuccess(null);
            }}
            style={{
              background: 'var(--surface-warm)',
              border: '1px solid var(--border)',
              padding: '5px 9px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Change Account Password"
          >
            <span>🔑</span>
            <span>Password</span>
          </button>

          <button
            onClick={handleLogout}
            style={{
              background: 'var(--surface-warm)',
              border: '1px solid var(--border)',
              padding: '5px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <div style={{ width: '100%', maxWidth: '540px', margin: '0 auto', padding: '0.85rem 0.75rem', boxSizing: 'border-box' }}>
        {/* PWA Install Banner */}
        {installPrompt && !installed && (
          <div
            className="admin-card"
            style={{
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
              border: '1.5px solid #fed7aa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.9rem 1rem',
              marginBottom: '1rem',
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#92400e' }}>
                📲 Add Admin App to Phone
              </div>
              <div style={{ fontSize: '0.76rem', color: '#b45309' }}>
                1-tap home screen access for instant counter toggling.
              </div>
            </div>
            <button
              onClick={handleInstallPwa}
              className="btn-primary"
              style={{ padding: '0.5rem 0.9rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            >
              Install App
            </button>
          </div>
        )}

        {/* Segmented Tabs (Unclutters mobile screen, separated Counter Stock vs Daily Promo) */}
        <div className="admin-nav-tabs">
          <button
            type="button"
            className={`admin-nav-tab ${adminTab === 'menu' ? 'active' : ''}`}
            onClick={() => setAdminTab('menu')}
          >
            <span>🍽️</span>
            <span>Menu &amp; Stock</span>
            <span className="admin-nav-tab-badge">{totalItemsCount}</span>
          </button>
          <button
            type="button"
            className={`admin-nav-tab ${adminTab === 'promo' ? 'active' : ''}`}
            onClick={() => setAdminTab('promo')}
          >
            <span>⭐</span>
            <span>Spotlight Promo</span>
            {promoActive && <span className="admin-nav-tab-dot" />}
          </button>
        </div>

        {/* Promotion Modal Manager (Dedicated clean tab) */}
        {adminTab === 'promo' && (
          <div className="admin-card" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⭐</span> Promotion Modal Spotlight
              </h2>
              <label className="large-stock-switch" style={{ minHeight: '36px' }}>
                <input
                  type="checkbox"
                  checked={promoActive}
                  onChange={(e) => setPromoActive(e.target.checked)}
                  style={{ display: 'none' }}
                />
                <span className="large-switch-toggle" style={{ width: '44px', height: '26px' }}></span>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: promoActive ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {promoActive ? 'Active' : 'Disabled'}
                </span>
              </label>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              This dish is spotlighted in the arch modal on all customer phones upon opening the menu.
            </p>

            {/* Warning if spotlighted dish is currently marked Sold Out */}
            {selectedPromoItemData && !selectedPromoItemData.isAvailable && (
              <div
                style={{
                  background: '#fee2e2',
                  border: '1.5px solid #fca5a5',
                  color: '#b91c1c',
                  padding: '0.75rem 0.95rem',
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  marginBottom: '1rem',
                  lineHeight: 1.4,
                }}
              >
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚠️</span>
                <div>
                  <div>
                    <strong>Notice: &ldquo;{selectedPromoItemData.nameEn}&rdquo; is currently marked SOLD OUT in your menu.</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', marginTop: '2px', fontWeight: 600, color: '#991b1b' }}>
                    The promotion modal on customer phones will display a red &ldquo;SOLD OUT&rdquo; stamp and prevent orders for this item until you toggle it back In Stock.
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Searchable Dish Dropdown */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  🔍 Search &amp; Spotlight Any Dish
                </label>
                <SearchableSelect
                  options={dishSelectOptions}
                  value={selectedPromoItemId}
                  onChange={handleSelectDish}
                  placeholder="Type to search dish (e.g. Masala Dosa, Thatte Idly)..."
                  searchPlaceholder="Search 32 menu items..."
                />
              </div>

              {/* Auto-selected Visual & Headline */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--surface-warm)', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={promoImageUrl}
                  alt="Selected Dish Visual"
                  style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}
                />
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>
                    Dish / Promotion Title
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Thatte Idly (1 pc) / Ghee Podi Masala Dosa"
                    value={promoTitle}
                    onChange={(e) => setPromoTitle(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '3px' }}>
                  Description
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Describe your special dish..."
                  value={promoDesc}
                  onChange={(e) => setPromoDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '0.35rem' }}>
                <button
                  className="btn-primary"
                  style={{ padding: '0.75rem 1.4rem', fontSize: '0.9rem', width: '100%' }}
                  onClick={handleSavePromotion}
                  disabled={savingPromo}
                >
                  {savingPromo ? 'Saving...' : '✓ Save & Publish Promotion'}
                </button>
              </div>
              {promoSavedNotice && (
                <div style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 800, textAlign: 'center' }}>
                  ✓ Promotion Published to Customer Phones!
                </div>
              )}
            </div>
          </div>
        )}

        {/* 1-Tap Live Stock Management Section (Ergonomic One-Handed Mobile UX) */}
        {adminTab === 'menu' && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.2 }}>
                  🍽️ Live Stock &amp; Price Controls
                </h2>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  1-Hand Fast Counter
                </span>
              </div>

              {/* + Add New Dish Button */}
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  if (data.categories.length > 0 && !newDishCatId) {
                    setNewDishCatId(data.categories[0].id);
                  }
                  setIsAddDishOpen(true);
                }}
                style={{
                  padding: '0.55rem 0.95rem',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-warm)',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>➕</span>
                <span>Add Dish</span>
              </button>
            </div>

            {dishNotice && (
              <div
                style={{
                  background: 'var(--accent-light)',
                  border: '1px solid var(--accent-border)',
                  color: 'var(--accent)',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{dishNotice}</span>
                <button
                  type="button"
                  onClick={() => setDishNotice(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 800 }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Search Bar for items */}
            <div style={{ position: 'relative', marginBottom: '0.65rem' }}>
              <input
                type="text"
                className="form-input"
                style={{ padding: '0.75rem 0.9rem 0.75rem 2.25rem', fontSize: '0.9rem', borderRadius: '12px' }}
                placeholder="Search 32 items to change price or stock..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '0.95rem',
                  color: 'var(--text-muted)',
                }}
              >
                🔍
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    fontWeight: 700,
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter pills: Category pills + Sold out quick filter */}
            <div
              style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                paddingBottom: '8px',
                marginBottom: '0.75rem',
                scrollbarWidth: 'none',
              }}
            >
              <button
                className={`filter-chip ${catFilter === 'ALL' && !showSoldOutOnly ? 'active' : ''}`}
                onClick={() => {
                  setCatFilter('ALL');
                  setShowSoldOutOnly(false);
                }}
              >
                All Items
              </button>

              <button
                className={`filter-chip ${showSoldOutOnly ? 'active' : ''}`}
                onClick={() => setShowSoldOutOnly(!showSoldOutOnly)}
                style={{
                  borderColor: showSoldOutOnly ? 'var(--primary)' : 'var(--border)',
                  color: showSoldOutOnly ? '#dc2626' : undefined,
                  fontWeight: 800,
                }}
              >
                🔴 Sold Out ({soldOutCount})
              </button>

              {data.categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`filter-chip ${catFilter === cat.id && !showSoldOutOnly ? 'active' : ''}`}
                  onClick={() => {
                    setCatFilter(cat.id);
                    setShowSoldOutOnly(false);
                  }}
                >
                  {cat.title}
                </button>
              ))}
            </div>

            {/* Menu List organized by category with Spacious Cards */}
            {filteredCategories.length === 0 ? (
              <div className="admin-card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
                <div style={{ fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  No dishes found
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Try a different search keyword or clear your filters.
                </div>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setSearchQuery('');
                    setCatFilter('ALL');
                    setShowSoldOutOnly(false);
                  }}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredCategories.map((cat) => (
                <div key={cat.id} style={{ marginBottom: '1.25rem' }}>
                  {/* Category Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      padding: '0.35rem 0.25rem 0.5rem 0.25rem',
                      borderBottom: '2px solid var(--border)',
                      marginBottom: '0.65rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontWeight: 900, fontSize: '0.98rem', color: 'var(--text-main)' }}>
                        {cat.title}
                      </span>
                      {cat.titleKn && (
                        <span className="kannada" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          / {cat.titleKn}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {cat.items.length} dishes
                    </span>
                  </div>

                  {/* Dishes in this Category: Clean, Spacious Mobile Cards */}
                  <div>
                    {cat.items.map((item) => (
                      <div
                        key={item.id}
                        className={`stock-item-card ${!item.isAvailable ? 'sold-out' : ''}`}
                      >
                        {/* Top Line: Dish Title + Kannada + POS Code + Discreet Delete Button */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.98rem', color: item.isAvailable ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                {item.nameEn}
                              </span>
                              {!item.isAvailable && (
                                <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#fee2e2', color: '#dc2626', padding: '1px 6px', borderRadius: '4px' }}>
                                  SOLD OUT
                                </span>
                              )}
                              {item.badge && (
                                <span style={{ fontSize: '0.66rem', background: 'var(--accent-light)', color: 'var(--accent)', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                              {item.nameKn && (
                                <span className="kannada" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  {item.nameKn}
                                </span>
                              )}
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', background: 'var(--surface-warm)', padding: '2px 7px', borderRadius: '6px', fontWeight: 700, border: '1px solid var(--border)' }}>
                                POS #{item.code}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons: Edit ✎ & Delete 🗑 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              className="edit-touch-btn"
                              onClick={() => openEditDish(item)}
                              title={`Edit all details of ${item.nameEn}`}
                              aria-label={`Edit ${item.nameEn}`}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>

                            <button
                              type="button"
                              className="delete-touch-btn"
                              onClick={() => setDeleteConfirmItem(item)}
                              title={`Delete ${item.nameEn}`}
                              aria-label={`Delete ${item.nameEn}`}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Bottom Line: Price Touch Button (Left) and Clear In-Stock Toggle (Right) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                          {/* Price Button (Opens edit sheet) */}
                          <button
                            type="button"
                            className="price-touch-btn"
                            onClick={() => openEditDish(item)}
                            title="Tap to edit dish details"
                            style={{ height: '40px', minHeight: '40px', padding: '0 12px', minWidth: '95px' }}
                          >
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginRight: '2px' }}>Price:</span>
                            <span style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '1.05rem' }}>₹{item.price}</span>
                          </button>

                          {/* Large Stock Switch with Text Status */}
                          <label
                            className="large-stock-switch"
                            title={item.isAvailable ? 'In Stock (tap to mark Sold Out)' : 'Sold Out (tap to mark In Stock)'}
                            style={{ minHeight: '42px', margin: 0, padding: '0 4px', gap: '8px' }}
                          >
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: item.isAvailable ? 'var(--accent)' : '#9ca3af' }}>
                              {item.isAvailable ? 'IN STOCK' : 'SOLD OUT'}
                            </span>
                            <input
                              type="checkbox"
                              checked={item.isAvailable}
                              onChange={() => toggleStock(item.id, item.isAvailable)}
                              style={{ display: 'none' }}
                            />
                            <span className="large-switch-toggle" style={{ width: '48px', height: '28px' }}></span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Edit Dish Details Modal (All Fields: Name, Kannada, Category, Price, POS Code, Badge, Desc) */}
      {editingItem && (
        <div className="admin-bottom-sheet-backdrop" onClick={() => setEditingItem(null)}>
          <div className="admin-bottom-sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ✏️ Edit Dish Details
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDishEdit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Error Banner */}
              {editError && (
                <div style={{ background: '#fee2e2', border: '1.5px solid #fca5a5', color: '#b91c1c', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚠️</span>
                  <span>{editError}</span>
                </div>
              )}

              {/* Category */}
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '3px' }}>
                  Category *
                </label>
                <SearchableSelect
                  options={categorySelectOptions}
                  value={editCatId}
                  onChange={setEditCatId}
                  placeholder="Select category..."
                  searchPlaceholder="Search category..."
                />
              </div>

              {/* Dish Name (English) */}
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '3px' }}>
                  Dish Name (English) *
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editNameEn}
                  onChange={(e) => setEditNameEn(e.target.value)}
                  placeholder="e.g. Thatte Idly (1 pc)"
                  required
                />
              </div>

              {/* Kannada Name */}
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '3px' }}>
                  Kannada Name (Optional)
                </label>
                <input
                  type="text"
                  className="form-input kannada"
                  value={editNameKn}
                  onChange={(e) => setEditNameKn(e.target.value)}
                  placeholder="e.g. ತಟ್ಟೆ ಇಡ್ಲಿ (1)"
                />
              </div>

              {/* Price & Stepper */}
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '3px' }}>
                  Price (₹) *
                </label>
                <div style={{ background: 'var(--surface-warm)', border: '1.5px solid var(--border)', borderRadius: '14px', padding: '0.75rem', textAlign: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', marginRight: '4px' }}>₹</span>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Math.max(0, Number(e.target.value)))}
                    style={{
                      fontSize: '1.8rem',
                      fontWeight: 900,
                      width: '120px',
                      textAlign: 'center',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-main)',
                      outline: 'none',
                    }}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  <button type="button" className="one-hand-quick-chip" onClick={() => setEditPrice((p) => Math.max(0, p - 10))}>−₹10</button>
                  <button type="button" className="one-hand-quick-chip" onClick={() => setEditPrice((p) => Math.max(0, p - 5))}>−₹5</button>
                  <button type="button" className="one-hand-quick-chip" onClick={() => setEditPrice((p) => p + 5)}>+₹5</button>
                  <button type="button" className="one-hand-quick-chip" onClick={() => setEditPrice((p) => p + 10)}>+₹10</button>
                </div>
              </div>

              {/* POS Code & Badge */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '3px' }}>
                    Petpooja POS Code *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editCode}
                    onChange={(e) => {
                      setEditCode(e.target.value);
                      if (editError) setEditError(null);
                    }}
                    placeholder="e.g. 101"
                    style={duplicateEditDish ? { borderColor: '#dc2626', background: '#fef2f2' } : {}}
                    required
                  />
                  {duplicateEditDish && (
                    <span style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 800, display: 'block', marginTop: '3px', lineHeight: 1.2 }}>
                      ⚠️ In use by &ldquo;{duplicateEditDish.nameEn}&rdquo;
                    </span>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '3px' }}>
                    Badge (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editBadge}
                    onChange={(e) => setEditBadge(e.target.value)}
                    placeholder="e.g. Signature, Bestseller"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '3px' }}>
                  Description (Optional)
                </label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Short description of ingredients..."
                  style={{ resize: 'none' }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '0.4rem' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={savingEdit || Boolean(duplicateEditDish)}
                  style={{
                    width: '100%',
                    padding: '0.95rem',
                    fontSize: '1rem',
                    borderRadius: '14px',
                    opacity: duplicateEditDish ? 0.6 : 1,
                    cursor: duplicateEditDish ? 'not-allowed' : 'pointer',
                  }}
                >
                  {savingEdit
                    ? 'Saving Changes...'
                    : duplicateEditDish
                    ? '⚠️ POS Code Already In Use'
                    : `✓ Save "${editNameEn || 'Dish'}" Details`}
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingItem(null)}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '14px', fontSize: '0.9rem' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Dish Modal (One-Handed Mobile Bottom Sheet) */}
      {isAddDishOpen && (
        <div className="admin-bottom-sheet-backdrop" onClick={() => setIsAddDishOpen(false)}>
          <div className="admin-bottom-sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>➕</span> Add New Menu Dish
              </h3>
              <button
                type="button"
                onClick={() => setIsAddDishOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDish} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '3px' }}>
                  Category *
                </label>
                <SearchableSelect
                  options={categorySelectOptions}
                  value={newDishCatId}
                  onChange={setNewDishCatId}
                  placeholder="Select or search category..."
                  searchPlaceholder="Type to search (e.g. Dosa, Breakfast, Meals)..."
                />
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '3px' }}>
                  Dish Name (English) *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ghee Podi Butter Dosa"
                  value={newDishNameEn}
                  onChange={(e) => setNewDishNameEn(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '3px' }}>
                  Kannada Name (Optional)
                </label>
                <input
                  type="text"
                  className="form-input kannada"
                  placeholder="e.g. ತುಪ್ಪದ ಮಸಾಲ ದೋಸೆ"
                  value={newDishNameKn}
                  onChange={(e) => setNewDishNameKn(e.target.value)}
                />
              </div>

              {/* Price & Stepper */}
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '3px' }}>
                  Price (₹) *
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                  <input
                    type="number"
                    className="form-input"
                    value={newDishPrice}
                    onChange={(e) => setNewDishPrice(Math.max(0, Number(e.target.value)))}
                    required
                    style={{ fontWeight: 900, fontSize: '1.2rem', textAlign: 'center' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  <button type="button" className="one-hand-quick-chip" onClick={() => setNewDishPrice((p) => Math.max(0, p - 10))}>−₹10</button>
                  <button type="button" className="one-hand-quick-chip" onClick={() => setNewDishPrice((p) => Math.max(0, p - 5))}>−₹5</button>
                  <button type="button" className="one-hand-quick-chip" onClick={() => setNewDishPrice((p) => p + 5)}>+₹5</button>
                  <button type="button" className="one-hand-quick-chip" onClick={() => setNewDishPrice((p) => p + 10)}>+₹10</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '3px' }}>
                    Petpooja POS Code
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 209 (Auto if blank)"
                    value={newDishCode}
                    onChange={(e) => setNewDishCode(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '3px' }}>
                    Badge (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Bestseller, New"
                    value={newDishBadge}
                    onChange={(e) => setNewDishBadge(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '3px' }}>
                  Description (Optional)
                </label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Short description of ingredients and taste..."
                  value={newDishDesc}
                  onChange={(e) => setNewDishDesc(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={addingDish}
                  style={{ width: '100%', padding: '0.95rem', fontSize: '1rem', borderRadius: '14px' }}
                >
                  {addingDish ? 'Adding Dish...' : `✓ Add "${newDishNameEn || 'Dish'}" to Menu`}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsAddDishOpen(false)}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '14px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal (Replaces browser alert/confirm) */}
      {deleteConfirmItem && (
        <div className="admin-bottom-sheet-backdrop" onClick={() => !deletingDish && setDeleteConfirmItem(null)}>
          <div
            className="admin-bottom-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{ textAlign: 'center', padding: '1.5rem 1.25rem' }}
          >
            {/* Warning Icon Badge */}
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.9rem auto',
                border: '1.5px solid #fca5a5',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Remove Dish from Menu?
            </h3>

            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#dc2626', marginBottom: '0.2rem' }}>
              &ldquo;{deleteConfirmItem.nameEn}&rdquo;
            </div>
            {deleteConfirmItem.nameKn && (
              <div className="kannada" style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                {deleteConfirmItem.nameKn}
              </div>
            )}

            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.45, maxWidth: '340px', marginInline: 'auto' }}>
              This dish will be permanently deleted from the live customer menu and cannot be recovered.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={deletingDish}
                style={{
                  width: '100%',
                  padding: '0.95rem',
                  borderRadius: '14px',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '1rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.3)',
                }}
              >
                {deletingDish ? 'Deleting Dish...' : 'Yes, Delete Dish'}
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteConfirmItem(null)}
                disabled={deletingDish}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '14px', fontSize: '0.9rem' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="modal-backdrop" onClick={() => !savingPassword && setIsChangePasswordOpen(false)}>
          <div
            className="modal-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px', width: '100%', boxSizing: 'border-box' }}
          >
            <div className="modal-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem' }}>🔑</span>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Account Security</h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Change Owner Portal Password</span>
                </div>
              </div>
              <button
                className="btn-close"
                onClick={() => !savingPassword && setIsChangePasswordOpen(false)}
                disabled={savingPassword}
              >
                ✕
              </button>
            </div>

            {passwordError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>⚠️</span>
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>✅</span>
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  Current Password *
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  disabled={savingPassword}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: '1.5px solid var(--border)',
                    background: 'var(--surface-warm)',
                    fontSize: '0.92rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  New Password * (min. 6 characters)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new strong password"
                  required
                  disabled={savingPassword}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: '1.5px solid var(--border)',
                    background: 'var(--surface-warm)',
                    fontSize: '0.92rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  disabled={savingPassword}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: '1.5px solid var(--border)',
                    background: 'var(--surface-warm)',
                    fontSize: '0.92rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsChangePasswordOpen(false)}
                  disabled={savingPassword}
                  style={{ flex: 1, padding: '0.85rem', borderRadius: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={savingPassword}
                  style={{ flex: 2, padding: '0.85rem', borderRadius: '12px' }}
                >
                  {savingPassword ? 'Updating...' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
