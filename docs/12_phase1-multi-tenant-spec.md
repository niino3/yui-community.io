# フェーズ1: マルチテナント化 — 実装仕様書

**バージョン**: 0.1.0  
**作成日**: 2026-03-10  
**前提**: フェーズ0（シングルテナント）完了  
**参照**: [08_multi-tenant-architecture.md](./08_multi-tenant-architecture.md), [03_technical-design.md](./03_technical-design.md)

---

## 1. 目標

- 複数のパーマカルチャーコミュニティが独立して運営できる
- 新しいコミュニティを Web UI から作成できる
- 各コミュニティが独自のトークン名・ルール・ブランドを持てる
- 2〜3 コミュニティでの実運用を目指す

---

## 2. スマートコントラクト

### 2.1 CommunityFactory.sol

新しいコミュニティのコントラクト群を一括デプロイするファクトリー。

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

interface ICommunityFactory {
    struct CommunityConfig {
        string name;            // コミュニティ名
        string tokenName;       // トークン名（例: "Hokkaido Community Dollar"）
        string tokenSymbol;     // トークンシンボル（例: "HKD"）
        address admin;          // コミュニティ管理者
        uint256 initialSupply;  // 初期供給量（wei）
    }

    struct DeployedContracts {
        address token;          // CommunityToken
        address sbt;            // MembershipSBT
        address registry;       // このコミュニティの ID
    }

    event CommunityCreated(
        uint256 indexed communityId,
        string name,
        string tokenSymbol,
        address admin,
        address token,
        address sbt
    );

    function createCommunity(CommunityConfig calldata config)
        external returns (uint256 communityId);

    function getCommunity(uint256 communityId)
        external view returns (DeployedContracts memory);

    function communityCount() external view returns (uint256);
}
```

**実装ポイント:**
- `createCommunity()` で CommunityToken + MembershipSBT をデプロイ
- デプロイしたアドレスを CommunityRegistry に登録
- admin に initialSupply を mint + MembershipSBT を発行
- フェーズ2 以降で ContributionSBT / EarthCareSBT / Escrow / Governance / Treasury を追加

**ガス代見積もり:**
- CommunityToken デプロイ: 約 $2〜5（Polygon）
- MembershipSBT デプロイ: 約 $1〜3
- 合計: 約 $3〜8 / コミュニティ

### 2.2 CommunityRegistry.sol

全コミュニティのコントラクトアドレスを管理するレジストリ。

```solidity
interface ICommunityRegistry {
    struct CommunityInfo {
        uint256 id;
        string name;
        string tokenSymbol;
        address admin;
        address token;
        address sbt;
        bool active;
        uint256 createdAt;
    }

    function getCommunityBySlug(string calldata slug)
        external view returns (CommunityInfo memory);

    function getAllCommunities()
        external view returns (CommunityInfo[] memory);

    function isActiveCommunity(uint256 communityId)
        external view returns (bool);
}
```

### 2.3 CommunityToken.sol（既存 YuiToken の汎用化）

既存の `YuiToken.sol` をベースに、コミュニティごとにカスタム名・シンボルを持てるように変更。

```solidity
// 変更点: コンストラクタで name/symbol を受け取る
constructor(string memory _name, string memory _symbol, address _admin)
    ERC20(_name, _symbol)
    Ownable(_admin)
{}
```

### 2.4 テスト要件

| テスト | 内容 |
|-------|------|
| コミュニティ作成 | Factory からコミュニティを作成し、Token / SBT がデプロイされること |
| 複数コミュニティ | 2つ以上のコミュニティが独立して動作すること |
| トークン分離 | コミュニティ A のトークンがコミュニティ B に影響しないこと |
| Registry 照会 | Registry から全コミュニティのアドレスを取得できること |
| 権限 | admin のみが mint / SBT 発行できること |

---

## 3. バックエンド

### 3.1 テナントミドルウェア

リクエストからテナント（コミュニティ）を特定するミドルウェア。

**テナント解決の優先順位:**

1. `X-Community-Slug` ヘッダー
2. サブドメイン（`hokkaido.yui-community.io` → `hokkaido`）
3. クエリパラメータ `?community=hokkaido`

```php
// app/Http/Middleware/ResolveTenant.php

class ResolveTenant
{
    public function handle(Request $request, Closure $next)
    {
        $slug = $this->resolveSlug($request);

        if (! $slug) {
            return response()->json(['message' => 'コミュニティが特定できません'], 400);
        }

        $community = Community::where('slug', $slug)->first();

        if (! $community || ! $community->is_active) {
            return response()->json(['message' => 'コミュニティが見つかりません'], 404);
        }

        app()->instance('current_community', $community);
        $request->merge(['community_id' => $community->id]);

        return $next($request);
    }
}
```

### 3.2 DB 設計の拡張

#### communities テーブルに追加するカラム

```
communities（既存テーブルに追加）
  + is_active (boolean, default true)
  + logo_url (string, nullable)
  + color_primary (string, nullable, default "#22c55e")
  + color_secondary (string, nullable, default "#86efac")
  + locale (string, default "ja")
  + demurrage_rate (decimal, default 0)
  + token_rate_description (text, nullable)
  + max_members (integer, default 100)
  + created_by (foreignId -> users)
```

#### community_members テーブルに role を追加

```
community_members（既存テーブルに追加）
  + role (enum: 'member', 'operator', 'admin', default 'member')
```

#### contract_registry テーブル（新規）

```
contract_registry
  id, community_id, contract_type, address, deployed_at, tx_hash
  
  contract_type: 'token' | 'sbt' | 'escrow' | 'governance' | 'treasury'
```

### 3.3 API エンドポイント

#### プラットフォーム管理 API（認証不要 / プラットフォーム管理者のみ）

| メソッド | パス | 機能 |
|---------|------|------|
| GET | `/api/platform/communities` | 全コミュニティ一覧（管理者向け） |
| POST | `/api/platform/communities` | コミュニティ作成 |
| PATCH | `/api/platform/communities/{id}` | コミュニティ設定更新 |
| DELETE | `/api/platform/communities/{id}` | コミュニティ停止（論理削除） |
| GET | `/api/platform/stats` | プラットフォーム横断統計 |

#### テナント内 API（テナントミドルウェア経由）

| メソッド | パス | 機能 |
|---------|------|------|
| GET | `/api/community/info` | 現在のコミュニティ情報（名前・ロゴ・色・設定） |
| GET | `/api/community/members` | メンバー一覧 |
| POST | `/api/community/members/invite` | メンバー招待 |
| PATCH | `/api/community/members/{id}/role` | メンバーの role 変更 |
| DELETE | `/api/community/members/{id}` | メンバー除外 |
| GET | `/api/community/stats` | コミュニティ統計 |
| PATCH | `/api/community/settings` | コミュニティ設定変更（operator以上） |

既存の `/api/tasks`, `/api/transactions` 等はテナントミドルウェアにより自動的にスコープされる。

### 3.4 認可ミドルウェア

```php
// app/Http/Middleware/EnsureRole.php

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        $user = $request->user();
        $community = app('current_community');

        $membership = CommunityMember::where('community_id', $community->id)
            ->where('user_id', $user->id)
            ->first();

        if (! $membership || ! in_array($membership->role, $roles)) {
            return response()->json(['message' => '権限がありません'], 403);
        }

        return $next($request);
    }
}

// 使用例: Route::middleware(['tenant', 'role:operator,admin'])
```

---

## 4. フロントエンド

### 4.1 ランディングページ（プラットフォームトップ）

**URL**: `https://yui-community.io`

```
┌─────────────────────────────────────────────┐
│  yui — パーマカルチャーコミュニティ通貨        │
│                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ 北海道   │ │ 京都    │ │ 沖縄    │       │
│  │ HKD     │ │ KYT    │ │ OKN    │       │
│  │ 28名    │ │ 15名   │ │ 12名   │       │
│  └─────────┘ └─────────┘ └─────────┘       │
│                                             │
│  [ 新しいコミュニティを作成 ]                  │
│                                             │
│  このプロジェクトについて / GitHub / ドキュメント │
└─────────────────────────────────────────────┘
```

**コンポーネント:**
- `CommunityCard` — コミュニティ名・トークン名・メンバー数・カラーテーマ
- `CreateCommunityForm` — ウィザード形式で作成
- `PlatformStats` — プラットフォーム全体の統計

### 4.2 コミュニティ作成ウィザード

**ステップ1: 基本情報**
- コミュニティ名
- サブドメイン（slug）
- 所在地域

**ステップ2: トークン設定**
- トークン名・シンボル
- 初期供給量
- 推奨レート（1時間の農作業 = XX トークン）

**ステップ3: ブランド設定**
- ロゴアップロード
- プライマリカラー・セカンダリカラー

**ステップ4: コントラクトデプロイ**
- MetaMask で署名 → CommunityFactory.createCommunity() 実行
- デプロイ進捗表示
- 完了 → コミュニティ URL を表示

### 4.3 テナント内 UI の変更

#### コミュニティコンテキスト

```javascript
// src/context/CommunityContext.jsx

const CommunityContext = createContext()

export function CommunityProvider({ children }) {
  const [community, setCommunity] = useState(null)

  useEffect(() => {
    // サブドメインまたは URL からコミュニティを解決
    const slug = resolveCommunitySlug()
    if (slug) {
      api.get(`/community/info?community=${slug}`)
        .then(setCommunity)
    }
  }, [])

  return (
    <CommunityContext.Provider value={{ community }}>
      {children}
    </CommunityContext.Provider>
  )
}
```

#### 動的テーマ

```javascript
// コミュニティのカラーテーマを CSS 変数に反映
useEffect(() => {
  if (community) {
    document.documentElement.style.setProperty('--color-primary', community.color_primary)
    document.documentElement.style.setProperty('--color-secondary', community.color_secondary)
  }
}, [community])
```

#### コントラクトアドレスの動的解決

```javascript
// 現在: ハードコード
export const CONTRACTS = { YuiToken: '0x414e...' }

// 変更後: コミュニティごとに動的取得
export function useContracts() {
  const { community } = useCommunity()
  return {
    YuiToken: community?.contract_address,
    MembershipSBT: community?.sbt_contract_address,
  }
}
```

### 4.4 テナント内管理画面

**URL**: `{slug}.yui-community.io` → プロフィール → コミュニティ管理

| 画面 | 機能 | 権限 |
|------|------|------|
| メンバー管理 | 一覧・招待・role 変更・除外 | operator 以上 |
| コミュニティ設定 | 名前・ロゴ・カラー・レート設定 | admin のみ |
| 統計ダッシュボード | 取引量・アクティブユーザー・トークン流通 | operator 以上 |
| トークン管理 | mint（新規発行）・焼却 | admin のみ |

### 4.5 プラットフォーム管理画面

**URL**: `admin.yui-community.io`（または `/platform-admin`）

| 画面 | 機能 |
|------|------|
| コミュニティ一覧 | 全テナントの状態・メンバー数・取引量 |
| コミュニティ詳細 | 設定確認・停止・再開 |
| プラットフォーム統計 | 総コミュニティ数・総ユーザー数・総取引量 |

---

## 5. 実装タスク

### Phase 1-A: スマートコントラクト

| # | タスク | ブランチ | 見積もり |
|---|-------|---------|---------|
| 1-A-1 | CommunityToken.sol 汎用化（name/symbol 引数化） | `feature/mt-token` | 2h |
| 1-A-2 | CommunityFactory.sol 実装 | `feature/mt-factory` | 4h |
| 1-A-3 | CommunityRegistry.sol 実装 | `feature/mt-registry` | 2h |
| 1-A-4 | テスト作成（Factory + Registry + Token） | `feature/mt-factory` | 3h |
| 1-A-5 | テストネットデプロイ + 検証 | `feature/mt-factory` | 1h |

### Phase 1-B: バックエンド

| # | タスク | ブランチ | 見積もり |
|---|-------|---------|---------|
| 1-B-1 | DB マイグレーション（communities 拡張 + community_members.role + contract_registry） | `feature/mt-schema` | 2h |
| 1-B-2 | テナントミドルウェア（ResolveTenant） | `feature/mt-middleware` | 3h |
| 1-B-3 | 認可ミドルウェア（EnsureRole） | `feature/mt-middleware` | 2h |
| 1-B-4 | プラットフォーム管理 API | `feature/mt-platform-api` | 3h |
| 1-B-5 | テナント内管理 API（メンバー管理・設定・統計） | `feature/mt-tenant-api` | 4h |
| 1-B-6 | 既存 API のテナントスコープ対応 | `feature/mt-scope` | 3h |

### Phase 1-C: フロントエンド

| # | タスク | ブランチ | 見積もり |
|---|-------|---------|---------|
| 1-C-1 | CommunityContext + 動的テーマ | `feature/mt-context` | 3h |
| 1-C-2 | ランディングページ（コミュニティ一覧） | `feature/mt-landing` | 4h |
| 1-C-3 | コミュニティ作成ウィザード | `feature/mt-onboarding` | 6h |
| 1-C-4 | テナント内管理画面（メンバー・設定・統計） | `feature/mt-admin` | 6h |
| 1-C-5 | コントラクトアドレス動的解決 | `feature/mt-contracts` | 2h |
| 1-C-6 | API クライアントのテナント対応 | `feature/mt-api` | 2h |

### 合計見積もり

| カテゴリ | 時間 |
|---------|------|
| スマートコントラクト | 12h |
| バックエンド | 17h |
| フロントエンド | 23h |
| **合計** | **52h** |

---

## 6. マイグレーション戦略

### 既存データの移行

フェーズ0で作成した既存のシングルテナントデータを、マルチテナント構造に移行する。

1. 既存の `communities` レコードがデフォルトテナントになる
2. 既存ユーザーは `community_members` に `role: member` で登録
3. 既存のコントラクトアドレスを `contract_registry` に登録
4. 既存の API クライアントはデフォルトテナントにフォールバック

### 後方互換性

- テナントが解決できない場合、デフォルトコミュニティにフォールバック（フェーズ0互換）
- 既存の Vercel URL（`yui-community-io.vercel.app`）はデフォルトテナントとして動作し続ける

---

## 7. デプロイ戦略

| 環境 | URL | 用途 |
|------|-----|------|
| プラットフォーム | `yui-community.io` | ランディング・コミュニティ一覧・作成 |
| テナント | `{slug}.yui-community.io` | 各コミュニティの専用サイト |
| API | `api.yui-community.io` | バックエンド API |
| 管理 | `admin.yui-community.io` | プラットフォーム管理 |

Vercel のワイルドカードドメイン（`*.yui-community.io`）を設定し、サブドメインをフロントエンドで解決する。

---

## 8. セキュリティ考慮事項

| リスク | 対策 |
|-------|------|
| テナント間のデータ漏洩 | テナントミドルウェアで全クエリにスコープ強制 |
| 不正なコミュニティ作成 | CommunityFactory にデプロイ制限（ガス代が抑止力） |
| 権限エスカレーション | community_members.role による API レベルの認可チェック |
| コントラクトの脆弱性 | OpenZeppelin ベース + テスト + 監査（フェーズ2以降） |
