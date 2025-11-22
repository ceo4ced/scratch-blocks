#!/usr/bin/env python3
"""
Create a minimal .sb3 file that draws a square using the pen extension.
"""

import json
import zipfile
import shutil
from pathlib import Path

# Create output directory
output_dir = Path("/home/user/square_project")
output_dir.mkdir(exist_ok=True)

# Copy the default Scratch cat costume from scratch-gui
cat_costume_svg = "bcf454acf82e4504149f7ffe07081dbc.svg"
shutil.copy(
    f"/home/user/scratch-gui/src/lib/default-project/{cat_costume_svg}",
    output_dir / cat_costume_svg
)

# Create the project JSON structure
project = {
    "targets": [
        {
            # Stage
            "isStage": True,
            "name": "Stage",
            "variables": {},
            "lists": {},
            "broadcasts": {},
            "blocks": {},
            "comments": {},
            "currentCostume": 0,
            "costumes": [
                {
                    "assetId": "cd21514d0531fdffb22204e0ec5ed84a",
                    "name": "backdrop1",
                    "md5ext": "cd21514d0531fdffb22204e0ec5ed84a.svg",
                    "dataFormat": "svg",
                    "rotationCenterX": 240,
                    "rotationCenterY": 180
                }
            ],
            "sounds": [],
            "volume": 100,
            "layerOrder": 0,
            "tempo": 60,
            "videoTransparency": 50,
            "videoState": "on",
            "textToSpeechLanguage": None
        },
        {
            # Sprite1 - The cat that draws the square
            "isStage": False,
            "name": "Sprite1",
            "variables": {},
            "lists": {},
            "broadcasts": {},
            "blocks": {
                # Green flag hat block
                "greenFlag": {
                    "opcode": "event_whenflagclicked",
                    "next": "penDown",
                    "parent": None,
                    "inputs": {},
                    "fields": {},
                    "topLevel": True,
                    "x": 48,
                    "y": 48
                },

                # Pen down
                "penDown": {
                    "opcode": "pen_penDown",
                    "next": "repeat",
                    "parent": "greenFlag",
                    "inputs": {},
                    "fields": {},
                    "topLevel": False
                },

                # Repeat 4 times
                "repeat": {
                    "opcode": "control_repeat",
                    "next": "penUp",
                    "parent": "penDown",
                    "inputs": {
                        "TIMES": [
                            1,  # Shadow type (1 = shadow, 2 = no shadow, 3 = shadow obscured)
                            [
                                4,  # Type: number
                                "4"
                            ]
                        ],
                        "SUBSTACK": [
                            2,  # No shadow
                            "move"
                        ]
                    },
                    "fields": {},
                    "topLevel": False
                },

                # Move 100 steps
                "move": {
                    "opcode": "motion_movesteps",
                    "next": "turn",
                    "parent": "repeat",
                    "inputs": {
                        "STEPS": [
                            1,  # Shadow
                            [
                                4,  # Type: number
                                "100"
                            ]
                        ]
                    },
                    "fields": {},
                    "topLevel": False
                },

                # Turn right 90 degrees
                "turn": {
                    "opcode": "motion_turnright",
                    "next": None,
                    "parent": "move",
                    "inputs": {
                        "DEGREES": [
                            1,  # Shadow
                            [
                                4,  # Type: number
                                "90"
                            ]
                        ]
                    },
                    "fields": {},
                    "topLevel": False
                },

                # Pen up (after repeat)
                "penUp": {
                    "opcode": "pen_penUp",
                    "next": None,
                    "parent": "repeat",
                    "inputs": {},
                    "fields": {},
                    "topLevel": False
                }
            },
            "comments": {},
            "currentCostume": 0,
            "costumes": [
                {
                    "assetId": "bcf454acf82e4504149f7ffe07081dbc",
                    "name": "costume1",
                    "bitmapResolution": 1,
                    "md5ext": "bcf454acf82e4504149f7ffe07081dbc.svg",
                    "dataFormat": "svg",
                    "rotationCenterX": 48,
                    "rotationCenterY": 50
                }
            ],
            "sounds": [],
            "volume": 100,
            "layerOrder": 1,
            "visible": True,
            "x": 0,
            "y": 0,
            "size": 100,
            "direction": 90,
            "draggable": False,
            "rotationStyle": "all around"
        }
    ],
    "monitors": [],
    "extensions": ["pen"],  # Include the pen extension
    "meta": {
        "semver": "3.0.0",
        "vm": "0.2.0",
        "agent": "claude-code-scratch-generator"
    }
}

# Write project.json
with open(output_dir / "project.json", "w") as f:
    json.dump(project, f, indent=2)

# Create the .sb3 file (which is just a ZIP)
sb3_path = Path("/home/user/draw_square.sb3")
with zipfile.ZipFile(sb3_path, "w", zipfile.ZIP_DEFLATED) as zf:
    zf.write(output_dir / "project.json", "project.json")
    zf.write(output_dir / cat_costume_svg, cat_costume_svg)

print(f"✓ Created {sb3_path}")
print(f"✓ Project structure:")
print(f"  - 1 sprite with pen blocks")
print(f"  - Green flag → pen down → repeat 4 (move 100, turn 90) → pen up")
print(f"  - Extension: pen")
