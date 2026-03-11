// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title CommunitySBT — 譲渡不可のメンバーシップ証明 (Soulbound Token)
/// @notice 管理者が発行し、一人一つだけ保有可能。transfer は全てブロックされる。
/// @dev MembershipSBT を汎用化し、name/symbol をコンストラクタで指定可能にしたバージョン
contract CommunitySBT is ERC721, Ownable {
    uint256 private _nextTokenId;

    /// @notice コミュニティSBTを初期化
    /// @param _name SBT名（例: "Hokkaido Community Membership"）
    /// @param _symbol SBTシンボル（例: "HKDM"）
    /// @param _admin SBTの管理者アドレス
    constructor(
        string memory _name,
        string memory _symbol,
        address _admin
    ) ERC721(_name, _symbol) Ownable(_admin) {}

    /// @notice 管理者がメンバーに SBT を発行する（一人一つまで）
    /// @param to 発行先アドレス
    function issue(address to) external onlyOwner {
        require(balanceOf(to) == 0, "Already a member");
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
    }

    /// @dev transfer をすべてブロックして Soulbound にする
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        // mint (from == address(0)) は許可、それ以外の transfer は拒否
        require(from == address(0), "Soulbound: transfer not allowed");
        return super._update(to, tokenId, auth);
    }
}
