
var rows = 5;
var cols = 5;

var hunger = 80;
var energy = 100;
var messageQueue = [];
var handlingMessages = false;
var activeTile = undefined;
var nextTileRow = 0;
var nextTileCol = 0;

var tiles = []

let tile = document.getElementById('r0c0tile');
let row = document.getElementsByClassName('row')[1];
for (let i = 0; i < rows; i++) {
    let parentRow = row;
    parentRow = row.cloneNode(false);
    row.parentElement.appendChild(parentRow);
    tiles.push([]);
    for (let j = 0; j < cols; j++) {
        let clone = tile.cloneNode(true);
        clone.id = 'r' + i + 'c' + j + 'tile';
        parentRow.appendChild(clone);
        tiles[i].push({
            element: clone,
            name: undefined,
            task: undefined,
            uses: undefined,
        });
    }
}
row.remove();

function addTile(newTile) {
    if (nextTileRow >= rows) {
        return;
    }
    for (let row of tiles) {
        for (let tile of row) {
            if (tile.name == newTile.name && tile.task == newTile.task) {
                tile.uses += newTile.uses;
                return;
            }
        }
    }
    tile = tiles[nextTileRow][nextTileCol];
    tile.name = newTile.name;
    tile.task = newTile.task;
    if(newTile.uses == undefined) {
        tile.uses = undefined;
    } else {
        tile.uses = (tile.uses == undefined ? 0 : tile.uses) + newTile.uses;
    }
    nextTileCol++;
    if (nextTileCol >= cols) {
        nextTileCol = 0;
        nextTileRow++;
    }
}

var lookAround;
var takeRest;
var tree;
var bush;
var berries;
var wood;

lookAround = {
    task: {
        startText: 'Look around',
        runningText: 'Looking around...',
        msDuration: 4000,
        conditions: [
            {
                check: function() {
                    return energy >= 30;
                },
                notMetText: 'I feel too tired',
            }
        ],
        endAction: function(tile) {
            energy -= 20;
            enqueueMessage('There are plenty of trees and bushes all around you');
            addTile(tree);
            addTile(bush);
            updateGUI();
        },
    },
}

takeRest = {
    task: {
        startText: 'Take a rest',
        runningText: 'Sleeping...',
        msDuration: 8000,
        conditions: [
            {
                check: function() {
                    return energy <= 40;
                },
                notMetText: 'No need to rest now',
            }
        ],
        endAction: function(tile) {
            energy = 100;
            hunger = 80;
            enqueueMessage('You wake up feeling quite hungry');
            updateGUI();
        },
    },
}

tree = {
    name: 'Tree',
    task: {
        startText: 'Chop down tree',
        runningText: 'Chopping tree...',
        msDuration: 10000,
        conditions: [
            {
                check: function() {
                    return energy >= 30;
                },
                notMetText: 'I feel too tired',
            }
        ],
        endAction: function(tile) {
            tile.uses--;
            energy -= 20;
            addTile(wood);
            enqueueMessage('The tree fell down. You got 4 Wood');
        }
    },
    uses: 3,
}

bush = {
    name: 'Bush',
    task: {
        startText: 'Forage bush',
        runningText: 'Foraging...',
        msDuration: 6000,
        conditions: [
            {
                check: function() {
                    return energy >= 20;
                },
                notMetText: 'I feel too tired',
            }
        ],
        endAction: function(tile) {
            tile.uses--;
            energy -= 10;
            addTile(berries);
            enqueueMessage('You got 4 blue berries. They look comestible');
        }
    },
    uses: 2,
}

berries = {
    name: 'Berries',
    task: {
        startText: 'Eat berries',
        runningText: 'Eating...',
        msDuration: 2000,
        conditions: [
            {
                check: function() {
                    return hunger > 0;
                },
                notMetText: 'I\'m already full',
            }
        ],
        endAction: function(tile) {
            tile.uses--;
            hunger -= 10;
            enqueueMessage('Feeling a little less hungry now');
        }
    },
    uses: 4,
}

wood = {
    name: 'Wood',
    uses: 4,
}

takeRest.task.endAction();
addTile(lookAround);
addTile(takeRest);
updateGUI();

function enqueueMessage(message) {
    messageQueue.push(message);
    if(!handlingMessages) {
        handlingMessages = true;
        handleMessageQueue();
    }
}

function handleMessageQueue() {
    if (messageQueue.length > 0) {
        message = messageQueue.shift();
        showMessage(message);
    } else {
        handlingMessages = false;
    }
}

function showMessage(message) {
    currentChar = 0;
    messageWritten = "";
    var messages = document.getElementsByClassName('messages')[0];
    messages.textContent = messageWritten;
    var intervalId = setInterval(function() {
        if (currentChar < message.length) {
            messageWritten += message[currentChar];
            messages.textContent = messageWritten;
            currentChar++;
        } else {
            clearInterval(intervalId);
            setTimeout(handleMessageQueue, 1000);
        }
    }, 50);
}

function runProgressBar(progress, progressBar, duration, onFinish) {tile
    progressBar.style.width = 0;
    var intervalId = setInterval(function() {
        progress++;
        if (progress < 100) {
            progressBar.style.width = progress * 2; // (progress / 100) * 250
        } else {
            clearInterval(intervalId);
            progressBar.style.width = 200;
            onFinish();
        }
    }, duration / 100);
}

function executeTask(element, task, tile) {
    if(task.msDuration == undefined) {
        if(task.startAction != undefined) {
            task.startAction(tile);
        }
        if(task.endAction != undefined) {
            task.endAction(tile);
        }
        updateGUI();
    } else {
        activeTile = tile;
        if(task.startAction != undefined) {
            task.startAction(tile);
        }
        updateGUI();

        runProgressBar(0, element.children[2], task.msDuration, function() {
            activeTile = undefined;
            if(task.endAction != undefined) {
                task.endAction(tile);
            }
            updateGUI();
        });
    }
}

function updateGUI() {
    document.getElementById('hungerAmount').textContent = hunger;
    document.getElementById('hungerBar').style.width = hunger * 2; // (hunger / 100) * 250

    document.getElementById('energyAmount').textContent = energy;
    document.getElementById('energyBar').style.width = energy * 2; // (hunger / 100) * 250

    for (let row of tiles) {
        for (let tile of row) {
            updateTile(tile);
        }
    }
}

function checkConditions(tile) {
    if (tile.task == undefined || tile.task.conditions == undefined) {
        return undefined;
    }
    for (let condition of tile.task.conditions) {
        if (!condition.check()) {
            return condition;
        }
    }
    return undefined;
}

function updateTile(tile) {
    if (tile.name == undefined) {
        tile.element.children[0].textContent = '';
    } else {
        tile.element.children[0].textContent = tile.name + ' (' + tile.uses + ')';
    }
    conditionNotMet = checkConditions(tile);
    if (tile.task == undefined) {
        tile.element.onclick = undefined;
        tile.element.classList.add('disabled');
        tile.element.children[1].classList.add('disabled');
        tile.element.children[2].classList.add('disabled');
        tile.element.children[3].textContent = '';
    } else if (conditionNotMet != undefined) {
        tile.element.onclick = undefined;
        tile.element.classList.add('disabled');
        tile.element.children[1].classList.add('disabled');
        tile.element.children[2].classList.add('disabled');
        tile.element.children[3].textContent = conditionNotMet.notMetText;
    } else if (tile.uses == 0) {
        tile.element.onclick = undefined;
        tile.element.classList.add('disabled');
        tile.element.children[1].classList.add('disabled');
        tile.element.children[2].classList.add('disabled');
        tile.element.children[3].textContent = tile.task.startText;
    } else {
        if (activeTile == undefined) {
            tile.element.onclick = function() { executeTask(tile.element, tile.task, tile); }
            tile.element.classList.remove('disabled');
        } else {
            tile.element.onclick = undefined;
            tile.element.classList.add('disabled');
        }
        tile.element.children[1].classList.remove('disabled');
        tile.element.children[2].classList.remove('disabled');

        if (activeTile == tile) {
            tile.element.children[3].textContent = tile.task.runningText;
        } else {
            tile.element.children[3].textContent = tile.task.startText;
        }
    }
}
