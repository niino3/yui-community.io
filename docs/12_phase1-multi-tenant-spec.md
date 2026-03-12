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

### 4.4 3サイト構成（実装済み 2026-03-12）

3つのアクターに対応する3つの独立したサイトとして実装。

| サイト | アクター | URL（開発） | レイアウト |
|--------|---------|------------|-----------|
| Site 1: Platform Admin | Service Owner | `http://localhost:5173/` | デスクトップ フルページ |
| Site 2: Community Admin | Community Owner | `/?community={slug}&admin=true` | デスクトップ フルページ |
| Site 3: Community App | Community Member | `/?community={slug}` | モバイルフレーム |

**判定ロジック（`App.jsx`）:**
1. slug なし → Site 1（`LandingPage`）
2. slug あり + `admin=true` → Site 2（`TenantAdmin` フルページ）
3. slug あり → Site 3（モバイルアプリ）

### 4.5 Site 1: プラットフォーム管理画面

**画面構成:**
- `LandingPage.jsx` — コミュニティ一覧・作成/管理画面への入口
- `PlatformAdmin.jsx` — 全コミュニティの管理（一覧・統計・有効無効切替・削除・編集）
- `CreateCommunity.jsx` — コミュニティの新規作成・編集（4ステップウィザード）

### 4.6 Site 2: テナント内管理画面

**画面**: `TenantAdmin.jsx`（6タブ構成）

| タブ | 機能 | 権限 |
|------|------|------|
| ダッシュボード | 統計カード・トークン流通グラフ | operator 以上 |
| タスク管理 | タスク一覧・ステータス管理 | operator 以上 |
| 農機具管理 | 農機具の登録・一覧・状態管理 | operator 以上 |
| Earth Care | 環境活動の一覧・承認 | operator 以上 |
| メンバー | メンバー一覧・ロール変更・招待 | admin のみ |
| 設定 | コミュニティ設定・コントラクト情報 | admin のみ |

### 4.7 Site 3: コミュニティアプリ

モバイルフレーム内のタブナビゲーションで動作。

| タブ | 画面 |
|------|------|
| ホーム | 残高・通知・取引・クイックアクション |
| 掲示板 | タスク一覧・投稿・詳細 |
| QR | QR決済 |
| 農機具 | 共有農機具一覧・詳細・予約 |
| マイページ | プロフィール・SBT・取引履歴 |

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

---

## 9. 実装ロードマップ（2026-03-11〜）

**ブランチ**: `feature/multi-tenant`
**開始日**: 2026-03-11
**推定完了**: 52時間（約7営業日）

### 9.1 実装フェーズ

#### Phase 1-A: スマートコントラクト（12h）

| タスクID | タスク | 見積 | 担当ブランチ | 完了条件 |
|---------|-------|------|------------|---------|
| 1-A-1 | YuiToken → CommunityToken に汎用化 | 2h | `feature/mt-token` | name/symbol を引数で受け取るコンストラクタに変更 |
| 1-A-2 | CommunityFactory.sol 実装 | 4h | `feature/mt-factory` | createCommunity() でトークン+SBT をデプロイ |
| 1-A-3 | CommunityRegistry.sol 実装 | 2h | `feature/mt-registry` | 全コミュニティ情報を管理 |
| 1-A-4 | テスト作成（Hardhat） | 3h | `feature/mt-factory` | Factory + Registry + Token の統合テスト |
| 1-A-5 | Amoy テストネットデプロイ | 1h | `feature/mt-factory` | Factory/Registry をデプロイ + 検証 |

#### Phase 1-B: バックエンドAPI（17h）

| タスクID | タスク | 見積 | 担当ブランチ | 完了条件 |
|---------|-------|------|------------|---------|
| 1-B-1 | DB マイグレーション | 2h | `feature/mt-schema` | communities 拡張 + contract_registry + community_members.role |
| 1-B-2 | テナントミドルウェア（ResolveTenant） | 3h | `feature/mt-middleware` | サブドメイン/ヘッダー/クエリからテナント解決 |
| 1-B-3 | 認可ミドルウェア（EnsureRole） | 2h | `feature/mt-middleware` | role に応じた API アクセス制御 |
| 1-B-4 | プラットフォーム管理 API | 3h | `feature/mt-platform-api` | `/api/platform/communities` 系エンドポイント |
| 1-B-5 | テナント内管理 API | 4h | `feature/mt-tenant-api` | `/api/community/*` 系エンドポイント（メンバー・設定・統計） |
| 1-B-6 | 既存 API のテナントスコープ対応 | 3h | `feature/mt-scope` | tasks/transactions 等を community_id でスコープ |

#### Phase 1-C: フロントエンド（23h）

| タスクID | タスク | 見積 | 担当ブランチ | 完了条件 |
|---------|-------|------|------------|---------|
| 1-C-1 | CommunityContext + 動的テーマ | 3h | `feature/mt-context` | コミュニティ情報の取得 + CSS 変数への反映 |
| 1-C-2 | ランディングページ（コミュニティ一覧） | 4h | `feature/mt-landing` | yui-community.io でコミュニティカード一覧表示 |
| 1-C-3 | コミュニティ作成ウィザード | 6h | `feature/mt-onboarding` | 4ステップのウィザード + Factory 呼び出し |
| 1-C-4 | プラットフォーム管理画面 | 5h | `feature/mt-admin-platform` | admin.yui-community.io で全テナント管理 |
| 1-C-5 | テナント内管理画面 | 6h | `feature/mt-admin-tenant` | メンバー管理・設定・統計ダッシュボード |
| 1-C-6 | コントラクトアドレス動的解決 | 2h | `feature/mt-contracts` | useContracts() フックで動的にアドレス取得 |
| 1-C-7 | API クライアントのテナント対応 | 2h | `feature/mt-api` | X-Community-Slug ヘッダー追加 |

### 9.2 マージ戦略

```
サブブランチ → feature/multi-tenant → main
```

1. 各フェーズ（1-A, 1-B, 1-C）のタスクを並行開発可能な場合は並行実施
2. 各タスク完了時に `feature/multi-tenant` へマージ
3. 全タスク完了後、統合テスト → `main` へマージ
4. main マージ後、本番デプロイ

### 9.3 実装開始手順

```bash
# 1. ブランチ作成（完了済み）
git checkout -b feature/multi-tenant

# 2. Phase 1-A から着手
# contracts/contracts/CommunityToken.sol を作成
# contracts/contracts/CommunityFactory.sol を作成
# contracts/contracts/CommunityRegistry.sol を作成

# 3. テスト実行
cd contracts && npx hardhat test

# 4. Amoy デプロイ
npx hardhat run scripts/deploy-multi-tenant.js --network amoy
```

### 9.4 完了定義（Definition of Done）

各フェーズの完了条件:

**Phase 1-A 完了:**
- [ ] CommunityFactory/Registry が Amoy にデプロイ済み
- [ ] テストが全てパス（コミュニティ作成・複数テナント分離）
- [ ] Sourcify で検証済み

**Phase 1-B 完了:**
- [ ] テナントミドルウェアが正常動作
- [ ] プラットフォーム管理 API が動作
- [ ] 既存 API がテナントスコープで動作

**Phase 1-C 完了:**
- [x] ランディングページでコミュニティ一覧表示（2026-03-11）
- [x] コミュニティ作成ウィザード（4ステップ、編集モード対応）（2026-03-11）
- [x] プラットフォーム管理画面で全テナント管理可能（2026-03-11）
- [x] テナント内管理画面でメンバー・設定管理可能（2026-03-12）
- [x] 3サイト分離: Site 1 / Site 2 / Site 3 が独立したレイアウトで表示（2026-03-12）
- [x] CommunityContext + 動的テーマ（2026-03-11）
- [x] APIクライアントのテナント対応（X-Community-Slug）（2026-03-11）
- [x] コントラクトアドレス動的解決（useContracts）（2026-03-11）

**全体完了:**
- [ ] 3つのコミュニティを作成してテスト
- [ ] テナント間のデータ分離を確認
- [ ] パフォーマンステスト（100リクエスト/秒）
- [ ] セキュリティチェック（テナント漏洩・権限エスカレーション）

### 9.5 リスクと対策

| リスク | 影響度 | 対策 |
|-------|--------|------|
| Factory のガス代が高い | 中 | テストネットで事前検証、必要なら Minimal Proxy パターン導入 |
| サブドメインルーティングが複雑 | 中 | まずクエリパラメータで実装、後でサブドメイン対応 |
| 既存データの移行失敗 | 高 | マイグレーションスクリプトを事前テスト、ロールバック手順を用意 |
| テナント間データ漏洩 | 高 | 全 API にテナントスコープのテストを追加 |
