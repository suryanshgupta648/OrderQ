export const CATEGORIES = ['Momos', 'Street Food', 'Noodles', 'Beverages'];

export const MENU_ITEMS = [
  {
    id: 'm1',
    name: 'Steamed Veg Momos',
    description: 'Classic steamed dumplings filled with mixed vegetables and served with spicy red chutney.',
    price: 4.00,
    category: 'Momos',
    image: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&q=80&w=600',
    recommended: true,
    sizes: [
      { name: 'Half Plate (6 pcs)', price: 4.00 },
      { name: 'Full Plate (10 pcs)', price: 6.00 }
    ]
  },
  {
    id: 'm2',
    name: 'Paneer Kurkure Momos',
    description: 'Crispy fried momos stuffed with spiced paneer, coated in a crunchy batter.',
    price: 5.50,
    category: 'Momos',
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=600',
    recommended: true,
    sizes: [
      { name: 'Half Plate (6 pcs)', price: 5.50 },
      { name: 'Full Plate (10 pcs)', price: 8.50 }
    ]
  },
  {
    id: 'm3',
    name: 'Chicken Tandoori Momos',
    description: 'Juicy chicken momos marinated in tandoori spices and roasted to perfection.',
    price: 6.00,
    category: 'Momos',
    image: 'https://images.unsplash.com/photo-1645696301019-35adcc18fc21?auto=format&fit=crop&q=80&w=600',
    sizes: [
      { name: 'Half Plate (6 pcs)', price: 6.00 },
      { name: 'Full Plate (10 pcs)', price: 9.00 }
    ]
  },
  {
    id: 'sf1',
    name: 'Malai Soya Chaap',
    description: 'Tender soya chunks marinated in rich cream and cashew paste, grilled over charcoal.',
    price: 7.00,
    category: 'Street Food',
    image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=600',
    recommended: true,
    sizes: [
      { name: 'Half Plate', price: 7.00 },
      { name: 'Full Plate', price: 12.00 }
    ]
  },
  {
    id: 'sf2',
    name: 'Spicy Afgani Chaap',
    description: 'Soya chaap tossed in a spicy, tangy, and creamy afghani sauce.',
    price: 7.50,
    category: 'Street Food',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=600',
    sizes: [
      { name: 'Half Plate', price: 7.50 },
      { name: 'Full Plate', price: 13.00 }
    ]
  },
  {
    id: 'n1',
    name: 'Hakka Noodles',
    description: 'Wok-tossed noodles with julienned vegetables, soy sauce, and a hint of garlic.',
    price: 5.00,
    category: 'Noodles',
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=600',
    sizes: [
      { name: 'Half (Serves 1-2)', price: 5.00 },
      { name: 'Full (Serves 3-4)', price: 8.50 }
    ]
  },
  {
    id: 'n2',
    name: 'Chilli Garlic Noodles',
    description: 'Spicy noodles tossed with burnt garlic, fiery chilli paste, and spring onions.',
    price: 5.50,
    category: 'Noodles',
    image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&q=80&w=600',
    recommended: true,
    sizes: [
      { name: 'Half (Serves 1-2)', price: 5.50 },
      { name: 'Full (Serves 3-4)', price: 9.00 }
    ]
  },
  {
    id: 'b1',
    name: 'Masala Shikanji',
    description: 'Refreshing Indian lemonade spiced with roasted cumin, black salt, and mint.',
    price: 2.50,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'b2',
    name: 'Kulhad Chai',
    description: 'Strong, aromatic Indian tea served in a traditional clay cup.',
    price: 1.50,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1576092762791-dd9e222044fe?auto=format&fit=crop&q=80&w=600',
    recommended: true
  }
];
