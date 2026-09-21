import CustomerMenuView from '@/components/CustomerMenuView';

export default function HomePage() {
  const defaultSlug = process.env.NEXT_PUBLIC_DEFAULT_RESTAURANT || 'annapurna-tiffins';
  return <CustomerMenuView initialSlug={defaultSlug} />;
}
