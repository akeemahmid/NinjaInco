# NinjaInco Contracts

Foundry contracts for NinjaInco's confidential player progression game on Inco Lightning.

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) installed
- [Docker](https://docs.docker.com/get-docker/) installed (for the local node)
- [Node.js](https://nodejs.org/) >= 18

## Setup

### 1. Install dependencies
```sh
npm install
```

### 2. Configure environment variables
```sh
cp .env.sample .env
```
`.env` ships with the well-known Anvil key (`PRIVATE_KEY_ANVIL`) for local use. Before deploying to a live network, fill in `PRIVATE_KEY_BASE_SEPOLIA` / `BASE_SEPOLIA_RPC_URL` (and `PRIVATE_KEY_BASE` / `BASE_RPC_URL` for mainnet).

### 3. Compile
```sh
npm run compile   # forge build
```

### 4. Run tests
```sh
npm run test      # forge test -vvv
```

## Deploy

Each `deploy:*` script reads the matching key from `.env` automatically — `PRIVATE_KEY_ANVIL`, `PRIVATE_KEY_BASE_SEPOLIA`, or `PRIVATE_KEY_BASE`, selected by the target chain — so no extra flags are needed.

**Local (Inco Anvil node)** — start the node in one terminal, then deploy in another:
```sh
npm run node            # docker compose up — Inco anvil + covalidator
npm run deploy:ninja:local
npm run deploy:attributes:local
npm run deploy:duel:local
npm run deploy:promotion:local
```

**Base Sepolia (testnet):**
```sh
npm run deploy:ninja:testnet
npm run deploy:attributes:testnet
npm run deploy:duel:testnet
npm run deploy:promotion:testnet
```

**Base Mainnet:**
```sh
npm run deploy:ninja:mainnet
npm run deploy:attributes:mainnet
npm run deploy:duel:mainnet
npm run deploy:promotion:mainnet
```

The NinjaInco deployment scripts deploy the registry, confidential attributes, duel, and promotion contracts. Deploy the duel before promotion so the promotion contract can be configured as its authorized experience reader.

## Project Structure

```
contracts/
├── src/                          # Solidity source files
│   ├── NinjaIncoGame.sol
│   ├── NinjaIncoAttributes.sol
│   ├── NinjaIncoDuel.sol
│   └── NinjaIncoPromotion.sol
├── test/                         # Foundry tests
├── script/                       # Deployment scripts
│   ├── DeployNinjaInco.s.sol
│   ├── DeployNinjaIncoAttributes.s.sol
│   ├── DeployNinjaIncoDuel.s.sol
│   └── DeployNinjaIncoPromotion.s.sol
├── foundry.toml                  # Foundry configuration (incl. rpc_endpoints)
├── remappings.txt                # Import remappings
├── .env.sample                   # Environment variable template
└── docker-compose.yaml           # Local Inco node (anvil + covalidator)
```

## Features

- Confidential player registration and encrypted techniques
- Confidential attributes, training, duels, and promotion eligibility
- Foundry test suite using Inco's `IncoTest` helpers
- Forge Script deployment to local node, Base Sepolia, and Base Mainnet
- Local node with Docker Compose
