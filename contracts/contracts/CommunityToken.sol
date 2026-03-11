// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title CommunityToken — コミュニティごとのトークン (ERC-20)
/// @notice 管理者が mint でき、ユーザー間で自由に送金できるシンプルなトークン
/// @dev YuiToken を汎用化し、name/symbol をコンストラクタで指定可能にしたバージョン
contract CommunityToken is ERC20, Ownable {
    /// @notice コミュニティトークンを初期化
    /// @param _name トークン名（例: "Hokkaido Community Dollar"）
    /// @param _symbol トークンシンボル（例: "HKD"）
    /// @param _admin トークンの管理者アドレス
    constructor(
        string memory _name,
        string memory _symbol,
        address _admin
    ) ERC20(_name, _symbol) Ownable(_admin) {}

    /// @notice 管理者のみがトークンを発行できる
    /// @param to 発行先アドレス
    /// @param amount 発行量（wei単位）
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
