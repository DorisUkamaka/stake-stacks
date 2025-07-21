# STAKE-STACKS - Staking Platform Smart Contract

A comprehensive multi-tier staking platform built on the Stacks blockchain, offering tiered rewards, flexible lock periods, and robust administrative controls.

## 🌟 Features

### Core Functionality

- **Multi-tier Staking System** - 3 tiers with progressive rewards and lock periods
- **Flexible Rewards** - Claim rewards anytime without unstaking
- **Emergency Withdrawal** - Early unstaking with penalty system
- **Role-based Administration** - Secure multi-admin management
- **Contract Pause Mechanism** - Emergency halt functionality

### Security Features

- Comprehensive input validation
- Lock period enforcement
- Minimum stake requirements
- Emergency controls
- Role-based access control

## 📊 Staking Tiers

| Tier                | Minimum Stake | Reward Multiplier | Lock Duration           |
| ------------------- | ------------- | ----------------- | ----------------------- |
| **Bronze (Tier 1)** | 1 STX         | 1.0x              | ~1 week (1,008 blocks)  |
| **Silver (Tier 2)** | 10 STX        | 1.2x              | ~2 weeks (2,016 blocks) |
| **Gold (Tier 3)**   | 50 STX        | 1.5x              | ~4 weeks (4,032 blocks) |

### Prerequisites

- Stacks wallet (Hiro Wallet, Xverse, etc.)
- STX tokens for staking
- Access to Stacks blockchain (mainnet/testnet)

### Deployment

```bash
# Clone the repository
git clone <your-repo-url>
cd staking-platform

# Deploy using Clarinet (recommended)
clarinet deploy --testnet

# Or deploy using stacks-cli
stx deploy_contract stx-vault staking-platform.clar --testnet
```

## 📖 Usage Guide

### For Stakers

#### 1. Stake STX Tokens

```clarity
;; Stake 10 STX for 2 weeks (Tier 2)
(contract-call? .stx-vault stake u10000000 u2016)
```

#### 2. Check Your Staking Status

```clarity
;; Get your staking information
(contract-call? .stx-vault get-staker-info tx-sender)

;; Check pending rewards
(contract-call? .stx-vault get-pending-rewards tx-sender)
```

#### 3. Claim Rewards

```clarity
;; Claim accumulated rewards without unstaking
(contract-call? .stx-vault claim-rewards)
```

#### 4. Unstake (After Lock Period)

```clarity
;; Unstake and claim all rewards
(contract-call? .stx-vault unstake)
```

#### 5. Emergency Unstake (10% Penalty)

```clarity
;; Emergency unstake with penalty
(contract-call? .stx-vault emergency-unstake)
```

### For Administrators

#### Fund Reward Pool

```clarity
;; Add 100 STX to reward pool
(contract-call? .stx-vault fund-reward-pool u100000000)
```

#### Update Platform Parameters

```clarity
;; Set new reward rate (e.g., 150 = 1.5%)
(contract-call? .stx-vault set-reward-rate u150)

;; Update minimum stake to 2 STX
(contract-call? .stx-vault set-minimum-stake u2000000)
```

#### Manage Admins

```clarity
;; Add new admin
(contract-call? .stx-vault add-admin 'SP123...ABC)

;; Remove admin
(contract-call? .stx-vault remove-admin 'SP456...DEF)
```

#### Emergency Controls

```clarity
;; Pause contract
(contract-call? .stx-vault toggle-pause)
```

## 🔧 Contract Functions

### Public Functions (Staking)

| Function            | Description                      | Parameters                     |
| ------------------- | -------------------------------- | ------------------------------ |
| `stake`             | Stake STX tokens                 | `amount: uint, duration: uint` |
| `unstake`           | Withdraw stake after lock period | None                           |
| `claim-rewards`     | Claim rewards without unstaking  | None                           |
| `emergency-unstake` | Early withdrawal with penalty    | None                           |

### Public Functions (Admin)

| Function            | Description              | Access Level |
| ------------------- | ------------------------ | ------------ |
| `fund-reward-pool`  | Add funds to reward pool | Admin        |
| `set-reward-rate`   | Update reward rate       | Admin        |
| `set-minimum-stake` | Update minimum stake     | Admin        |
| `add-admin`         | Grant admin privileges   | Owner Only   |
| `remove-admin`      | Revoke admin privileges  | Owner Only   |
| `toggle-pause`      | Pause/unpause contract   | Admin        |

### Read-Only Functions

| Function              | Description               | Returns               |
| --------------------- | ------------------------- | --------------------- |
| `get-staker-info`     | Get staker details        | Staker data or none   |
| `get-pending-rewards` | Calculate pending rewards | Reward amount         |
| `get-contract-stats`  | Get platform statistics   | Contract stats object |
| `get-tier-info`       | Get tier information      | Tier data             |
| `is-user-admin`       | Check admin status        | Boolean               |
| `get-all-tiers`       | Get all tier information  | All tiers data        |

## 📈 Reward Calculation

Rewards are calculated using the formula:

```
rewards = (stake_amount × reward_rate × tier_multiplier × blocks_staked) ÷ 10,000,000
```

**Example:**

- Stake: 10 STX (Tier 2)
- Reward Rate: 100 (1%)
- Tier Multiplier: 120 (1.2x)
- Blocks Staked: 1,008 (1 week)
- **Reward: ~1.2 STX**

## ⚠️ Important Notes

### Security Considerations

- **Lock Periods**: Funds are locked for the specified duration
- **Emergency Unstaking**: 10% penalty applies for early withdrawal
- **Admin Keys**: Secure admin private keys properly
- **Contract Pause**: Admins can halt operations in emergencies

### Gas Costs

- Staking: ~0.01 STX transaction fee
- Claiming: ~0.005 STX transaction fee
- Unstaking: ~0.01 STX transaction fee

### Limitations

- One active stake per address
- Minimum stake requirements per tier
- Reward pool must be funded by admins

## 🛠️ Development

### Project Structure

```
staking-platform/
├── contracts/
│   └── stake-stacks.clar
├── tests/
│   └── stake-stacks_test.ts
├── settings/
│   └── Devnet.toml
└── Clarinet.toml
```

### Testing

```bash
# Run all tests
clarinet test

# Run specific test
clarinet test --filter="test_stake_success"
```

### Local Development

```bash
# Start local blockchain
clarinet integrate

# Check contract syntax
clarinet check

# Analyze contract
clarinet analyze
```

## 📋 Error Codes

| Code   | Error                         | Description                   |
| ------ | ----------------------------- | ----------------------------- |
| `u100` | `ERR_NOT_AUTHORIZED`          | Insufficient permissions      |
| `u101` | `ERR_INSUFFICIENT_BALANCE`    | Not enough balance            |
| `u102` | `ERR_INVALID_AMOUNT`          | Invalid stake amount          |
| `u103` | `ERR_NOT_STAKED`              | User has no active stake      |
| `u104` | `ERR_ALREADY_STAKED`          | User already has active stake |
| `u105` | `ERR_MINIMUM_STAKE_NOT_MET`   | Below minimum stake           |
| `u106` | `ERR_LOCK_PERIOD_NOT_EXPIRED` | Lock period still active      |
| `u107` | `ERR_REWARDS_NOT_AVAILABLE`   | No rewards to claim           |
| `u108` | `ERR_INVALID_DURATION`        | Invalid lock duration         |
| `u109` | `ERR_CONTRACT_PAUSED`         | Contract is paused            |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow Clarity best practices
- Add comprehensive tests for new features
- Update documentation for API changes
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation

- [Stacks Documentation](https://docs.stacks.co/)
- [Clarity Language Guide](https://docs.stacks.co/clarity/)
- [Clarinet Documentation](https://github.com/hirosystems/clarinet)

### Community

- [Stacks Discord](https://discord.gg/stacks)
- [Stacks Forum](https://forum.stacks.org/)
- [GitHub Issues](https://github.com/DorisUkamaka/stake-stacks/issues)

### Contact

- **Developer**: DORIS UKAMAKA
- **Email**: doris.uka2024@gmail.com

**⚡ Built with ❤️ on Stacks blockchain**
