const mineflayer = require('mineflayer')
var bots = new Array
for (i = 0; i < 20; i++) {
    var bot = mineflayer.createBot({
        'host': 'localhost',
        'username': 'test_bot_' + i
    });
    bot.on('chat', (username, message) => {
        if (username === bot.username) return
        switch (message) {
            case 'loaded':
                bot.waitForChunksToLoad(() => {
                    bot.chat('Ready!')
                })
                break
            case 'list':
                sayItems(bot)
                break
            case 'dig':
                dig(bot)
                break
            case 'build':
                build(bot)
                break
            case 'equip dirt':
                equipDirt()
                break
        }
    })
    bots[i] = bot
}


function dig(bot) {
    var i = 0;
    while (i < 100) {
        if (bot.targetDigBlock) {
            bot.chat(`already digging ${bot.targetDigBlock.name}`)
        } else {
            var target = bot.blockAt(bot.entity.position.offset(0, -1, 0))
            if (target && bot.canDigBlock(target)) {
                bot.chat(`starting to dig ${target.name}`)
                bot.dig(target, onDiggingCompleted)
            } else {
                bot.chat('cannot dig')
            }
        }
    }
    function onDiggingCompleted(err) {
        if (err) {
            console.log(err.stack)
            return
        }
        bot.chat(`finished digging ${target.name}`)
        dig();
    }
}

function build(bot) {
    const referenceBlock = bot.blockAt(bot.entity.position.offset(0, -1, 0))
    const jumpY = Math.floor(bot.entity.position.y) + 1.0
    bot.setControlState('jump', true)
    bot.on('move', placeIfHighEnough)

    let tryCount = 0

    function placeIfHighEnough() {
        if (bot.entity.position.y > jumpY) {
            bot.placeBlock(referenceBlock, vec3(0, 1, 0), (err) => {
                if (err) {
                    tryCount++
                    if (tryCount > 10) {
                        bot.chat(err.message)
                        bot.setControlState('jump', false)
                        bot.removeListener('move', placeIfHighEnough)
                        return
                    }
                    return
                }
                bot.setControlState('jump', false)
                bot.removeListener('move', placeIfHighEnough)
                bot.chat('Placing a block was successful')
            })
        }
    }
}

function equipDirt(bot) {
    const mcData = require('minecraft-data')(bot.version)
    let itemsByName
    if (bot.supportFeature('itemsAreNotBlocks')) {
        itemsByName = 'itemsByName'
    } else if (bot.supportFeature('itemsAreAlsoBlocks')) {
        itemsByName = 'blocksByName'
    }
    bot.equip(mcData[itemsByName].dirt.id, 'hand', (err) => {
        if (err) {
            bot.chat(`unable to equip dirt: ${err.message}`)
        } else {
            bot.chat('equipped dirt')
        }
    })
}

function itemToString(item) {
    if (item) {
        return `${item.name} x ${item.count}`
    } else {
        return '(nothing)'
    }
}

function sayItems(bot) {
    var items = bot.inventory.items()
    const output = items.map(itemToString).join(', ')
    if (output) {
        bot.chat(output)
    } else {
        bot.chat('empty')
    }
}
