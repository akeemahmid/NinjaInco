# ninjainco

A full-stack NinjaInco game built with Foundry, Next.js, RainbowKit, and Inco Lightning.

NinjaInco uses Inco's TEE-backed confidential handles for encrypted techniques, attributes, duel outcomes, experience, and promotion eligibility. Public identity and progression data remain readable on-chain.


## Project Structure

```
ninjainco/
├── contracts/     # Solidity smart contracts (Foundry)
├── frontend/            # Next.js frontend with RainbowKit
└── package.json         # Workspace configuration
```

## Getting Started

### Install Dependencies

```bash
npm install
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

## Learn More

- [Inco Documentation](https://docs.inco.org)
- [Foundry Documentation](https://book.getfoundry.sh)
