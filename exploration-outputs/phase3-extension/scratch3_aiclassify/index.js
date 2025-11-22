const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const formatMessage = require('format-message');

/**
 * Icon for the AI Classify extension
 * Using a simple base64-encoded SVG representing AI/brain
 */
const blockIconURI = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+QUkgSWNvbjwvdGl0bGU+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTUiIGZpbGw9IiM0Qzk3RkYiLz48Y2lyY2xlIGN4PSIxNSIgY3k9IjE1IiByPSIyIiBmaWxsPSJ3aGl0ZSIvPjxjaXJjbGUgY3g9IjI1IiBjeT0iMTUiIHI9IjIiIGZpbGw9IndoaXRlIi8+PHBhdGggZD0iTSAxMiAyNSBRIDIwIDMwIDI4IDI1IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48L3N2Zz4=';

/**
 * Host for the AI Classify extension blocks
 * @param {Runtime} runtime - the runtime instantiating this block package.
 * @constructor
 */
class Scratch3AIClassifyBlocks {
    constructor(runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo() {
        return {
            id: 'aiclassify',
            name: formatMessage({
                id: 'aiclassify.categoryName',
                default: 'AI Classify',
                description: 'Name of the AI classification extension'
            }),
            blockIconURI: blockIconURI,
            blocks: [
                {
                    opcode: 'classifyText',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'aiclassify.classifyText',
                        default: 'classify [TEXT]',
                        description: 'Classify the given text'
                    }),
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'aiclassify.defaultText',
                                default: 'Hello world',
                                description: 'Default text to classify'
                            })
                        }
                    }
                },
                {
                    opcode: 'classifyTextWithCategory',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'aiclassify.classifyTextWithCategory',
                        default: 'classify [TEXT] as [CATEGORY]',
                        description: 'Classify text into a specific category'
                    }),
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'aiclassify.defaultText',
                                default: 'Hello world',
                                description: 'Default text to classify'
                            })
                        },
                        CATEGORY: {
                            type: ArgumentType.STRING,
                            menu: 'categories',
                            defaultValue: 'sentiment'
                        }
                    }
                }
            ],
            menus: {
                categories: {
                    acceptReporters: true,
                    items: [
                        {
                            text: formatMessage({
                                id: 'aiclassify.sentiment',
                                default: 'sentiment',
                                description: 'Sentiment analysis category'
                            }),
                            value: 'sentiment'
                        },
                        {
                            text: formatMessage({
                                id: 'aiclassify.topic',
                                default: 'topic',
                                description: 'Topic classification category'
                            }),
                            value: 'topic'
                        },
                        {
                            text: formatMessage({
                                id: 'aiclassify.language',
                                default: 'language',
                                description: 'Language detection category'
                            }),
                            value: 'language'
                        }
                    ]
                }
            }
        };
    }

    /**
     * Classify the given text (simple version).
     * @param {object} args - the block arguments.
     * @param {string} args.TEXT - the text to classify.
     * @returns {string} A placeholder classification result.
     */
    classifyText(args) {
        const text = String(args.TEXT);

        // Placeholder implementation - returns a mock classification
        // In a real implementation, this would call an AI service

        if (text.length === 0) {
            return 'empty';
        }

        // Simple sentiment analysis based on keywords (placeholder)
        const positiveWords = ['good', 'great', 'happy', 'excellent', 'love', 'awesome'];
        const negativeWords = ['bad', 'sad', 'terrible', 'hate', 'awful', 'poor'];

        const lowerText = text.toLowerCase();
        const hasPositive = positiveWords.some(word => lowerText.includes(word));
        const hasNegative = negativeWords.some(word => lowerText.includes(word));

        if (hasPositive && !hasNegative) {
            return 'positive';
        } else if (hasNegative && !hasPositive) {
            return 'negative';
        } else if (hasPositive && hasNegative) {
            return 'mixed';
        } else {
            return 'neutral';
        }
    }

    /**
     * Classify the given text with a specific category.
     * @param {object} args - the block arguments.
     * @param {string} args.TEXT - the text to classify.
     * @param {string} args.CATEGORY - the classification category.
     * @returns {string} A placeholder classification result.
     */
    classifyTextWithCategory(args) {
        const text = String(args.TEXT);
        const category = String(args.CATEGORY);

        if (text.length === 0) {
            return 'empty';
        }

        // Placeholder implementations for different categories
        switch (category) {
            case 'sentiment':
                return this.classifyText(args);

            case 'topic':
                // Simple topic detection based on keywords
                const lowerText = text.toLowerCase();
                if (lowerText.includes('code') || lowerText.includes('program')) {
                    return 'technology';
                } else if (lowerText.includes('cat') || lowerText.includes('dog')) {
                    return 'animals';
                } else if (lowerText.includes('game') || lowerText.includes('play')) {
                    return 'entertainment';
                } else {
                    return 'general';
                }

            case 'language':
                // Very simple language detection (placeholder)
                if (/[\u4e00-\u9fa5]/.test(text)) {
                    return 'chinese';
                } else if (/[\u0600-\u06FF]/.test(text)) {
                    return 'arabic';
                } else if (/[а-яА-Я]/.test(text)) {
                    return 'russian';
                } else {
                    return 'english';
                }

            default:
                return 'unknown category';
        }
    }
}

module.exports = Scratch3AIClassifyBlocks;
