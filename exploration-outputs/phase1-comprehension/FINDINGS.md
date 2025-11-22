# Phase 1: Comprehension Findings

## 1. How the Runtime Executes Blocks (Stack/Thread Model)

### Thread-Based Execution

Each running script becomes a **Thread** object that maintains:
- **Stack**: Array of block IDs representing the execution path
- **Stack Frames**: Execution context for each level (params, loop state, warp mode)
- **Status**: `RUNNING`, `PROMISE_WAIT`, `YIELD`, `YIELD_TICK`, or `DONE`

### The Sequencer

The Sequencer steps through all threads in a time-sliced manner:

```javascript
// From src/engine/sequencer.js:70-91
while (runtime.threads.length > 0 &&
       numActiveThreads > 0 &&
       timer.timeElapsed() < WORK_TIME &&
       (runtime.turboMode || !runtime.redrawRequested)) {
    // Step each thread once per iteration
}
```

**Work Time**: 75% of frame time (~11ms for 60fps)

### Execution Flow

1. Sequencer calls `stepThread(thread)` for each active thread
2. Gets current block ID from `thread.peekStack()`
3. Looks up opcode and finds corresponding JavaScript function
4. Executes function with `(args, util)` parameters
5. Function returns:
   - **Value** (reporter block) - stored and continues
   - **undefined** (command block) - continues to next
   - **Promise** (async) - thread status → `PROMISE_WAIT`
6. Thread moves to next block or waits based on result

### Turbo Mode vs Warp Mode

| Aspect | Turbo Mode | Warp Mode |
|--------|------------|-----------|
| **Scope** | Global (entire runtime) | Per custom block (stack frame) |
| **Set by** | User GUI button | "Run without screen refresh" checkbox |
| **Effect** | Bypasses redraw checks | Executes to completion without yielding |
| **Time limit** | WORK_TIME (75% of frame) | 500ms per warp block |
| **Location** | `runtime.turboMode` | `stackFrame.warpMode` |

## 2. Structure of an .sb3 File

An .sb3 file is a **ZIP archive** containing:

```
project.json          # Main project definition
*.svg / *.png         # Costumes (referenced by MD5)
*.wav / *.mp3         # Sounds (referenced by MD5)
```

### project.json Structure

```json
{
  "targets": [          // Array of sprites + stage
    {
      "isStage": true/false,
      "name": "Stage",
      "variables": {},   // {id: [name, value]}
      "lists": {},
      "broadcasts": {},
      "blocks": {        // Block definitions
        "block-id": {
          "opcode": "motion_movesteps",
          "next": "next-block-id",
          "parent": "parent-block-id",
          "inputs": {    // Nested blocks/values
            "STEPS": [1, [4, "10"]]
          },
          "fields": {},  // Dropdown selections
          "topLevel": true/false,
          "x": 100,      // Editor position
          "y": 200
        }
      },
      "costumes": [...],
      "sounds": [...],
      "x": 0, "y": 0,    // Sprite position
      "direction": 90
    }
  ],
  "monitors": [],        // Visible variable/list monitors
  "extensions": ["pen"], // Extension IDs
  "meta": {
    "semver": "3.0.0"
  }
}
```

### Block Linking

- Blocks form a **linked list** via `next` pointers
- Control structures (loops, if) use `inputs` to nest blocks:
  ```json
  "inputs": {
    "SUBSTACK": [2, "first-block-in-loop"]
  }
  ```

### Input Format

Inputs are arrays: `[shadowType, value]`
- **shadowType**:
  - `1` = shadow present
  - `2` = no shadow
  - `3` = shadow obscured
- **value**:
  - For literals: `[type, stringValue]` where type:
    - `4` = number
    - `10` = text
  - For blocks: block ID string

## 3. How Block Opcodes Map to JavaScript Functions

### Block Package Structure

Each category (motion, looks, sound, etc.) is a JavaScript class:

```javascript
// From src/blocks/scratch3_motion.js
class Scratch3MotionBlocks {
    constructor(runtime) {
        this.runtime = runtime;
    }

    getPrimitives() {
        return {
            motion_movesteps: this.moveSteps,
            motion_gotoxy: this.goToXY,
            // ... more opcodes
        };
    }

    moveSteps(args, util) {
        const steps = Cast.toNumber(args.STEPS);
        const radians = MathUtil.degToRad(90 - util.target.direction);
        const dx = steps * Math.cos(radians);
        const dy = steps * Math.sin(radians);
        util.target.setXY(util.target.x + dx, util.target.y + dy);
    }
}
```

### Registration Flow

1. Runtime imports all default block packages (src/engine/runtime.js:35-45)
2. Calls `getPrimitives()` on each to build opcode→function map
3. During execution:
   - Looks up `blocks[blockId].opcode` in the map
   - Calls function with:
     - `args`: Block's fields/inputs resolved to values
     - `util`: BlockUtility object (runtime, target, helpers)

### Function Signatures

- **Command blocks**: `(args, util) => void`
- **Reporter blocks**: `(args, util) => value`
- **Async blocks**: `(args, util) => Promise`

### The BlockUtility Object

Provides blocks access to:
- `util.target` - The sprite/stage executing the block
- `util.runtime` - The VM runtime
- `util.stackFrame` - Loop/procedure state
- `util.startBranch(branchNum, isLoop)` - Enter control structure
- `util.yield()` / `util.yieldTick()` - Pause execution
- `util.ioQuery(device, func, args)` - Access I/O devices

### Extensions

Extensions (like pen) follow the same pattern but return a `getInfo()` descriptor:

```javascript
getInfo() {
    return {
        id: 'pen',
        name: 'Pen',
        blocks: [
            {
                opcode: 'penDown',
                blockType: BlockType.COMMAND,
                text: 'pen down'
            },
            // ... more blocks
        ]
    };
}
```

---

## Files Explored

- `/src/engine/runtime.js` - Main runtime initialization and management
- `/src/engine/thread.js` - Thread and stack frame classes
- `/src/engine/sequencer.js` - Thread scheduling and execution loop
- `/src/engine/execute.js` - Block execution logic
- `/src/blocks/scratch3_motion.js` - Example block package
- `/src/extensions/scratch3_pen/index.js` - Example extension
- `/test/fixtures/default.sb3` - Example project structure
