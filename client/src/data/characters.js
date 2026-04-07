const characters = [
  {
    id: 'cloe',
    name: 'Cloe',
    title: 'The Angel',
    skinBase: '#F5CBA7',
    eyeColor: '#5DADE2',
    lipColor: '#FFB6C1',
    vibe: 'sweet, Y2K princess, feminine maximalist',
    unlockRequirement: null,
    skinTones: ['#FDEBD0', '#F5CBA7', '#E0B98F', '#C49A6C', '#A67B5B', '#8B6547']
  },
  {
    id: 'jade',
    name: 'Jade',
    title: 'The Kool Kat',
    skinBase: '#D4A574',
    eyeColor: '#2E7D32',
    lipColor: '#E57373',
    vibe: 'edgy, streetwear, urban chic, sporty glam',
    unlockRequirement: { type: 'items_collected', count: 50, description: 'Collect 50 items to unlock Jade' },
    skinTones: ['#F0D5B8', '#D4A574', '#C09060', '#A67B5B', '#8B6547', '#6D4C41']
  },
  {
    id: 'sasha',
    name: 'Sasha',
    title: 'The Bunny Boo',
    skinBase: '#8D6E63',
    eyeColor: '#5D4037',
    lipColor: '#D32F2F',
    vibe: 'fierce, bold, hip-hop glam, statement maker',
    unlockRequirement: { type: 'challenges_completed', count: 10, description: 'Complete 10 challenges to unlock Sasha' },
    skinTones: ['#C49A6C', '#A67B5B', '#8D6E63', '#795548', '#6D4C41', '#4E342E']
  },
  {
    id: 'yasmin',
    name: 'Yasmin',
    title: 'The Pretty Princess',
    skinBase: '#D2B48C',
    eyeColor: '#795548',
    lipColor: '#E91E63',
    vibe: 'boho, romantic, earthy glam, free spirit',
    unlockRequirement: { type: 'gacha_10pull', count: 1, description: 'Perform your first 10-pull to unlock Yasmin' },
    skinTones: ['#F5DEB3', '#D2B48C', '#C49A6C', '#A67B5B', '#8B6547', '#6D4C41']
  }
];

export default characters;
