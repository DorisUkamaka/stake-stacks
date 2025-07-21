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
