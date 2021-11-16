
var rows = 5;
var cols = 5;

var hunger = 0;
var energy = 0;
var minEnergy = 10;
var messageQueue = [];
var handlingMessages = false;
var activeSquare = undefined;
var nextSquareIndex = 0;
var assigningWorker = undefined;
var workers = [];

var timeScale = 1.0;

var squares = getSquares();
addTile('Look around', undefined);
addTile('Take a rest', undefined);
// addTile('Worker', undefined);
let takeRestTile = findTile('Take a rest');
hunger = 40;
actionsOnEnd(takeRestTile.onEnd, takeRestTile, squares[1]);
updateGUI();

setInterval(updateWorkers, 100);

function getSquares() {
    let squares = [];
    let tile = document.getElementById('r0c0tile');
    let row = document.getElementsByClassName('row')[1];
    for (let i = 0; i < rows; i++) {
        let parentRow = row;
        parentRow = row.cloneNode(false);
        row.parentElement.appendChild(parentRow);
        for (let j = 0; j < cols; j++) {
            let clone = tile.cloneNode(true);
            clone.id = 'r' + i + 'c' + j + 'tile';
            parentRow.appendChild(clone);
            squares.push({
                element: clone,
            });
        }
    }
    row.remove();
    return squares;
}

function findTile(tileName) {
    for (let tile of tiles) {
        if (tile.name == tileName) {
            return tile;
        }
    }
    return undefined;
}

function addTile(tileName, uses) {
    if (nextSquareIndex >= rows * cols) {
        return;
    }
    let tile = findTile(tileName);
    if (tile == undefined) {
        return;
    }
    for (let square of squares) {
        if (square.tile != undefined && square.tile.name == tileName) {
            if(square.uses != undefined) {
                square.uses += uses;
            }
            return;
        }
    }
    squares[nextSquareIndex].tile = tile;
    squares[nextSquareIndex].uses = uses;
    squares[nextSquareIndex].exp = 0;
    squares[nextSquareIndex].level = 0;
    if (tile.isWorker != undefined && tile.isWorker) {
        squares[nextSquareIndex].hunger = tile.startHunger;
        squares[nextSquareIndex].energy = tile.startEnergy;
        squares[nextSquareIndex].busy = false;
        workers.push(squares[nextSquareIndex]);
    }
    nextSquareIndex++;
}

function hasTileUses(tileName, uses) {
    for (let square of squares) {
        if (square.tile != undefined && square.tile.name == tileName) {
            return square.uses >= uses;
        }
    }
    return false;
}

function removeTileUses(tileName, uses) {
    for (let square of squares) {
        if (square.tile.name == tileName) {
            square.uses -= uses;
            return;
        }
    }
}

function addExp(tile) {
    tile.exp++;
    while (tile.exp >= 5 * Math.pow(4, tile.level)) {
        tile.exp -= 5 * Math.pow(4, tile.level);
        tile.level++;
        enqueueMessage('You leveled up this skill. Now you are twice as fast');
    }
}

function calculateEnergySpentWithTools(tile) {
    if (tile.usesTools == undefined || !tile.usesTools) {
        return tile.energySpent;
    }
    if (hasTileUses('Wooden tools', 1)) {
        return tile.energySpent / 2;
    }
    return tile.energySpent;
}

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
            setTimeout(handleMessageQueue, 1000 / timeScale);
        }
    }, 50 / timeScale);
}

function runProgressBar(progress, progressBar, duration, onFinish) {
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
    }, duration / (100 * timeScale));
}

function actionsOnEnd(onEnd, tile, square, worker) {
    if (onEnd == undefined) {
        return;
    }
    if (square.uses != undefined) {
        square.uses--;
    }
    if (tile.energySpent != undefined) {
        if (worker != undefined) {
            worker.energy -= calculateEnergySpentWithTools(tile);
        } else {
            energy -= calculateEnergySpentWithTools(tile);
        }
    }
    if (tile.requiredResources != undefined) {
        for (let resource of tile.requiredResources) {
            removeTileUses(resource.name, resource.amount);
        }
    }
    if (onEnd.expWon != undefined) {
        if (worker != undefined) {
            worker.exp += onEnd.expWon;
            let expToLevelUp = 50.0 * Math.pow(4, worker.level);
            if (worker.exp >= expToLevelUp) {
                worker.exp -= expToLevelUp;
                worker.level++;
            }
        } else {
            square.exp += onEnd.expWon;
            let expToLevelUp = 50.0 * Math.pow(4, square.level);
            if (square.exp >= expToLevelUp) {
                square.exp -= expToLevelUp;
                square.level++;
                enqueueMessage('You leveled up this skill! Now the task will take half as long');
            }
        }
    }
    if (onEnd.newHunger != undefined) {
        if (worker != undefined && worker.hunger < onEnd.newHunger) {
            worker.hunger = onEnd.newHunger;
        } else if (worker == undefined && hunger < onEnd.newHunger) {
            hunger = onEnd.newHunger;
        }
    }
    if (onEnd.newEnergy != undefined) {
        if (worker != undefined) {
            worker.energy = onEnd.newEnergy;
        } else {
            energy = onEnd.newEnergy;
        }
    }
    if (onEnd.hungerAdded != undefined) {
        if (worker != undefined) {
            worker.hunger += onEnd.hungerAdded;
            if (worker.hunger >= 100) {
                worker.hunger = 100;
            }
        } else {
            hunger += onEnd.hungerAdded;
            if (hunger >= 100) {
                hunger = 100;
                enqueueMessage('I REALLY need to get some food');
                enqueueMessage('It seems to take twice as long to do everything');
            }
        }
    }
    if (onEnd.tilesToAdd != undefined) {
        for (let tileToAdd of onEnd.tilesToAdd) {
            addTile(tileToAdd.name, tileToAdd.uses);
        }
    }
    if (onEnd.messages != undefined) {
        for (let message of onEnd.messages) {
            enqueueMessage(message);
        }
    }
}

function updateWorkers() {
    for (let worker of workers) {
        if (worker.assigned && !worker.busy) {
            if (getConditionNotMet(worker.assigned.tile, worker.assigned, worker) == undefined) {
                let task = getButtonOnClickFunc(worker.assigned.tile, worker.assigned, worker);
                task();
            }
        }
    }
}

function updateGUI() {
    document.getElementById('hungerAmount').textContent = hunger;
    document.getElementById('hungerBar').style.width = hunger * 2; // (hunger / 100) * 250

    document.getElementById('energyAmount').textContent = energy;
    document.getElementById('energyBar').style.width = energy * 2; // (hunger / 100) * 250

    for (let square of squares) {
        updateSquare(square);
    }
}

function getDurationAndLevel(tile, square, worker) {
    if (tile == undefined || tile.msDuration == undefined) {
        return '';
    }
    if (worker != undefined) {
        let duration = tile.msDuration / (Math.pow(2, worker.level) * 1000.0);
        if (worker.hunger == 100) {
            duration *= 2;
        }
        let level = worker.level > 0 ? ' (W Lvl ' + (worker.level + 1) + ')' : '';
        return duration + 's' + level;
    }
    let duration = tile.msDuration / (Math.pow(2, square.level) * 1000.0);
    if (hunger == 100) {
        duration *= 2;
    }
    let level = square.level > 0 ? ' (Lvl ' + (square.level + 1) + ')' : '';
    return duration + 's' + level;
}

function getWorkerHunger(tile, square) {
    if (tile == undefined) {
        return '';
    }
    return 'H: ' + square.hunger;
}

function getEnergy(tile, square) {
    if (tile == undefined || tile.energySpent == undefined) {
        return '';
    }
    let energyTools = calculateEnergySpentWithTools(tile);
    let tools = energyTools != tile.energySpent ? '(Wooden) ' : '';
    return tools + energyTools;
}

function getWorkerEnergy(tile, square) {
    if (tile == undefined) {
        return '';
    }
    return 'E: ' + square.energy;
}

function getTitle(tile, square) {
    if (tile == undefined || tile.name == undefined) {
        return '';
    }
    if (activeSquare == square && tile.startText == undefined) {
        return tile.runningText;
    }
    title = tile.name;
    if (square.uses != undefined) {
        title += ' (' + square.uses + ')';
    }
    if (tile.isWorker != undefined && tile.isWorker) {
        if (square.assigned == undefined) {
            title += ' (Unassigned)';
        } else {
            title += ' (' + square.assigned.tile.name + ')'
        }
    }
    return title;
}

function getConditionNotMet(tile, square, worker) {
    if (tile == undefined) {
        return '';
    }
    if (square.uses != undefined && square.uses == 0) {
        return '';
    }
    if (tile.maxEnergy != undefined) {
        if (worker != undefined && worker.energy > tile.maxEnergy) {
            return '(Worker) No need to rest';
        }
        if (worker == undefined && energy > tile.maxEnergy) {
            return 'No need to rest';
        }
    }
    if (tile.minHunger != undefined) {
        if (worker != undefined && worker.hunger < tile.minHunger) {
            return '(Worker) You are already full';
        }
        if (worker == undefined && hunger < tile.minHunger) {
            return 'You are already full';
        }
    }
    if (tile.energySpent != undefined) {
        let energyTools = calculateEnergySpentWithTools(tile);
        if (worker != undefined && worker.energy - energyTools < minEnergy) {
            return '(Worker) I feel too tired';
        }
        if (worker == undefined && energy - energyTools < minEnergy) {
            return 'I feel too tired';
        }
    }
    if (tile.requiredResources != undefined) {
        for (let resource of tile.requiredResources) {
            if (!hasTileUses(resource.name, resource.amount)) {
                if (worker != undefined) {
                    return '(Worker) Need ' + resource.amount + ' ' + resource.name;
                }
                return 'Need ' + resource.amount + ' ' + resource.name;
            }
        }
    }
    if (tile.onEnd == undefined && tile.isWorker == undefined) {
        return '';
    }
    return undefined;
}

function getSubtitle(tile, square, worker) {
    let conditionNotMet = getConditionNotMet(tile, square, worker);
    if (conditionNotMet != undefined) {
        return conditionNotMet;
    }
    if (tile.isWorker != undefined && tile.isWorker) {
        if (assigningWorker == square) {
            return 'Cancel assigning';
        }
        if (square.assigned == undefined) {
            if (square.busy) {
                return 'Finishing task';
            }
            return 'Assign task';
        }
        return 'Unassign task';
    }
    if (worker != undefined) {
        return '(Worker) ' + tile.runningText;
    }
    if (activeSquare == square && tile.startText != undefined) {
        if (tile.runningText == undefined) {
            return '';
        }
        return tile.runningText;
    }
    if (tile.startText == undefined) {
        return '';
    }
    return tile.startText;
}

function buttonLooksEnabled(tile, square, worker) {
    if (getConditionNotMet(tile, square, worker) != undefined) {
        return false;
    }
    return true;
}

function getButtonOnClickFunc(tile, square, worker) {
    if (tile.isWorker != undefined && tile.isWorker) {
        if (assigningWorker == square) { // Cancel assigning
            return function() {
                assigningWorker = undefined;
                updateGUI();
            }
        }
        if (square.assigned != undefined) {
            return function() {
                square.assigned = undefined;
                updateGUI();
            }
        }
        return function() { // Change worker assigning or Start assigning
            assigningWorker = square;
            updateGUI();
        }
    }
    if (assigningWorker != undefined) { // Assign task
        return function() {
            assigningWorker.assigned = square;
            assigningWorker = undefined;
            updateGUI();
        }
    }
    if (tile.msDuration == undefined) {
        return function() {
            actionsOnEnd(tile.onEnd, tile, square, worker);
            updateGUI();
        }
    }
    if (worker != undefined) {
        return function() {
            let progressBar = square.element.children[4];
            let duration = tile.msDuration / Math.pow(2, square.level);
            if (worker.hunger == 100) {
                duration *= 2;
            }
            worker.busy = true;
            runProgressBar(0, progressBar, duration,
                function() {
                    actionsOnEnd(tile.onEnd, tile, square, worker);
                    worker.busy = false;
                    updateGUI();
            });
        };
    }
    return function() {
        activeSquare = square;
        updateGUI();

        let progressBar = square.element.children[4];
        let duration = tile.msDuration / Math.pow(2, square.level);
        if (hunger == 100) {
            duration *= 2;
        }
        runProgressBar(0, progressBar, duration,
            function() {
                activeSquare = undefined;
                actionsOnEnd(tile.onEnd, tile, square, undefined);
                updateGUI();
        });
    };
}

function getExpWidth(tile, square, worker) {
    if (tile == undefined || (tile.isWorker != undefined && tile.isWorker)) {
        return 0;
    }
    if (worker != undefined) {
        return (worker.exp / (50.0 * Math.pow(4, worker.level))) * 200;
    }
    return (square.exp / (50.0 * Math.pow(4, square.level))) * 200;
}

function getWorkerAtSquare(square) {
    for (let worker of workers) {
        if (worker.assigned == square) {
            return worker;
        }
    }
    return undefined;
}

function getWorkerFinishingTask(tile, square) {
    if (tile == undefined || tile.isWorker == undefined || !tile.isWorker) {
        return false;
    }
    return !square.assigned && square.busy;
}

function updateSquare(square) {
    let isWorkerDefined = square.tile != undefined && square.tile.isWorker != undefined;
    if (isWorkerDefined && square.tile.isWorker) {
        square.element.children[0].textContent = getWorkerHunger(square.tile, square);
        square.element.children[1].textContent = getWorkerEnergy(square.tile, square);
    } else {
        square.element.children[0].textContent = getDurationAndLevel(square.tile, square);
        square.element.children[1].textContent = getEnergy(square.tile, square);
    }
    let workerAtSquare = getWorkerAtSquare(square);
    square.element.children[2].textContent = getTitle(square.tile, square);
    square.element.children[3].textContent = getSubtitle(square.tile, square, workerAtSquare);
    square.element.children[5].style.width = getExpWidth(square.tile, square, workerAtSquare);

    let workerFinishingTask = getWorkerFinishingTask(square.tile, square);
    if (buttonLooksEnabled(square.tile, square, assigningWorker) && !workerFinishingTask) {
        square.element.children[4].classList.remove('disabled');
        square.element.children[5].classList.remove('disabled');
        square.element.children[6].classList.remove('disabled');
    } else {
        square.element.children[4].classList.add('disabled');
        square.element.children[5].classList.add('disabled');
        square.element.children[6].classList.add('disabled');
    }
    let conditionMet = getConditionNotMet(square.tile, square, assigningWorker) == undefined;
    let nobodyWorking = activeSquare == undefined && workerAtSquare == undefined;
    if (conditionMet && nobodyWorking && !workerFinishingTask) {
        square.element.onclick = getButtonOnClickFunc(square.tile, square, undefined);
        square.element.classList.remove('disabled');
    } else {
        square.element.onclick = undefined;
        square.element.classList.add('disabled');
    }
}
