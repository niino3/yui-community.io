// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title YuiToken — yui コミュニティトークン (ERC-20)
/// @notice 管理者が mint でき、ユーザー間で自由に送金できるシンプルなトークン
contract YuiToken is ERC20, Ownable {
    constructor() ERC20("Yui Token", "YUI") Ownable(msg.sender) {}

    /// @notice 管理者のみがトークンを発行できる
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
