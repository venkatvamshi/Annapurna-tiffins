import CustomerMenuView from '@/components/CustomerMenuView';

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>;
}) {
  const { restaurantSlug } = await params;
  return <CustomerMenuView initialSlug={restaurantSlug} />;
}
