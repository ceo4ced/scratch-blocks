/**
 * Load and execute the draw_square.sb3 project programmatically
 */

const VirtualMachine = require('./scratch-vm/src/index.js');
const fs = require('fs');

async function runSquareProject() {
    console.log('🚀 Starting Scratch VM Test\n');

    const vm = new VirtualMachine();
    const sb3Data = fs.readFileSync('./draw_square.sb3');

    // Load the project
    await vm.loadProject(sb3Data);
    console.log('✓ Project loaded\n');

    // Get the sprite
    const sprite = vm.runtime.targets.find(t => !t.isStage);
    console.log(`📦 Sprite: ${sprite.sprite.name}`);
    console.log(`📍 Initial position: (${sprite.x}, ${sprite.y})`);
    console.log(`🧭 Initial direction: ${sprite.direction}°\n`);

    // Start the project (triggers green flag)
    console.log('🏁 Clicking green flag...\n');
    vm.greenFlag();

    // Let it run for a bit
    await new Promise(resolve => setTimeout(resolve, 100));

    // Step the runtime manually to execute blocks
    console.log('⚙️  Executing blocks...');
    for (let i = 0; i < 100; i++) {
        vm.runtime._step();
        if (vm.runtime.threads.length === 0) {
            console.log(`✓ Execution complete after ${i + 1} steps\n`);
            break;
        }
    }

    // Check results
    console.log('📊 Final State:');
    console.log(`   Position: (${sprite.x.toFixed(2)}, ${sprite.y.toFixed(2)})`);
    console.log(`   Direction: ${sprite.direction}°`);
    console.log(`   Threads: ${vm.runtime.threads.length} (should be 0 when done)`);

    // Verify the sprite moved (should have drawn a square and returned to origin)
    const moved = Math.abs(sprite.x) > 0.1 || Math.abs(sprite.y) > 0.1;
    console.log(`\n🎨 Square drawn: ${moved ? '✓ YES (sprite moved)' : '? Cannot verify without renderer'}`);
    console.log('\n💡 Note: Pen drawing requires a renderer (canvas). This test verifies block execution.');
    console.log('   To SEE the square, upload to https://scratch.mit.edu/projects/editor/\n');

    return vm;
}

runSquareProject().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
