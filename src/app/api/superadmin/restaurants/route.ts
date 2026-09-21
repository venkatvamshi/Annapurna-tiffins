import { NextRequest, NextResponse } from 'next/server';
import { getSession, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Unauthorized: Superadmin access required' }, { status: 403 });
  }

  const restaurants = await prisma.restaurant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          menuItems: true,
          categories: true,
          users: true,
        },
      },
    },
  });

  return NextResponse.json({ restaurants });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Superadmin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, nameKn, slug, subtitle, placeId, supportPhone, ownerUsername, ownerPassword } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Restaurant name and slug are required' }, { status: 400 });
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');

    // Check slug uniqueness
    const existing = await prisma.restaurant.findUnique({ where: { slug: cleanSlug } });
    if (existing) {
      return NextResponse.json({ error: `A restaurant with slug "${cleanSlug}" already exists.` }, { status: 400 });
    }

    // Create restaurant
    const restaurant = await prisma.restaurant.create({
      data: {
        slug: cleanSlug,
        name: name.trim(),
        nameKn: nameKn?.trim() || null,
        subtitle: subtitle?.trim() || null,
        placeId: placeId?.trim() || null,
        supportPhone: supportPhone?.trim() || null,
        isActive: true,
      },
    });

    // Create default categories for fast onboarding
    await prisma.category.createMany({
      data: [
        { restaurantId: restaurant.id, slug: 'breakfast', title: 'Breakfast & Tiffins', titleKn: 'ತಿಂಡಿಗಳು', timing: '7:00 AM – 11:30 AM', sortOrder: 1 },
        { restaurantId: restaurant.id, slug: 'dosa', title: 'Dosa Varieties', titleKn: 'ದೋಸೆಗಳು', timing: 'All Day', sortOrder: 2 },
        { restaurantId: restaurant.id, slug: 'beverages', title: 'Beverages', titleKn: 'ಕಾಫಿ / ಟೀ', timing: 'All Day', sortOrder: 3 },
      ],
    });

    // Create owner login credentials if provided
    let createdOwner = null;
    if (ownerUsername && ownerPassword) {
      const existingUser = await prisma.user.findUnique({ where: { username: ownerUsername.trim() } });
      if (!existingUser) {
        const passwordHash = await hashPassword(ownerPassword);
        createdOwner = await prisma.user.create({
          data: {
            username: ownerUsername.trim(),
            passwordHash,
            role: 'OWNER',
            restaurantId: restaurant.id,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      restaurant,
      ownerUsername: createdOwner?.username || null,
    });
  } catch (error) {
    console.error('Error onboarding restaurant:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
