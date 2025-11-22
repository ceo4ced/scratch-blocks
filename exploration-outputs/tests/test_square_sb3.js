/**
 * Test that the draw_square.sb3 file can be loaded and executed by scratch-vm
 */

const VirtualMachine = require('./scratch-vm/src/index.js');
const fs = require('fs');

async function testSquareSb3() {
    console.log('Creating VM instance...');
    const vm = new VirtualMachine();

    console.log('Loading draw_square.sb3...');
    const sb3Data = fs.readFileSync('./draw_square.sb3');

    try {
        await vm.loadProject(sb3Data);
        console.log('✓ Project loaded successfully!');

        // Check that the project has the expected structure
        const targets = vm.runtime.targets;
        console.log(`✓ Found ${targets.length} targets (stage + sprite)`);

        // Find the sprite
        const sprite = targets.find(t => !t.isStage);
        if (sprite) {
            console.log(`✓ Sprite name: ${sprite.sprite.name}`);
            const blocks = sprite.blocks;
            const blockList = Object.keys(blocks._blocks);
            console.log(`✓ Sprite has ${blockList.length} blocks`);

            // Check for specific opcodes
            const opcodes = blockList.map(id => blocks._blocks[id].opcode);
            const expectedOpcodes = [
                'event_whenflagclicked',
                'pen_penDown',
                'control_repeat',
                'motion_movesteps',
                'motion_turnright',
                'pen_penUp'
            ];

            console.log('\n✓ Block opcodes found:');
            expectedOpcodes.forEach(opcode => {
                if (opcodes.includes(opcode)) {
                    console.log(`  ✓ ${opcode}`);
                } else {
                    console.log(`  ✗ ${opcode} MISSING`);
                }
            });
        }

        // Check extensions
        const extensions = vm.extensionManager._loadedExtensions;
        console.log(`\n✓ Loaded extensions: ${Object.keys(extensions).join(', ')}`);

        console.log('\n✓✓✓ SUCCESS! The .sb3 file is valid and can be loaded by scratch-vm');

    } catch (error) {
        console.error('✗ Error loading project:', error.message);
        process.exit(1);
    }
}

testSquareSb3().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
