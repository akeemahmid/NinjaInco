# NinjaInco

NinjaInco is a confidential on-chain ninja game built with Solidity, Foundry, Next.js, RainbowKit, Wagmi, Viem, and Inco Lightning.

The game combines traditional on-chain game mechanics with confidential computation. Players train their ninja, choose secret techniques, enter challenges, fight Sensei opponents, reveal confidential battle results, and progress through the ninja ranks.

Sensitive gameplay information such as technique choices, duel outcomes, training progress, challenge wins, player attributes, and promotion eligibility can remain encrypted while Inco handles confidential computation and attested decryption.

The goal is to demonstrate how confidential computation can be used to build gameplay that cannot be fully observed or manipulated from public blockchain state.

---

## Features

- Confidential ninja attributes
- Confidential secret techniques
- Confidential training progress
- Confidential challenge wins
- Confidential player and Sensei technique choices
- Confidential duel outcomes
- Attested decryption through Inco Lightning
- On-chain rank progression
- Academy → Chunin → Jonin progression
- Technique and challenge rank gating
- Explicit duel settlement
- Confidential promotion eligibility
- Attestation-based promotion finalization
- Player villages
- Responsive ninja-themed frontend

---

## Tech Stack

### Smart Contracts

- Solidity
- Foundry
- OpenZeppelin
- Inco Lightning

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- RainbowKit
- Wagmi
- Viem

### Blockchain

- Base Sepolia
- Chain ID: `84532`

---

# How NinjaInco Works

The game is divided into several major stages:

```text
Register Ninja
      ↓
Choose Village
      ↓
View Profile
      ↓
Train
      ↓
Select Technique
      ↓
Select Challenge
      ↓
Enter Duel
      ↓
Confidential Battle Computation
      ↓
Reveal Duel Result
      ↓
Settle Duel
      ↓
Confidential Progression Updated
      ↓
Meet Promotion Requirements
      ↓
Evaluate Promotion
      ↓
Inco Attestation
      ↓
Finalize Promotion
      ↓
Rank Up
```

---

# How to Play

## 1. Connect Your Wallet

Open the NinjaInco application and connect a wallet using RainbowKit.

The game currently runs on Base Sepolia.

Make sure the wallet is connected to:

```text
Network: Base Sepolia
Chain ID: 84532
```

The wallet needs Base Sepolia ETH to perform transactions and interact with the confidential game contracts.

---

## 2. Register Your Ninja

Before playing, register your ninja.

During registration you select your village and secret technique.

Supported villages include:

- Ember
- Mist
- Storm
- Stone

Your village becomes part of your public ninja identity.

Your secret technique is stored through the confidential system and can only be revealed through the appropriate wallet-authorized decryption flow.

---

## 3. View Your Profile

The Profile page contains your ninja identity and confidential information.

The profile can display:

- Ninja name
- Wallet address
- Village
- Current rank
- Power
- Speed
- Focus
- Luck
- Chakra
- Starting Style
- Secret Technique

Confidential attributes and secret techniques are not simply displayed as public blockchain data.

The application uses Inco's confidential handles and attested decryption to reveal protected information when authorized.

---

# 4. Train Your Ninja

Visit the Training page to perform training actions.

Each training action creates a unique non-zero `bytes32` action ID.

The V2 progression system records training confidentially:

```text
TrainingV2
    ↓
ProgressionV2
    ↓
Encrypted training counter
```

Training contributes toward promotion eligibility.

### Important

The current V2 training system tracks confidential training progress separately from the legacy V1 attribute-training contract.

Therefore, V2 training increases the V2 confidential training counter used for promotion, but does not currently modify the V1 confidential attributes.

This is an intentional architectural limitation of the current MVP and can be addressed in a future V2.1 version with an atomic training coordinator.

---

# 5. Choose a Technique

Before entering a duel, choose one of the techniques available to your ninja.

Technique availability depends on:

- Current rank
- Technique requirements
- Whether the technique is enabled

The authoritative Technique Registry determines which techniques exist and which ranks can use them.

Your selected technique is encrypted before being submitted to the DuelV2 contract.

The public blockchain therefore does not simply expose your chosen technique as ordinary plaintext game state.

---

# 6. Choose a Challenge

Challenges are managed through the Challenge Registry.

Each challenge contains information such as:

- Challenge ID
- Name
- Required rank
- Opponent tier
- Technique pool
- Difficulty
- Enabled status

The frontend determines whether your current V2 rank is allowed to enter the challenge.

For example:

```text
Academy
   ↓
Academy challenges

Chunin
   ↓
Academy + Chunin challenges

Jonin
   ↓
Higher-level challenges
```

---

# 7. Enter a Duel

After selecting a challenge and technique, start the duel.

The flow is:

```text
Select Challenge
      ↓
Select Technique
      ↓
Encrypt Technique
      ↓
DuelV2.duel(...)
      ↓
Duel ID Created
```

The duel contract stores confidential information including:

- Player technique
- Sensei technique
- Duel outcome

The Sensei's technique is not simply provided to the frontend before the battle.

Instead, it is part of the confidential duel computation.

---

# 8. Reveal the Duel Result

After the duel transaction confirms, retrieve the confidential result.

Inco's attested decryption flow is used to reveal:

```text
Your Technique
Sensei Technique
Battle Result
```

The result can be:

```text
WIN
DRAW
LOSS
```

The technique IDs returned from the confidential result are matched against the authoritative Technique Registry so the frontend can display the actual technique names.

For example:

```text
Your Technique:
Shadow Strike

Sensei Technique:
Lightning Fang

Battle Result:
WIN
```

The frontend does not calculate the winner itself.

The authoritative result comes from the confidential contract state.

---

# 9. Settle the Duel

After the confidential result has been successfully retrieved and displayed, the player can explicitly settle the duel.

Settlement updates the confidential progression system.

Only an actual player victory increases the confidential challenge-win counter.

```text
Player Win
    ↓
Challenge Wins + 1
```

Losses and draws do not increase the win counter.

Settlement is replay-protected, meaning the same duel cannot be settled multiple times.

---

# 10. Track Your Progress

The Progression page allows the player to reveal their confidential progression.

The progression system tracks:

- Training count
- Challenge wins
- Current rank

Training and wins remain cumulative.

They are not reset after promotion.

---

# Rank Progression

NinjaInco currently has three V2 ranks:

```text
Academy
   ↓
Chunin
   ↓
Jonin
```

The current promotion requirements are:

### Academy → Chunin

```text
Training: 2+
Wins:     3+
```

### Chunin → Jonin

```text
Training: 4+
Wins:     6+
```

These values are cumulative.

For example, if you reach Chunin with:

```text
Training = 2
Wins = 3
```

you need at least:

```text
2 additional training actions
3 additional wins
```

to reach the Jonin requirements.

Wins do not have to be consecutive.

Training actions do not have to be consecutive.

Losses and draws do not reset your progress.

---

# Promotion System

Promotion is intentionally separated into multiple steps.

## Step 1 — Evaluate Promotion

The player explicitly calls:

```text
evaluatePromotion()
```

The ProgressionV2 contract evaluates the player's confidential progression and creates an encrypted eligibility result.

The frontend does not calculate promotion eligibility itself.

---

## Step 2 — Attested Decryption

The frontend retrieves the pending encrypted eligibility handle.

It then uses Inco Lightning's attested decryption mechanism:

```text
Encrypted Eligibility
        ↓
Inco attestedDecrypt()
        ↓
Plaintext Eligibility
        +
Covalidator Signatures
```

The player can only proceed when a valid attestation has been obtained.

---

## Step 3 — Finalize Promotion

After a valid attestation is available, the player explicitly confirms:

```text
finalizePromotion(...)
```

The PromotionV2 contract verifies the attestation and advances the player's rank.

For example:

```text
Academy
   ↓
Chunin
```

or:

```text
Chunin
   ↓
Jonin
```

Rank skipping is not allowed.

Jonin cannot be promoted further.

---

# How Inco Is Integrated

Inco Lightning is one of the core technologies behind NinjaInco.

Instead of storing every piece of game state publicly, NinjaInco uses confidential computation for gameplay information that should not be visible to other players.

The integration can be divided into two major concepts:

## 1. Encrypted State

Sensitive game values are represented using encrypted handles.

Examples include:

```text
Encrypted Attributes
Encrypted Secret Technique
Encrypted Training Count
Encrypted Challenge Wins
Encrypted Player Technique
Encrypted Sensei Technique
Encrypted Duel Outcome
Encrypted Promotion Eligibility
```

The contracts can operate on confidential values without exposing their plaintext values publicly.

---

## 2. Attested Decryption

When the player needs to see protected information, the frontend requests an attested decryption through Inco Lightning.

Conceptually:

```text
Encrypted Handle
      ↓
Inco Lightning
      ↓
Attested Decryption
      ↓
Plaintext Value
      +
Covalidator Signatures
```

The application then uses the returned attestation when interacting with contracts that require proof of the decrypted value.

This is especially important for promotion.

The frontend does not simply say:

```text
"I have 3 wins, therefore I am eligible."
```

Instead:

```text
Encrypted Progression
        ↓
ProgressionV2
        ↓
Encrypted Eligibility
        ↓
Inco Attested Decryption
        ↓
Verified Eligibility
        ↓
PromotionV2
        ↓
Rank Advancement
```

This makes promotion eligibility part of the confidential computation flow rather than a frontend-only decision.

---

# Confidential Duel Architecture

The duel system is one of the main demonstrations of Inco's confidential computation.

The simplified flow is:

```text
Player chooses technique
        ↓
Technique encrypted for DuelV2
        ↓
DuelV2 receives encrypted choice
        ↓
Sensei technique is selected
        ↓
Confidential computation determines outcome
        ↓
Encrypted result stored
        ↓
Player requests attested decryption
        ↓
Player sees:
    - Player technique
    - Sensei technique
    - Result
        ↓
Player settles duel
        ↓
ProgressionV2 updates confidential wins
```

The player therefore does not need to reveal their strategy as ordinary public blockchain data before the battle is resolved.

---

# V2 Smart Contract Architecture

The current V2 architecture is divided into specialized contracts:

```text
TechniqueRegistry
        │
        ├──────────────┐
        │              │
ChallengeRegistry   DuelV2
        │              │
        └──────┬───────┘
               │
          ProgressionV2
          │           │
          │           │
     TrainingV2   PromotionV2
```

### TechniqueRegistry

Stores authoritative technique metadata and rank requirements.

### ChallengeRegistry

Stores challenge metadata, difficulty, opponent tiers, and rank requirements.

### ProgressionV2

Maintains confidential training and win progression and the public rank.

### TrainingV2

Records valid training actions into the V2 confidential progression system.

### DuelV2

Creates duels, stores encrypted technique choices and outcomes, and settles completed duels.

### PromotionV2

Handles promotion evaluation, attestation verification, and rank advancement.

---

# Frontend Structure

The player-facing application is divided into separate pages:

```text
/
├── Academy Hub
│
├── /profile
│   └── Ninja Profile
│
├── /training
│   └── Training Dojo
│
├── /duel
│   └── Challenge + Technique → Duel → Result → Settlement
│
├── /progression
│   └── Rank + Confidential Progress
│
├── /techniques
│   └── Techniques + Unlocks
│
├── /challenges
│   └── Challenges + Unlocks
│
└── /promotion
    └── Promotion → Attestation → Finalization
```

The older `/v2` route remains as a compatibility redirect to the main Academy Hub.

---

# Project Structure

```text
ninjainco/
├── contracts/
│   ├── src/
│   ├── test/
│   └── script/
│
├── frontend/
│   ├── app/
│   │   ├── profile/
│   │   ├── training/
│   │   ├── duel/
│   │   ├── progression/
│   │   ├── techniques/
│   │   ├── challenges/
│   │   └── promotion/
│   │
│   ├── components/
│   ├── hooks/
│   └── lib/
│
├── package.json
└── README.md
```

---

# Getting Started

## Clone the Repository

```bash
git clone https://github.com/akeemahmid/NinjaInco.git
cd NinjaInco
```

## Install Dependencies

```bash
npm install
```

---

# Environment Setup

Create the contracts environment file:

```bash
cp contracts/.env.sample contracts/.env
```

Then configure the required deployment variables:

```env
PRIVATE_KEY_BASE_SEPOLIA=YOUR_PRIVATE_KEY
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

For frontend development, configure the required V2 contract addresses and network settings in:

```text
frontend/.env.local
```

Do not commit private keys, RPC secrets, or other sensitive credentials.

---

# Run the Project

## Start the Frontend

```bash
npm run dev
```

The application will normally be available at:

```text
http://localhost:3000
```

## Compile Contracts

```bash
npm run contracts:compile
```

## Run Contract Tests

```bash
npm run contracts:test
```

---

# Testing

The V2 contracts currently have automated coverage for:

- Training
- Duel creation
- Duel settlement
- Confidential progression
- Promotion
- Rank transitions
- Replay protection
- Access control

Current verification:

```text
forge build
forge test
```

The project currently passes:

```text
65 tests
0 failures
```

The frontend production build can be verified with:

```bash
npm run build
```

---

# Security and Confidentiality Notes

NinjaInco does not treat the frontend as the authoritative source of confidential gameplay state.

Important gameplay decisions are enforced by the smart contracts.

The frontend:

- Does not calculate duel outcomes.
- Does not fabricate confidential progression.
- Does not fabricate promotion eligibility.
- Does not fabricate Inco attestations.
- Does not automatically submit transactions.
- Uses wallet confirmation for state-changing operations.
- Uses attested decryption for protected information.

The current MVP intentionally reuses the existing V1 identity, village, attribute, and secret-technique systems alongside the V2 gameplay architecture.

---

# Current MVP Limitation

The V2 Training contract currently records confidential V2 training progress but does not update the separate V1 confidential attribute system.

Therefore:

```text
V2 Training
    ↓
V2 confidential training count
```

rather than:

```text
V2 Training
    ↓
V2 training count
+
V1 confidential attributes
```

A future V2.1 version can introduce an authorized atomic training coordinator that updates both systems safely with replay protection.

---

# Future Improvements

Potential future improvements include:

- Atomic V2 training and attribute progression
- More villages
- More techniques
- More challenge tiers
- Additional Sensei opponents
- More complex confidential battle mechanics
- Equipment and inventory
- Ninja missions
- Multiplayer battles
- Tournament mode
- Leaderboards using selectively revealed information
- More sophisticated confidential attributes
- Deterministic or contract-authoritative attribute initialization
- Additional rank tiers

---

# Learn More

- [Inco Documentation](https://docs.inco.org)
- [Foundry Documentation](https://book.getfoundry.sh)
- [Next.js Documentation](https://nextjs.org/docs)
- [Base Documentation](https://docs.base.org)

---
