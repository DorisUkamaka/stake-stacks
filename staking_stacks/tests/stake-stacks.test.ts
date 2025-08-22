
import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

const contractName = "stake-stacks";

describe("Stake Stacks Contract - Basic Setup and Initialization", () => {
  beforeEach(() => {
    // Mine a few blocks to ensure clean state for each test
    simnet.mineEmptyBlocks(3);
  });

  describe("Contract Initialization", () => {
    it("should initialize with correct default values", () => {
      const stats = simnet.callReadOnlyFn(
        contractName,
        "get-contract-stats",
        [],
        deployer
      );
      
      expect(stats.result).toBeTuple({
        "total-staked": Cl.uint(0),
        "total-rewards-distributed": Cl.uint(0),
        "reward-rate": Cl.uint(100),
        "minimum-stake": Cl.uint(1000000),
        "reward-pool": Cl.uint(0),
        "contract-paused": Cl.bool(false),
      });
    });

    it("should set deployer as contract owner", () => {
      const isAdmin = simnet.callReadOnlyFn(
        contractName,
        "is-user-admin",
        [Cl.principal(deployer)],
        deployer
      );
      
      expect(isAdmin.result).toBeBool(true);
    });

    it("should initialize staking tiers correctly", () => {
      // Test tier 1
      const tier1 = simnet.callReadOnlyFn(
        contractName,
        "get-tier-info",
        [Cl.uint(1)],
        deployer
      );
      
      expect(tier1.result).toBeSome(
        Cl.tuple({
          "min-amount": Cl.uint(1000000),
          "reward-multiplier": Cl.uint(100),
          "lock-duration": Cl.uint(1008),
        })
      );

      // Test tier 2
      const tier2 = simnet.callReadOnlyFn(
        contractName,
        "get-tier-info",
        [Cl.uint(2)],
        deployer
      );
      
      expect(tier2.result).toBeSome(
        Cl.tuple({
          "min-amount": Cl.uint(10000000),
          "reward-multiplier": Cl.uint(120),
          "lock-duration": Cl.uint(2016),
        })
      );

      // Test tier 3
      const tier3 = simnet.callReadOnlyFn(
        contractName,
        "get-tier-info",
        [Cl.uint(3)],
        deployer
      );
      
      expect(tier3.result).toBeSome(
        Cl.tuple({
          "min-amount": Cl.uint(50000000),
          "reward-multiplier": Cl.uint(150),
          "lock-duration": Cl.uint(4032),
        })
      );
    });

    it("should return all tiers information", () => {
      const allTiers = simnet.callReadOnlyFn(
        contractName,
        "get-all-tiers",
        [],
        deployer
      );
      
      expect(allTiers.result).toBeTuple({
        "tier-1": Cl.tuple({
          "min-amount": Cl.uint(1000000),
          "reward-multiplier": Cl.uint(100),
          "lock-duration": Cl.uint(1008),
        }),
        "tier-2": Cl.tuple({
          "min-amount": Cl.uint(10000000),
          "reward-multiplier": Cl.uint(120),
          "lock-duration": Cl.uint(2016),
        }),
        "tier-3": Cl.tuple({
          "min-amount": Cl.uint(50000000),
          "reward-multiplier": Cl.uint(150),
          "lock-duration": Cl.uint(4032),
        }),
      });
    });
  });

  describe("Read-only Functions - Initial State", () => {
    it("should return none for non-existent staker", () => {
      const stakerInfo = simnet.callReadOnlyFn(
        contractName,
        "get-staker-info",
        [Cl.principal(wallet1)],
        deployer
      );
      
      expect(stakerInfo.result).toBeNone();
    });

    it("should return 0 pending rewards for non-existent staker", () => {
      const pendingRewards = simnet.callReadOnlyFn(
        contractName,
        "get-pending-rewards",
        [Cl.principal(wallet1)],
        deployer
      );
      
      expect(pendingRewards.result).toBeUint(0);
    });

    it("should return false for non-admin users", () => {
      const isAdmin = simnet.callReadOnlyFn(
        contractName,
        "is-user-admin",
        [Cl.principal(wallet1)],
        deployer
      );
      
      expect(isAdmin.result).toBeBool(false);
    });
  });

  describe("Error Constants Validation", () => {
    it("should have proper error constants defined", () => {
      // Test ERR_NOT_AUTHORIZED (u100)
      const unauthorizedCall = simnet.callPublicFn(
        contractName,
        "set-reward-rate",
        [Cl.uint(200)],
        wallet1
      );
      expect(unauthorizedCall.result).toBeErr(Cl.uint(100));

      // Test ERR_NOT_STAKED (u103)
      const unstakeNotStaked = simnet.callPublicFn(
        contractName,
        "unstake",
        [],
        wallet1
      );
      expect(unstakeNotStaked.result).toBeErr(Cl.uint(103));

      // Test ERR_MINIMUM_STAKE_NOT_MET (u105)
      const lowStake = simnet.callPublicFn(
        contractName,
        "stake",
        [Cl.uint(500000), Cl.uint(1008)], // Below minimum stake
        wallet1
      );
      expect(lowStake.result).toBeErr(Cl.uint(105));
    });
  });
});

describe("Stake Stacks Contract - Staking Functionality", () => {
  const wallet2 = accounts.get("wallet_2")!;
  const wallet3 = accounts.get("wallet_3")!;
  
  beforeEach(() => {
    simnet.mineEmptyBlocks(3);
  });

  describe("Basic Staking Operations", () => {
    it("should allow staking with minimum amount (Tier 1)", () => {
      const stakeAmount = 1000000; // 1 STX (minimum)
      const duration = 1008; // Required duration for tier 1
      
      const stakeResult = simnet.callPublicFn(
        contractName,
        "stake",
        [Cl.uint(stakeAmount), Cl.uint(duration)],
        wallet1
      );
      
      expect(stakeResult.result).toBeOk(Cl.uint(stakeAmount));
      
      // Verify staker info was recorded
      const stakerInfo = simnet.callReadOnlyFn(
        contractName,
        "get-staker-info",
        [Cl.principal(wallet1)],
        deployer
      );
      
      expect(stakerInfo.result).toBeSome(
        Cl.tuple({
          amount: Cl.uint(stakeAmount),
          "start-block": Cl.uint(simnet.blockHeight),
          "last-claim-block": Cl.uint(simnet.blockHeight),
          "lock-duration": Cl.uint(duration),
          "total-earned": Cl.uint(0),
        })
      );
      
      // Verify total staked was updated
      const stats = simnet.callReadOnlyFn(
        contractName,
        "get-contract-stats",
        [],
        deployer
      );
      
      expect(stats.result).toBeTuple({
        "total-staked": Cl.uint(stakeAmount),
        "total-rewards-distributed": Cl.uint(0),
        "reward-rate": Cl.uint(100),
        "minimum-stake": Cl.uint(1000000),
        "reward-pool": Cl.uint(0),
        "contract-paused": Cl.bool(false),
      });
    });

    it("should allow staking at Tier 2 level", () => {
      const stakeAmount = 10000000; // 10 STX
      const duration = 2016; // Required duration for tier 2
      
      const stakeResult = simnet.callPublicFn(
        contractName,
        "stake",
        [Cl.uint(stakeAmount), Cl.uint(duration)],
        wallet2
      );
      
      expect(stakeResult.result).toBeOk(Cl.uint(stakeAmount));
      
      // Verify staker info
      const stakerInfo = simnet.callReadOnlyFn(
        contractName,
        "get-staker-info",
        [Cl.principal(wallet2)],
        deployer
      );
      
      expect(stakerInfo.result).toBeSome(
        Cl.tuple({
          amount: Cl.uint(stakeAmount),
          "start-block": Cl.uint(simnet.blockHeight),
          "last-claim-block": Cl.uint(simnet.blockHeight),
          "lock-duration": Cl.uint(duration),
          "total-earned": Cl.uint(0),
        })
      );
    });

    it("should allow staking at Tier 3 level", () => {
      const stakeAmount = 50000000; // 50 STX
      const duration = 4032; // Required duration for tier 3
      
      const stakeResult = simnet.callPublicFn(
        contractName,
        "stake",
        [Cl.uint(stakeAmount), Cl.uint(duration)],
        wallet3
      );
      
      expect(stakeResult.result).toBeOk(Cl.uint(stakeAmount));
      
      // Verify staker info
      const stakerInfo = simnet.callReadOnlyFn(
        contractName,
        "get-staker-info",
        [Cl.principal(wallet3)],
        deployer
      );
      
      expect(stakerInfo.result).toBeSome(
        Cl.tuple({
          amount: Cl.uint(stakeAmount),
          "start-block": Cl.uint(simnet.blockHeight),
          "last-claim-block": Cl.uint(simnet.blockHeight),
          "lock-duration": Cl.uint(duration),
          "total-earned": Cl.uint(0),
        })
      );
    });
  });

  describe("Staking Validation and Error Handling", () => {
    it("should reject stakes below minimum amount", () => {
      const lowStakeAmount = 500000; // 0.5 STX (below minimum)
      const duration = 1008;
      
      const stakeResult = simnet.callPublicFn(
        contractName,
        "stake",
        [Cl.uint(lowStakeAmount), Cl.uint(duration)],
        wallet1
      );
      
      expect(stakeResult.result).toBeErr(Cl.uint(105)); // ERR_MINIMUM_STAKE_NOT_MET
    });

    it("should reject stake with insufficient lock duration", () => {
      const stakeAmount = 1000000; // 1 STX
      const shortDuration = 500; // Below required 1008 blocks
      
      const stakeResult = simnet.callPublicFn(
        contractName,
        "stake",
        [Cl.uint(stakeAmount), Cl.uint(shortDuration)],
        wallet1
      );
      
      expect(stakeResult.result).toBeErr(Cl.uint(108)); // ERR_INVALID_DURATION
    });

    it("should reject duplicate staking from same user", () => {
      const stakeAmount = 1000000;
      const duration = 1008;
      
      // First stake should succeed
      const firstStake = simnet.callPublicFn(
        contractName,
        "stake",
        [Cl.uint(stakeAmount), Cl.uint(duration)],
        wallet1
      );
      expect(firstStake.result).toBeOk(Cl.uint(stakeAmount));
      
      // Second stake from same user should fail
      const secondStake = simnet.callPublicFn(
        contractName,
        "stake",
        [Cl.uint(stakeAmount), Cl.uint(duration)],
        wallet1
      );
      expect(secondStake.result).toBeErr(Cl.uint(104)); // ERR_ALREADY_STAKED
    });

    it("should reject staking when contract is paused", () => {
      // First pause the contract (as admin)
      const pauseResult = simnet.callPublicFn(
        contractName,
        "toggle-pause",
        [],
        deployer
      );
      expect(pauseResult.result).toBeOk(Cl.bool(true));
      
      // Try to stake while paused
      const stakeResult = simnet.callPublicFn(
        contractName,
        "stake",
        [Cl.uint(1000000), Cl.uint(1008)],
        wallet1
      );
      expect(stakeResult.result).toBeErr(Cl.uint(109)); // ERR_CONTRACT_PAUSED
      
      // Unpause for future tests
      const unpauseResult = simnet.callPublicFn(
        contractName,
        "toggle-pause",
        [],
        deployer
      );
      expect(unpauseResult.result).toBeOk(Cl.bool(false));
    });
  });

  describe("Multiple Users Staking", () => {
    it("should handle multiple users staking simultaneously", () => {
      const stake1Amount = 2000000; // 2 STX
      const stake2Amount = 15000000; // 15 STX
      const stake3Amount = 75000000; // 75 STX
      
      // User 1 stakes (Tier 1)
      const stake1 = simnet.callPublicFn(
        contractName,
        "stake",
        [Cl.uint(stake1Amount), Cl.uint(1008)],
        wallet1
      );
      expect(stake1.result).toBeOk(Cl.uint(stake1Amount));
      
      // User 2 stakes (Tier 2)
      const stake2 = simnet.callPublicFn(
        contractName,
        "stake",
        [Cl.uint(stake2Amount), Cl.uint(2016)],
        wallet2
      );
      expect(stake2.result).toBeOk(Cl.uint(stake2Amount));
      
      // User 3 stakes (Tier 3)
      const stake3 = simnet.callPublicFn(
        contractName,
        "stake",
        [Cl.uint(stake3Amount), Cl.uint(4032)],
        wallet3
      );
      expect(stake3.result).toBeOk(Cl.uint(stake3Amount));
      
      // Verify total staked
      const stats = simnet.callReadOnlyFn(
        contractName,
        "get-contract-stats",
        [],
        deployer
      );
      
      const expectedTotal = stake1Amount + stake2Amount + stake3Amount;
      expect(stats.result).toBeTuple({
        "total-staked": Cl.uint(expectedTotal),
        "total-rewards-distributed": Cl.uint(0),
        "reward-rate": Cl.uint(100),
        "minimum-stake": Cl.uint(1000000),
        "reward-pool": Cl.uint(0),
        "contract-paused": Cl.bool(false),
      });
    });
  });

  describe("Tier Requirements Validation", () => {
    it("should accept longer duration than minimum for each tier", () => {
      // Tier 1 with extended duration
      const tier1Result = simnet.callPublicFn(
        contractName,
        "stake",
        [Cl.uint(1000000), Cl.uint(2000)], // Longer than required 1008
        wallet1
      );
      expect(tier1Result.result).toBeOk(Cl.uint(1000000));
      
      // Reset for next test
      simnet.callPublicFn(contractName, "emergency-unstake", [], wallet1);
      
      // Tier 2 with extended duration
      const tier2Result = simnet.callPublicFn(
        contractName,
        "stake",
        [Cl.uint(10000000), Cl.uint(3000)], // Longer than required 2016
        wallet2
      );
      expect(tier2Result.result).toBeOk(Cl.uint(10000000));
      
      // Reset for next test
      simnet.callPublicFn(contractName, "emergency-unstake", [], wallet2);
      
      // Tier 3 with extended duration
      const tier3Result = simnet.callPublicFn(
        contractName,
        "stake",
        [Cl.uint(50000000), Cl.uint(5000)], // Longer than required 4032
        wallet3
      );
      expect(tier3Result.result).toBeOk(Cl.uint(50000000));
    });
  });
});
