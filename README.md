# NinjaInco

NinjaInco is a confidential on-chain ninja game built with Solidity, Foundry, Next.js, RainbowKit, and Inco Lightning.

The game uses Inco's confidential computation to keep selected gameplay information private, including encrypted technique choices and duel-related values, while player identity and progression remain readable on-chain.

## Tech Stack

- Solidity
- Foundry
- Inco Lightning
- Next.js
- TypeScript
- RainbowKit
- Wagmi
- Viem

## Project Structure

````text
ninjainco/
├── contracts/      # Solidity contracts, tests and deployment scripts
├── frontend/       # Next.js frontend
├── package.json    # Workspace configuration
└── README.md


### Getting Started

git clone https://github.com/akeemahmid/NinjaInco.git
cd NinjaInco


### Install Dependencies

```bash
npm install
````

### Environment Setup

cp contracts/.env.sample contracts/.env

Then edit contracts/.env:

```
PRIVATE_KEY_BASE_SEPOLIA=YOUR_PRIVATE_KEY
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

NINJAINCO_REGISTRY_ADDRESS=0x09c96Ec6583B3D0E2082827E31FcEA05D97AC72A
NINJAINCO_DUEL_ADDRESS=0x2D413eDd739704CE7193Bc08e626f0C0Ec8e47e4
```

### Start Development

```bash
# Start the frontend
npm run dev

# Compile contracts
npm run contracts:compile

# Run contract tests
npm run contracts:test
```

### How it works

Player connects wallet
↓
Player registers
↓
Player selects a secret technique
↓
Technique is encrypted
↓
Encrypted value is submitted on-chain
↓
Inco performs confidential computation
↓
Duel outcome is determined
↓
Player progression is updated
↓
Promotion eligibility is evaluated

## Learn More

- [Inco Documentation](https://docs.inco.org)
- [Foundry Documentation](https://book.getfoundry.sh)
