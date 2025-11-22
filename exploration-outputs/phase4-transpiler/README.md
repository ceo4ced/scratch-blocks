# Phase 4: ScratchScript Transpiler

## Overview

Created **ScratchScript** - a simple, human-readable text-based syntax that transpiles to valid Scratch .sb3 files.

## Files

- **`scratchscript-transpiler.js`** - The transpiler core
- **`scratchscript-cli.js`** - Command-line interface
- **`example.scratch`** - Example: Draw a square
- **`example2.scratch`** - Example: Interactive sprite
- **`example-transpiled.sb3`** - Output from example 1
- **`example2-transpiled.sb3`** - Output from example 2

## ScratchScript Syntax

### Basic Structure

```scratch
sprite <name>:
    when <event>:
        <blocks>
```

### Events (Hat Blocks)

```scratch
when flag clicked:
    <blocks>

when <key> pressed:
    <blocks>
```

Keys: `space`, `up arrow`, `down arrow`, `left arrow`, `right arrow`, etc.

### Blocks

#### Motion
```scratch
move <n> steps
turn right <n>
turn left <n>
```

#### Looks
```scratch
say "<text>"
```

#### Pen
```scratch
pen down
pen up
```

#### Control
```scratch
repeat <n>:
    <indented blocks>
```

### Comments

```scratch
# This is a comment
```

## Examples

### Example 1: Draw a Square

**Input (`example.scratch`):**
```scratch
# ScratchScript Example: Draw a Square

sprite Cat:
    when flag clicked:
        pen down
        repeat 4:
            move 100 steps
            turn right 90
        pen up
```

**Output:** Valid .sb3 file with:
- Green flag event
- Pen extension
- Repeat block with move and turn inside

### Example 2: Interactive Sprite

**Input (`example2.scratch`):**
```scratch
sprite Cat:
    when flag clicked:
        say "Use arrow keys to move me!"

    when up arrow pressed:
        move 10 steps

    when down arrow pressed:
        move -10 steps

    when right arrow pressed:
        turn right 15

    when left arrow pressed:
        turn left 15
```

**Output:** Valid .sb3 file with:
- 5 event handlers (flag + 4 keys)
- Say block
- Motion blocks for each key

## Usage

### Command Line

```bash
node scratchscript-cli.js <input.scratch> [output.sb3]
```

**Examples:**
```bash
# Transpile example.scratch to example.sb3
node scratchscript-cli.js example.scratch

# Specify output filename
node scratchscript-cli.js example.scratch my-project.sb3
```

### Programmatic Use

```javascript
const ScratchScriptTranspiler = require('./scratchscript-transpiler');

const script = `
sprite Cat:
    when flag clicked:
        move 10 steps
`;

const transpiler = new ScratchScriptTranspiler();
const projectJson = transpiler.transpile(script);

// projectJson is valid Scratch 3.0 JSON
```

## How It Works

### 1. Lexing & Parsing

The transpiler reads the `.scratch` file line by line:

```javascript
parse(script) {
    // For each line:
    // 1. Detect indentation level
    // 2. Identify block type (event, motion, control, etc.)
    // 3. Extract parameters
    // 4. Build block objects
}
```

### 2. Block Generation

Each line is converted to a Scratch block:

```javascript
// Input: "move 100 steps"
// Output:
{
    id: "block_1",
    opcode: "motion_movesteps",
    inputs: {
        STEPS: [1, [4, "100"]]
    },
    fields: {},
    next: null,
    parent: null
}
```

### 3. Linking Blocks

Blocks are linked based on indentation:

- **Same indent**: Sequential (use `next` pointer)
- **Deeper indent**: Nested (use `SUBSTACK` input)
- **Shallower indent**: Exit nesting, continue sequence

### 4. .sb3 Generation

The final project structure is created with:
- Stage (backdrop)
- Sprite with generated blocks
- Required extensions (auto-detected)
- Metadata

Then packaged as a ZIP file with:
- `project.json` - The project data
- `*.svg` - Costume files

## Supported Blocks

| Category | Blocks |
|----------|--------|
| **Events** | when flag clicked, when \<key\> pressed |
| **Motion** | move \<n\> steps, turn right \<n\>, turn left \<n\> |
| **Looks** | say "\<text\>" |
| **Pen** | pen down, pen up |
| **Control** | repeat \<n\>: |

## Test Results

```
✅ example.scratch → example-transpiled.sb3
   Blocks: 6
   Extensions: pen
   Valid: ✓

✅ example2.scratch → example2-transpiled.sb3
   Blocks: 9
   Extensions: none
   Valid: ✓
```

Both outputs can be uploaded to Scratch 3.0 and run successfully!

## Architecture

### Class: `ScratchScriptTranspiler`

```javascript
class ScratchScriptTranspiler {
    generateBlockId()           // Generate unique IDs
    getIndentLevel(line)        // Parse indentation
    tokenize(line)              // Clean up line
    parse(script)               // Main parser
    parseHatBlock(content)      // Parse event blocks
    parseBlock(content)         // Parse regular blocks
    transpile(script)           // Main entry point
}
```

### Data Flow

```
.scratch file
    ↓
parse()
    ↓
blocks object + scriptStarts array
    ↓
transpile()
    ↓
Scratch 3.0 JSON
    ↓
ZIP (.sb3)
```

## Future Enhancements

### More Blocks
- Variables (set/change)
- Conditionals (if/if-else)
- Operators (math, comparison)
- Sensing blocks
- Custom blocks

### Advanced Features
- Multi-sprite support
- Variables and lists
- Broadcasts
- Costumes and sounds
- Comments in output

### Syntax Improvements
- String interpolation
- Expression evaluation
- Type checking
- Error messages with line numbers

### Tooling
- Syntax highlighting
- VSCode extension
- Online playground
- Debugger

## What I Learned

1. **Parser Design**: Indentation-based syntax is clean but requires careful tracking
2. **Block Linking**: The `next`/`parent`/`SUBSTACK` relationships form a tree
3. **Extension Detection**: Can auto-detect which extensions are needed
4. **ZIP Format**: .sb3 files are just ZIPs with standardized structure
5. **Transpilation**: Converting syntax trees to Scratch JSON is straightforward once you understand the format

## Design Decisions

**Why indentation-based?**
- More readable than XML/JSON
- Natural for representing nesting (loops, conditionals)
- Familiar to Python/YAML users

**Why limited block set?**
- Proof of concept - demonstrates the approach
- Easy to extend with more blocks
- Keeps the parser simple

**Why text-based?**
- Version control friendly (unlike binary .sb3)
- Easier to generate programmatically
- Can be edited in any text editor
- Enables code review and diffs

## Comparison to Scratch

| Aspect | Scratch (GUI) | ScratchScript |
|--------|---------------|---------------|
| **Interface** | Drag & drop | Text editor |
| **Format** | .sb3 (binary ZIP) | .scratch (text) |
| **Version Control** | Difficult | Git-friendly |
| **Learning Curve** | Visual, intuitive | Requires syntax knowledge |
| **Output** | .sb3 file | .sb3 file (same!) |
| **Editing** | Scratch editor | Any text editor |
| **Best For** | Beginners, visual learners | Programmers, automation |

## Conclusion

ScratchScript successfully bridges the gap between text-based programming and Scratch's visual blocks. It demonstrates that Scratch projects can be created, versioned, and collaborated on using standard development tools and workflows.

The transpiler proves the .sb3 format is well-designed and accessible, enabling entirely new ways to create Scratch content programmatically.
