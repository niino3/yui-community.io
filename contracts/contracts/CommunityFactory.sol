// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "./CommunityToken.sol";
import "./CommunitySBT.sol";
import "./CommunityRegistry.sol";

/// @title CommunityFactory — 新しいコミュニティのコントラクト群をデプロイするファクトリー
/// @notice コミュニティトークン + SBT を一括デプロイし、Registry に登録
contract CommunityFactory {
    CommunityRegistry public immutable registry;

    struct CommunityConfig {
        string name;            // コミュニティ名
        string slug;            // URLスラグ（例: "hokkaido"）
        string tokenName;       // トークン名（例: "Hokkaido Community Dollar"）
        string tokenSymbol;     // トークンシンボル（例: "HKD"）
        string sbtName;         // SBT名（例: "Hokkaido Community Membership"）
        string sbtSymbol;       // SBTシンボル（例: "HKDM"）
        address admin;          // コミュニティ管理者
        uint256 initialSupply;  // 初期供給量（wei）
    }

    struct DeployedContracts {
        uint256 communityId;
        address token;
        address sbt;
    }

    event CommunityCreated(
        uint256 indexed communityId,
        string name,
        string slug,
        string tokenSymbol,
        address admin,
        address token,
        address sbt,
        uint256 initialSupply
    );

    /// @notice Factory を初期化
    /// @param _registry CommunityRegistry のアドレス
    constructor(address _registry) {
        require(_registry != address(0), "Invalid registry address");
        registry = CommunityRegistry(_registry);
    }

    /// @notice 新しいコミュニティを作成
    /// @param config コミュニティ設定
    /// @return deployed デプロイされたコントラクト情報
    function createCommunity(CommunityConfig calldata config)
        external
        returns (DeployedContracts memory)
    {
        require(bytes(config.name).length > 0, "Name cannot be empty");
        require(bytes(config.slug).length > 0, "Slug cannot be empty");
        require(config.admin != address(0), "Invalid admin address");
        require(config.initialSupply > 0, "Initial supply must be > 0");

        // 1. CommunityToken をデプロイ（一時的に Factory が owner）
        CommunityToken token = new CommunityToken(
            config.tokenName,
            config.tokenSymbol,
            address(this)
        );

        // 2. CommunitySBT をデプロイ（一時的に Factory が owner）
        CommunitySBT sbt = new CommunitySBT(
            config.sbtName,
            config.sbtSymbol,
            address(this)
        );

        // 3. admin に初期供給量を mint
        token.mint(config.admin, config.initialSupply);

        // 4. admin に SBT を発行
        sbt.issue(config.admin);

        // 5. Token と SBT の ownership を admin に移譲
        token.transferOwnership(config.admin);
        sbt.transferOwnership(config.admin);

        // 6. Registry に登録
        uint256 communityId = registry.register(
            config.name,
            config.slug,
            config.tokenSymbol,
            config.admin,
            address(token),
            address(sbt)
        );

        emit CommunityCreated(
            communityId,
            config.name,
            config.slug,
            config.tokenSymbol,
            config.admin,
            address(token),
            address(sbt),
            config.initialSupply
        );

        return DeployedContracts({
            communityId: communityId,
            token: address(token),
            sbt: address(sbt)
        });
    }

    /// @notice コミュニティIDから情報を取得（Registry へのプロキシ）
    /// @param communityId コミュニティID
    /// @return コミュニティ情報
    function getCommunity(uint256 communityId)
        external
        view
        returns (CommunityRegistry.CommunityInfo memory)
    {
        return registry.getCommunity(communityId);
    }

    /// @notice 登録されたコミュニティ数を取得
    /// @return コミュニティ総数
    function communityCount() external view returns (uint256) {
        return registry.communityCount();
    }
}
