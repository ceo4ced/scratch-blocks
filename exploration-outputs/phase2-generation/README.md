# Phase 2: Generation - draw_square.sb3

## Overview

Created a minimal valid .sb3 file from scratch that draws a 100×100 pixel square using the pen extension.

## Files

- **`draw_square.sb3`** - The generated Scratch project
- **`create_square_sb3.py`** - Python script that generates the .sb3 file

## What It Does

When you click the green flag:
1. Pen down
2. Repeat 4 times:
   - Move 100 steps
   - Turn right 90 degrees
3. Pen up

**Result**: A perfect square!

## Block Structure

```
greenFlag (event_whenflagclicked)
    ↓
penDown (pen_penDown)
    ↓
repeat (control_repeat, TIMES=4)
    → SUBSTACK:
        move (motion_movesteps, STEPS=100)
            ↓
        turn (motion_turnright, DEGREES=90)
    ↓
penUp (pen_penUp)
```

## Testing

### Option 1: Online Scratch (Recommended)
1. Go to https://scratch.mit.edu/projects/editor/
2. File → Load from your computer
3. Select `draw_square.sb3`
4. Click the green flag 🏁
5. Watch the square appear!

### Option 2: Validate Structure
```bash
cd /home/user/scratch-exploration-output/tests
node test_square_sb3.js
```

## Technical Details

### File Structure
```
draw_square.sb3 (ZIP archive)
├── project.json
└── bcf454acf82e4504149f7ffe07081dbc.svg (Scratch cat costume)
```

### Key JSON Elements

**Extensions Used:**
```json
"extensions": ["pen"]
```

**Repeat Block Structure:**
```json
{
  "opcode": "control_repeat",
  "inputs": {
    "TIMES": [1, [4, "4"]],
    "SUBSTACK": [2, "move"]
  }
}
```

**Number Input Format:**
- `[1, [4, "100"]]` means:
  - `1` = has shadow
  - `4` = number type
  - `"100"` = the value

### Validation Results

✓ Valid ZIP structure
✓ Loads successfully in scratch-vm
✓ Has 2 targets (Stage + Sprite1)
✓ Contains 6 blocks with correct opcodes
✓ Pen extension properly declared
✓ Ready to run in Scratch 3.0

## What I Learned

1. **Block linking**: Blocks use `next` pointers to form sequences
2. **Control flow**: Loops use `SUBSTACK` input to reference nested blocks
3. **Value encoding**: Numbers are stored as `[shadowType, [valueType, "value"]]`
4. **Extensions**: Must be declared in the `extensions` array for opcodes to work
5. **.sb3 format**: Just a ZIP file with standardized JSON structure
