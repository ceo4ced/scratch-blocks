const BlockType = require('../../extension-support/block-type');
const ArgumentType = require('../../extension-support/argument-type');
const Cast = require('../../util/cast');

/**
 * Scratch3 n8n Extension
 * Provides integration with n8n workflow automation platform
 */
class Scratch3N8NBlocks {
    constructor(runtime) {
        this.runtime = runtime;

        // Backend API endpoint
        this.apiEndpoint = process.env.SCRATCH_N8N_API || 'http://localhost:3000/api';

        // Workflow results cache (keyed by workflow ID)
        this.results = new Map();

        // Pending workflows (for async execution)
        this.pendingWorkflows = new Set();

        // Last execution details
        this.lastWorkflowId = null;
        this.lastResult = null;
        this.lastError = null;
    }

    getInfo() {
        return {
            id: 'n8n',
            name: 'Workflows',
            color1: '#EA4B71',
            color2: '#C43D5C',
            color3: '#A8334E',
            blocks: [
                {
                    opcode: 'triggerWorkflow',
                    blockType: BlockType.COMMAND,
                    text: 'trigger workflow [WEBHOOK]',
                    arguments: {
                        WEBHOOK: {
                            type: ArgumentType.STRING,
                            defaultValue: 'https://n8n.example.com/webhook/...'
                        }
                    }
                },
                {
                    opcode: 'triggerWorkflowWithData',
                    blockType: BlockType.COMMAND,
                    text: 'trigger workflow [NAME] with [DATA]',
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: 'my-workflow'
                        },
                        DATA: {
                            type: ArgumentType.STRING,
                            defaultValue: '{"score": 100}'
                        }
                    }
                },
                {
                    opcode: 'waitForWorkflow',
                    blockType: BlockType.COMMAND,
                    text: 'wait for workflow [NAME]',
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: 'my-workflow'
                        }
                    }
                },
                {
                    opcode: 'getWorkflowResult',
                    blockType: BlockType.REPORTER,
                    text: 'workflow [NAME] result',
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: 'my-workflow'
                        }
                    }
                },
                {
                    opcode: 'getWorkflowField',
                    blockType: BlockType.REPORTER,
                    text: 'workflow [NAME] field [FIELD]',
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: 'my-workflow'
                        },
                        FIELD: {
                            type: ArgumentType.STRING,
                            defaultValue: 'status'
                        }
                    }
                },
                {
                    opcode: 'isWorkflowComplete',
                    blockType: BlockType.BOOLEAN,
                    text: 'workflow [NAME] complete?',
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: 'my-workflow'
                        }
                    }
                },
                {
                    opcode: 'hasWorkflowError',
                    blockType: BlockType.BOOLEAN,
                    text: 'workflow [NAME] failed?',
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: 'my-workflow'
                        }
                    }
                },
                {
                    opcode: 'sendGameData',
                    blockType: BlockType.COMMAND,
                    text: 'send game data [TYPE]: [VALUE]',
                    arguments: {
                        TYPE: {
                            type: ArgumentType.STRING,
                            menu: 'dataTypes',
                            defaultValue: 'score'
                        },
                        VALUE: {
                            type: ArgumentType.STRING,
                            defaultValue: '100'
                        }
                    }
                },
                {
                    opcode: 'clearWorkflowResults',
                    blockType: BlockType.COMMAND,
                    text: 'clear all workflow results'
                }
            ],
            menus: {
                dataTypes: {
                    acceptReporters: true,
                    items: [
                        { text: 'Score', value: 'score' },
                        { text: 'Level', value: 'level' },
                        { text: 'Achievement', value: 'achievement' },
                        { text: 'Player Name', value: 'player_name' },
                        { text: 'Custom', value: 'custom' }
                    ]
                }
            }
        };
    }

    /**
     * Trigger a workflow via webhook URL
     */
    async triggerWorkflow(args) {
        const webhook = Cast.toString(args.WEBHOOK);

        this.lastError = null;

        try {
            const response = await this._callWebhook(webhook, {
                timestamp: Date.now(),
                source: 'scratch-game'
            });

            this.lastWorkflowId = this._extractWorkflowId(webhook);
            this.lastResult = response;
            this.results.set(this.lastWorkflowId, response);

            console.log('[n8n Extension] Workflow triggered:', this.lastWorkflowId);
        } catch (error) {
            this.lastError = error.message;
            console.error('[n8n Extension] Error:', error);
        }
    }

    /**
     * Trigger a named workflow with custom data
     */
    async triggerWorkflowWithData(args) {
        const name = Cast.toString(args.NAME);
        const dataStr = Cast.toString(args.DATA);

        this.lastError = null;

        let data;
        try {
            data = JSON.parse(dataStr);
        } catch (e) {
            // If not valid JSON, treat as string value
            data = { value: dataStr };
        }

        try {
            const response = await this._callAPI('/n8n/trigger', {
                workflow_name: name,
                data: data,
                timestamp: Date.now()
            });

            this.lastWorkflowId = name;
            this.lastResult = response;
            this.results.set(name, response);
            this.pendingWorkflows.add(name);

            console.log('[n8n Extension] Workflow triggered:', name);
        } catch (error) {
            this.lastError = error.message;
            console.error('[n8n Extension] Error:', error);
        }
    }

    /**
     * Wait for a workflow to complete (blocking)
     */
    async waitForWorkflow(args) {
        const name = Cast.toString(args.NAME);

        this.lastError = null;

        if (!this.pendingWorkflows.has(name)) {
            console.log('[n8n Extension] Workflow not pending:', name);
            return;
        }

        try {
            // Poll for workflow completion
            const maxAttempts = 30; // 30 seconds max
            let attempts = 0;

            while (attempts < maxAttempts) {
                const response = await this._callAPI('/n8n/result', {
                    workflow_name: name
                });

                if (response.status === 'completed' || response.status === 'failed') {
                    this.results.set(name, response);
                    this.pendingWorkflows.delete(name);
                    this.lastResult = response;
                    break;
                }

                // Wait 1 second before next poll
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
            }

            if (attempts >= maxAttempts) {
                throw new Error('Workflow timeout');
            }
        } catch (error) {
            this.lastError = error.message;
            console.error('[n8n Extension] Error:', error);
        }
    }

    /**
     * Get workflow result
     */
    getWorkflowResult(args) {
        const name = Cast.toString(args.NAME);
        const result = this.results.get(name);

        if (!result) return '';

        // Return the entire result as JSON string
        return JSON.stringify(result);
    }

    /**
     * Get specific field from workflow result
     */
    getWorkflowField(args) {
        const name = Cast.toString(args.NAME);
        const field = Cast.toString(args.FIELD);

        const result = this.results.get(name);
        if (!result) return '';

        // Access nested fields with dot notation
        const parts = field.split('.');
        let value = result;

        for (const part of parts) {
            value = value?.[part];
            if (value === undefined) return '';
        }

        return typeof value === 'object' ? JSON.stringify(value) : String(value);
    }

    /**
     * Check if workflow is complete
     */
    isWorkflowComplete(args) {
        const name = Cast.toString(args.NAME);
        return !this.pendingWorkflows.has(name) && this.results.has(name);
    }

    /**
     * Check if workflow failed
     */
    hasWorkflowError(args) {
        const name = Cast.toString(args.NAME);
        const result = this.results.get(name);

        return result?.status === 'failed' || result?.error !== undefined;
    }

    /**
     * Send game data to default workflow
     */
    async sendGameData(args) {
        const type = Cast.toString(args.TYPE);
        const value = Cast.toString(args.VALUE);

        try {
            await this._callAPI('/n8n/game-data', {
                type: type,
                value: value,
                timestamp: Date.now()
            });

            console.log('[n8n Extension] Game data sent:', type, value);
        } catch (error) {
            this.lastError = error.message;
            console.error('[n8n Extension] Error:', error);
        }
    }

    /**
     * Clear all workflow results
     */
    clearWorkflowResults() {
        this.results.clear();
        this.pendingWorkflows.clear();
        this.lastResult = null;
        this.lastError = null;
    }

    /**
     * Internal: Call n8n webhook directly
     */
    async _callWebhook(url, data) {
        if (typeof fetch !== 'undefined') {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Webhook failed: ${response.status}`);
            }

            return await response.json();
        }

        // Mock response for testing
        console.log('[n8n Extension] Mock webhook call:', url, data);
        return {
            success: true,
            execution_id: 'exec_' + Date.now()
        };
    }

    /**
     * Internal: Call backend API
     */
    async _callAPI(endpoint, data) {
        if (typeof fetch !== 'undefined') {
            const response = await fetch(this.apiEndpoint + endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'API request failed');
            }

            return await response.json();
        }

        // Mock response for testing
        console.log('[n8n Extension] Mock API call:', endpoint, data);

        if (endpoint === '/n8n/trigger') {
            return {
                execution_id: 'exec_' + Date.now(),
                status: 'running'
            };
        } else if (endpoint === '/n8n/result') {
            return {
                status: 'completed',
                result: { success: true, data: 'mock result' }
            };
        } else if (endpoint === '/n8n/game-data') {
            return { success: true };
        }

        return {};
    }

    /**
     * Extract workflow ID from webhook URL
     */
    _extractWorkflowId(url) {
        const match = url.match(/webhook\/([^/]+)/);
        return match ? match[1] : 'unknown';
    }
}

module.exports = Scratch3N8NBlocks;
