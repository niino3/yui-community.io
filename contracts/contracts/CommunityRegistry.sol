// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title CommunityRegistry — 全コミュニティの情報を管理するレジストリ
/// @notice コミュニティの作成・照会・管理機能を提供
contract CommunityRegistry is Ownable {
    struct CommunityInfo {
        uint256 id;
        string name;
        string slug;
        string tokenSymbol;
        address admin;
        address token;
        address sbt;
        bool active;
        uint256 createdAt;
    }

    uint256 private _nextCommunityId = 1; // 1から開始（0は予約）
    mapping(uint256 => CommunityInfo) private _communities;
    mapping(string => uint256) private _slugToId;

    event CommunityRegistered(
        uint256 indexed communityId,
        string name,
        string slug,
        string tokenSymbol,
        address admin,
        address token,
        address sbt
    );

    event CommunityDeactivated(uint256 indexed communityId);
    event CommunityReactivated(uint256 indexed communityId);

    constructor() Ownable(msg.sender) {}

    /// @notice 新しいコミュニティを登録（Factory のみが呼び出す）
    /// @param name コミュニティ名
    /// @param slug URLスラグ（例: "hokkaido"）
    /// @param tokenSymbol トークンシンボル
    /// @param admin コミュニティ管理者
    /// @param token トークンコントラクトアドレス
    /// @param sbt SBTコントラクトアドレス
    /// @return communityId 登録されたコミュニティID
    function register(
        string calldata name,
        string calldata slug,
        string calldata tokenSymbol,
        address admin,
        address token,
        address sbt
    ) external onlyOwner returns (uint256) {
        require(bytes(slug).length > 0, "Slug cannot be empty");
        require(_slugToId[slug] == 0, "Slug already exists");
        require(admin != address(0), "Invalid admin address");
        require(token != address(0), "Invalid token address");
        require(sbt != address(0), "Invalid SBT address");

        uint256 communityId = _nextCommunityId++;

        _communities[communityId] = CommunityInfo({
            id: communityId,
            name: name,
            slug: slug,
            tokenSymbol: tokenSymbol,
            admin: admin,
            token: token,
            sbt: sbt,
            active: true,
            createdAt: block.timestamp
        });

        _slugToId[slug] = communityId;

        emit CommunityRegistered(
            communityId,
            name,
            slug,
            tokenSymbol,
            admin,
            token,
            sbt
        );

        return communityId;
    }

    /// @notice コミュニティIDから情報を取得
    /// @param communityId コミュニティID
    /// @return コミュニティ情報
    function getCommunity(uint256 communityId)
        external
        view
        returns (CommunityInfo memory)
    {
        require(communityId < _nextCommunityId, "Community does not exist");
        return _communities[communityId];
    }

    /// @notice スラグからコミュニティ情報を取得
    /// @param slug URLスラグ
    /// @return コミュニティ情報
    function getCommunityBySlug(string calldata slug)
        external
        view
        returns (CommunityInfo memory)
    {
        uint256 communityId = _slugToId[slug];
        require(communityId > 0, "Community not found");
        return _communities[communityId];
    }

    /// @notice 全コミュニティ情報を取得
    /// @return コミュニティ情報の配列
    function getAllCommunities()
        external
        view
        returns (CommunityInfo[] memory)
    {
        CommunityInfo[] memory communities = new CommunityInfo[](_nextCommunityId);
        for (uint256 i = 0; i < _nextCommunityId; i++) {
            communities[i] = _communities[i];
        }
        return communities;
    }

    /// @notice アクティブなコミュニティのみを取得
    /// @return アクティブなコミュニティ情報の配列
    function getActiveCommunities()
        external
        view
        returns (CommunityInfo[] memory)
    {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < _nextCommunityId; i++) {
            if (_communities[i].active) {
                activeCount++;
            }
        }

        CommunityInfo[] memory activeCommunities = new CommunityInfo[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < _nextCommunityId; i++) {
            if (_communities[i].active) {
                activeCommunities[index] = _communities[i];
                index++;
            }
        }
        return activeCommunities;
    }

    /// @notice コミュニティがアクティブかチェック
    /// @param communityId コミュニティID
    /// @return アクティブならtrue
    function isActiveCommunity(uint256 communityId)
        external
        view
        returns (bool)
    {
        require(communityId < _nextCommunityId, "Community does not exist");
        return _communities[communityId].active;
    }

    /// @notice コミュニティを無効化（プラットフォーム管理者のみ）
    /// @param communityId コミュニティID
    function deactivate(uint256 communityId) external onlyOwner {
        require(communityId < _nextCommunityId, "Community does not exist");
        _communities[communityId].active = false;
        emit CommunityDeactivated(communityId);
    }

    /// @notice コミュニティを再有効化（プラットフォーム管理者のみ）
    /// @param communityId コミュニティID
    function reactivate(uint256 communityId) external onlyOwner {
        require(communityId < _nextCommunityId, "Community does not exist");
        _communities[communityId].active = true;
        emit CommunityReactivated(communityId);
    }

    /// @notice 登録されたコミュニティ数を取得
    /// @return コミュニティ総数
    function communityCount() external view returns (uint256) {
        return _nextCommunityId;
    }
}
