;; Staking Platform Smart Contract
;; A comprehensive staking platform with rewards, penalties, and governance

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u100))
(define-constant ERR_INSUFFICIENT_BALANCE (err u101))
(define-constant ERR_INVALID_AMOUNT (err u102))
(define-constant ERR_NOT_STAKED (err u103))
(define-constant ERR_ALREADY_STAKED (err u104))
(define-constant ERR_MINIMUM_STAKE_NOT_MET (err u105))
(define-constant ERR_LOCK_PERIOD_NOT_EXPIRED (err u106))
(define-constant ERR_REWARDS_NOT_AVAILABLE (err u107))
(define-constant ERR_INVALID_DURATION (err u108))
(define-constant ERR_CONTRACT_PAUSED (err u109))

;; Data Variables
(define-data-var total-staked uint u0)
(define-data-var total-rewards-distributed uint u0)
(define-data-var reward-rate uint u100) ;; 1% per 1000 blocks (approximately 1 week)
(define-data-var minimum-stake uint u1000000) ;; 1 STX minimum stake
(define-data-var contract-paused bool false)
(define-data-var reward-pool uint u0)

;; Data Maps
(define-map stakers
    principal
    {
        amount: uint,
        start-block: uint,
        last-claim-block: uint,
        lock-duration: uint,
        total-earned: uint,
    }
)

(define-map staking-tiers
    uint
    {
        min-amount: uint,
        reward-multiplier: uint,
        lock-duration: uint,
    }
)

(define-map admin-roles
    principal
    bool
)

;; Initialize staking tiers
(map-set staking-tiers u1 {
    min-amount: u1000000, ;; 1 STX
    reward-multiplier: u100, ;; 1x rewards
    lock-duration: u1008, ;; ~1 week in blocks
})

(map-set staking-tiers u2 {
    min-amount: u10000000, ;; 10 STX
    reward-multiplier: u120, ;; 1.2x rewards
    lock-duration: u2016, ;; ~2 weeks in blocks
})

(map-set staking-tiers u3 {
    min-amount: u50000000, ;; 50 STX
    reward-multiplier: u150, ;; 1.5x rewards
    lock-duration: u4032, ;; ~4 weeks in blocks
})

;; Private Functions
(define-private (is-admin (user principal))
    (or
        (is-eq user CONTRACT_OWNER)
        (default-to false (map-get? admin-roles user))
    )
)

(define-private (calculate-rewards (staker principal))
    (let (
            (staker-data (unwrap! (map-get? stakers staker) u0))
            (blocks-staked (- stacks-block-height (get last-claim-block staker-data)))
            (stake-amount (get amount staker-data))
            (tier (get-staking-tier stake-amount))
            (multiplier (get reward-multiplier (unwrap! (map-get? staking-tiers tier) u100)))
        )
        (/ (* (* stake-amount (var-get reward-rate)) multiplier blocks-staked)
            u10000000
        )
    )
)

(define-private (get-staking-tier (amount uint))
    (if (>= amount u50000000)
        u3
        (if (>= amount u10000000)
            u2
            u1
        )
    )
)

(define-private (update-staker-claim-block (staker principal))
    (match (map-get? stakers staker)
        staker-data (map-set stakers staker
            (merge staker-data { last-claim-block: stacks-block-height })
        )
        false
    )
)
