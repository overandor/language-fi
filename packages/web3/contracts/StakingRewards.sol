// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILGU {
    function mintFromOracle(address to, uint256 amount) external;
}

contract StakingRewards {
    ILGU public token;
    address public owner;

    struct Stake {
        address owner;
        uint256 score;
        uint256 stakedAt;
    }

    mapping(uint256 => Stake) public stakes;
    uint256 public nextTokenId;

    event Staked(uint256 indexed tokenId, address indexed owner, uint256 score);
    event RewardDistributed(uint256 indexed tokenId, uint256 reward);

    constructor(address tokenAddress) {
        token = ILGU(tokenAddress);
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function stake(address staker, uint256 score) external onlyOwner returns (uint256) {
        nextTokenId++;
        uint256 tokenId = nextTokenId;
        stakes[tokenId] = Stake({
            owner: staker,
            score: score,
            stakedAt: block.timestamp
        });
        emit Staked(tokenId, staker, score);
        return tokenId;
    }

    function distribute(uint256 tokenId, uint256 reward) external onlyOwner {
        Stake memory s = stakes[tokenId];
        require(s.owner != address(0), "No stake");
        token.mintFromOracle(s.owner, reward);
        emit RewardDistributed(tokenId, reward);
    }

    function unstake(uint256 tokenId) external {
        Stake memory s = stakes[tokenId];
        require(s.owner == msg.sender, "Not owner");
        delete stakes[tokenId];
    }

    function getStake(uint256 tokenId) external view returns (Stake memory) {
        return stakes[tokenId];
    }
}
