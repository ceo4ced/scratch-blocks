/**
 * ScratchScript Transpiler
 * Converts text-based syntax to valid Scratch .sb3 JSON
 */

const fs = require('fs');
const path = require('path');

/**
 * ScratchScript Syntax:
 *
 * sprite <name>:
 *     when flag clicked:
 *         <blocks>
 *
 *     when <key> pressed:
 *         <blocks>
 *
 * Blocks:
 *   move <n> steps
 *   turn right <n>
 *   turn left <n>
 *   go to x: <x> y: <y>
 *   say <text>
 *   say <text> for <n> secs
 *   pen down
 *   pen up
 *   repeat <n>:
 *       <indented blocks>
 *   forever:
 *       <indented blocks>
 *   set <var> to <value>
 *   change <var> by <value>
 */

class ScratchScriptTranspiler {
    constructor() {
        this.blockIdCounter = 0;
        this.sprites = [];
        this.currentSprite = null;
        this.extensions = new Set();
    }

    /**
     * Generate a unique block ID
     */
    generateBlockId() {
        return `block_${this.blockIdCounter++}`;
    }

    /**
     * Parse indentation level
     */
    getIndentLevel(line) {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
    }

    /**
     * Tokenize a line
     */
    tokenize(line) {
        return line.trim();
    }

    /**
     * Parse a ScratchScript program
     */
    parse(script) {
        const lines = script.split('\n');
        const blocks = {};
        const scriptStarts = [];
        let currentHat = null;
        let blockStack = [];
        let lastIndent = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim() || line.trim().startsWith('#')) continue;

            const indent = this.getIndentLevel(line);
            const content = this.tokenize(line);

            // Sprite definition
            if (content.startsWith('sprite ')) {
                const name = content.slice(7).replace(':', '').trim();
                this.currentSprite = { name, blocks: {}, scripts: [] };
                continue;
            }

            // Event hat blocks
            if (content.startsWith('when ')) {
                const hatBlock = this.parseHatBlock(content);
                blocks[hatBlock.id] = hatBlock;
                scriptStarts.push(hatBlock.id);
                currentHat = hatBlock.id;
                blockStack = [hatBlock.id];
                lastIndent = indent;
                continue;
            }

            // Regular blocks
            if (currentHat) {
                const block = this.parseBlock(content);

                if (block) {
                    blocks[block.id] = block;

                    // Handle indentation for control structures
                    if (indent > lastIndent) {
                        // Nested block (in repeat, forever, etc.)
                        const parent = blocks[blockStack[blockStack.length - 1]];
                        if (parent.inputs && parent.inputs.SUBSTACK) {
                            parent.inputs.SUBSTACK[1] = block.id;
                        }
                        block.parent = blockStack[blockStack.length - 1];
                        blockStack.push(block.id);
                    } else if (indent < lastIndent) {
                        // Un-nest
                        while (blockStack.length > 1 && indent <= lastIndent) {
                            blockStack.pop();
                            lastIndent -= 4;
                        }
                        const parent = blocks[blockStack[blockStack.length - 1]];
                        parent.next = block.id;
                        block.parent = blockStack[blockStack.length - 1];
                        blockStack[blockStack.length - 1] = block.id;
                    } else {
                        // Same level
                        const parent = blocks[blockStack[blockStack.length - 1]];
                        parent.next = block.id;
                        block.parent = blockStack[blockStack.length - 1];
                        blockStack[blockStack.length - 1] = block.id;
                    }

                    lastIndent = indent;
                }
            }
        }

        return { blocks, scriptStarts };
    }

    /**
     * Parse a hat (event) block
     */
    parseHatBlock(content) {
        const id = this.generateBlockId();

        if (content === 'when flag clicked:') {
            return {
                id,
                opcode: 'event_whenflagclicked',
                next: null,
                parent: null,
                inputs: {},
                fields: {},
                topLevel: true,
                x: 48,
                y: 48
            };
        }

        if (content.match(/when (.+) pressed:/)) {
            const key = content.match(/when (.+) pressed:/)[1];
            return {
                id,
                opcode: 'event_whenkeypressed',
                next: null,
                parent: null,
                inputs: {},
                fields: {
                    KEY_OPTION: {
                        name: 'KEY_OPTION',
                        value: key
                    }
                },
                topLevel: true,
                x: 48,
                y: 150
            };
        }

        return null;
    }

    /**
     * Parse a regular block
     */
    parseBlock(content) {
        const id = this.generateBlockId();
        let block = {
            id,
            next: null,
            parent: null,
            topLevel: false
        };

        // Move steps
        if (content.match(/^move (\d+) steps?$/)) {
            const steps = content.match(/^move (\d+) steps?$/)[1];
            return {
                ...block,
                opcode: 'motion_movesteps',
                inputs: {
                    STEPS: [1, [4, steps]]
                },
                fields: {}
            };
        }

        // Turn right
        if (content.match(/^turn right (\d+)$/)) {
            const degrees = content.match(/^turn right (\d+)$/)[1];
            return {
                ...block,
                opcode: 'motion_turnright',
                inputs: {
                    DEGREES: [1, [4, degrees]]
                },
                fields: {}
            };
        }

        // Turn left
        if (content.match(/^turn left (\d+)$/)) {
            const degrees = content.match(/^turn left (\d+)$/)[1];
            return {
                ...block,
                opcode: 'motion_turnleft',
                inputs: {
                    DEGREES: [1, [4, degrees]]
                },
                fields: {}
            };
        }

        // Pen down
        if (content === 'pen down') {
            this.extensions.add('pen');
            return {
                ...block,
                opcode: 'pen_penDown',
                inputs: {},
                fields: {}
            };
        }

        // Pen up
        if (content === 'pen up') {
            this.extensions.add('pen');
            return {
                ...block,
                opcode: 'pen_penUp',
                inputs: {},
                fields: {}
            };
        }

        // Say
        if (content.match(/^say "(.+)"$/)) {
            const text = content.match(/^say "(.+)"$/)[1];
            return {
                ...block,
                opcode: 'looks_say',
                inputs: {
                    MESSAGE: [1, [10, text]]
                },
                fields: {}
            };
        }

        // Repeat
        if (content.match(/^repeat (\d+):$/)) {
            const times = content.match(/^repeat (\d+):$/)[1];
            return {
                ...block,
                opcode: 'control_repeat',
                inputs: {
                    TIMES: [1, [4, times]],
                    SUBSTACK: [2, null]
                },
                fields: {}
            };
        }

        return null;
    }

    /**
     * Transpile ScratchScript to .sb3 JSON
     */
    transpile(script) {
        const { blocks, scriptStarts } = this.parse(script);

        // Create the project structure
        const project = {
            targets: [
                // Stage
                {
                    isStage: true,
                    name: 'Stage',
                    variables: {},
                    lists: {},
                    broadcasts: {},
                    blocks: {},
                    comments: {},
                    currentCostume: 0,
                    costumes: [
                        {
                            assetId: 'cd21514d0531fdffb22204e0ec5ed84a',
                            name: 'backdrop1',
                            md5ext: 'cd21514d0531fdffb22204e0ec5ed84a.svg',
                            dataFormat: 'svg',
                            rotationCenterX: 240,
                            rotationCenterY: 180
                        }
                    ],
                    sounds: [],
                    volume: 100,
                    layerOrder: 0,
                    tempo: 60,
                    videoTransparency: 50,
                    videoState: 'on',
                    textToSpeechLanguage: null
                },
                // Sprite
                {
                    isStage: false,
                    name: this.currentSprite?.name || 'Sprite1',
                    variables: {},
                    lists: {},
                    broadcasts: {},
                    blocks: blocks,
                    comments: {},
                    currentCostume: 0,
                    costumes: [
                        {
                            assetId: 'bcf454acf82e4504149f7ffe07081dbc',
                            name: 'costume1',
                            bitmapResolution: 1,
                            md5ext: 'bcf454acf82e4504149f7ffe07081dbc.svg',
                            dataFormat: 'svg',
                            rotationCenterX: 48,
                            rotationCenterY: 50
                        }
                    ],
                    sounds: [],
                    volume: 100,
                    layerOrder: 1,
                    visible: true,
                    x: 0,
                    y: 0,
                    size: 100,
                    direction: 90,
                    draggable: false,
                    rotationStyle: 'all around'
                }
            ],
            monitors: [],
            extensions: Array.from(this.extensions),
            meta: {
                semver: '3.0.0',
                vm: '0.2.0',
                agent: 'ScratchScript-Transpiler'
            }
        };

        return project;
    }
}

module.exports = ScratchScriptTranspiler;
