
var tiles = [
{
    name: 'Look around',
    runningText: 'Looking around...',
    msDuration: 4000,
    energySpent: 20,
    onEnd: {
        hungerAdded: 10,
        tilesToAdd: [
            { name: 'Tree', uses: 3 },
            { name: 'Bush', uses: 2 },
        ],
        messages: [ 'There are plenty of trees and bushes all around you' ],
    },
},
{
    name: 'Take a rest',
    runningText: 'Sleeping...',
    msDuration: 6000,
    maxEnergy: 40,
    onEnd: {
        newEnergy: 100,
        messages: [ 'You wake up feeling quite hungry' ],
    },
},
{
    name: 'Tree',
    startText: 'Chop down tree',
    runningText: 'Chopping down...',
    msDuration: 8000,
    energySpent: 0,
    usesTools: true,
    onEnd: {
        expWon: 10,
        hungerAdded: 10,
        tilesToAdd: [
            { name: 'Wood', uses: 2 },
            { name: 'Hut blueprint' },
            { name: 'Wooden tools blueprint' },
        ],
        messages: [ 'The tree has fallen. You got some wood' ],
    },
},
{
    name: 'Bush',
    startText: 'Forage bush',
    runningText: 'Foraging...',
    msDuration: 4000,
    energySpent: 10,
    onEnd: {
        hungerAdded: 10,
        tilesToAdd: [
            { name: 'Berries', uses: 2 },
        ],
        messages: [ 'You found some berries. They look comestible' ],
    },
},
{
    name: 'Wood',
},
{
    name: 'Berries',
    startText: 'Eat berries',
    runningText: 'Eating...',
    msDuration: 2000,
    minHunger: 20,
    onEnd: {
        hungerAdded: -20,
        messages: [ 'You feel less hungry now' ],
    },
},
{
    name: 'Hut blueprint',
    startText: 'Build hut',
    runningtext: 'Building...',
    msDuration: 4000,
    energySpent: 20,
    usesTools: true,
    requiredResources: [
        { name: 'Wood', amount: 4 },
    ],
    onEnd: {
        tilesToAdd: [
            { name: 'Hut', uses: 1 },
        ],
        messages: [ 'A small shelter is never taken for granted' ],
    },
},
{
    name: 'Wooden tools blueprint',
    startText: 'Craft tools',
    runningtext: 'Crafting...',
    msDuration: 4000,
    energySpent: 20,
    usesTools: true,
    requiredResources: [
        { name: 'Wood', amount: 6 },
    ],
    onEnd: {
        tilesToAdd: [
            { name: 'Wooden tools', uses: 2 }
        ],
        messages: [
            'Using tools on some tasks may save me energy',
            'I wonder if they could be upgraded',
        ],
    },
},
{
    name: 'Hut',
    startText: 'Recruit worker',
    runningText: 'Recruiting...',
    msDuration: 6000,
    requiredResources: [
        { name: 'Berries', amount: 10 },
    ],
    onEnd: {
        tilesToAdd: [
            { name: 'Worker' },
        ],
        messages: [ 'Great! A helping hand is definitely going to be useful' ],
    },
},
{
    name: 'Wooden tools',
},
{
    name: 'Worker',
    isWorker: true,
    startHunger: 40,
    startEnergy: 100,
},
];
