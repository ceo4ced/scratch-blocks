# Phase 5: Advanced Integrations

## Overview

Phase 5 transforms Scratch into a comprehensive platform with:

✨ **AI Integration**: Access to LLMs (GPT-4, Claude, etc.)
🔄 **Workflow Automation**: n8n integration
💰 **Cryptocurrency**: Brand token economy & NFTs
💳 **Payments**: Stripe & PayPal monetization

## Quick Start

### 1. Install Dependencies

```bash
cd exploration-outputs/phase5-integrations
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Start Backend Server

```bash
npm start
```

The server will run on `http://localhost:3000`

### 4. Register Extensions in Scratch

The extensions are already registered in scratch-vm:
- `scratch3_llm` - AI Models extension
- `scratch3_n8n` - Workflows extension
- `scratch3_crypto` - Tokens & NFTs extension
- `scratch3_payment` - Payments extension

## Extensions

### 1. AI Models Extension (`llm`)

Access various AI models directly from Scratch blocks.

**Blocks:**

- `ask [MODEL] prompt [TEXT]` - Single AI prompt
- `chat with [MODEL] saying [TEXT]` - Multi-turn conversation
- `classify [TEXT] using [MODEL]` - Text classification
- `generate image from [PROMPT]` - Image generation
- `AI response` - Get last response
- `set AI creativity to [TEMP]` - Control randomness (0-2)
- `set max response length to [TOKENS]` - Control response size
- `clear conversation with [MODEL]` - Reset chat history
- `AI request failed?` - Check for errors
- `AI error message` - Get error details

**Supported Models:**

**OpenAI:**
- GPT-4 Turbo
- GPT-4
- GPT-3.5 Turbo

**Anthropic:**
- Claude Sonnet
- Claude Opus
- Claude Haiku

**Hugging Face:**
- BERT Base
- GPT-2
- T5 Base

**Local:**
- Ollama
- LM Studio

**Example Usage:**

```scratch
when flag clicked
    ask [gpt-3.5-turbo] prompt "Explain how Scratch works"
    say (AI response) for 5 seconds
```

**API Configuration:**

```javascript
// Set environment variable
SCRATCH_LLM_API=http://localhost:3000/api

// Or configure in extension
extension.apiEndpoint = 'http://your-backend.com/api';
```

### 2. Workflows Extension (`n8n`)

Integrate with n8n for powerful automation workflows.

**Blocks:**

- `trigger workflow [WEBHOOK]` - Start workflow via webhook URL
- `trigger workflow [NAME] with [DATA]` - Start with custom data
- `wait for workflow [NAME]` - Wait for completion
- `workflow [NAME] result` - Get full result
- `workflow [NAME] field [FIELD]` - Get specific field
- `workflow [NAME] complete?` - Check if done
- `workflow [NAME] failed?` - Check for errors
- `send game data [TYPE]: [VALUE]` - Send predefined data types
- `clear all workflow results` - Reset cache

**Example Usage:**

```scratch
when flag clicked
    trigger workflow [score-tracker] with {"score": 1000}
    wait for workflow [score-tracker]
    if <workflow [score-tracker] complete?> then
        say (workflow [score-tracker] field [message])
    end
```

**n8n Setup:**

1. Create workflow in n8n with webhook trigger
2. Copy webhook URL
3. Use in Scratch block
4. Workflow receives game data and processes it

**Use Cases:**

- Save high scores to Google Sheets
- Send email notifications
- Post to Discord/Slack
- Trigger external APIs
- Data analytics pipelines

### 3. Tokens & NFTs Extension (`crypto`)

Brand token economy and blockchain integration.

**Balances:**

- `[COIN] balance` - Get token balance
- `all balances` - Get all balances as JSON
- `refresh balances` - Update from backend

**Transactions:**

- `award [AMOUNT] [COIN] to player` - Grant tokens (game reward)
- `spend [AMOUNT] [COIN]` - Deduct tokens
- `transfer [AMOUNT] [COIN] to [ADDRESS]` - Send to wallet

**Purchases:**

- `buy [ITEM] for [AMOUNT] [COIN]` - Purchase with tokens
- `has [AMOUNT] [COIN]?` - Check if affordable

**NFTs:**

- `mint NFT [NAME] with metadata [JSON]` - Create NFT
- `mint current sprite as NFT` - Turn sprite into NFT
- `number of NFTs owned` - Count owned NFTs

**Exchange:**

- `[COIN] price in [CURRENCY]` - Get exchange rate
- `[AMOUNT] [COIN] in [CURRENCY]` - Convert value

**Wallet:**

- `wallet address` - Get user's wallet
- `last transaction ID` - Get latest transaction

**Supported Coins:**

- `SCRATCH` - Brand token (ERC-20)
- `COINS` - In-game currency
- `GEMS` - Premium currency
- `GOLD` - Special currency

**Example Usage:**

```scratch
when flag clicked
    if <has 100 [SCRATCH]?> then
        buy [power-up] for 100 [SCRATCH]
        say "Purchased power-up!" for 2 seconds
    else
        say "Not enough SCRATCH tokens!" for 2 seconds
    end
```

**Token Economics:**

- Earn tokens by playing games
- Spend on items, upgrades, features
- Transfer to other players
- Mint achievements as NFTs
- Trade on DEX platforms

**Blockchain Support:**

- **Development**: Mock balances (no real blockchain)
- **Testnet**: Polygon Mumbai (free testing)
- **Mainnet**: Polygon (low fees)

### 4. Payments Extension (`payment`)

Monetize games with Stripe and PayPal.

**One-Time Payments:**

- `create payment for [AMOUNT] [CURRENCY]` - Start payment
- `buy [ITEM] for [PRICE] [CURRENCY]` - Purchase item
- `buy game [NAME] for [PRICE] [CURRENCY]` - Purchase full game

**Subscriptions:**

- `subscribe to [PLAN]` - Start subscription
- `cancel subscription` - End subscription
- `subscribed to [PLAN]?` - Check status
- `subscription status` - Get current plan

**Payment Status:**

- `payment status` - Get last payment state
- `payment succeeded?` - Check if successful
- `payment failed?` - Check if failed
- `last payment ID` - Get transaction ID

**Payment Methods:**

- `use [METHOD] for payment` - Set provider
- `open checkout page` - Show payment modal

**Revenue & Analytics:**

- `total revenue` - Sum of all payments
- `number of purchases` - Count transactions
- `purchased [ITEM]?` - Check if player owns item

**Subscription Plans:**

- **Free**: Ad-supported, limited features
- **Premium ($4.99/mo)**: Ad-free, unlimited AI, bonus tokens
- **Pro ($9.99/mo)**: All premium + advanced models + API access
- **Enterprise (Custom)**: White-label, dedicated support

**Example Usage:**

```scratch
when flag clicked
    if <not <subscribed to [premium]?>> then
        say "Subscribe for ad-free experience!" for 2 seconds
        subscribe to [premium]
        wait until <payment succeeded?>
        if <payment succeeded?> then
            say "Welcome to Premium!" for 3 seconds
        end
    end
```

**Payment Flow:**

1. User clicks purchase/subscribe block
2. Backend creates payment intent
3. Checkout modal opens (Stripe/PayPal)
4. User completes payment
5. Webhook confirms payment
6. Game unlocks content
7. Receipt sent via email

**Supported Currencies:**

- USD, EUR, GBP, JPY, CAD, AUD

**Payment Methods:**

- Credit/Debit Cards (via Stripe)
- PayPal Balance
- Apple Pay
- Google Pay
- Bank Transfer (ACH)

## Backend Server

### API Endpoints

#### LLM APIs

```
POST /api/llm/prompt
POST /api/llm/chat
POST /api/llm/classify
POST /api/llm/generate-image
```

#### n8n APIs

```
POST /api/n8n/trigger
POST /api/n8n/result
POST /api/n8n/game-data
```

#### Crypto APIs

```
POST /api/crypto/balances
POST /api/crypto/award
POST /api/crypto/spend
POST /api/crypto/transfer
POST /api/crypto/buy-item
POST /api/crypto/mint-nft
POST /api/crypto/nft-count
POST /api/crypto/price
POST /api/crypto/convert
```

#### Payment APIs

```
POST /api/payment/create
POST /api/payment/buy-item
POST /api/payment/buy-game
POST /api/payment/subscribe
POST /api/payment/cancel-subscription
POST /api/payment/webhook/stripe
POST /api/payment/webhook/paypal
```

#### Health & Status

```
GET /health
GET /stats
```

### Running the Server

**Development:**

```bash
npm run dev
```

**Production:**

```bash
npm start
```

**Docker:**

```bash
docker build -t scratch-backend .
docker run -p 3000:3000 --env-file .env scratch-backend
```

**Environment Variables:**

See `.env.example` for all configuration options.

**Key Variables:**

- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `PAYPAL_CLIENT_ID` - PayPal client ID
- `BLOCKCHAIN_PRIVATE_KEY` - Wallet private key
- `N8N_API_URL` - n8n instance URL

### Security

**API Keys:**

- Never expose API keys in client code
- All API calls go through backend proxy
- Keys stored in environment variables
- Rotate keys regularly

**Authentication:**

- JWT tokens for user sessions
- API keys for project access
- Rate limiting per user/project

**Payment Security:**

- PCI-DSS compliant (via Stripe/PayPal)
- Webhook signature verification
- No card data stored
- 3D Secure support

**Blockchain Security:**

- Non-custodial wallets
- Multi-sig for large transactions
- Gas fee management
- Anti-cheat validation

## Testing

### Extension Tests

Test each extension individually:

```bash
# LLM Extension
node exploration-outputs/phase5-integrations/test_llm.js

# n8n Extension
node exploration-outputs/phase5-integrations/test_n8n.js

# Crypto Extension
node exploration-outputs/phase5-integrations/test_crypto.js

# Payment Extension
node exploration-outputs/phase5-integrations/test_payment.js
```

### Backend Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

## Deployment

### Backend Deployment

**Recommended Platforms:**

- **AWS**: ECS/Fargate for containers
- **Google Cloud**: Cloud Run for serverless
- **Heroku**: Simple deployment with add-ons
- **DigitalOcean**: App Platform or Droplets
- **Vercel**: Serverless functions (limited)

**Cost Estimate (Monthly):**

- **Small (100 users)**: $20-50
- **Medium (1,000 users)**: $100-200
- **Large (10,000 users)**: $500-1,000
- **Enterprise (100,000+ users)**: $2,000+

**Infrastructure Needs:**

- API Server: 2GB RAM minimum
- Database: PostgreSQL (managed service recommended)
- Cache: Redis (for sessions, rate limits)
- Queue: Bull/BullMQ (for async jobs)
- Storage: S3 or equivalent (for NFT images)

### Extension Deployment

Extensions are part of scratch-vm. To use:

1. **Local Development**: Already registered
2. **Scratch Website**: Need to fork and deploy scratch-gui
3. **Custom Platform**: Include extensions in your build

### Mobile Deployment

For iOS/Android apps with integrations:

1. Use Capacitor to wrap Scratch
2. Configure backend URL in app
3. Add payment plugins (RevenueCat recommended)
4. Submit to app stores

## Examples

### Example 1: AI-Powered Quiz Game

```scratch
when flag clicked
    set [score v] to 0
    ask [gpt-3.5-turbo] prompt "Generate a random trivia question"
    ask (AI response) and wait
    # Check answer logic here
    if <correct answer> then
        change [score v] by 10
        award 5 [SCRATCH] to player
    end
```

### Example 2: NFT Achievement System

```scratch
when I receive [level-complete v]
    if <[current-level v] = 10> then
        mint NFT [Level 10 Master] with metadata {"level": 10, "date": "2024"}
        say "Achievement unlocked as NFT!" for 3 seconds
    end
```

### Example 3: Subscription-Gated Content

```scratch
when flag clicked
    if <subscribed to [premium]?> then
        # Show premium content
        switch costume to [premium-skin v]
    else
        say "Subscribe to unlock premium skins!" for 3 seconds
        subscribe to [premium]
    end
```

### Example 4: Workflow Automation

```scratch
when I receive [high-score v]
    trigger workflow [leaderboard-update] with {"player": (username), "score": (score)}
    say "Score submitted to leaderboard!" for 2 seconds
```

## Monetization Strategies

### Hybrid Model (Recommended)

**Free Tier:**
- Ad-supported gameplay
- 10 AI requests/day
- Limited tokens (earn by playing)
- Basic features

**Premium Tier ($4.99/mo):**
- Ad-free
- Unlimited AI requests
- 1,000 bonus SCRATCH tokens/month
- Priority support

**Pro Tier ($9.99/mo):**
- All Premium features
- Advanced AI models (GPT-4, Claude Opus)
- 5,000 bonus SCRATCH tokens/month
- API access
- Revenue sharing

### Revenue Streams

1. **Subscriptions**: $4.99-$9.99/month
2. **Token Sales**: $1-$100 packages
3. **NFT Minting**: 100 SCRATCH per NFT
4. **Game Purchases**: $0.99-$14.99
5. **Item Sales**: $0.49-$4.99
6. **Ads**: $0.50 per user/month (free tier)

### Distribution Platforms

- **Web**: Scratch.mit.edu (custom instance)
- **Mobile**: iOS App Store, Google Play
- **Desktop**: Windows Store, Mac App Store
- **Streaming**: YouTube Playables, Netflix Games
- **Social**: Facebook Gaming, Snapchat

## Roadmap

### Phase 5.1 (Completed) ✅
- LLM extension with multiple providers
- n8n workflow automation
- Cryptocurrency & NFTs
- Payment processing

### Phase 5.2 (Next)
- [ ] Voice synthesis (TTS) blocks
- [ ] Speech recognition (STT) blocks
- [ ] Computer vision blocks
- [ ] Multi-language support

### Phase 5.3 (Future)
- [ ] Multiplayer game sync
- [ ] Leaderboards on-chain
- [ ] DAO governance
- [ ] Cross-game item transfers
- [ ] Tournament smart contracts
- [ ] Staking rewards

### Phase 5.4 (Vision)
- [ ] Fine-tuned AI models for games
- [ ] Custom model training blocks
- [ ] AR/VR integration
- [ ] Console deployment (via transpiler)
- [ ] Creator marketplace
- [ ] Revenue sharing platform

## Troubleshooting

### Backend Won't Start

**Issue**: `Error: Cannot find module 'express'`
**Fix**: Run `npm install`

**Issue**: `EADDRINUSE: address already in use`
**Fix**: Change port in `.env` or kill process on port 3000

### Extensions Not Loading

**Issue**: Extension not found
**Fix**: Ensure extensions are registered in `extension-manager.js`

**Issue**: API calls failing
**Fix**: Check backend is running and `apiEndpoint` is correct

### Payment Issues

**Issue**: Payments not processing
**Fix**: Verify Stripe/PayPal credentials in `.env`

**Issue**: Webhooks not working
**Fix**: Set up webhook endpoints in Stripe/PayPal dashboard

### Crypto Issues

**Issue**: Balances not updating
**Fix**: Call `refresh balances` block or restart backend

**Issue**: NFT minting fails
**Fix**: Check blockchain RPC URL and wallet has gas

## License

MIT License - See LICENSE file for details

## Support

- **Documentation**: See ARCHITECTURE.md for detailed design
- **Issues**: Report bugs on GitHub Issues
- **Community**: Join our Discord server
- **Email**: support@scratch-integrations.com

## Contributors

Built as part of the Scratch Exploration project (Phase 5).

Special thanks to:
- Scratch Foundation for the amazing platform
- OpenAI & Anthropic for AI APIs
- Stripe & PayPal for payment infrastructure
- n8n community for workflow automation
- Web3 developers for blockchain tools

---

**Ready to build the future of interactive games!** 🚀
