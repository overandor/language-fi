// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LGU is ERC20, Ownable {
    uint256 public epochEmission;
    address public oracle;

    constructor() ERC20("Language Gas Unit", "LGU") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 * 10**18);
    }

    function setOracle(address _oracle) external onlyOwner {
        oracle = _oracle;
    }

    function setEpochEmission(uint256 amount) external onlyOwner {
        epochEmission = amount;
    }

    function mintFromOracle(address to, uint256 amount) external {
        require(msg.sender == oracle, "Not oracle");
        require(amount <= epochEmission, "Exceeds emission");
        _mint(to, amount);
    }
}
