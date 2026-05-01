// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title LGUArtifact - Proof-of-Value Artifact Minting Contract
 * @dev Mints LGU tokens based on verified artifact attestations from oracle
 * @notice No fiat linkage - CID → score → emission, not conversion
 */
contract LGUArtifact is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    IERC20 public immutable lguToken;
    address public oracle;
    
    // CID uniqueness tracking
    mapping(bytes32 => bool) public usedCids;
    
    // Per-wallet caps (anti-farming)
    mapping(address => uint256) public dailyMinted;
    mapping(address => uint256) public lastMintDay;
    
    // Gating parameters
    uint256 public constant MAX_PER_IMAGE = 1000 * 10**18; // Max LGU per artifact
    uint256 public constant DAILY_CAP = 10000 * 10**18; // Max LGU per wallet per day
    uint256 public constant BASE_EMISSION = 10 * 10**18; // Base emission per score unit
    
    // Oracle nonce for replay protection
    mapping(uint256 => bool) public usedNonces;
    
    event ArtifactMinted(
        address indexed owner,
        bytes32 indexed cid,
        uint256 score,
        uint256 amount,
        uint256 timestamp
    );
    
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event DailyCapUpdated(uint256 oldCap, uint256 newCap);
    event MaxPerImageUpdated(uint256 oldMax, uint256 newMax);
    
    constructor(address _lguToken, address _oracle) Ownable(msg.sender) {
        lguToken = IERC20(_lguToken);
        oracle = _oracle;
    }
    
    /**
     * @dev Mint LGU from verified artifact attestation
     * @param cid IPFS CID of the artifact (content-addressed, immutable)
     * @param score Protocol verification score (0-100, not dollar value)
     * @param amount Amount of LGU to mint (calculated from score)
     * @param nonce Oracle nonce for replay protection
     * @param signature Oracle attestation signature
     */
    function mintFromArtifact(
        bytes32 cid,
        uint256 score,
        uint256 amount,
        uint256 nonce,
        bytes calldata signature
    ) external {
        // Check CID uniqueness (prevent replay)
        require(!usedCids[cid], "CID already used");
        require(!usedNonces[nonce], "Nonce already used");
        
        // Verify oracle attestation
        bytes32 messageHash = keccak256(abi.encodePacked(cid, score, amount, nonce, block.chainid));
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedHash.recover(signature);
        require(signer == oracle, "Invalid oracle signature");
        
        // Validate scoring bounds
        require(score <= 100, "Score out of bounds");
        require(amount <= MAX_PER_IMAGE, "Exceeds max per image");
        
        // Enforce daily cap per wallet
        uint256 currentDay = block.timestamp / 1 days;
        if (lastMintDay[msg.sender] != currentDay) {
            dailyMinted[msg.sender] = 0;
            lastMintDay[msg.sender] = currentDay;
        }
        require(dailyMinted[msg.sender] + amount <= DAILY_CAP, "Exceeds daily cap");
        
        // Mark as used
        usedCids[cid] = true;
        usedNonces[nonce] = true;
        dailyMinted[msg.sender] += amount;
        
        // Mint LGU tokens
        require(lguToken.transferFrom(msg.sender, address(this), 0), "LGU transfer setup"); // Placeholder for actual mint logic
        // In production, this would either:
        // 1. Call LGU.mint() if this contract is the oracle
        // 2. Transfer from oracle's pre-minted pool
        // For now, we'll assume LGU has a mintFromOracle function
        
        emit ArtifactMinted(msg.sender, cid, score, amount, block.timestamp);
    }
    
    /**
     * @dev Update oracle address
     */
    function setOracle(address _oracle) external onlyOwner {
        address oldOracle = oracle;
        oracle = _oracle;
        emit OracleUpdated(oldOracle, _oracle);
    }
    
    /**
     * @dev Update daily cap (anti-farming parameter)
     */
    function setDailyCap(uint256 _dailyCap) external onlyOwner {
        uint256 oldCap = DAILY_CAP;
        // Note: constant cannot be changed, this would need to be a state variable
        // For production, make DAILY_CAP a mutable state variable
        emit DailyCapUpdated(oldCap, _dailyCap);
    }
    
    /**
     * @dev Update max per image (bounded emission parameter)
     */
    function setMaxPerImage(uint256 _maxPerImage) external onlyOwner {
        uint256 oldMax = MAX_PER_IMAGE;
        // Note: constant cannot be changed, this would need to be a state variable
        // For production, make MAX_PER_IMAGE a mutable state variable
        emit MaxPerImageUpdated(oldMax, _maxPerImage);
    }
    
    /**
     * @dev Check if CID has been used
     */
    function isCidUsed(bytes32 cid) external view returns (bool) {
        return usedCids[cid];
    }
    
    /**
     * @dev Get daily minted amount for wallet
     */
    function getDailyMinted(address wallet) external view returns (uint256) {
        return dailyMinted[wallet];
    }
}
