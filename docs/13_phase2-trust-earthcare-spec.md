# フェーズ2: 信頼・Earth Care — 実装仕様書

**バージョン**: 0.1.0  
**作成日**: 2026-03-10  
**前提**: フェーズ1（マルチテナント化）完了  
**参照**: [03_technical-design.md](./03_technical-design.md), [04_permaculture-dao-framework.md](./04_permaculture-dao-framework.md)

---

## 1. 目標

- 取引実績を SBT として可視化し、信頼スコアを構築する
- 環境再生活動（Earth Care）をトークンと SBT で評価する
- エスクロー機能で安全な取引を実現する
- 初対面でも安心して取引できるレピュテーションシステム

---

## 2. スマートコントラクト

### 2.1 ContributionSBT.sol

取引完了時に発行される「お手伝い実績バッジ」。譲渡不可。

```solidity
interface IContributionSBT {
    struct Contribution {
        uint256 taskId;           // タスク ID
        address helper;           // お手伝いした人
        address requester;        // 依頼者
        string category;          // "people_care" | "earth_care"
        uint256 tokenAmount;      // 報酬額
        uint256 timestamp;
    }

    event ContributionRecorded(
        uint256 indexed tokenId,
        address indexed helper,
        address indexed requester,
        uint256 taskId,
        uint256 tokenAmount
    );

    // タスク承認時に自動発行（Escrow or TaskController 経由）
    function issue(
        address helper,
        address requester,
        uint256 taskId,
        string calldata category,
        uint256 tokenAmount
    ) external returns (uint256 tokenId);

    // ヘルパーの貢献一覧を取得
    function getContributions(address helper)
        external view returns (Contribution[] memory);

    // 貢献回数を取得
    function contributionCount(address helper)
        external view returns (uint256);
}
```

**発行タイミング:**
- タスクの依頼者が「承認」した時点で自動発行
- helper と requester の両方に発行（双方の実績として記録）

### 2.2 EarthCareSBT.sol

環境再生活動を証明する SBT。コミュニティの承認投票で発行。

```solidity
interface IEarthCareSBT {
    enum ActivityType { Composting, Planting, PesticideFree, WaterConservation }
    enum VerificationStatus { Pending, Approved, Rejected }

    struct EarthCareActivity {
        uint256 activityId;
        address reporter;
        ActivityType activityType;
        string description;
        string photoHash;        // IPFS ハッシュ or オフチェーン参照
        int256 gpsLat;           // 緯度 * 10^7
        int256 gpsLng;           // 経度 * 10^7
        uint256 approvalCount;
        VerificationStatus status;
        uint256 reportedAt;
    }

    event ActivityReported(uint256 indexed activityId, address indexed reporter, ActivityType activityType);
    event ActivityApproved(uint256 indexed activityId, uint256 indexed sbtTokenId);

    // 活動を報告（pending 状態で登録）
    function reportActivity(
        ActivityType activityType,
        string calldata description,
        string calldata photoHash,
        int256 gpsLat,
        int256 gpsLng
    ) external returns (uint256 activityId);

    // 承認投票（閾値に達したら自動で SBT 発行）
    function approveActivity(uint256 activityId) external;

    // 活動情報を取得
    function getActivity(uint256 activityId)
        external view returns (EarthCareActivity memory);

    // ユーザーの Earth Care SBT 数
    function earthCareCount(address user) external view returns (uint256);
}
```

**承認ロジック:**
- 報告者以外のコミュニティメンバーが投票
- 同じ人が同じ活動に2回投票できない
- 閾値（デフォルト: 3票）に達したら `approved` → SBT 発行
- オフチェーンの写真・GPS は参考情報としてバックエンドに保存

### 2.3 Escrow.sol

タスクの報酬を一時ロックし、完了確認後に自動送金する。

```solidity
interface IEscrow {
    enum EscrowStatus { Locked, Released, Refunded, Disputed }

    struct EscrowRecord {
        uint256 escrowId;
        uint256 taskId;
        address depositor;       // 依頼者
        address beneficiary;     // 作業者
        uint256 amount;
        EscrowStatus status;
        uint256 lockedAt;
        uint256 releasedAt;
    }

    event Deposited(uint256 indexed escrowId, uint256 indexed taskId, address depositor, uint256 amount);
    event Released(uint256 indexed escrowId, address beneficiary, uint256 amount);
    event Refunded(uint256 indexed escrowId, address depositor, uint256 amount);

    // タスク作成時: 依頼者がトークンをエスクローに預ける
    function deposit(uint256 taskId, address beneficiary, uint256 amount) external;

    // タスク承認時: 作業者にトークンを送金 + ContributionSBT 発行
    function release(uint256 escrowId) external;

    // タスクキャンセル時: 依頼者にトークンを返金
    function refund(uint256 escrowId) external;

    // 紛争処理（コミュニティ operator が仲裁）
    function dispute(uint256 escrowId) external;
    function resolveDispute(uint256 escrowId, bool releaseToBeneficiary) external;
}
```

**フロー:**
```
1. 依頼者がタスク投稿 → deposit() でトークンをロック
2. 作業者が応募 → assign
3. 作業者が完了報告 → complete
4. 依頼者が承認 → release() でトークン送金 + ContributionSBT 発行
5. (キャンセル時) → refund() でトークン返金
6. (紛争時) → dispute() → operator が resolveDispute()
```

### 2.4 ReputationScore.sol

ContributionSBT と EarthCareSBT の保有数をもとに信頼スコアを算出。

```solidity
interface IReputationScore {
    struct Score {
        uint256 contributionCount;   // ContributionSBT 保有数
        uint256 earthCareCount;      // EarthCareSBT 保有数
        uint256 totalTokenEarned;    // 累計獲得トークン
        uint256 reputationScore;     // 算出スコア（0〜1000）
    }

    function getScore(address user) external view returns (Score memory);

    function getLevel(address user) external view returns (string memory);
    // 0-99: 🌱 はじめのいっぽ
    // 100-299: 🌿 コミュニティの仲間
    // 300-599: 🌳 頼れる助っ人
    // 600-899: 🌻 コミュニティの柱
    // 900-1000: 🏆 パーマカルチャーマスター
}
```

**スコア算出ロジック:**
```
score = (contributionCount * 30) + (earthCareCount * 50) + min(totalTokenEarned / 10, 200)
score = min(score, 1000)
```

---

## 3. バックエンド

### 3.1 追加 API エンドポイント

#### ContributionSBT 関連

| メソッド | パス | 機能 |
|---------|------|------|
| GET | `/api/contributions` | 貢献一覧（自分の実績） |
| GET | `/api/contributions/{userId}` | 指定ユーザーの貢献一覧 |

#### Earth Care 拡張

| メソッド | パス | 機能 |
|---------|------|------|
| POST | `/api/earth-care/{id}/photo` | 写真アップロード |
| GET | `/api/earth-care/{id}/voters` | 投票者一覧 |

#### Escrow 関連

| メソッド | パス | 機能 |
|---------|------|------|
| GET | `/api/escrows` | 自分のエスクロー一覧 |
| POST | `/api/escrows/{id}/dispute` | 紛争申し立て |
| POST | `/api/escrows/{id}/resolve` | 紛争解決（operator 以上） |

#### ReputationScore 関連

| メソッド | パス | 機能 |
|---------|------|------|
| GET | `/api/reputation/{userId}` | 信頼スコア取得 |
| GET | `/api/reputation/ranking` | コミュニティ内ランキング |

### 3.2 タスクフロー変更

既存のタスク承認フローに Escrow + ContributionSBT を統合。

```
[既存]
  タスク投稿 → 応募 → 完了報告 → 承認 → DB に記録

[変更後]
  タスク投稿 → Escrow.deposit()
  → 応募 → assign
  → 完了報告 → complete
  → 承認 → Escrow.release() + ContributionSBT.issue()
  → 紛争 → Escrow.dispute() → operator が仲裁
```

### 3.3 写真ストレージ

Earth Care 活動の写真はオフチェーンで管理。

| 方式 | メリット | デメリット |
|------|---------|----------|
| S3 / R2 | 安価・高速 | 中央集権 |
| IPFS (Pinata) | 分散化・改ざん耐性 | コスト・速度 |

**推奨**: フェーズ2では S3 / Cloudflare R2 で十分。IPFS はフェーズ3で検討。

---

## 4. フロントエンド

### 4.1 信頼スコアプロフィール

ユーザープロフィールに信頼スコアと実績バッジを表示。

```
┌─────────────────────────────────────────┐
│  👤 田中 よし子                           │
│  🌻 コミュニティの柱（スコア: 720）         │
│                                         │
│  ── 実績 ──                              │
│  🤝 お手伝い: 24回                        │
│  🌱 Earth Care: 8回                      │
│  💰 累計獲得: 480 YUI                     │
│                                         │
│  ── 最近のバッジ ──                       │
│  [🏅 堆肥作り] [🏅 草刈り10回] [🏅 植樹]  │
└─────────────────────────────────────────┘
```

### 4.2 Earth Care 活動記録 UI

```
┌─────────────────────────────────────────┐
│  Earth Care 活動を報告                    │
│                                         │
│  活動タイプ: [堆肥作り ▼]                 │
│                                         │
│  説明:                                   │
│  ┌─────────────────────────────────────┐│
│  │ コンポスト第3号を作成...              ││
│  └─────────────────────────────────────┘│
│                                         │
│  📷 写真を添付                            │
│  [写真1.jpg] [写真2.jpg] [+ 追加]        │
│                                         │
│  📍 現在地を使用 ✓                        │
│     北緯 35.6812° 東経 139.7671°         │
│                                         │
│  [ 報告する ]                             │
└─────────────────────────────────────────┘
```

### 4.3 エスクロー付きタスク投稿

```
┌─────────────────────────────────────────┐
│  タスク投稿                              │
│                                         │
│  タイトル: [草刈りのお手伝い]              │
│  報酬: [30] YUI                          │
│                                         │
│  ⚠️ 報酬 30 YUI はエスクローに             │
│     一時ロックされます。                   │
│     作業完了・承認後に作業者に送金されます。  │
│                                         │
│  [ 投稿する（30 YUI をロック）]            │
└─────────────────────────────────────────┘
```

### 4.4 コミュニティランキング

```
┌─────────────────────────────────────────┐
│  コミュニティランキング                    │
│                                         │
│  1. 🌻 田中 よし子    720pt  24回        │
│  2. 🌳 佐藤 太郎     520pt  18回        │
│  3. 🌿 山田 花子     280pt  12回        │
│  4. 🌱 鈴木 一郎     90pt   5回         │
│                                         │
│  あなたの順位: 3位 / 28名               │
└─────────────────────────────────────────┘
```

---

## 5. 実装タスク

### Phase 2-A: スマートコントラクト

| # | タスク | 見積もり |
|---|-------|---------|
| 2-A-1 | ContributionSBT.sol 実装 + テスト | 4h |
| 2-A-2 | EarthCareSBT.sol 実装（承認投票ロジック含む）+ テスト | 6h |
| 2-A-3 | Escrow.sol 実装 + テスト | 6h |
| 2-A-4 | ReputationScore.sol 実装 + テスト | 3h |
| 2-A-5 | CommunityFactory に新コントラクトの自動デプロイを追加 | 2h |
| 2-A-6 | テストネットデプロイ + 検証 | 2h |

### Phase 2-B: バックエンド

| # | タスク | 見積もり |
|---|-------|---------|
| 2-B-1 | ContributionSBT 関連 API + タスク承認フロー変更 | 4h |
| 2-B-2 | Earth Care 写真アップロード + 投票者管理 | 4h |
| 2-B-3 | Escrow API + 紛争処理 | 4h |
| 2-B-4 | ReputationScore API + ランキング | 3h |

### Phase 2-C: フロントエンド

| # | タスク | 見積もり |
|---|-------|---------|
| 2-C-1 | 信頼スコアプロフィール画面 | 4h |
| 2-C-2 | Earth Care 活動報告 UI（写真・GPS） | 6h |
| 2-C-3 | エスクロー付きタスク投稿・承認 UI | 4h |
| 2-C-4 | コミュニティランキング画面 | 3h |
| 2-C-5 | ContributionSBT バッジ表示 | 2h |

### 合計見積もり

| カテゴリ | 時間 |
|---------|------|
| スマートコントラクト | 23h |
| バックエンド | 15h |
| フロントエンド | 19h |
| **合計** | **57h** |
