import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Annapurna Tiffins platform database...');

  // 1. Clean existing records (dev environment)
  await prisma.promotion.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.restaurant.deleteMany();

  // 2. Create Annapurna Tiffins restaurant
  const annapurna = await prisma.restaurant.create({
    data: {
      slug: 'annapurna-tiffins',
      name: 'Annapurna Tiffins',
      nameKn: 'ಶ್ರೀ ಅನ್ನಪೂರ್ಣ ಟಿಫಿನ್ಸ್',
      subtitle: 'Fast Self-Service • Authentic Bangalore Tiffins',
      placeId: 'ChIJIznANwAP6joRsC8ckf6OSuc',
      supportPhone: '919999999999',
      isActive: true,
    },
  });
  console.log(`Created restaurant: ${annapurna.name} (id: ${annapurna.id})`);

  // 3. Create Users
  const salt = await bcrypt.genSalt(10);
  const superadminHash = await bcrypt.hash('developer123', salt);
  const ownerHash = await bcrypt.hash('annapurna123', salt);

  // Superadmin / Developer
  await prisma.user.create({
    data: {
      username: 'developer',
      passwordHash: superadminHash,
      role: 'SUPERADMIN',
    },
  });
  console.log('Created Superadmin: developer / developer123');

  // Restaurant Owner
  await prisma.user.create({
    data: {
      username: 'annapurna_owner',
      passwordHash: ownerHash,
      role: 'OWNER',
      restaurantId: annapurna.id,
    },
  });
  console.log('Created Owner: annapurna_owner / annapurna123');

  // 4. Categories
  const categoryDefs = [
    { slug: 'breakfast', title: 'Breakfast & Tiffins', titleKn: 'ತಿಂಡಿಗಳು', timing: '7:00 AM – 11:30 AM', sortOrder: 1 },
    { slug: 'dosa', title: 'Dosa Varieties', titleKn: 'ದೋಸೆಗಳು', timing: 'All Day', sortOrder: 2 },
    { slug: 'special-dosa', title: 'Chef Specials & Pesarattu', titleKn: 'ಸ್ಪೆಷಲ್ & ಪೆಸರಟ್ಟು', timing: 'All Day', sortOrder: 3 },
    { slug: 'lunch', title: 'Meals & Roti Curries', titleKn: 'ಊಟ & ರೋಟಿ', timing: '12:00 PM – 4:00 PM', sortOrder: 4 },
    { slug: 'beverages', title: 'Beverages', titleKn: 'ಕಾಫಿ / ಟೀ', timing: 'All Day', sortOrder: 5 },
  ];

  const catMap = {};
  for (const cat of categoryDefs) {
    const created = await prisma.category.create({
      data: {
        restaurantId: annapurna.id,
        slug: cat.slug,
        title: cat.title,
        titleKn: cat.titleKn,
        timing: cat.timing,
        sortOrder: cat.sortOrder,
      },
    });
    catMap[cat.slug] = created.id;
  }
  console.log('Created categories');

  // 5. Menu Items (Authentic Bangalore tiffin list)
  const items = [
    // Breakfast
    { cat: 'breakfast', code: '101', nameEn: 'Thatte Idly (1 pc)', nameKn: 'ತಟ್ಟೆ ಇಡ್ಲಿ (1)', price: 40, badge: 'Signature', desc: 'Large flat steamed thatte idly served with spicy gun powder & fresh coconut chutney', isSpecial: true },
    { cat: 'breakfast', code: '102', nameEn: 'Ghee Podi Thatte Idly', nameKn: 'ಗೀ ಪೊಡಿ ತಟ್ಟೆ ಇಡ್ಲಿ', price: 70, badge: 'Bestseller', desc: 'Steamed thatte idly slathered with pure aromatic desi ghee and karam podi', isSpecial: true },
    { cat: 'breakfast', code: '103', nameEn: 'Idly (2) & Vada (1)', nameKn: 'ಇಡ್ಲಿ (2) / ವಡಾ', price: 70, badge: 'Popular Combo', desc: 'Two pillowy soft idlies and one crisp medu vada with hot sambar' },
    { cat: 'breakfast', code: '104', nameEn: 'Crispy Medu Vada (2)', nameKn: 'ವಡಾ (2 ಪೀಸ್)', price: 60, badge: 'Crispy', desc: 'Golden crispy urad dal vadas tempered with whole peppercorns & ginger' },
    { cat: 'breakfast', code: '105', nameEn: 'Rava Idly with Saagu', nameKn: 'ರವಾ ಇಡ್ಲಿ', price: 55, badge: 'Traditional', desc: 'Classic semolina idly with mustard, cashews, served with rich potato saagu' },
    { cat: 'breakfast', code: '106', nameEn: 'Kesari Bath', nameKn: 'ಕೇಸರಿ ಬಾತ್', price: 45, badge: 'Pure Ghee', desc: 'Rich saffron semolina dessert cooked with pure ghee, raisins and cashews' },
    { cat: 'breakfast', code: '107', nameEn: 'Khara Bath (Upma)', nameKn: 'ಖಾರಾ ಬಾತ್', price: 40, badge: '', desc: 'Karnataka style savory semolina bath tempered with veggies and spices' },
    { cat: 'breakfast', code: '108', nameEn: 'Chow Chow Bath', nameKn: 'ಚೌ ಚೌ ಬಾತ್', price: 80, badge: 'Classic Duo', desc: 'The authentic Karnataka pair of spicy Khara Bath and sweet Kesari Bath' },
    { cat: 'breakfast', code: '109', nameEn: 'Ghee Pongal', nameKn: 'ಗೀ ಪೊಂಗಲ್', price: 70, badge: 'Special', desc: 'Melt-in-mouth ven pongal tempered generously with pure ghee, cumin & black pepper' },
    { cat: 'breakfast', code: '110', nameEn: 'Poori with Aloo Saagu (2)', nameKn: 'ಪೂರಿ - ಆಲೂ ಸಾಗು', price: 70, badge: '', desc: 'Two hot fluffy wheat pooris served with spiced potato and onion saagu' },

    // Dosa
    { cat: 'dosa', code: '201', nameEn: 'Masala Dosa', nameKn: 'ಮಸಾಲ ದೋಸೆ', price: 80, badge: 'Bestseller', desc: 'Golden brown crisp dosa stuffed with aromatic spiced potato onion palya' },
    { cat: 'dosa', code: '202', nameEn: 'Ghee Podi Masala Dosa', nameKn: 'ಗೀ ಪೊಡಿ ಮಸಾಲ ದೋಸೆ', price: 120, badge: 'Signature', desc: 'Crisp dosa roasted in pure ghee, dusted with secret spice podi & potato filling' },
    { cat: 'dosa', code: '203', nameEn: 'Butter Open Dosa', nameKn: 'ಬಟರ್ ಓಪನ್ ದೋಸೆ', price: 110, badge: 'Davangere Style', desc: 'Thick spongy Davangere style open dosa loaded with fresh white butter & podi' },
    { cat: 'dosa', code: '204', nameEn: 'Mysore Masala Dosa', nameKn: 'ಮೈಸೂರು ಮಸಾಲ ದೋಸೆ', price: 110, badge: 'Chef Special', desc: 'Crispy dosa spread with spicy red garlic-chili paste and potato mash' },
    { cat: 'dosa', code: '205', nameEn: 'Plain Dosa', nameKn: 'ಪ್ಲೇನ್ ದೋಸೆ', price: 60, badge: '', desc: 'Crispy golden classic fermented rice-lentil crepe' },
    { cat: 'dosa', code: '206', nameEn: 'Set Dosa (3 pcs)', nameKn: 'ಸೆಟ್ ದೋಸೆ', price: 80, badge: 'Soft & Spongy', desc: 'Trio of feather-soft thick dosas served with creamy coconut chutney and saagu' },
    { cat: 'dosa', code: '207', nameEn: 'Onion Kaara Dosa', nameKn: 'ಈರುಳ್ಳಿ ಖಾರಾ ದೋಸೆ', price: 85, badge: '', desc: 'Crisp dosa roasted with finely diced onions and red chili chutney' },
    { cat: 'dosa', code: '208', nameEn: 'Paneer Masala Dosa', nameKn: 'ಪನ್ನೀರ್ ಮಸಾಲ ದೋಸೆ', price: 120, badge: '', desc: 'Crispy golden dosa generously filled with spiced fresh paneer filling' },
    { cat: 'dosa', code: '209', nameEn: 'Cheese Masala Dosa', nameKn: 'ಚೀಸ್ ಮಸಾಲ ದೋಸೆ', price: 130, badge: '', desc: 'Loaded with melted mozzarella and cheddar cheese over potato masala' },
    { cat: 'dosa', code: '210', nameEn: 'Rava Masala Dosa', nameKn: 'ರವಾ ಮಸಾಲ ದೋಸೆ', price: 110, badge: 'Extra Crispy', desc: 'Lacy, ultra-crispy semolina crepe stuffed with seasoned potato filling' },

    // Specials & Pesarattu
    { cat: 'special-dosa', code: '301', nameEn: 'Ghee MLA Upma Pesarattu', nameKn: 'ಗೀ ಉಪ್ಮಾ ಪೆಸರಟ್ಟು', price: 120, badge: 'Rayalaseema Special', desc: 'Whole green gram moong dal crepe stuffed with hot savory upma, roasted in ghee' },
    { cat: 'special-dosa', code: '302', nameEn: 'Kaju Paneer Dosa', nameKn: 'ಕಾಜು ಪನ್ನೀರ್ ದೋಸೆ', price: 150, badge: 'Rich Special', desc: 'Deluxe dosa packed with golden roasted cashews, paneer, and rich ghee' },
    { cat: 'special-dosa', code: '303', nameEn: 'Onion Pesarattu', nameKn: 'ಈರುಳ್ಳಿ ಪೆಸರಟ್ಟು', price: 85, badge: 'Healthy', desc: 'High protein Andhra moong dal crepe topped with raw onions, ginger & green chilies' },
    { cat: 'special-dosa', code: '304', nameEn: 'Palak Cheese Dosa', nameKn: 'ಪಾಲಕ್ ಚೀಸ್ ದೋಸೆ', price: 150, badge: '', desc: 'Fresh garden spinach puree roasted on dosa with molten cheese' },
    { cat: 'special-dosa', code: '305', nameEn: 'Onion Uthappam', nameKn: 'ಈರುಳ್ಳಿ ಉತ್ತಪ್ಪಂ', price: 100, badge: '', desc: 'Thick soft griddle cake topped with caramelized onions, coriander & green chilies' },

    // Lunch
    { cat: 'lunch', code: '401', nameEn: 'South Indian Mini Meals', nameKn: 'ದಕ್ಷಿಣ ಭಾರತದ ಊಟ', price: 110, badge: 'Full Thali', desc: 'Phulka (2), Rice, Sambar, Rasam, Palya, Papad, Pickle, Curd & Payasam' },
    { cat: 'lunch', code: '402', nameEn: 'Roti Curry Meal', nameKn: 'ರೋಟಿ ಕರಿ', price: 90, badge: '', desc: 'Two handmade soft rotis served with wholesome spiced mixed vegetable curry' },
    { cat: 'lunch', code: '403', nameEn: 'Special Curd Rice', nameKn: 'ಕರ್ಡ್ ರೈಸ್', price: 60, badge: 'Comfort Food', desc: 'Tempered curd rice with mustard seeds, ginger, green chilies, and fresh pomegranate' },

    // Beverages
    { cat: 'beverages', code: '501', nameEn: 'Filter Coffee (Degree)', nameKn: 'ಫಿಲ್ಟರ್ ಕಾಫಿ', price: 25, badge: 'Bestseller', desc: 'Strong, aromatic South Indian filter coffee brewed with chicory-rich decoction & creamy milk' },
    { cat: 'beverages', code: '502', nameEn: 'Special Masala Tea', nameKn: 'ಮಸಾಲಾ ಟೀ', price: 20, badge: '', desc: 'Freshly brewed tea infused with crushed cardamom, ginger, and aromatic spices' },
    { cat: 'beverages', code: '503', nameEn: 'Warm Badam Milk', nameKn: 'ಬಾದಾಮ್ ಹಾಲು', price: 30, badge: 'Rich', desc: 'Pure boiled milk infused with almond paste, cardamom, and saffron strands' },
    { cat: 'beverages', code: '504', nameEn: 'Ginger Sukku Coffee', nameKn: 'ಶುಂಠಿ ಕಾಫಿ', price: 25, badge: 'Ayurvedic', desc: 'Digestive dry ginger herbal coffee sweetened with jaggery' },
  ];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    await prisma.menuItem.create({
      data: {
        restaurantId: annapurna.id,
        categoryId: catMap[item.cat],
        code: item.code,
        nameEn: item.nameEn,
        nameKn: item.nameKn,
        description: item.desc,
        price: item.price,
        badge: item.badge,
        isSpecial: item.isSpecial || false,
        isAvailable: true,
        sortOrder: i + 1,
      },
    });
  }
  console.log(`Seeded ${items.length} menu items`);

  // 6. Promotions (Modal Dialog matching screenshot layout, zero blue/purple)
  // Restaurant Special Promotion
  await prisma.promotion.create({
    data: {
      restaurantId: annapurna.id,
      type: 'SPECIAL_DISH',
      title: "Chef's Morning Special",
      subtitle: 'Ghee Podi Thatte Idly',
      badge: '★ TODAY ONLY',
      description: 'Hot steamed Thatte Idly drenched in pure melted cow ghee and special Rayalaseema podi. Limited morning batch!',
      primaryBtnText: 'Add Special to Order (+₹70)',
      primaryBtnAction: 'ADD_ITEM:102',
      secondaryBtnText: 'Explore Full Menu',
      secondaryBtnAction: 'DISMISS',
      isActive: true,
      priority: 10,
    },
  });

  // Hyperlocal / Developer Ad Promotion (for multi-restaurant monetization)
  await prisma.promotion.create({
    data: {
      restaurantId: null, // Global platform ad
      type: 'HYPERLOCAL_AD',
      title: 'Bangalore Metro Smart Card',
      subtitle: 'Instant Recharge & 10% Cashback',
      badge: '⚡ SPONSORED OFFER',
      description: 'Skip token queues at Metro stations! Recharge in 30 seconds with zero convenience fees.',
      primaryBtnText: 'Claim 10% Cashback',
      primaryBtnAction: 'URL:https://example.com/metro-offer',
      secondaryBtnText: 'Maybe Later',
      secondaryBtnAction: 'DISMISS',
      isActive: false, // Inactive by default; developer can toggle it in superadmin!
      priority: 5,
    },
  });
  console.log('Seeded promotions (Special Dish & Hyperlocal Ad)');

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
