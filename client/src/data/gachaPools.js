const gachaPools = {
  main: {
    id: 'main',
    name: 'Style Studio Capsule',
    description: 'The signature collection featuring all clothing, accessories, and jewelry',
    type: 'permanent',
    rates: { common: 60, rare: 30, epic: 8, legendary: 2 },
    costPerPull: 100,
    costPer10Pull: 900,
    pityThreshold: 80,
    guaranteedRarity: 'rare',
    itemPool: 'all_clothing',
    featured: []
  },

  aesthetic: {
    id: 'aesthetic',
    name: 'Aesthetic Spotlight',
    description: 'Rotating themed banners with boosted rates for specific aesthetics',
    type: 'rotating',
    rates: { common: 40, rare: 40, epic: 15, legendary: 5 },
    costPerPull: 120,
    costPer10Pull: 1000,
    pityThreshold: 60,
    guaranteedRarity: 'epic',
    rotationSchedule: [
      {
        week: 1,
        theme: 'Y2K Revival',
        aesthetic: 'y2k',
        description: 'Butterfly clips, low-rise everything, and rhinestone dreams',
        featured: ['set_891', 'top_001', 'bottom_210', 'acc_571']
      },
      {
        week: 2,
        theme: 'Streetwear Heat',
        aesthetic: 'streetwear',
        description: 'Oversized fits, chunky sneakers, and urban edge',
        featured: ['set_896', 'top_050', 'shoe_380', 'outer_490']
      },
      {
        week: 3,
        theme: 'Boho Dreamscape',
        aesthetic: 'boho',
        description: 'Flowy fabrics, earthy tones, and festival vibes',
        featured: ['set_901', 'top_100', 'bottom_260', 'jewel_690']
      },
      {
        week: 4,
        theme: 'Glam Night Out',
        aesthetic: 'glam',
        description: 'Sequins, heels, and red carpet energy',
        featured: ['set_906', 'top_150', 'shoe_420', 'jewel_710']
      },
      {
        week: 5,
        theme: 'Sporty Spice',
        aesthetic: 'sporty',
        description: 'Athletic luxury meets casual cool',
        featured: ['set_911', 'top_170', 'bottom_320', 'shoe_440']
      },
      {
        week: 6,
        theme: 'Gothic Romance',
        aesthetic: 'goth',
        description: 'Dark lace, velvet, and Victorian drama',
        featured: ['set_916', 'top_030', 'outer_500', 'jewel_680']
      },
      {
        week: 7,
        theme: 'Cottagecore Charm',
        aesthetic: 'cottagecore',
        description: 'Floral prints, gingham, and pastoral sweetness',
        featured: ['set_920', 'top_110', 'bottom_270', 'acc_600']
      }
    ]
  },

  hair: {
    id: 'hair',
    name: 'Iconic Looks',
    description: 'Exclusive hairstyles and dye kits for all characters',
    type: 'permanent',
    rates: { common: 50, rare: 30, epic: 15, legendary: 5 },
    costPerPull: 80,
    costPer10Pull: 700,
    pityThreshold: 50,
    guaranteedRarity: 'rare',
    itemPool: 'all_hair_and_dyes',
    dyeKitChance: 0.2,
    featured: [
      'hair_cloe_23', 'hair_jade_23', 'hair_sasha_23', 'hair_yasmin_23'
    ]
  }
};

export default gachaPools;
