import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Promotion } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('restaurant') || process.env.NEXT_PUBLIC_DEFAULT_RESTAURANT || 'annapurna-tiffins';

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      include: {
        categories: {
          orderBy: { sortOrder: 'asc' },
          include: {
            items: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        promotions: {
          where: { isActive: true },
          orderBy: { priority: 'desc' },
          take: 1,
        },
      },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Check for active restaurant-level promotion first; if none, check for active global developer ad
    let activePromotion: Promotion | null = restaurant.promotions[0] || null;
    if (!activePromotion) {
      const globalAd = await prisma.promotion.findFirst({
        where: {
          restaurantId: null,
          isActive: true,
        },
        orderBy: { priority: 'desc' },
      });
      activePromotion = globalAd;
    }

    return NextResponse.json({
      restaurant: {
        id: restaurant.id,
        slug: restaurant.slug,
        name: restaurant.name,
        nameKn: restaurant.nameKn,
        subtitle: restaurant.subtitle,
        placeId: restaurant.placeId,
        supportPhone: restaurant.supportPhone,
        isActive: restaurant.isActive,
      },
      categories: restaurant.categories.map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        titleKn: c.titleKn,
        timing: c.timing,
        sortOrder: c.sortOrder,
        items: c.items.map((item) => ({
          id: item.id,
          code: item.code,
          nameEn: item.nameEn,
          nameKn: item.nameKn,
          description: item.description,
          price: item.price,
          badge: item.badge,
          isAvailable: item.isAvailable,
          isSpecial: item.isSpecial,
          categoryId: item.categoryId,
        })),
      })),
      activePromotion,
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
