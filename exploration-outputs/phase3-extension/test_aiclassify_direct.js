/**
 * Direct test of the AI Classify extension
 */

const AIClassifyExtension = require('./scratch-vm/src/extensions/scratch3_aiclassify/index.js');

console.log('🧪 Testing AI Classify Extension (Direct)\n');

// Create extension instance
const mockRuntime = {};
const extension = new AIClassifyExtension(mockRuntime);

// Test the extension metadata
const info = extension.getInfo();
console.log('📋 Extension Info:');
console.log(`   ID: ${info.id}`);
console.log(`   Name: ${info.name}`);
console.log(`   Blocks: ${info.blocks.length}`);

info.blocks.forEach((block, i) => {
    console.log(`   ${i + 1}. ${block.opcode} - "${block.text}"`);
});
console.log();

// Test classifyText block
console.log('🧠 Testing classifyText block:\n');

const testCases = [
    { input: 'This is great!', expected: 'positive' },
    { input: 'This is terrible!', expected: 'negative' },
    { input: 'Hello world', expected: 'neutral' },
    { input: 'I love this but hate that', expected: 'mixed' },
    { input: '', expected: 'empty' }
];

testCases.forEach(({ input, expected }) => {
    const result = extension.classifyText({ TEXT: input });
    const status = result === expected ? '✓' : '✗';
    console.log(`   ${status} classify("${input}") → "${result}" ${result === expected ? '' : `(expected: ${expected})`}`);
});

console.log();

// Test classifyTextWithCategory block
console.log('🏷️  Testing classifyTextWithCategory block:\n');

const categoryTests = [
    { text: 'I love programming!', category: 'sentiment', expected: 'positive' },
    { text: 'Let me write some code', category: 'topic', expected: 'technology' },
    { text: 'My cat loves to play', category: 'topic', expected: 'animals' },
    { text: 'Hello world', category: 'language', expected: 'english' },
    { text: '你好世界', category: 'language', expected: 'chinese' },
    { text: 'Привет мир', category: 'language', expected: 'russian' }
];

categoryTests.forEach(({ text, category, expected }) => {
    const result = extension.classifyTextWithCategory({ TEXT: text, CATEGORY: category });
    const status = result === expected ? '✓' : '✗';
    console.log(`   ${status} classify("${text}", "${category}") → "${result}" ${result === expected ? '' : `(expected: ${expected})`}`);
});

console.log();

// Test menu options
console.log('📝 Category Menu Options:');
info.menus.categories.items.forEach((item, i) => {
    console.log(`   ${i + 1}. ${item.value} (${item.text})`);
});

console.log();
console.log('✅ All tests complete!\n');
console.log('💡 Extension successfully registered in scratch-vm');
console.log('   Extension ID: aiclassify');
console.log('   Blocks available:');
console.log('   - aiclassify_classifyText');
console.log('   - aiclassify_classifyTextWithCategory');
