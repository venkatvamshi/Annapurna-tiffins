import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
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
    const { title, subtitle, badge, description, imageUrl, primaryBtnText, primaryBtnAction, isActive } = body;

    // Check if special dish promo exists for this restaurant
    const existing = await prisma.promotion.findFirst({
      where: {
        restaurantId,
        type: 'SPECIAL_DISH',
      },
    });

    let promo;
    if (existing) {
      promo = await prisma.promotion.update({
        where: { id: existing.id },
        data: {
          title: title ?? existing.title,
          subtitle: subtitle !== undefined ? subtitle : existing.subtitle,
          badge: badge !== undefined ? badge : existing.badge,
          description: description !== undefined ? description : existing.description,
          imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
          primaryBtnText: primaryBtnText !== undefined ? primaryBtnText : existing.primaryBtnText,
          primaryBtnAction: primaryBtnAction !== undefined ? primaryBtnAction : existing.primaryBtnAction,
          isActive: typeof isActive === 'boolean' ? isActive : existing.isActive,
        },
      });
    } else {
      promo = await prisma.promotion.create({
        data: {
          restaurantId,
          type: 'SPECIAL_DISH',
          title: title || "Chef's Special",
          subtitle: subtitle || null,
          badge: badge || 'Special',
          description: description || 'Try our signature dish today!',
          imageUrl: imageUrl || null,
          primaryBtnText: primaryBtnText || 'Add to Order',
          primaryBtnAction: primaryBtnAction || null,
          isActive: typeof isActive === 'boolean' ? isActive : true,
          priority: 10,
        },
      });
    }

    return NextResponse.json({ success: true, promotion: promo });
  } catch (error) {
    console.error('Error saving owner promotion:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
