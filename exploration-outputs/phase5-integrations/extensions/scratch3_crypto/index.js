const BlockType = require('../../extension-support/block-type');
const ArgumentType = require('../../extension-support/argument-type');
const Cast = require('../../util/cast');

/**
 * Scratch3 Cryptocurrency Extension
 * Provides brand token economy and blockchain integration
 */
class Scratch3CryptoBlocks {
    constructor(runtime) {
        this.runtime = runtime;

        // Backend API endpoint
        this.apiEndpoint = process.env.SCRATCH_CRYPTO_API || 'http://localhost:3000/api';

        // User wallet info
        this.walletAddress = null;
        this.balances = new Map(); // coin -> balance

        // Transaction history
        this.transactions = [];
        this.lastTransactionId = null;

        // Events
        this.balanceChangeListeners = new Map();

        // Initialize with mock user (in production, would come from auth)
        this.userId = 'user_' + Math.random().toString(36).substr(2, 9);

        // Pre-fetch balances
        this._fetchBalances();
    }

    getInfo() {
        return {
            id: 'crypto',
            name: 'Tokens & NFTs',
            color1: '#FFB84D',
            color2: '#E6A043',
            color3: '#CC8939',
            blocks: [
                '---', // Separator
                {
                    blockType: BlockType.LABEL,
                    text: 'Balances'
                },
                {
                    opcode: 'getBalance',
                    blockType: BlockType.REPORTER,
                    text: '[COIN] balance',
                    arguments: {
                        COIN: {
                            type: ArgumentType.STRING,
                            menu: 'coins',
                            defaultValue: 'SCRATCH'
                        }
                    }
                },
                {
                    opcode: 'getAllBalances',
                    blockType: BlockType.REPORTER,
                    text: 'all balances'
                },
                {
                    opcode: 'refreshBalances',
                    blockType: BlockType.COMMAND,
                    text: 'refresh balances'
                },

                '---',
                {
                    blockType: BlockType.LABEL,
                    text: 'Transactions'
                },
                {
                    opcode: 'awardTokens',
                    blockType: BlockType.COMMAND,
                    text: 'award [AMOUNT] [COIN] to player',
                    arguments: {
                        AMOUNT: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 10
                        },
                        COIN: {
                            type: ArgumentType.STRING,
                            menu: 'coins',
                            defaultValue: 'SCRATCH'
                        }
                    }
                },
                {
                    opcode: 'spendTokens',
                    blockType: BlockType.COMMAND,
                    text: 'spend [AMOUNT] [COIN]',
                    arguments: {
                        AMOUNT: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 10
                        },
                        COIN: {
                            type: ArgumentType.STRING,
                            menu: 'coins',
                            defaultValue: 'SCRATCH'
                        }
                    }
                },
                {
                    opcode: 'transferTokens',
                    blockType: BlockType.COMMAND,
                    text: 'transfer [AMOUNT] [COIN] to [ADDRESS]',
                    arguments: {
                        AMOUNT: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 10
                        },
                        COIN: {
                            type: ArgumentType.STRING,
                            menu: 'coins',
                            defaultValue: 'SCRATCH'
                        },
                        ADDRESS: {
                            type: ArgumentType.STRING,
                            defaultValue: '0x...'
                        }
                    }
                },

                '---',
                {
                    blockType: BlockType.LABEL,
                    text: 'Purchases'
                },
                {
                    opcode: 'buyItem',
                    blockType: BlockType.COMMAND,
                    text: 'buy [ITEM] for [AMOUNT] [COIN]',
                    arguments: {
                        ITEM: {
                            type: ArgumentType.STRING,
                            defaultValue: 'power-up'
                        },
                        AMOUNT: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 100
                        },
                        COIN: {
                            type: ArgumentType.STRING,
                            menu: 'coins',
                            defaultValue: 'SCRATCH'
                        }
                    }
                },
                {
                    opcode: 'hasEnoughTokens',
                    blockType: BlockType.BOOLEAN,
                    text: 'has [AMOUNT] [COIN]?',
                    arguments: {
                        AMOUNT: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 100
                        },
                        COIN: {
                            type: ArgumentType.STRING,
                            menu: 'coins',
                            defaultValue: 'SCRATCH'
                        }
                    }
                },

                '---',
                {
                    blockType: BlockType.LABEL,
                    text: 'NFTs'
                },
                {
                    opcode: 'mintNFT',
                    blockType: BlockType.COMMAND,
                    text: 'mint NFT [NAME] with metadata [JSON]',
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: 'My Achievement'
                        },
                        JSON: {
                            type: ArgumentType.STRING,
                            defaultValue: '{"level": 10}'
                        }
                    }
                },
                {
                    opcode: 'mintSpriteAsNFT',
                    blockType: BlockType.COMMAND,
                    text: 'mint current sprite as NFT'
                },
                {
                    opcode: 'getNFTCount',
                    blockType: BlockType.REPORTER,
                    text: 'number of NFTs owned'
                },

                '---',
                {
                    blockType: BlockType.LABEL,
                    text: 'Exchange'
                },
                {
                    opcode: 'getTokenPrice',
                    blockType: BlockType.REPORTER,
                    text: '[COIN] price in [CURRENCY]',
                    arguments: {
                        COIN: {
                            type: ArgumentType.STRING,
                            menu: 'coins',
                            defaultValue: 'SCRATCH'
                        },
                        CURRENCY: {
                            type: ArgumentType.STRING,
                            menu: 'currencies',
                            defaultValue: 'USD'
                        }
                    }
                },
                {
                    opcode: 'convertTokens',
                    blockType: BlockType.REPORTER,
                    text: '[AMOUNT] [COIN] in [CURRENCY]',
                    arguments: {
                        AMOUNT: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 100
                        },
                        COIN: {
                            type: ArgumentType.STRING,
                            menu: 'coins',
                            defaultValue: 'SCRATCH'
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
                    text: 'Wallet'
                },
                {
                    opcode: 'getWalletAddress',
                    blockType: BlockType.REPORTER,
                    text: 'wallet address'
                },
                {
                    opcode: 'getLastTransaction',
                    blockType: BlockType.REPORTER,
                    text: 'last transaction ID'
                }
            ],
            menus: {
                coins: {
                    acceptReporters: true,
                    items: [
                        { text: 'SCRATCH Token', value: 'SCRATCH' },
                        { text: 'Game Coins', value: 'COINS' },
                        { text: 'Gems', value: 'GEMS' },
                        { text: 'Gold', value: 'GOLD' }
                    ]
                },
                currencies: {
                    acceptReporters: true,
                    items: [
                        { text: 'USD', value: 'USD' },
                        { text: 'EUR', value: 'EUR' },
                        { text: 'ETH', value: 'ETH' },
                        { text: 'BTC', value: 'BTC' }
                    ]
                }
            }
        };
    }

    /**
     * Get balance for a specific coin
     */
    getBalance(args) {
        const coin = Cast.toString(args.COIN);
        return this.balances.get(coin) || 0;
    }

    /**
     * Get all balances as JSON
     */
    getAllBalances() {
        const balances = {};
        for (const [coin, balance] of this.balances.entries()) {
            balances[coin] = balance;
        }
        return JSON.stringify(balances);
    }

    /**
     * Refresh balances from backend
     */
    async refreshBalances() {
        await this._fetchBalances();
    }

    /**
     * Award tokens to player (game reward)
     */
    async awardTokens(args) {
        const amount = Cast.toNumber(args.AMOUNT);
        const coin = Cast.toString(args.COIN);

        if (amount <= 0) {
            console.error('[Crypto Extension] Invalid amount:', amount);
            return;
        }

        try {
            const response = await this._callAPI('/crypto/award', {
                user_id: this.userId,
                coin: coin,
                amount: amount,
                reason: 'game_reward'
            });

            // Update local balance
            const currentBalance = this.balances.get(coin) || 0;
            this.balances.set(coin, currentBalance + amount);

            this.lastTransactionId = response.transaction_id;
            this.transactions.push(response);

            // Trigger balance change event
            this._notifyBalanceChange(coin);

            console.log('[Crypto Extension] Awarded', amount, coin);
        } catch (error) {
            console.error('[Crypto Extension] Error awarding tokens:', error);
        }
    }

    /**
     * Spend tokens
     */
    async spendTokens(args) {
        const amount = Cast.toNumber(args.AMOUNT);
        const coin = Cast.toString(args.COIN);

        if (amount <= 0) {
            console.error('[Crypto Extension] Invalid amount:', amount);
            return;
        }

        const currentBalance = this.balances.get(coin) || 0;
        if (currentBalance < amount) {
            console.error('[Crypto Extension] Insufficient balance');
            return;
        }

        try {
            const response = await this._callAPI('/crypto/spend', {
                user_id: this.userId,
                coin: coin,
                amount: amount
            });

            // Update local balance
            this.balances.set(coin, currentBalance - amount);

            this.lastTransactionId = response.transaction_id;
            this.transactions.push(response);

            // Trigger balance change event
            this._notifyBalanceChange(coin);

            console.log('[Crypto Extension] Spent', amount, coin);
        } catch (error) {
            console.error('[Crypto Extension] Error spending tokens:', error);
        }
    }

    /**
     * Transfer tokens to another wallet
     */
    async transferTokens(args) {
        const amount = Cast.toNumber(args.AMOUNT);
        const coin = Cast.toString(args.COIN);
        const address = Cast.toString(args.ADDRESS);

        if (amount <= 0) {
            console.error('[Crypto Extension] Invalid amount:', amount);
            return;
        }

        const currentBalance = this.balances.get(coin) || 0;
        if (currentBalance < amount) {
            console.error('[Crypto Extension] Insufficient balance');
            return;
        }

        try {
            const response = await this._callAPI('/crypto/transfer', {
                from_user: this.userId,
                to_address: address,
                coin: coin,
                amount: amount
            });

            // Update local balance
            this.balances.set(coin, currentBalance - amount);

            this.lastTransactionId = response.transaction_id;
            this.transactions.push(response);

            // Trigger balance change event
            this._notifyBalanceChange(coin);

            console.log('[Crypto Extension] Transferred', amount, coin, 'to', address);
        } catch (error) {
            console.error('[Crypto Extension] Error transferring tokens:', error);
        }
    }

    /**
     * Buy item with tokens
     */
    async buyItem(args) {
        const item = Cast.toString(args.ITEM);
        const amount = Cast.toNumber(args.AMOUNT);
        const coin = Cast.toString(args.COIN);

        const currentBalance = this.balances.get(coin) || 0;
        if (currentBalance < amount) {
            console.error('[Crypto Extension] Insufficient balance to buy', item);
            return;
        }

        try {
            const response = await this._callAPI('/crypto/buy-item', {
                user_id: this.userId,
                item: item,
                price: amount,
                coin: coin
            });

            // Update local balance
            this.balances.set(coin, currentBalance - amount);

            this.lastTransactionId = response.transaction_id;
            this.transactions.push(response);

            // Trigger balance change event
            this._notifyBalanceChange(coin);

            console.log('[Crypto Extension] Purchased', item, 'for', amount, coin);
        } catch (error) {
            console.error('[Crypto Extension] Error buying item:', error);
        }
    }

    /**
     * Check if player has enough tokens
     */
    hasEnoughTokens(args) {
        const amount = Cast.toNumber(args.AMOUNT);
        const coin = Cast.toString(args.COIN);

        const currentBalance = this.balances.get(coin) || 0;
        return currentBalance >= amount;
    }

    /**
     * Mint NFT with custom metadata
     */
    async mintNFT(args) {
        const name = Cast.toString(args.NAME);
        const jsonStr = Cast.toString(args.JSON);

        let metadata;
        try {
            metadata = JSON.parse(jsonStr);
        } catch (e) {
            metadata = { description: jsonStr };
        }

        try {
            const response = await this._callAPI('/crypto/mint-nft', {
                user_id: this.userId,
                name: name,
                metadata: metadata
            });

            this.lastTransactionId = response.transaction_id;
            console.log('[Crypto Extension] Minted NFT:', name, response.token_id);
        } catch (error) {
            console.error('[Crypto Extension] Error minting NFT:', error);
        }
    }

    /**
     * Mint current sprite as NFT
     */
    async mintSpriteAsNFT() {
        // Get current sprite info from runtime
        const target = this.runtime.getEditingTarget();
        if (!target) {
            console.error('[Crypto Extension] No sprite selected');
            return;
        }

        const metadata = {
            name: target.getName(),
            costume: target.getCurrentCostume()?.name || 'unknown',
            position: { x: target.x, y: target.y },
            direction: target.direction,
            size: target.size
        };

        try {
            const response = await this._callAPI('/crypto/mint-nft', {
                user_id: this.userId,
                name: `Sprite: ${target.getName()}`,
                metadata: metadata,
                sprite_data: metadata
            });

            this.lastTransactionId = response.transaction_id;
            console.log('[Crypto Extension] Minted sprite NFT:', response.token_id);
        } catch (error) {
            console.error('[Crypto Extension] Error minting sprite NFT:', error);
        }
    }

    /**
     * Get number of NFTs owned
     */
    async getNFTCount() {
        try {
            const response = await this._callAPI('/crypto/nft-count', {
                user_id: this.userId
            });

            return response.count || 0;
        } catch (error) {
            console.error('[Crypto Extension] Error getting NFT count:', error);
            return 0;
        }
    }

    /**
     * Get token price in fiat currency
     */
    async getTokenPrice(args) {
        const coin = Cast.toString(args.COIN);
        const currency = Cast.toString(args.CURRENCY);

        try {
            const response = await this._callAPI('/crypto/price', {
                coin: coin,
                currency: currency
            });

            return response.price || 0;
        } catch (error) {
            console.error('[Crypto Extension] Error getting price:', error);
            return 0;
        }
    }

    /**
     * Convert tokens to fiat equivalent
     */
    async convertTokens(args) {
        const amount = Cast.toNumber(args.AMOUNT);
        const coin = Cast.toString(args.COIN);
        const currency = Cast.toString(args.CURRENCY);

        try {
            const response = await this._callAPI('/crypto/convert', {
                amount: amount,
                coin: coin,
                currency: currency
            });

            return response.converted_amount || 0;
        } catch (error) {
            console.error('[Crypto Extension] Error converting:', error);
            return 0;
        }
    }

    /**
     * Get wallet address
     */
    getWalletAddress() {
        return this.walletAddress || 'Not connected';
    }

    /**
     * Get last transaction ID
     */
    getLastTransaction() {
        return this.lastTransactionId || '';
    }

    /**
     * Internal: Fetch balances from backend
     */
    async _fetchBalances() {
        try {
            const response = await this._callAPI('/crypto/balances', {
                user_id: this.userId
            });

            if (response.balances) {
                for (const [coin, balance] of Object.entries(response.balances)) {
                    this.balances.set(coin, balance);
                }
            }

            if (response.wallet_address) {
                this.walletAddress = response.wallet_address;
            }

            console.log('[Crypto Extension] Balances refreshed');
        } catch (error) {
            console.error('[Crypto Extension] Error fetching balances:', error);

            // Set default balances for testing
            this.balances.set('SCRATCH', 1000);
            this.balances.set('COINS', 500);
            this.balances.set('GEMS', 50);
            this.balances.set('GOLD', 100);
        }
    }

    /**
     * Internal: Notify balance change
     */
    _notifyBalanceChange(coin) {
        // Could trigger hat blocks or events here
        console.log('[Crypto Extension] Balance changed:', coin, this.balances.get(coin));
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
                console.error('[Crypto Extension] API error:', error);
                throw error;
            }
        }

        // Mock response for testing
        console.log('[Crypto Extension] Mock API call:', endpoint, data);

        if (endpoint === '/crypto/balances') {
            return {
                balances: {
                    SCRATCH: 1000,
                    COINS: 500,
                    GEMS: 50,
                    GOLD: 100
                },
                wallet_address: '0x' + Math.random().toString(16).substr(2, 40)
            };
        } else if (endpoint === '/crypto/award' || endpoint === '/crypto/spend' ||
                   endpoint === '/crypto/transfer' || endpoint === '/crypto/buy-item') {
            return {
                transaction_id: 'tx_' + Date.now(),
                success: true
            };
        } else if (endpoint === '/crypto/mint-nft') {
            return {
                transaction_id: 'tx_' + Date.now(),
                token_id: 'nft_' + Date.now(),
                success: true
            };
        } else if (endpoint === '/crypto/nft-count') {
            return { count: 5 };
        } else if (endpoint === '/crypto/price') {
            return { price: 0.10 }; // $0.10 per SCRATCH token
        } else if (endpoint === '/crypto/convert') {
            return { converted_amount: data.amount * 0.10 };
        }

        return {};
    }
}

module.exports = Scratch3CryptoBlocks;
