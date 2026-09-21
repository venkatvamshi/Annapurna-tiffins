import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Unauthorized: Superadmin access required' }, { status: 403 });
  }

  const promotions = await prisma.promotion.findMany({
    orderBy: { priority: 'desc' },
    include: {
      restaurant: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  return NextResponse.json({ promotions });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Superadmin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, restaurantId, type, title, subtitle, badge, description, primaryBtnText, primaryBtnAction, secondaryBtnText, isActive, priority } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (id) {
      // Update existing
      const updated = await prisma.promotion.update({
        where: { id },
        data: {
          restaurantId: restaurantId || null,
          type: type || 'HYPERLOCAL_AD',
          title: title.trim(),
          subtitle: subtitle?.trim() || null,
          badge: badge?.trim() || null,
          description: description?.trim() || null,
          primaryBtnText: primaryBtnText?.trim() || null,
          primaryBtnAction: primaryBtnAction?.trim() || null,
          secondaryBtnText: secondaryBtnText?.trim() || null,
          isActive: typeof isActive === 'boolean' ? isActive : true,
          priority: typeof priority === 'number' ? priority : 0,
        },
      });
      return NextResponse.json({ success: true, promotion: updated });
    } else {
      // Create new
      const created = await prisma.promotion.create({
        data: {
          restaurantId: restaurantId || null,
          type: type || 'HYPERLOCAL_AD',
          title: title.trim(),
          subtitle: subtitle?.trim() || null,
          badge: badge?.trim() || null,
          description: description?.trim() || null,
          primaryBtnText: primaryBtnText?.trim() || 'Learn More',
          primaryBtnAction: primaryBtnAction?.trim() || null,
          secondaryBtnText: secondaryBtnText?.trim() || 'Close',
          isActive: typeof isActive === 'boolean' ? isActive : true,
          priority: typeof priority === 'number' ? priority : 5,
        },
      });
      return NextResponse.json({ success: true, promotion: created });
    }
  } catch (error) {
    console.error('Error saving developer promotion:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
