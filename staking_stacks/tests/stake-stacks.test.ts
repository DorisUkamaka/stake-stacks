
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
