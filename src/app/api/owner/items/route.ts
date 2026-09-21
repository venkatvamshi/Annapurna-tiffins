import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== 'OWNER' && session.role !== 'SUPERADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // If superadmin, fallback to default restaurant if not specified
  let restaurantId = session.restaurantId;
  if (!restaurantId && session.role === 'SUPERADMIN') {
    const defaultRest = await prisma.restaurant.findFirst();
    restaurantId = defaultRest?.id || null;
  }

  if (!restaurantId) {
    return NextResponse.json({ error: 'No restaurant associated with this account' }, { status: 400 });
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
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
        where: { type: 'SPECIAL_DISH' },
      },
    },
  });

  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
  }

  return NextResponse.json({
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      nameKn: restaurant.nameKn,
      slug: restaurant.slug,
    },
    categories: restaurant.categories,
    specialPromotion: restaurant.promotions[0] || null,
  });
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'OWNER' && session.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let restaurantId = session.restaurantId;
    if (!restaurantId && session.role === 'SUPERADMIN') {
      const defaultRest = await prisma.restaurant.findFirst();
      restaurantId = defaultRest?.id || null;
    }

    if (!restaurantId) {
      return NextResponse.json({ error: 'No restaurant associated' }, { status: 400 });
    }

    const body = await request.json();
    const { nameEn, nameKn, categoryId, price, code, description, badge, isSpecial } = body;

    if (!nameEn || !categoryId || price === undefined) {
      return NextResponse.json({ error: 'Name, category, and price are required' }, { status: 400 });
    }

    // Verify category belongs to this restaurant
    const category = await prisma.category.findFirst({
      where: { id: categoryId, restaurantId },
    });

    if (!category) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    // Generate unique POS code if not provided, or validate uniqueness if provided
    let finalCode = code?.trim();
    if (!finalCode) {
      const existingItems = await prisma.menuItem.findMany({
        where: { restaurantId },
        select: { code: true },
      });
      const codeSet = new Set(existingItems.map((i) => i.code));
      let candidate = 101;
      while (codeSet.has(String(candidate))) {
        candidate++;
      }
      finalCode = String(candidate);
    } else {
      const duplicate = await prisma.menuItem.findFirst({
        where: { restaurantId, code: finalCode },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: `POS Code #${finalCode} is already assigned to "${duplicate.nameEn}". Each dish must have a unique POS Code.` },
          { status: 400 }
        );
      }
    }

    // Determine max sortOrder in this category
    const lastItem = await prisma.menuItem.findFirst({
      where: { categoryId },
      orderBy: { sortOrder: 'desc' },
    });
    const nextSortOrder = (lastItem?.sortOrder || 0) + 1;

    const newItem = await prisma.menuItem.create({
      data: {
        restaurantId,
        categoryId,
        nameEn: nameEn.trim(),
        nameKn: nameKn ? nameKn.trim() : null,
        price: Math.max(0, Math.round(Number(price))),
        code: finalCode,
        description: description ? description.trim() : null,
        badge: badge ? badge.trim() : null,
        isSpecial: Boolean(isSpecial),
        isAvailable: true,
        sortOrder: nextSortOrder,
      },
    });

    return NextResponse.json({ success: true, item: newItem }, { status: 201 });
  } catch (error) {
    console.error('Error creating menu item:', error);
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 });
  }
}
