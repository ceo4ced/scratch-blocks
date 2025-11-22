#!/usr/bin/env node
/**
 * ScratchScript CLI
 * Transpile .scratch files to .sb3 files
 */

const fs = require('fs');
const path = require('path');
const JSZip = require('./scratch-vm/node_modules/jszip');
const ScratchScriptTranspiler = require('./scratchscript-transpiler');

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('📝 ScratchScript Transpiler\n');
        console.log('Usage: node scratchscript-cli.js <input.scratch> [output.sb3]\n');
        console.log('Examples:');
        console.log('  node scratchscript-cli.js example.scratch');
        console.log('  node scratchscript-cli.js example.scratch output.sb3\n');
        process.exit(1);
    }

    const inputFile = args[0];
    const outputFile = args[1] || inputFile.replace('.scratch', '.sb3');

    if (!fs.existsSync(inputFile)) {
        console.error(`❌ Error: File not found: ${inputFile}`);
        process.exit(1);
    }

    console.log('🔄 Reading ScratchScript file...');
    const script = fs.readFileSync(inputFile, 'utf8');

    console.log('⚙️  Transpiling to Scratch JSON...');
    const transpiler = new ScratchScriptTranspiler();
    const projectJson = transpiler.transpile(script);

    console.log('📦 Creating .sb3 file...');

    // Create ZIP file
    const zip = new JSZip();
    zip.file('project.json', JSON.stringify(projectJson, null, 2));

    // Add default costume (if needed)
    const costumePath = path.join(__dirname, 'scratch-gui/src/lib/default-project/bcf454acf82e4504149f7ffe07081dbc.svg');
    if (fs.existsSync(costumePath)) {
        const costumeData = fs.readFileSync(costumePath);
        zip.file('bcf454acf82e4504149f7ffe07081dbc.svg', costumeData);
    }

    // Generate ZIP
    const zipData = await zip.generateAsync({ type: 'nodebuffer' });
    fs.writeFileSync(outputFile, zipData);

    console.log(`✅ Success! Created ${outputFile}\n`);
    console.log('📊 Project Info:');
    console.log(`   Blocks: ${Object.keys(projectJson.targets[1].blocks).length}`);
    console.log(`   Extensions: ${projectJson.extensions.join(', ') || 'none'}`);
    console.log(`   Sprite: ${projectJson.targets[1].name}\n`);
    console.log('💡 Test it:');
    console.log(`   Upload ${outputFile} to https://scratch.mit.edu/projects/editor/`);
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
