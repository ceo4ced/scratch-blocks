#!/usr/bin/env node
/**
 * Scratch Integrations Backend Server
 * Handles LLM, n8n, crypto, and payment APIs securely
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

// Environment variables (would be in .env file)
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// API Keys (loaded from environment in production)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-...';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'sk-ant-...';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_...';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 'paypal-client-id';
const PAYPAL_SECRET = process.env.PAYPAL_SECRET || 'paypal-secret';

// Initialize Express app
const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ============================================================================
// In-Memory Database (replace with PostgreSQL/MongoDB in production)
// ============================================================================

const db = {
    users: new Map(),
    balances: new Map(),
    transactions: new Map(),
    nfts: new Map(),
    payments: new Map(),
    subscriptions: new Map(),
    workflows: new Map(),
    conversations: new Map()
};

// Initialize test user
db.balances.set('user_test', {
    SCRATCH: 1000,
    COINS: 500,
    GEMS: 50,
    GOLD: 100
});

// ============================================================================
// Utility Functions
// ============================================================================

function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

function getUserBalance(userId, coin) {
    const userBalances = db.balances.get(userId) || {};
    return userBalances[coin] || 0;
}

function setUserBalance(userId, coin, amount) {
    let userBalances = db.balances.get(userId);
    if (!userBalances) {
        userBalances = {};
        db.balances.set(userId, userBalances);
    }
    userBalances[coin] = amount;
}

function adjustBalance(userId, coin, delta) {
    const current = getUserBalance(userId, coin);
    setUserBalance(userId, coin, current + delta);
}

// ============================================================================
// LLM API Routes
// ============================================================================

app.post('/api/llm/prompt', async (req, res) => {
    try {
        const { model, prompt, temperature = 0.7, max_tokens = 1000 } = req.body;

        console.log('[LLM] Prompt request:', { model, prompt: prompt.substring(0, 50) });

        // Route to appropriate AI provider
        let response;

        if (model.startsWith('gpt-')) {
            // OpenAI
            response = await callOpenAI(model, prompt, temperature, max_tokens);
        } else if (model.startsWith('claude-')) {
            // Anthropic
            response = await callAnthropic(model, prompt, temperature, max_tokens);
        } else if (model === 'ollama' || model === 'lmstudio') {
            // Local models
            response = await callLocalModel(model, prompt, temperature, max_tokens);
        } else {
            // Default: mock response
            response = {
                text: `[Mock ${model} response] You said: "${prompt}". This is a simulated AI response for testing.`
            };
        }

        res.json(response);
    } catch (error) {
        console.error('[LLM] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/llm/chat', async (req, res) => {
    try {
        const { model, messages, temperature = 0.7, max_tokens = 1000 } = req.body;

        console.log('[LLM] Chat request:', { model, messageCount: messages.length });

        // For chat, we need to handle message history
        let response;

        if (model.startsWith('gpt-')) {
            response = await callOpenAIChat(model, messages, temperature, max_tokens);
        } else if (model.startsWith('claude-')) {
            response = await callAnthropicChat(model, messages, temperature, max_tokens);
        } else {
            // Mock response
            const lastMessage = messages[messages.length - 1]?.content || '';
            response = {
                text: `[Mock chat response] Continuing conversation... You said: "${lastMessage}"`
            };
        }

        res.json(response);
    } catch (error) {
        console.error('[LLM] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/llm/classify', async (req, res) => {
    try {
        const { text, classification_type } = req.body;

        console.log('[LLM] Classify request:', { text: text.substring(0, 30), classification_type });

        // Simple keyword-based classification (would use AI in production)
        let classification;

        if (classification_type === 'sentiment') {
            classification = classifySentiment(text);
        } else if (classification_type === 'topic') {
            classification = classifyTopic(text);
        } else if (classification_type === 'language') {
            classification = 'english'; // Would use language detection library
        } else {
            classification = 'unknown';
        }

        res.json({ classification });
    } catch (error) {
        console.error('[LLM] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/llm/generate-image', async (req, res) => {
    try {
        const { prompt } = req.body;

        console.log('[LLM] Image generation:', prompt);

        // Would call DALL-E or Stable Diffusion in production
        const mockImageUrl = `https://via.placeholder.com/512x512.png?text=${encodeURIComponent(prompt)}`;

        res.json({ image_url: mockImageUrl });
    } catch (error) {
        console.error('[LLM] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// n8n Workflow API Routes
// ============================================================================

app.post('/api/n8n/trigger', async (req, res) => {
    try {
        const { workflow_name, data } = req.body;

        console.log('[n8n] Trigger workflow:', workflow_name);

        const executionId = generateId('exec');

        // Store workflow execution
        db.workflows.set(executionId, {
            workflow_name,
            data,
            status: 'running',
            started_at: Date.now()
        });

        // Simulate async execution (would trigger real n8n webhook in production)
        setTimeout(() => {
            const workflow = db.workflows.get(executionId);
            if (workflow) {
                workflow.status = 'completed';
                workflow.result = { success: true, processed_data: data };
                workflow.completed_at = Date.now();
            }
        }, 2000);

        res.json({
            execution_id: executionId,
            status: 'running'
        });
    } catch (error) {
        console.error('[n8n] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/n8n/result', async (req, res) => {
    try {
        const { workflow_name } = req.body;

        // Find most recent execution for this workflow
        let latestExecution = null;
        for (const [id, workflow] of db.workflows.entries()) {
            if (workflow.workflow_name === workflow_name) {
                if (!latestExecution || workflow.started_at > latestExecution.started_at) {
                    latestExecution = { id, ...workflow };
                }
            }
        }

        if (!latestExecution) {
            return res.status(404).json({ error: 'Workflow not found' });
        }

        res.json({
            execution_id: latestExecution.id,
            status: latestExecution.status,
            result: latestExecution.result
        });
    } catch (error) {
        console.error('[n8n] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/n8n/game-data', async (req, res) => {
    try {
        const { type, value } = req.body;

        console.log('[n8n] Game data received:', type, value);

        // Would send to configured n8n webhook in production
        res.json({ success: true });
    } catch (error) {
        console.error('[n8n] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// Cryptocurrency API Routes
// ============================================================================

app.post('/api/crypto/balances', async (req, res) => {
    try {
        const { user_id } = req.body;

        const balances = db.balances.get(user_id) || {
            SCRATCH: 1000,
            COINS: 500,
            GEMS: 50,
            GOLD: 100
        };

        // Generate wallet address (would be from actual blockchain wallet)
        const walletAddress = '0x' + crypto.randomBytes(20).toString('hex');

        res.json({
            balances,
            wallet_address: walletAddress
        });
    } catch (error) {
        console.error('[Crypto] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/crypto/award', async (req, res) => {
    try {
        const { user_id, coin, amount, reason } = req.body;

        console.log('[Crypto] Award:', user_id, amount, coin, reason);

        adjustBalance(user_id, coin, amount);

        const transactionId = generateId('tx');
        db.transactions.set(transactionId, {
            type: 'award',
            user_id,
            coin,
            amount,
            reason,
            timestamp: Date.now()
        });

        res.json({
            transaction_id: transactionId,
            success: true
        });
    } catch (error) {
        console.error('[Crypto] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/crypto/spend', async (req, res) => {
    try {
        const { user_id, coin, amount } = req.body;

        const balance = getUserBalance(user_id, coin);
        if (balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        adjustBalance(user_id, coin, -amount);

        const transactionId = generateId('tx');
        db.transactions.set(transactionId, {
            type: 'spend',
            user_id,
            coin,
            amount,
            timestamp: Date.now()
        });

        res.json({
            transaction_id: transactionId,
            success: true
        });
    } catch (error) {
        console.error('[Crypto] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/crypto/transfer', async (req, res) => {
    try {
        const { from_user, to_address, coin, amount } = req.body;

        const balance = getUserBalance(from_user, coin);
        if (balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        adjustBalance(from_user, coin, -amount);

        const transactionId = generateId('tx');
        db.transactions.set(transactionId, {
            type: 'transfer',
            from_user,
            to_address,
            coin,
            amount,
            timestamp: Date.now()
        });

        console.log('[Crypto] Transfer:', from_user, '->', to_address, amount, coin);

        res.json({
            transaction_id: transactionId,
            success: true
        });
    } catch (error) {
        console.error('[Crypto] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/crypto/buy-item', async (req, res) => {
    try {
        const { user_id, item, price, coin } = req.body;

        const balance = getUserBalance(user_id, coin);
        if (balance < price) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        adjustBalance(user_id, coin, -price);

        const transactionId = generateId('tx');
        db.transactions.set(transactionId, {
            type: 'purchase',
            user_id,
            item,
            price,
            coin,
            timestamp: Date.now()
        });

        console.log('[Crypto] Purchase:', user_id, 'bought', item);

        res.json({
            transaction_id: transactionId,
            success: true
        });
    } catch (error) {
        console.error('[Crypto] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/crypto/mint-nft', async (req, res) => {
    try {
        const { user_id, name, metadata } = req.body;

        const tokenId = generateId('nft');
        db.nfts.set(tokenId, {
            owner: user_id,
            name,
            metadata,
            minted_at: Date.now()
        });

        const transactionId = generateId('tx');

        console.log('[Crypto] NFT minted:', tokenId, name);

        res.json({
            transaction_id: transactionId,
            token_id: tokenId,
            success: true
        });
    } catch (error) {
        console.error('[Crypto] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/crypto/nft-count', async (req, res) => {
    try {
        const { user_id } = req.body;

        let count = 0;
        for (const nft of db.nfts.values()) {
            if (nft.owner === user_id) count++;
        }

        res.json({ count });
    } catch (error) {
        console.error('[Crypto] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/crypto/price', async (req, res) => {
    try {
        const { coin, currency } = req.body;

        // Mock prices (would fetch from DEX/CEX in production)
        const prices = {
            SCRATCH: { USD: 0.10, EUR: 0.09, ETH: 0.00005, BTC: 0.000002 },
            COINS: { USD: 0.01, EUR: 0.009, ETH: 0.000005, BTC: 0.0000002 },
            GEMS: { USD: 1.00, EUR: 0.90, ETH: 0.0005, BTC: 0.00002 },
            GOLD: { USD: 0.50, EUR: 0.45, ETH: 0.00025, BTC: 0.00001 }
        };

        const price = prices[coin]?.[currency] || 0;

        res.json({ price });
    } catch (error) {
        console.error('[Crypto] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/crypto/convert', async (req, res) => {
    try {
        const { amount, coin, currency } = req.body;

        // Get price and convert
        const prices = {
            SCRATCH: { USD: 0.10 },
            COINS: { USD: 0.01 },
            GEMS: { USD: 1.00 },
            GOLD: { USD: 0.50 }
        };

        const price = prices[coin]?.[currency] || 0;
        const convertedAmount = amount * price;

        res.json({ converted_amount: convertedAmount });
    } catch (error) {
        console.error('[Crypto] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// Payment API Routes
// ============================================================================

app.post('/api/payment/create', async (req, res) => {
    try {
        const { user_id, amount, currency, description } = req.body;

        const paymentId = generateId('pi');

        db.payments.set(paymentId, {
            user_id,
            amount,
            currency,
            description,
            status: 'pending',
            created_at: Date.now()
        });

        const checkoutUrl = `https://checkout.example.com/${paymentId}`;

        console.log('[Payment] Created:', paymentId, amount, currency);

        res.json({
            payment_id: paymentId,
            checkout_url: checkoutUrl,
            status: 'pending'
        });
    } catch (error) {
        console.error('[Payment] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/payment/buy-item', async (req, res) => {
    try {
        const { user_id, item, price, currency } = req.body;

        const paymentId = generateId('pi');

        // Simulate successful payment (would integrate with Stripe/PayPal)
        db.payments.set(paymentId, {
            user_id,
            item,
            price,
            currency,
            status: 'succeeded',
            created_at: Date.now()
        });

        console.log('[Payment] Item purchased:', item, price, currency);

        res.json({
            payment_id: paymentId,
            status: 'succeeded'
        });
    } catch (error) {
        console.error('[Payment] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/payment/buy-game', async (req, res) => {
    try {
        const { user_id, game_name, price, currency } = req.body;

        const paymentId = generateId('pi');

        db.payments.set(paymentId, {
            user_id,
            game: game_name,
            price,
            currency,
            status: 'succeeded',
            created_at: Date.now()
        });

        console.log('[Payment] Game purchased:', game_name, price, currency);

        res.json({
            payment_id: paymentId,
            status: 'succeeded'
        });
    } catch (error) {
        console.error('[Payment] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/payment/subscribe', async (req, res) => {
    try {
        const { user_id, plan } = req.body;

        const subscriptionId = generateId('sub');

        db.subscriptions.set(subscriptionId, {
            user_id,
            plan,
            status: 'active',
            started_at: Date.now()
        });

        console.log('[Payment] Subscription created:', plan);

        res.json({
            subscription_id: subscriptionId,
            status: 'active'
        });
    } catch (error) {
        console.error('[Payment] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/payment/cancel-subscription', async (req, res) => {
    try {
        const { subscription_id } = req.body;

        const subscription = db.subscriptions.get(subscription_id);
        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        subscription.status = 'canceled';
        subscription.canceled_at = Date.now();

        console.log('[Payment] Subscription canceled:', subscription_id);

        res.json({ success: true });
    } catch (error) {
        console.error('[Payment] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Webhook handlers (for Stripe/PayPal)
app.post('/api/payment/webhook/stripe', async (req, res) => {
    console.log('[Payment] Stripe webhook received');
    // Would verify signature and process events
    res.json({ received: true });
});

app.post('/api/payment/webhook/paypal', async (req, res) => {
    console.log('[Payment] PayPal webhook received');
    // Would verify signature and process events
    res.json({ received: true });
});

// ============================================================================
// AI Provider Helper Functions
// ============================================================================

async function callOpenAI(model, prompt, temperature, maxTokens) {
    // Would use OpenAI SDK in production
    console.log('[OpenAI] Mock call:', model);
    return {
        text: `[OpenAI ${model}] ${prompt.substring(0, 50)}... (simulated response)`
    };
}

async function callOpenAIChat(model, messages, temperature, maxTokens) {
    console.log('[OpenAI] Mock chat call:', model);
    const lastMsg = messages[messages.length - 1]?.content || '';
    return {
        text: `[OpenAI ${model} chat] Responding to: "${lastMsg.substring(0, 30)}..."`
    };
}

async function callAnthropic(model, prompt, temperature, maxTokens) {
    console.log('[Anthropic] Mock call:', model);
    return {
        text: `[Anthropic ${model}] ${prompt.substring(0, 50)}... (simulated response)`
    };
}

async function callAnthropicChat(model, messages, temperature, maxTokens) {
    console.log('[Anthropic] Mock chat call:', model);
    const lastMsg = messages[messages.length - 1]?.content || '';
    return {
        text: `[Anthropic ${model} chat] Responding to: "${lastMsg.substring(0, 30)}..."`
    };
}

async function callLocalModel(model, prompt, temperature, maxTokens) {
    console.log('[Local Model] Mock call:', model);
    return {
        text: `[${model}] ${prompt.substring(0, 50)}... (simulated local response)`
    };
}

function classifySentiment(text) {
    const lowerText = text.toLowerCase();
    const positiveWords = ['good', 'great', 'happy', 'excellent', 'love', 'awesome', 'amazing', 'wonderful'];
    const negativeWords = ['bad', 'sad', 'terrible', 'hate', 'awful', 'poor', 'horrible'];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of positiveWords) {
        if (lowerText.includes(word)) positiveCount++;
    }
    for (const word of negativeWords) {
        if (lowerText.includes(word)) negativeCount++;
    }

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    if (positiveCount > 0 && negativeCount > 0) return 'mixed';
    return 'neutral';
}

function classifyTopic(text) {
    const lowerText = text.toLowerCase();

    if (lowerText.match(/code|programming|software|computer|tech/)) return 'technology';
    if (lowerText.match(/dog|cat|animal|bird|fish/)) return 'animals';
    if (lowerText.match(/movie|music|game|entertainment|fun/)) return 'entertainment';
    if (lowerText.match(/sport|football|basketball|soccer/)) return 'sports';

    return 'general';
}

// ============================================================================
// Health & Status Routes
// ============================================================================

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: Date.now(),
        uptime: process.uptime()
    });
});

app.get('/stats', (req, res) => {
    res.json({
        users: db.users.size,
        transactions: db.transactions.size,
        nfts: db.nfts.size,
        payments: db.payments.size,
        subscriptions: db.subscriptions.size,
        workflows: db.workflows.size
    });
});

// ============================================================================
// Start Server
// ============================================================================

app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🚀 Scratch Integrations Backend Server');
    console.log('='.repeat(60));
    console.log(`📍 Server running on: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log('');
    console.log('📡 Endpoints:');
    console.log('  - LLM:     /api/llm/*');
    console.log('  - n8n:     /api/n8n/*');
    console.log('  - Crypto:  /api/crypto/*');
    console.log('  - Payment: /api/payment/*');
    console.log('');
    console.log('💡 Health check: http://localhost:${PORT}/health');
    console.log('📊 Statistics:   http://localhost:${PORT}/stats');
    console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n🛑 SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 SIGINT received, shutting down gracefully...');
    process.exit(0);
});

module.exports = app; // For testing
