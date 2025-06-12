const TreeType = require('../models/TreeType');

const treeTypesData = [
  {
    id: 'oak',
    name: 'Oak Tree',
    scientificName: 'Quercus',
    description: 'A majestic tree known for its strength and longevity.',
    careLevel: 'Moderate',
    maxHeight: '20-30m',
    lifespan: '100+ years',
    nativeTo: 'Northern Hemisphere',
    cost: 100,
    stages: [
      {
        name: 'Seed',
        hoursRequired: 0,
        imageUrl: '/assets/trees/stage01.png',
        description: 'A tiny oak seed ready to sprout',
        tips: ['Plant in rich soil', 'Keep moist but not waterlogged']
      },
      {
        name: 'Sprout',
        hoursRequired: 1,
        imageUrl: '/assets/trees/stage02.png',
        description: 'First green shoots emerging from the soil',
        tips: ['Protect from strong winds', 'Ensure adequate sunlight']
      },
      {
        name: 'Seedling',
        hoursRequired: 2,
        imageUrl: '/assets/trees/stage03.png',
        description: 'Young seedling with first true leaves',
        tips: ['Water regularly', 'Watch for pests']
      },
      {
        name: 'Young Tree',
        hoursRequired: 3,
        imageUrl: '/assets/trees/stage04.png',
        description: 'Developing trunk and branch structure',
        tips: ['Add mulch around base', 'Prune if necessary']
      },
      {
        name: 'Mature Tree',
        hoursRequired: 4,
        imageUrl: '/assets/trees/stage05.png',
        description: 'Strong mature tree with full canopy',
        tips: ['Monitor for diseases', 'Deep watering during dry spells']
      },
      {
        name: 'Ancient Oak',
        hoursRequired: 5,
        imageUrl: '/assets/trees/stage06.png',
        description: 'Magnificent ancient oak tree',
        tips: ['Protect from damage', 'Enjoy the shade and beauty']
      }
    ]
  },
  {
    id: 'maple',
    name: 'Maple Tree',
    scientificName: 'Acer',
    description: 'Known for its beautiful fall colors and shade provision.',
    careLevel: 'Easy',
    maxHeight: '15-25m',
    lifespan: '50-100 years',
    nativeTo: 'Asia and North America',
    cost: 80,
    stages: [
      {
        name: 'Seed',
        hoursRequired: 0,
        imageUrl: '/assets/trees/stage01.png',
        description: 'A maple seed with its distinctive wing',
        tips: ['Plant in well-draining soil', 'Keep consistently moist']
      },
      {
        name: 'Sprout',
        hoursRequired: 1,
        imageUrl: '/assets/trees/stage02.png',
        description: 'First tender shoots breaking through soil',
        tips: ['Provide partial shade', 'Protect from frost']
      },
      {
        name: 'Seedling',
        hoursRequired: 2,
        imageUrl: '/assets/trees/stage03.png',
        description: 'Small maple with characteristic leaf shape',
        tips: ['Regular watering', 'Good air circulation']
      },
      {
        name: 'Young Tree',
        hoursRequired: 3,
        imageUrl: '/assets/trees/stage04.png',
        description: 'Growing maple with developing branches',
        tips: ['Feed with balanced fertilizer', 'Shape with light pruning']
      },
      {
        name: 'Mature Tree',
        hoursRequired: 4,
        imageUrl: '/assets/trees/stage05.png',
        description: 'Beautiful mature maple with full foliage',
        tips: ['Enjoy seasonal color changes', 'Deep water in summer']
      },
      {
        name: 'Ancient Maple',
        hoursRequired: 5,
        imageUrl: '/assets/trees/stage06.png',
        description: 'Spectacular ancient maple tree',
        tips: ['Preserve this natural treasure', 'Rake leaves in fall']
      }
    ]
  },
  {
    id: 'pine',
    name: 'Pine Tree',
    scientificName: 'Pinus',
    description: 'Evergreen conifer with distinctive needle-like leaves.',
    careLevel: 'Easy',
    maxHeight: '15-45m',
    lifespan: '100-200 years',
    nativeTo: 'Northern Hemisphere',
    cost: 90,
    stages: [
      {
        name: 'Seed',
        hoursRequired: 0,
        imageUrl: '/assets/trees/stage01.png',
        description: 'A pine seed from a cone',
        tips: ['Plant in sandy, well-draining soil', 'Needs cold treatment to germinate']
      },
      {
        name: 'Sprout',
        hoursRequired: 1,
        imageUrl: '/assets/trees/stage02.png',
        description: 'Tiny pine sprout with seed coat',
        tips: ['Full sunlight preferred', 'Minimal watering needed']
      },
      {
        name: 'Seedling',
        hoursRequired: 2,
        imageUrl: '/assets/trees/stage03.png',
        description: 'Young pine with first needles',
        tips: ['Drought tolerant once established', 'Good drainage essential']
      },
      {
        name: 'Young Tree',
        hoursRequired: 3,
        imageUrl: '/assets/trees/stage04.png',
        description: 'Growing pine with developing shape',
        tips: ['Prune lower branches if desired', 'Very low maintenance']
      },
      {
        name: 'Mature Tree',
        hoursRequired: 4,
        imageUrl: '/assets/trees/stage05.png',
        description: 'Tall mature pine tree',
        tips: ['Produces cones for reproduction', 'Check for pine beetles']
      },
      {
        name: 'Ancient Pine',
        hoursRequired: 5,
        imageUrl: '/assets/trees/stage06.png',
        description: 'Majestic ancient pine tree',
        tips: ['Windbreaker and wildlife habitat', 'A true forest giant']
      }
    ]
  }
];

async function seedTreeTypes() {
  try {
    console.log('Seeding tree types...');
    
    // Clear existing tree types
    await TreeType.deleteMany({});
    
    // Insert new tree types
    await TreeType.insertMany(treeTypesData);
    
    console.log(`Successfully seeded ${treeTypesData.length} tree types`);
    return true;
  } catch (error) {
    console.error('Error seeding tree types:', error);
    return false;
  }
}

module.exports = { seedTreeTypes, treeTypesData }; 