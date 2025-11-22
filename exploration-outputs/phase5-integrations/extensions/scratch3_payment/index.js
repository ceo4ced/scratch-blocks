const BlockType = require('../../extension-support/block-type');
const ArgumentType = require('../../extension-support/argument-type');
const Cast = require('../../util/cast');

/**
 * Scratch3 Payment Extension
 * Provides Stripe and PayPal integration for monetization
 */
class Scratch3PaymentBlocks {
    constructor(runtime) {
        this.runtime = runtime;

        // Backend API endpoint
        this.apiEndpoint = process.env.SCRATCH_PAYMENT_API || 'http://localhost:3000/api';

        // Payment state
        this.payments = new Map(); // payment_id -> payment data
        this.subscriptions = new Map(); // sub_id -> subscription data
        this.lastPaymentId = null;
        this.lastPaymentStatus = null;

        // User info
        this.userId = 'user_' + Math.random().toString(36).substr(2, 9);
        this.customerId = null; // Stripe/PayPal customer ID

        // Revenue tracking
        this.totalRevenue = 0;
        this.purchases = [];
    }

    getInfo() {
        return {
            id: 'payment',
            name: 'Payments',
            color1: '#00D924',
            color2: '#00B51E',
            color3: '#009A19',
            blocks: [
                '---',
                {
                    blockType: BlockType.LABEL,
                    text: 'One-Time Payments'
                },
                {
                    opcode: 'createPayment',
                    blockType: BlockType.COMMAND,
                    text: 'create payment for [AMOUNT] [CURRENCY]',
                    arguments: {
                        AMOUNT: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 9.99
                        },
                        CURRENCY: {
                            type: ArgumentType.STRING,
                            menu: 'currencies',
                            defaultValue: 'USD'
                        }
                    }
                },
                {
                    opcode: 'buyItem',
                    blockType: BlockType.COMMAND,
                    text: 'buy [ITEM] for [PRICE] [CURRENCY]',
                    arguments: {
                        ITEM: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Power-Up Pack'
                        },
                        PRICE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 4.99
                        },
                        CURRENCY: {
                            type: ArgumentType.STRING,
                            menu: 'currencies',
                            defaultValue: 'USD'
                        }
                    }
                },
                {
                    opcode: 'buyGame',
                    blockType: BlockType.COMMAND,
                    text: 'buy game [NAME] for [PRICE] [CURRENCY]',
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Premium Adventure'
                        },
                        PRICE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 14.99
                        },
                        CURRENCY: {
                            type: ArgumentType.STRING,
                            menu: 'currencies',
                            defaultValue: 'USD'
                        }
                    }
                },

                '---',
                {
                    blockType: BlockType.LABEL,
                    text: 'Subscriptions'
                },
                {
                    opcode: 'subscribe',
                    blockType: BlockType.COMMAND,
                    text: 'subscribe to [PLAN]',
                    arguments: {
                        PLAN: {
                            type: ArgumentType.STRING,
                            menu: 'plans',
                            defaultValue: 'premium'
                        }
                    }
                },
                {
                    opcode: 'cancelSubscription',
                    blockType: BlockType.COMMAND,
                    text: 'cancel subscription'
                },
                {
                    opcode: 'isSubscribed',
                    blockType: BlockType.BOOLEAN,
                    text: 'subscribed to [PLAN]?',
                    arguments: {
                        PLAN: {
                            type: ArgumentType.STRING,
                            menu: 'plans',
                            defaultValue: 'premium'
                        }
                    }
                },
                {
                    opcode: 'getSubscriptionStatus',
                    blockType: BlockType.REPORTER,
                    text: 'subscription status'
                },

                '---',
                {
                    blockType: BlockType.LABEL,
                    text: 'Payment Status'
                },
                {
                    opcode: 'getPaymentStatus',
                    blockType: BlockType.REPORTER,
                    text: 'payment status'
                },
                {
                    opcode: 'paymentSucceeded',
                    blockType: BlockType.BOOLEAN,
                    text: 'payment succeeded?'
                },
                {
                    opcode: 'paymentFailed',
                    blockType: BlockType.BOOLEAN,
                    text: 'payment failed?'
                },
                {
                    opcode: 'getLastPaymentId',
                    blockType: BlockType.REPORTER,
                    text: 'last payment ID'
                },

                '---',
                {
                    blockType: BlockType.LABEL,
                    text: 'Payment Methods'
                },
                {
                    opcode: 'setPaymentMethod',
                    blockType: BlockType.COMMAND,
                    text: 'use [METHOD] for payment',
                    arguments: {
                        METHOD: {
                            type: ArgumentType.STRING,
                            menu: 'methods',
                            defaultValue: 'stripe'
                        }
                    }
                },
                {
                    opcode: 'openCheckout',
                    blockType: BlockType.COMMAND,
                    text: 'open checkout page'
                },

                '---',
                {
                    blockType: BlockType.LABEL,
                    text: 'Revenue & Analytics'
                },
                {
                    opcode: 'getTotalRevenue',
                    blockType: BlockType.REPORTER,
                    text: 'total revenue'
                },
                {
                    opcode: 'getPurchaseCount',
                    blockType: BlockType.REPORTER,
                    text: 'number of purchases'
                },
                {
                    opcode: 'hasPurchased',
                    blockType: BlockType.BOOLEAN,
                    text: 'purchased [ITEM]?',
                    arguments: {
                        ITEM: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Power-Up Pack'
                        }
                    }
                }
            ],
            menus: {
                currencies: {
                    acceptReporters: true,
                    items: [
                        { text: 'USD ($)', value: 'USD' },
                        { text: 'EUR (€)', value: 'EUR' },
                        { text: 'GBP (£)', value: 'GBP' },
                        { text: 'JPY (¥)', value: 'JPY' },
                        { text: 'CAD ($)', value: 'CAD' },
                        { text: 'AUD ($)', value: 'AUD' }
                    ]
                },
                plans: {
                    acceptReporters: true,
                    items: [
                        { text: 'Free', value: 'free' },
                        { text: 'Premium ($4.99/mo)', value: 'premium' },
                        { text: 'Pro ($9.99/mo)', value: 'pro' },
                        { text: 'Enterprise (Custom)', value: 'enterprise' }
                    ]
                },
                methods: {
                    acceptReporters: true,
                    items: [
                        { text: 'Stripe', value: 'stripe' },
                        { text: 'PayPal', value: 'paypal' },
                        { text: 'Apple Pay', value: 'apple_pay' },
                        { text: 'Google Pay', value: 'google_pay' }
                    ]
                }
            }
        };
    }

    /**
     * Create a payment intent
     */
    async createPayment(args) {
        const amount = Cast.toNumber(args.AMOUNT);
        const currency = Cast.toString(args.CURRENCY);

        if (amount <= 0) {
            console.error('[Payment Extension] Invalid amount:', amount);
            return;
        }

        try {
            const response = await this._callAPI('/payment/create', {
                user_id: this.userId,
                amount: amount,
                currency: currency,
                description: 'Payment via Scratch game'
            });

            this.lastPaymentId = response.payment_id;
            this.lastPaymentStatus = 'pending';

            this.payments.set(this.lastPaymentId, {
                amount: amount,
                currency: currency,
                status: 'pending',
                created_at: Date.now()
            });

            console.log('[Payment Extension] Payment created:', this.lastPaymentId);

            // In a real implementation, this would open a payment modal
            if (response.checkout_url) {
                console.log('[Payment Extension] Checkout URL:', response.checkout_url);
            }
        } catch (error) {
            console.error('[Payment Extension] Error creating payment:', error);
            this.lastPaymentStatus = 'failed';
        }
    }

    /**
     * Buy an item
     */
    async buyItem(args) {
        const item = Cast.toString(args.ITEM);
        const price = Cast.toNumber(args.PRICE);
        const currency = Cast.toString(args.CURRENCY);

        if (price <= 0) {
            console.error('[Payment Extension] Invalid price:', price);
            return;
        }

        try {
            const response = await this._callAPI('/payment/buy-item', {
                user_id: this.userId,
                item: item,
                price: price,
                currency: currency
            });

            this.lastPaymentId = response.payment_id;
            this.lastPaymentStatus = response.status;

            if (response.status === 'succeeded') {
                this.purchases.push({
                    item: item,
                    price: price,
                    currency: currency,
                    purchased_at: Date.now()
                });

                this.totalRevenue += price;
                console.log('[Payment Extension] Purchased:', item);
            }
        } catch (error) {
            console.error('[Payment Extension] Error buying item:', error);
            this.lastPaymentStatus = 'failed';
        }
    }

    /**
     * Buy a game
     */
    async buyGame(args) {
        const name = Cast.toString(args.NAME);
        const price = Cast.toNumber(args.PRICE);
        const currency = Cast.toString(args.CURRENCY);

        if (price <= 0) {
            console.error('[Payment Extension] Invalid price:', price);
            return;
        }

        try {
            const response = await this._callAPI('/payment/buy-game', {
                user_id: this.userId,
                game_name: name,
                price: price,
                currency: currency
            });

            this.lastPaymentId = response.payment_id;
            this.lastPaymentStatus = response.status;

            if (response.status === 'succeeded') {
                this.purchases.push({
                    item: 'Game: ' + name,
                    price: price,
                    currency: currency,
                    purchased_at: Date.now()
                });

                this.totalRevenue += price;
                console.log('[Payment Extension] Purchased game:', name);
            }
        } catch (error) {
            console.error('[Payment Extension] Error buying game:', error);
            this.lastPaymentStatus = 'failed';
        }
    }

    /**
     * Subscribe to a plan
     */
    async subscribe(args) {
        const plan = Cast.toString(args.PLAN);

        if (plan === 'free') {
            console.log('[Payment Extension] Free plan selected');
            return;
        }

        try {
            const response = await this._callAPI('/payment/subscribe', {
                user_id: this.userId,
                plan: plan
            });

            const subscriptionId = response.subscription_id;
            this.subscriptions.set(plan, {
                id: subscriptionId,
                plan: plan,
                status: 'active',
                started_at: Date.now()
            });

            console.log('[Payment Extension] Subscribed to:', plan);
        } catch (error) {
            console.error('[Payment Extension] Error subscribing:', error);
        }
    }

    /**
     * Cancel subscription
     */
    async cancelSubscription() {
        // Find active subscription
        let activeSubscription = null;
        for (const [plan, sub] of this.subscriptions.entries()) {
            if (sub.status === 'active') {
                activeSubscription = { plan, ...sub };
                break;
            }
        }

        if (!activeSubscription) {
            console.log('[Payment Extension] No active subscription');
            return;
        }

        try {
            await this._callAPI('/payment/cancel-subscription', {
                user_id: this.userId,
                subscription_id: activeSubscription.id
            });

            const sub = this.subscriptions.get(activeSubscription.plan);
            if (sub) {
                sub.status = 'canceled';
                sub.canceled_at = Date.now();
            }

            console.log('[Payment Extension] Subscription canceled');
        } catch (error) {
            console.error('[Payment Extension] Error canceling subscription:', error);
        }
    }

    /**
     * Check if subscribed to a plan
     */
    isSubscribed(args) {
        const plan = Cast.toString(args.PLAN);

        if (plan === 'free') return true;

        const subscription = this.subscriptions.get(plan);
        return subscription?.status === 'active';
    }

    /**
     * Get subscription status
     */
    getSubscriptionStatus() {
        for (const [plan, sub] of this.subscriptions.entries()) {
            if (sub.status === 'active') {
                return plan;
            }
        }
        return 'free';
    }

    /**
     * Get payment status
     */
    getPaymentStatus() {
        return this.lastPaymentStatus || 'none';
    }

    /**
     * Check if payment succeeded
     */
    paymentSucceeded() {
        return this.lastPaymentStatus === 'succeeded';
    }

    /**
     * Check if payment failed
     */
    paymentFailed() {
        return this.lastPaymentStatus === 'failed';
    }

    /**
     * Get last payment ID
     */
    getLastPaymentId() {
        return this.lastPaymentId || '';
    }

    /**
     * Set payment method
     */
    setPaymentMethod(args) {
        const method = Cast.toString(args.METHOD);
        this.paymentMethod = method;
        console.log('[Payment Extension] Payment method set to:', method);
    }

    /**
     * Open checkout page
     */
    openCheckout() {
        if (!this.lastPaymentId) {
            console.error('[Payment Extension] No payment to checkout');
            return;
        }

        // In a real implementation, this would open a modal or redirect
        console.log('[Payment Extension] Opening checkout for:', this.lastPaymentId);
    }

    /**
     * Get total revenue
     */
    getTotalRevenue() {
        return this.totalRevenue;
    }

    /**
     * Get purchase count
     */
    getPurchaseCount() {
        return this.purchases.length;
    }

    /**
     * Check if item was purchased
     */
    hasPurchased(args) {
        const item = Cast.toString(args.ITEM);
        return this.purchases.some(p => p.item === item || p.item === 'Game: ' + item);
    }

    /**
     * Internal: Call backend API
     */
    async _callAPI(endpoint, data) {
        if (typeof fetch !== 'undefined') {
            try {
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
            } catch (error) {
                console.error('[Payment Extension] API error:', error);
                throw error;
            }
        }

        // Mock response for testing
        console.log('[Payment Extension] Mock API call:', endpoint, data);

        if (endpoint === '/payment/create') {
            return {
                payment_id: 'pi_' + Date.now(),
                checkout_url: 'https://checkout.example.com',
                status: 'pending'
            };
        } else if (endpoint === '/payment/buy-item' || endpoint === '/payment/buy-game') {
            // Simulate successful payment
            return {
                payment_id: 'pi_' + Date.now(),
                status: 'succeeded'
            };
        } else if (endpoint === '/payment/subscribe') {
            return {
                subscription_id: 'sub_' + Date.now(),
                status: 'active'
            };
        } else if (endpoint === '/payment/cancel-subscription') {
            return {
                success: true
            };
        }

        return {};
    }
}

module.exports = Scratch3PaymentBlocks;
