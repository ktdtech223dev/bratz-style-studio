// Shared item pool for gacha system
// Each item has: id, name, type (top, bottom, dress, shoes, accessory, hair, makeup), rarity

const ITEM_POOL = {
  common: [
    { id: 'top_basic_tee', name: 'Basic Tee', type: 'top', rarity: 'common' },
    { id: 'top_crop_tank', name: 'Crop Tank', type: 'top', rarity: 'common' },
    { id: 'top_hoodie', name: 'Cozy Hoodie', type: 'top', rarity: 'common' },
    { id: 'top_polo', name: 'Polo Shirt', type: 'top', rarity: 'common' },
    { id: 'bottom_jeans', name: 'Classic Jeans', type: 'bottom', rarity: 'common' },
    { id: 'bottom_shorts', name: 'Denim Shorts', type: 'bottom', rarity: 'common' },
    { id: 'bottom_leggings', name: 'Basic Leggings', type: 'bottom', rarity: 'common' },
    { id: 'bottom_skirt_mini', name: 'Mini Skirt', type: 'bottom', rarity: 'common' },
    { id: 'shoes_sneakers', name: 'White Sneakers', type: 'shoes', rarity: 'common' },
    { id: 'shoes_flats', name: 'Ballet Flats', type: 'shoes', rarity: 'common' },
    { id: 'shoes_sandals', name: 'Strappy Sandals', type: 'shoes', rarity: 'common' },
    { id: 'acc_sunglasses', name: 'Round Sunglasses', type: 'accessory', rarity: 'common' },
    { id: 'acc_beanie', name: 'Knit Beanie', type: 'accessory', rarity: 'common' },
    { id: 'acc_scrunchie', name: 'Velvet Scrunchie', type: 'accessory', rarity: 'common' },
    { id: 'hair_ponytail', name: 'High Ponytail', type: 'hair', rarity: 'common' },
    { id: 'hair_bob', name: 'Classic Bob', type: 'hair', rarity: 'common' },
    { id: 'makeup_natural', name: 'Natural Glow', type: 'makeup', rarity: 'common' },
    { id: 'makeup_light_blush', name: 'Light Blush', type: 'makeup', rarity: 'common' },
  ],
  rare: [
    { id: 'top_leather_jacket', name: 'Leather Jacket', type: 'top', rarity: 'rare' },
    { id: 'top_sequin_top', name: 'Sequin Top', type: 'top', rarity: 'rare' },
    { id: 'top_off_shoulder', name: 'Off-Shoulder Blouse', type: 'top', rarity: 'rare' },
    { id: 'top_denim_vest', name: 'Denim Vest', type: 'top', rarity: 'rare' },
    { id: 'dress_sundress', name: 'Floral Sundress', type: 'dress', rarity: 'rare' },
    { id: 'dress_bodycon', name: 'Bodycon Dress', type: 'dress', rarity: 'rare' },
    { id: 'bottom_pleated_skirt', name: 'Pleated Skirt', type: 'bottom', rarity: 'rare' },
    { id: 'bottom_cargo_pants', name: 'Cargo Pants', type: 'bottom', rarity: 'rare' },
    { id: 'shoes_boots_ankle', name: 'Ankle Boots', type: 'shoes', rarity: 'rare' },
    { id: 'shoes_platforms', name: 'Platform Shoes', type: 'shoes', rarity: 'rare' },
    { id: 'acc_beret', name: 'Parisian Beret', type: 'accessory', rarity: 'rare' },
    { id: 'acc_chain_necklace', name: 'Chain Necklace', type: 'accessory', rarity: 'rare' },
    { id: 'acc_hoop_earrings', name: 'Hoop Earrings', type: 'accessory', rarity: 'rare' },
    { id: 'hair_beach_waves', name: 'Beach Waves', type: 'hair', rarity: 'rare' },
    { id: 'hair_space_buns', name: 'Space Buns', type: 'hair', rarity: 'rare' },
    { id: 'makeup_smoky_eye', name: 'Smoky Eye', type: 'makeup', rarity: 'rare' },
    { id: 'makeup_berry_lip', name: 'Berry Lip', type: 'makeup', rarity: 'rare' },
  ],
  epic: [
    { id: 'top_fur_coat', name: 'Faux Fur Coat', type: 'top', rarity: 'epic' },
    { id: 'top_corset', name: 'Lace Corset', type: 'top', rarity: 'epic' },
    { id: 'dress_ballgown_mini', name: 'Mini Ballgown', type: 'dress', rarity: 'epic' },
    { id: 'dress_velvet', name: 'Velvet Evening Dress', type: 'dress', rarity: 'epic' },
    { id: 'bottom_leather_pants', name: 'Leather Pants', type: 'bottom', rarity: 'epic' },
    { id: 'shoes_thigh_boots', name: 'Thigh-High Boots', type: 'shoes', rarity: 'epic' },
    { id: 'shoes_crystal_heels', name: 'Crystal Heels', type: 'shoes', rarity: 'epic' },
    { id: 'acc_tiara_silver', name: 'Silver Tiara', type: 'accessory', rarity: 'epic' },
    { id: 'acc_designer_bag', name: 'Designer Handbag', type: 'accessory', rarity: 'epic' },
    { id: 'acc_feather_boa', name: 'Feather Boa', type: 'accessory', rarity: 'epic' },
    { id: 'hair_glamour_curls', name: 'Glamour Curls', type: 'hair', rarity: 'epic' },
    { id: 'hair_ombre_long', name: 'Ombre Long Hair', type: 'hair', rarity: 'epic' },
    { id: 'makeup_glam_full', name: 'Full Glam', type: 'makeup', rarity: 'epic' },
    { id: 'makeup_cat_eye', name: 'Cat Eye', type: 'makeup', rarity: 'epic' },
  ],
  legendary: [
    { id: 'dress_red_carpet', name: 'Red Carpet Gown', type: 'dress', rarity: 'legendary' },
    { id: 'dress_diamond', name: 'Diamond Dress', type: 'dress', rarity: 'legendary' },
    { id: 'dress_starlight', name: 'Starlight Gown', type: 'dress', rarity: 'legendary' },
    { id: 'top_dragon_jacket', name: 'Dragon Scale Jacket', type: 'top', rarity: 'legendary' },
    { id: 'shoes_glass_slippers', name: 'Glass Slippers', type: 'shoes', rarity: 'legendary' },
    { id: 'shoes_aurora_boots', name: 'Aurora Boots', type: 'shoes', rarity: 'legendary' },
    { id: 'acc_crown_gold', name: 'Golden Crown', type: 'accessory', rarity: 'legendary' },
    { id: 'acc_angel_wings', name: 'Angel Wings', type: 'accessory', rarity: 'legendary' },
    { id: 'acc_diamond_choker', name: 'Diamond Choker', type: 'accessory', rarity: 'legendary' },
    { id: 'hair_galaxy', name: 'Galaxy Hair', type: 'hair', rarity: 'legendary' },
    { id: 'hair_phoenix', name: 'Phoenix Flames Hair', type: 'hair', rarity: 'legendary' },
    { id: 'makeup_holographic', name: 'Holographic Makeup', type: 'makeup', rarity: 'legendary' },
  ],
};

// Duplicate shard values
const DUPE_SHARD_VALUES = {
  common: 5,
  rare: 15,
  epic: 40,
  legendary: 100,
};

function getRandomItem(rarity) {
  const pool = ITEM_POOL[rarity];
  if (!pool || pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function getAllItems() {
  return [
    ...ITEM_POOL.common,
    ...ITEM_POOL.rare,
    ...ITEM_POOL.epic,
    ...ITEM_POOL.legendary,
  ];
}

module.exports = {
  ITEM_POOL,
  DUPE_SHARD_VALUES,
  getRandomItem,
  getAllItems,
};
