const dyeColors = [
  // NATURALS (12)
  { id: 'nat_01', name: 'Platinum blonde', hex: '#E8D5B7', palette: 'naturals' },
  { id: 'nat_02', name: 'Golden blonde', hex: '#D4A843', palette: 'naturals' },
  { id: 'nat_03', name: 'Honey blonde', hex: '#C8973E', palette: 'naturals' },
  { id: 'nat_04', name: 'Strawberry blonde', hex: '#C87D4A', palette: 'naturals' },
  { id: 'nat_05', name: 'Light brown', hex: '#A0724E', palette: 'naturals' },
  { id: 'nat_06', name: 'Chestnut brown', hex: '#8B5E3C', palette: 'naturals' },
  { id: 'nat_07', name: 'Dark brown', hex: '#5C3A1E', palette: 'naturals' },
  { id: 'nat_08', name: 'Espresso', hex: '#3B2314', palette: 'naturals' },
  { id: 'nat_09', name: 'Jet black', hex: '#1A1110', palette: 'naturals' },
  { id: 'nat_10', name: 'Auburn', hex: '#A0522D', palette: 'naturals' },
  { id: 'nat_11', name: 'Copper red', hex: '#B87333', palette: 'naturals' },
  { id: 'nat_12', name: 'Ginger', hex: '#C45E28', palette: 'naturals' },

  // FASHION COLORS (16)
  { id: 'fash_01', name: 'Hot pink', hex: '#FF69B4', palette: 'fashion' },
  { id: 'fash_02', name: 'Bubblegum', hex: '#FF85A2', palette: 'fashion' },
  { id: 'fash_03', name: 'Cherry red', hex: '#DC143C', palette: 'fashion' },
  { id: 'fash_04', name: 'Firetruck red', hex: '#CE2029', palette: 'fashion' },
  { id: 'fash_05', name: 'Electric blue', hex: '#0892D0', palette: 'fashion' },
  { id: 'fash_06', name: 'Cobalt', hex: '#0047AB', palette: 'fashion' },
  { id: 'fash_07', name: 'Royal purple', hex: '#7851A9', palette: 'fashion' },
  { id: 'fash_08', name: 'Violet', hex: '#8B00FF', palette: 'fashion' },
  { id: 'fash_09', name: 'Emerald green', hex: '#50C878', palette: 'fashion' },
  { id: 'fash_10', name: 'Teal', hex: '#008080', palette: 'fashion' },
  { id: 'fash_11', name: 'Tangerine', hex: '#FF9966', palette: 'fashion' },
  { id: 'fash_12', name: 'Sunset orange', hex: '#FA5B3D', palette: 'fashion' },
  { id: 'fash_13', name: 'Candy apple', hex: '#FF0800', palette: 'fashion' },
  { id: 'fash_14', name: 'Magenta', hex: '#FF00FF', palette: 'fashion' },
  { id: 'fash_15', name: 'Wine', hex: '#722F37', palette: 'fashion' },
  { id: 'fash_16', name: 'Coral', hex: '#FF7F50', palette: 'fashion' },

  // PASTEL (10)
  { id: 'past_01', name: 'Baby pink', hex: '#F4C2C2', palette: 'pastel' },
  { id: 'past_02', name: 'Lavender', hex: '#E6E6FA', palette: 'pastel' },
  { id: 'past_03', name: 'Mint', hex: '#B2F2BB', palette: 'pastel' },
  { id: 'past_04', name: 'Peach', hex: '#FFDAB9', palette: 'pastel' },
  { id: 'past_05', name: 'Sky blue', hex: '#B0E0E6', palette: 'pastel' },
  { id: 'past_06', name: 'Lilac', hex: '#C8A2C8', palette: 'pastel' },
  { id: 'past_07', name: 'Rose quartz', hex: '#F7CAC9', palette: 'pastel' },
  { id: 'past_08', name: 'Butter yellow', hex: '#FFFACD', palette: 'pastel' },
  { id: 'past_09', name: 'Cotton candy', hex: '#FFBCD9', palette: 'pastel' },
  { id: 'past_10', name: 'Seafoam', hex: '#93E9BE', palette: 'pastel' },

  // DARK/OMBRE (8)
  { id: 'dark_01', name: 'Midnight blue', hex: '#191970', palette: 'dark' },
  { id: 'dark_02', name: 'Deep purple', hex: '#301934', palette: 'dark' },
  { id: 'dark_03', name: 'Black cherry', hex: '#3D0C11', palette: 'dark' },
  { id: 'dark_04', name: 'Forest green', hex: '#0B3D0B', palette: 'dark' },
  { id: 'dark_05', name: 'Charcoal', hex: '#36454F', palette: 'dark' },
  { id: 'dark_06', name: 'Burgundy', hex: '#800020', palette: 'dark' },
  { id: 'dark_07', name: 'Navy', hex: '#000080', palette: 'dark' },
  { id: 'dark_08', name: 'Dark teal', hex: '#004D4D', palette: 'dark' },

  // NEON (6)
  { id: 'neon_01', name: 'Neon pink', hex: '#FF6EC7', palette: 'neon' },
  { id: 'neon_02', name: 'Neon green', hex: '#39FF14', palette: 'neon' },
  { id: 'neon_03', name: 'Neon orange', hex: '#FF5F1F', palette: 'neon' },
  { id: 'neon_04', name: 'Neon yellow', hex: '#DFFF00', palette: 'neon' },
  { id: 'neon_05', name: 'Neon blue', hex: '#4D4DFF', palette: 'neon' },
  { id: 'neon_06', name: 'Neon purple', hex: '#BF00FF', palette: 'neon' },

  // METALLIC (8)
  { id: 'met_01', name: 'Silver', hex: '#C0C0C0', palette: 'metallic' },
  { id: 'met_02', name: 'Gold', hex: '#FFD700', palette: 'metallic' },
  { id: 'met_03', name: 'Rose gold', hex: '#B76E79', palette: 'metallic' },
  { id: 'met_04', name: 'Copper', hex: '#B87333', palette: 'metallic' },
  { id: 'met_05', name: 'Bronze', hex: '#CD7F32', palette: 'metallic' },
  { id: 'met_06', name: 'Platinum', hex: '#E5E4E2', palette: 'metallic' },
  { id: 'met_07', name: 'Champagne', hex: '#F7E7CE', palette: 'metallic' },
  { id: 'met_08', name: 'Pewter', hex: '#8F8F8F', palette: 'metallic' }
];

export default dyeColors;
