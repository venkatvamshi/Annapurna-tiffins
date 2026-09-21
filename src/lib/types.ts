export interface SerializedMenuItem {
  id: string;
  code: string;
  nameEn: string;
  nameKn: string | null;
  description: string | null;
  price: number;
  badge: string | null;
  isAvailable: boolean;
  isSpecial: boolean;
  categoryId: string;
}

export interface SerializedCategory {
  id: string;
  slug: string;
  title: string;
  titleKn: string | null;
  timing: string | null;
  sortOrder: number;
  items: SerializedMenuItem[];
}

export interface SerializedPromotion {
  id: string;
  restaurantId: string | null;
  type: 'SPECIAL_DISH' | 'HYPERLOCAL_AD';
  title: string;
  subtitle: string | null;
  badge: string | null;
  description: string | null;
  imageUrl: string | null;
  primaryBtnText: string | null;
  primaryBtnAction: string | null; // "ADD_ITEM:item_id" or "URL:https://..."
  secondaryBtnText: string | null;
  secondaryBtnAction: string | null;
  isActive: boolean;
  priority: number;
}

export interface SerializedRestaurant {
  id: string;
  slug: string;
  name: string;
  nameKn: string | null;
  subtitle: string | null;
  placeId: string | null;
  supportPhone: string | null;
  isActive: boolean;
}

export interface MenuApiResponse {
  restaurant: SerializedRestaurant;
  categories: SerializedCategory[];
  activePromotion: SerializedPromotion | null;
}

export interface AuthSession {
  userId: string;
  username: string;
  role: 'SUPERADMIN' | 'OWNER';
  restaurantId?: string | null;
}
