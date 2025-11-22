const BlockType = require('../../extension-support/block-type');
const ArgumentType = require('../../extension-support/argument-type');
const Cast = require('../../util/cast');

/**
 * Scratch3 LLM Extension
 * Provides access to various Large Language Models and AI services
 */
class Scratch3LLMBlocks {
    constructor(runtime) {
        this.runtime = runtime;

        // Backend API endpoint (can be configured)
        this.apiEndpoint = process.env.SCRATCH_LLM_API || 'http://localhost:3000/api';

        // Conversation history for multi-turn chat
        this.conversations = new Map();

        // Last response cache
        this.lastResponse = '';
        this.lastError = null;

        // Settings
        this.temperature = 0.7;
        this.maxTokens = 1000;
        this.currentModel = 'gpt-3.5-turbo';
    }

    getInfo() {
        return {
            id: 'llm',
            name: 'AI Models',
            color1: '#9966FF',
            color2: '#774DCB',
            color3: '#664BB3',
            blocks: [
                {
                    opcode: 'askAI',
                    blockType: BlockType.COMMAND,
                    text: 'ask [MODEL] prompt [TEXT]',
                    arguments: {
                        MODEL: {
                            type: ArgumentType.STRING,
                            menu: 'models',
                            defaultValue: 'gpt-3.5-turbo'
                        },
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'What is Scratch?'
                        }
                    }
                },
                {
                    opcode: 'chatWithAI',
                    blockType: BlockType.COMMAND,
                    text: 'chat with [MODEL] saying [TEXT]',
                    arguments: {
                        MODEL: {
                            type: ArgumentType.STRING,
                            menu: 'models',
                            defaultValue: 'gpt-3.5-turbo'
                        },
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Hello!'
                        }
                    }
                },
                {
                    opcode: 'classifyWithAI',
                    blockType: BlockType.REPORTER,
                    text: 'classify [TEXT] using [MODEL]',
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'This is amazing!'
                        },
                        MODEL: {
                            type: ArgumentType.STRING,
                            menu: 'classificationModels',
                            defaultValue: 'sentiment'
                        }
                    }
                },
                {
                    opcode: 'generateImage',
                    blockType: BlockType.COMMAND,
                    text: 'generate image from [PROMPT]',
                    arguments: {
                        PROMPT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'a cat wearing a space suit'
                        }
                    }
                },
                {
                    opcode: 'getResponse',
                    blockType: BlockType.REPORTER,
                    text: 'AI response'
                },
                {
                    opcode: 'setTemperature',
                    blockType: BlockType.COMMAND,
                    text: 'set AI creativity to [TEMP]',
                    arguments: {
                        TEMP: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0.7
                        }
                    }
                },
                {
                    opcode: 'setMaxTokens',
                    blockType: BlockType.COMMAND,
                    text: 'set max response length to [TOKENS]',
                    arguments: {
                        TOKENS: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1000
                        }
                    }
                },
                {
                    opcode: 'clearConversation',
                    blockType: BlockType.COMMAND,
                    text: 'clear conversation with [MODEL]',
                    arguments: {
                        MODEL: {
                            type: ArgumentType.STRING,
                            menu: 'models',
                            defaultValue: 'gpt-3.5-turbo'
                        }
                    }
                },
                {
                    opcode: 'hasError',
                    blockType: BlockType.BOOLEAN,
                    text: 'AI request failed?'
                },
                {
                    opcode: 'getError',
                    blockType: BlockType.REPORTER,
                    text: 'AI error message'
                }
            ],
            menus: {
                models: {
                    acceptReporters: true,
                    items: [
                        // OpenAI Models
                        { text: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
                        { text: 'GPT-4', value: 'gpt-4' },
                        { text: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },

                        // Anthropic Models
                        { text: 'Claude Sonnet', value: 'claude-sonnet' },
                        { text: 'Claude Opus', value: 'claude-opus' },
                        { text: 'Claude Haiku', value: 'claude-haiku' },

                        // Hugging Face Models
                        { text: 'BERT Base', value: 'bert-base' },
                        { text: 'GPT-2', value: 'gpt2' },
                        { text: 'T5 Base', value: 't5-base' },

                        // Local Models
                        { text: 'Ollama (Local)', value: 'ollama' },
                        { text: 'LM Studio (Local)', value: 'lmstudio' }
                    ]
                },
                classificationModels: {
                    acceptReporters: true,
                    items: [
                        { text: 'Sentiment', value: 'sentiment' },
                        { text: 'Topic', value: 'topic' },
                        { text: 'Language', value: 'language' },
                        { text: 'Toxicity', value: 'toxicity' },
                        { text: 'Emotion', value: 'emotion' }
                    ]
                }
            }
        };
    }

    /**
     * Ask AI a single prompt (no conversation history)
     */
    async askAI(args) {
        const model = Cast.toString(args.MODEL);
        const text = Cast.toString(args.TEXT);

        this.lastError = null;

        try {
            const response = await this._callAPI('/llm/prompt', {
                model: model,
                prompt: text,
                temperature: this.temperature,
                max_tokens: this.maxTokens
            });

            this.lastResponse = response.text || '';
            return this.lastResponse;
        } catch (error) {
            this.lastError = error.message;
            this.lastResponse = '';
            console.error('[LLM Extension] Error:', error);
        }
    }

    /**
     * Chat with AI (maintains conversation history)
     */
    async chatWithAI(args) {
        const model = Cast.toString(args.MODEL);
        const text = Cast.toString(args.TEXT);

        this.lastError = null;

        // Get or create conversation history
        if (!this.conversations.has(model)) {
            this.conversations.set(model, []);
        }
        const history = this.conversations.get(model);

        // Add user message to history
        history.push({ role: 'user', content: text });

        try {
            const response = await this._callAPI('/llm/chat', {
                model: model,
                messages: history,
                temperature: this.temperature,
                max_tokens: this.maxTokens
            });

            const assistantMessage = response.text || '';

            // Add assistant response to history
            history.push({ role: 'assistant', content: assistantMessage });

            this.lastResponse = assistantMessage;
            return this.lastResponse;
        } catch (error) {
            this.lastError = error.message;
            this.lastResponse = '';
            console.error('[LLM Extension] Error:', error);

            // Remove failed user message from history
            history.pop();
        }
    }

    /**
     * Classify text using AI models
     */
    async classifyWithAI(args) {
        const text = Cast.toString(args.TEXT);
        const model = Cast.toString(args.MODEL);

        this.lastError = null;

        try {
            const response = await this._callAPI('/llm/classify', {
                text: text,
                classification_type: model
            });

            this.lastResponse = response.classification || '';
            return this.lastResponse;
        } catch (error) {
            this.lastError = error.message;
            this.lastResponse = '';
            console.error('[LLM Extension] Error:', error);
            return '';
        }
    }

    /**
     * Generate image from text prompt
     */
    async generateImage(args) {
        const prompt = Cast.toString(args.PROMPT);

        this.lastError = null;

        try {
            const response = await this._callAPI('/llm/generate-image', {
                prompt: prompt
            });

            // Store image URL in response
            this.lastResponse = response.image_url || '';

            // Could also set as sprite costume here
            console.log('[LLM Extension] Generated image:', this.lastResponse);

            return this.lastResponse;
        } catch (error) {
            this.lastError = error.message;
            this.lastResponse = '';
            console.error('[LLM Extension] Error:', error);
        }
    }

    /**
     * Get the last AI response
     */
    getResponse() {
        return this.lastResponse;
    }

    /**
     * Set temperature (creativity/randomness)
     */
    setTemperature(args) {
        const temp = Cast.toNumber(args.TEMP);
        this.temperature = Math.max(0, Math.min(2, temp)); // Clamp to 0-2
    }

    /**
     * Set maximum tokens (response length)
     */
    setMaxTokens(args) {
        const tokens = Cast.toNumber(args.TOKENS);
        this.maxTokens = Math.max(1, Math.min(4000, tokens)); // Clamp to 1-4000
    }

    /**
     * Clear conversation history
     */
    clearConversation(args) {
        const model = Cast.toString(args.MODEL);
        this.conversations.delete(model);
    }

    /**
     * Check if last request had an error
     */
    hasError() {
        return this.lastError !== null;
    }

    /**
     * Get error message
     */
    getError() {
        return this.lastError || '';
    }

    /**
     * Internal: Call backend API
     */
    async _callAPI(endpoint, data) {
        // In browser environment, use fetch
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

        // In Node.js environment, simulate response (for testing)
        console.log('[LLM Extension] Simulated API call:', endpoint, data);

        // Return mock responses for testing
        if (endpoint === '/llm/prompt' || endpoint === '/llm/chat') {
            return {
                text: this._generateMockResponse(data.prompt || data.messages)
            };
        } else if (endpoint === '/llm/classify') {
            return {
                classification: this._getMockClassification(data.text, data.classification_type)
            };
        } else if (endpoint === '/llm/generate-image') {
            return {
                image_url: 'https://example.com/generated-image.png'
            };
        }

        throw new Error('Unknown endpoint');
    }

    /**
     * Generate mock response for testing (when backend is not available)
     */
    _generateMockResponse(input) {
        const prompt = typeof input === 'string' ? input : input[input.length - 1]?.content || '';

        const responses = [
            `I understand you said: "${prompt}". This is a simulated AI response.`,
            `That's an interesting question about "${prompt}". Let me think about that...`,
            `Based on your input "${prompt}", here's what I can tell you...`,
            `Great question! Regarding "${prompt}", I would say...`
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }

    /**
     * Get mock classification for testing
     */
    _getMockClassification(text, type) {
        const classifications = {
            sentiment: ['positive', 'negative', 'neutral'],
            topic: ['technology', 'science', 'entertainment', 'sports', 'general'],
            language: ['english', 'spanish', 'french', 'german', 'chinese'],
            toxicity: ['safe', 'potentially toxic', 'toxic'],
            emotion: ['happy', 'sad', 'angry', 'surprised', 'neutral']
        };

        const options = classifications[type] || ['unknown'];
        return options[Math.floor(Math.random() * options.length)];
    }
}

module.exports = Scratch3LLMBlocks;
