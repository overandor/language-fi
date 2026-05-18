// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract FeeDistributor is Ownable, ReentrancyGuard {
    IERC20 public lguToken;
    IERC20 public token0;
    IERC20 public token1;
    
    uint256 public protocolFeeRate = 200; // 0.2% (basis points)
    uint256 public lpFeeRate = 99800; // 99.8% (basis points)
    
    address public treasury;
    
    mapping(address => uint256) public token0Fees;
    mapping(address => uint256) public token1Fees;
    
    uint256 public totalToken0Fees;
    uint256 public totalToken1Fees;
    
    event FeesCollected(uint256 token0Amount, uint256 token1Amount);
    event ProtocolFeeSent(uint256 amount);
    event LPFeeDistributed(address indexed lp, uint256 token0Amount, uint256 token1Amount);
    event TreasuryUpdated(address newTreasury);
    event FeeRatesUpdated(uint256 protocolRate, uint256 lpRate);
    
    constructor(
        address _lguToken,
        address _token0,
        address _token1,
        address _treasury
    ) Ownable(msg.sender) {
        lguToken = IERC20(_lguToken);
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
        treasury = _treasury;
    }
    
    function collectFees(uint256 token0Amount, uint256 token1Amount) external onlyOwner {
        require(token0.transferFrom(msg.sender, address(this), token0Amount), "Transfer failed");
        require(token1.transferFrom(msg.sender, address(this), token1Amount), "Transfer failed");
        
        totalToken0Fees += token0Amount;
        totalToken1Fees += token1Amount;
        
        emit FeesCollected(token0Amount, token1Amount);
    }
    
    function distributeLPFees(address lp, uint256 share) external onlyOwner nonReentrant {
        uint256 token0Amount = (totalToken0Fees * share) / 1000000;
        uint256 token1Amount = (totalToken1Fees * share) / 1000000;
        
        if (token0Amount > 0) {
            token0Fees[lp] += token0Amount;
        }
        if (token1Amount > 0) {
            token1Fees[lp] += token1Amount;
        }
        
        emit LPFeeDistributed(lp, token0Amount, token1Amount);
    }
    
    function claimFees() external nonReentrant {
        uint256 token0Amount = token0Fees[msg.sender];
        uint256 token1Amount = token1Fees[msg.sender];
        
        require(token0Amount > 0 || token1Amount > 0, "No fees to claim");
        
        token0Fees[msg.sender] = 0;
        token1Fees[msg.sender] = 0;
        
        if (token0Amount > 0) {
            require(token0.transfer(msg.sender, token0Amount), "Transfer failed");
        }
        if (token1Amount > 0) {
            require(token1.transfer(msg.sender, token1Amount), "Transfer failed");
        }
    }
    
    function sendProtocolFee() external onlyOwner {
        uint256 protocolFee = (totalToken0Fees * protocolFeeRate) / 100000;
        if (protocolFee > 0) {
            require(token0.transfer(treasury, protocolFee), "Transfer failed");
            emit ProtocolFeeSent(protocolFee);
        }
    }
    
    function setTreasury(address newTreasury) external onlyOwner {
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }
    
    function setFeeRates(uint256 newProtocolRate, uint256 newLPRate) external onlyOwner {
        require(newProtocolRate + newLPRate == 100000, "Rates must sum to 100%");
        protocolFeeRate = newProtocolRate;
        lpFeeRate = newLPRate;
        emit FeeRatesUpdated(newProtocolRate, newLPRate);
    }
    
    function getLPFees(address lp) external view returns (uint256, uint256) {
        return (token0Fees[lp], token1Fees[lp]);
    }
}
