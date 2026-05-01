import { SentenceRegistered } from "../generated/SentenceRegistry/SentenceRegistry"
import { SentenceStaked } from "../generated/StakingRewards/StakingRewards"
import { SentenceTransferred } from "../generated/SentenceRegistry/SentenceRegistry"
import { RewardClaimed } from "../generated/StakingRewards/StakingRewards"
import { Sentence as SentenceEntity } from "../generated/schema"
import { Stake } from "../generated/schema"
import { Transfer } from "../generated/schema"
import { Reward as RewardEntity } from "../generated/schema"
import { BigDecimal } from "@graphprotocol/graph-ts"

export function handleSentenceRegistered(event: SentenceRegistered): void {
  let sentence = new SentenceEntity(event.params.hash.toHexString());
  sentence.hash = event.params.hash.toHexString();
  sentence.owner = event.params.owner;
  sentence.normalizedText = event.params.normalizedText;
  sentence.createdAt = event.block.timestamp;
  sentence.staked = false;
  sentence.lastMovedAt = event.block.timestamp;
  sentence.save();
}

export function handleSentenceStaked(event: SentenceStaked): void {
  let sentence = SentenceEntity.load(event.params.hash.toHexString());
  if (!sentence) return;
  
  sentence.staked = true;
  sentence.save();
  
  let stake = new Stake(event.transaction.hash.toHex());
  stake.sentence = sentence.id;
  stake.owner = event.params.owner;
  stake.stakedAt = event.block.timestamp;
  stake.score = BigDecimal.fromString(event.params.score.toString());
  stake.active = true;
  stake.save();
}

export function handleSentenceTransferred(event: SentenceTransferred): void {
  let sentence = SentenceEntity.load(event.params.hash.toHexString());
  if (!sentence) return;
  
  sentence.owner = event.params.to;
  sentence.lastMovedAt = event.block.timestamp;
  sentence.save();
  
  let transfer = new Transfer(event.transaction.hash.toHex());
  transfer.sentence = sentence.id;
  transfer.from = event.params.from;
  transfer.to = event.params.to;
  transfer.txHash = event.transaction.hash.toHex();
  transfer.transferredAt = event.block.timestamp;
  transfer.transferStatus = "confirmed";
  transfer.save();
}

export function handleRewardClaimed(event: RewardClaimed): void {
  let reward = new RewardEntity(event.transaction.hash.toHex());
  reward.owner = event.params.user;
  reward.amount = BigDecimal.fromString(event.params.amount.toString());
  reward.claimedAt = event.block.timestamp;
  reward.save();
}
