# オフチェーン/オンチェーン デュアル通貨 — 実装仕様書

**バージョン**: 0.1.0  
**作成日**: 2026-03-12  
**前提**: Phase 1（マルチテナント化）完了  
**参照**: [12_phase1-multi-tenant-spec.md](./12_phase1-multi-tenant-spec.md), [15_auth-notification-spec.md](./15_auth-notification-spec.md)

---

## 1. 課題と目標

### 1.1 現状の課題

現在のシステムはすべてブロックチェーン（Polygon）上のトークンで動作する。

| 課題 | 影響 |
|------|------|
| MetaMask のインストール・設定が必要 | 高齢農家には難しい |
| Polygon ネットワーク追加が必要 | 操作が煩雑 |
| ガス代（POL）が必要 | 少額でも「お金がかかる」心理的障壁 |
| 送金のたびに MetaMask 署名 | 体験が途切れる |

### 1.2 目標

- **オフチェーンポイント**を標準通貨とし、ウォレット不要で誰でもすぐ参加できるようにする
- コミュニティが成熟したタイミングで、**オンチェーントークンへの一括移行**をサポートする
- 将来的に**外部ポイントシステム**（地域通貨、企業ポイント等）への移行も設計上考慮する
- UI は通貨モードに依存せず、同じ操作感を維持する

---

## 2. アーキテクチャ

### 2.1 CurrencyAdapter パターン

通貨に関するすべての操作を抽象レイヤーで統一し、裏側の実装を差し替え可能にする。

```
┌─────────────────────────────────────────────────────────┐
│                     フロントエンド UI                      │
│   (Home, QRScan, TokenTransfer, TaskDetail, etc.)       │
└───────────────────────┬─────────────────────────────────┘
                        │ useCurrency()
┌───────────────────────▼─────────────────────────────────┐
│                  CurrencyAdapter (抽象)                   │
│   getBalance / transfer / getHistory / mint              │
├──────────────┬──────────────┬───────────────────────────┤
│  Offchain    │  OnChain     │  External (将来)           │
│  Adapter     │  Adapter     │  Adapter                  │
│              │              │                           │
│  PostgreSQL  │  ERC-20      │  PayPay / 地域通貨 /       │
│  wallets     │  wagmi/viem  │  Vポイント etc.            │
│  テーブル     │  MetaMask    │  外部 API                 │
└──────────────┴──────────────┴───────────────────────────┘
```

### 2.2 コミュニティのライフサイクル

```
作成時                     運用中                    移行
┌──────────┐         ┌──────────────┐         ┌──────────────┐
│ offchain │ ──→    │ オフチェーンで │ ──→    │ オンチェーンに │
│ (デフォルト) │         │ 日常運用      │         │ 一括移行      │
└──────────┘         └──────────────┘         └──────────────┘
                      ウォレット不要              全員ウォレット接続
                      ガス代不要                 コントラクトデプロイ
                      DB で残高管理              DB残高→トークンmint
                                                移行後は不可逆
```

### 2.3 通貨モード

| モード | 残高管理 | 送金 | 認証 | ガス代 |
|--------|---------|------|------|--------|
| `offchain` | PostgreSQL `wallets` テーブル | API コール（DB トランザクション） | メール/LINE/Google（Privy） | 不要 |
| `onchain` | ERC-20 トークン（Polygon） | MetaMask / 埋め込みウォレット署名 | ウォレット署名 | 必要（POL） |

---

## 3. データベース設計

### 3.1 communities テーブル（追加カラム）

```sql
ALTER TABLE communities ADD COLUMN currency_mode VARCHAR(20) NOT NULL DEFAULT 'offchain';
ALTER TABLE communities ADD COLUMN migrated_at TIMESTAMP NULL;
ALTER TABLE communities ADD COLUMN migration_tx_hash VARCHAR(66) NULL;
-- currency_mode: 'offchain' | 'onchain'
-- migrated_at: オンチェーン移行完了日時
-- migration_tx_hash: 移行時のトランザクションハッシュ
```

### 3.2 wallets テーブル（新規）

オフチェーンモード時のユーザー残高を管理する。

```sql
CREATE TABLE wallets (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id),
    community_id    BIGINT NOT NULL REFERENCES communities(id),
    balance         DECIMAL(18, 4) NOT NULL DEFAULT 0,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),

    UNIQUE (user_id, community_id),
    CHECK (balance >= 0)
);

CREATE INDEX idx_wallets_community ON wallets(community_id);
CREATE INDEX idx_wallets_user ON wallets(user_id);
```

### 3.3 point_transactions テーブル（新規）

オフチェーンモード時の取引履歴。

```sql
CREATE TABLE point_transactions (
    id              BIGSERIAL PRIMARY KEY,
    community_id    BIGINT NOT NULL REFERENCES communities(id),
    from_user_id    BIGINT NULL REFERENCES users(id),  -- NULL = システムmint
    to_user_id      BIGINT NOT NULL REFERENCES users(id),
    amount          DECIMAL(18, 4) NOT NULL,
    type            VARCHAR(30) NOT NULL,
    -- type: 'mint' | 'transfer' | 'qr_payment' | 'task_reward' | 'equipment_rental' | 'migration_burn'
    note            TEXT NULL,
    metadata        JSONB NULL,   -- タスクID、QRデータ等の付加情報
    created_at      TIMESTAMP DEFAULT NOW(),

    CHECK (amount > 0)
);

CREATE INDEX idx_pt_community ON point_transactions(community_id);
CREATE INDEX idx_pt_from ON point_transactions(from_user_id);
CREATE INDEX idx_pt_to ON point_transactions(to_user_id);
CREATE INDEX idx_pt_type ON point_transactions(type);
CREATE INDEX idx_pt_created ON point_transactions(created_at);
```

---

## 4. バックエンド

### 4.1 CurrencyService

通貨操作を抽象化するサービスクラス。

```php
// app/Services/CurrencyService.php

class CurrencyService
{
    public function getAdapter(Community $community): CurrencyAdapterInterface
    {
        return match ($community->currency_mode) {
            'offchain' => new OffchainAdapter($community),
            'onchain'  => new OnchainAdapter($community),
            default    => throw new \InvalidArgumentException("Unknown currency mode"),
        };
    }
}

// app/Services/Currency/CurrencyAdapterInterface.php

interface CurrencyAdapterInterface
{
    public function getBalance(User $user): string;
    public function transfer(User $from, User $to, string $amount, string $type, ?string $note = null): array;
    public function mint(User $to, string $amount, ?string $note = null): array;
    public function getHistory(User $user, int $limit = 20, int $offset = 0): array;
    public function getCirculatingSupply(): string;
    public function canMigrate(): array;  // ['ready' => bool, 'issues' => [...]]
}
```

### 4.2 OffchainAdapter

```php
// app/Services/Currency/OffchainAdapter.php

class OffchainAdapter implements CurrencyAdapterInterface
{
    public function getBalance(User $user): string
    {
        $wallet = Wallet::firstOrCreate(
            ['user_id' => $user->id, 'community_id' => $this->community->id],
            ['balance' => 0]
        );
        return $wallet->balance;
    }

    public function transfer(User $from, User $to, string $amount, string $type, ?string $note = null): array
    {
        return DB::transaction(function () use ($from, $to, $amount, $type, $note) {
            $fromWallet = Wallet::where('user_id', $from->id)
                ->where('community_id', $this->community->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($fromWallet->balance < $amount) {
                throw new InsufficientBalanceException('残高が不足しています');
            }

            $toWallet = Wallet::firstOrCreate(
                ['user_id' => $to->id, 'community_id' => $this->community->id],
                ['balance' => 0]
            );

            $fromWallet->decrement('balance', $amount);
            $toWallet->increment('balance', $amount);

            $tx = PointTransaction::create([
                'community_id' => $this->community->id,
                'from_user_id' => $from->id,
                'to_user_id'   => $to->id,
                'amount'       => $amount,
                'type'         => $type,
                'note'         => $note,
            ]);

            return ['transaction_id' => $tx->id, 'from_balance' => $fromWallet->fresh()->balance];
        });
    }

    public function mint(User $to, string $amount, ?string $note = null): array
    {
        $wallet = Wallet::firstOrCreate(
            ['user_id' => $to->id, 'community_id' => $this->community->id],
            ['balance' => 0]
        );
        $wallet->increment('balance', $amount);

        $tx = PointTransaction::create([
            'community_id' => $this->community->id,
            'from_user_id' => null,
            'to_user_id'   => $to->id,
            'amount'       => $amount,
            'type'         => 'mint',
            'note'         => $note,
        ]);

        return ['transaction_id' => $tx->id, 'balance' => $wallet->fresh()->balance];
    }

    public function getHistory(User $user, int $limit = 20, int $offset = 0): array
    {
        return PointTransaction::where('community_id', $this->community->id)
            ->where(fn ($q) => $q->where('from_user_id', $user->id)
                                 ->orWhere('to_user_id', $user->id))
            ->orderByDesc('created_at')
            ->skip($offset)
            ->take($limit)
            ->get()
            ->toArray();
    }
}
```

### 4.3 OnchainAdapter

```php
// app/Services/Currency/OnchainAdapter.php

class OnchainAdapter implements CurrencyAdapterInterface
{
    // オンチェーンの残高・送金は基本的にフロントエンドから直接実行される。
    // バックエンド側は記録・検証の役割。

    public function getBalance(User $user): string
    {
        // Polygon RPC 経由でトークン残高を取得
        // または IndexDB / The Graph から取得
        return $this->rpcCall('balanceOf', $user->wallet_address);
    }

    public function transfer(User $from, User $to, string $amount, string $type, ?string $note = null): array
    {
        // オンチェーン送金はフロントエンドから実行される
        // バックエンドは tx_hash を受け取って検証・記録する
        throw new \BadMethodCallException(
            'On-chain transfers are initiated from the frontend. Use recordTransaction() instead.'
        );
    }

    public function getHistory(User $user, int $limit = 20, int $offset = 0): array
    {
        // DB に記録されたトランザクション + オンチェーンイベントログ
        return Transaction::where('community_id', $this->community->id)
            ->where(fn ($q) => $q->where('from_address', $user->wallet_address)
                                 ->orWhere('to_address', $user->wallet_address))
            ->orderByDesc('created_at')
            ->skip($offset)
            ->take($limit)
            ->get()
            ->toArray();
    }
}
```

### 4.4 API エンドポイント

#### 通貨操作 API（テナントミドルウェア経由）

| メソッド | パス | 機能 | モード |
|---------|------|------|--------|
| GET | `/api/wallet/balance` | 残高取得 | 両方 |
| POST | `/api/wallet/transfer` | 送金（ユーザー間） | offchain |
| POST | `/api/wallet/mint` | ポイント発行（admin） | offchain |
| GET | `/api/wallet/history` | 取引履歴 | 両方 |
| GET | `/api/wallet/stats` | 流通量・統計 | 両方 |

#### 移行 API（admin のみ）

| メソッド | パス | 機能 |
|---------|------|------|
| GET | `/api/migration/status` | 移行準備状況チェック |
| POST | `/api/migration/prepare` | 移行準備（全メンバーのウォレット状況確認） |
| POST | `/api/migration/execute` | 移行実行（残高を確定 → currency_mode 切替） |
| GET | `/api/migration/history` | オフチェーン期間の取引履歴（移行後も参照可能） |

### 4.5 移行コントローラー

```php
// app/Http/Controllers/MigrationController.php

class MigrationController extends Controller
{
    public function status(Request $request)
    {
        $community = app('current_community');

        if ($community->currency_mode !== 'offchain') {
            return response()->json(['message' => 'すでにオンチェーンに移行済みです'], 400);
        }

        $members = $community->members()->get();
        $walletsReady = $members->filter(fn ($m) => $m->wallet_address !== null)->count();
        $totalMembers = $members->count();

        $wallets = Wallet::where('community_id', $community->id)->get();
        $totalSupply = $wallets->sum('balance');

        $issues = [];
        if ($walletsReady < $totalMembers) {
            $issues[] = sprintf(
                '%d/%d 名がウォレット未接続です',
                $totalMembers - $walletsReady,
                $totalMembers
            );
        }
        if (!$community->token_address) {
            $issues[] = 'コントラクトが未デプロイです';
        }

        return response()->json([
            'ready' => empty($issues),
            'members_total' => $totalMembers,
            'wallets_ready' => $walletsReady,
            'total_supply' => $totalSupply,
            'issues' => $issues,
        ]);
    }

    public function execute(Request $request)
    {
        $community = app('current_community');

        // 移行前チェック（全メンバーがウォレット接続済み、コントラクトデプロイ済み）
        // 各メンバーの DB 残高を確定
        // フロントエンドが各メンバーへ mint するための残高リストを返す
        // フロントエンドで mint 完了後、confirm エンドポイントで currency_mode を切替

        $wallets = Wallet::where('community_id', $community->id)
            ->where('balance', '>', 0)
            ->with('user')
            ->get();

        $mintList = $wallets->map(fn ($w) => [
            'user_id' => $w->user_id,
            'wallet_address' => $w->user->wallet_address,
            'amount' => $w->balance,
        ]);

        return response()->json([
            'mint_list' => $mintList,
            'total_supply' => $wallets->sum('balance'),
            'token_address' => $community->token_address,
        ]);
    }

    public function confirm(Request $request)
    {
        $community = app('current_community');

        $community->update([
            'currency_mode' => 'onchain',
            'migrated_at' => now(),
            'migration_tx_hash' => $request->input('tx_hash'),
        ]);

        // オフチェーン残高を全て migration_burn として記録
        $wallets = Wallet::where('community_id', $community->id)
            ->where('balance', '>', 0)
            ->get();

        foreach ($wallets as $wallet) {
            PointTransaction::create([
                'community_id' => $community->id,
                'from_user_id' => $wallet->user_id,
                'to_user_id'   => $wallet->user_id,
                'amount'       => $wallet->balance,
                'type'         => 'migration_burn',
                'note'         => 'オンチェーン移行による残高移転',
            ]);
            $wallet->update(['balance' => 0]);
        }

        return response()->json(['message' => 'オンチェーン移行が完了しました']);
    }
}
```

---

## 5. フロントエンド

### 5.1 useCurrency フック

UI コンポーネントが通貨モードを意識せずに使えるフック。

```javascript
// src/hooks/useCurrency.js

import { useCommunity } from '../context/CommunityContext'
import { useAuth } from '../context/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

export function useCurrency() {
  const { community } = useCommunity()
  const isOnChain = community?.currency_mode === 'onchain'
  return { isOnChain, currencyMode: community?.currency_mode }
}

export function useBalance() {
  const { community } = useCommunity()
  const { isOnChain } = useCurrency()

  // オフチェーン: バックエンド API から取得
  const offchainQuery = useQuery({
    queryKey: ['wallet-balance', community?.id],
    queryFn: () => api.get('/wallet/balance'),
    enabled: !isOnChain && !!community?.id,
  })

  // オンチェーン: 既存の useYuiBalance フックにフォールバック
  // （wagmi の useBalance で ERC-20 残高を取得）

  if (isOnChain) {
    return { balance: null, isOnChain: true }
    // オンチェーン残高は useYuiBalance で取得（既存実装を維持）
  }

  return {
    balance: offchainQuery.data?.balance ?? '0',
    isLoading: offchainQuery.isLoading,
    isOnChain: false,
  }
}

export function useTransfer() {
  const { isOnChain } = useCurrency()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ toUserId, amount, type, note }) => {
      if (isOnChain) {
        throw new Error('On-chain transfers use MetaMask directly')
      }
      return api.post('/wallet/transfer', {
        to_user_id: toUserId,
        amount,
        type: type || 'transfer',
        note,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet-balance'] })
      qc.invalidateQueries({ queryKey: ['wallet-history'] })
    },
  })
}

export function usePointHistory(limit = 20) {
  const { community } = useCommunity()

  return useQuery({
    queryKey: ['wallet-history', community?.id, limit],
    queryFn: () => api.get(`/wallet/history?limit=${limit}`),
    enabled: !!community?.id,
  })
}

export function useMint() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ toUserId, amount, note }) =>
      api.post('/wallet/mint', { to_user_id: toUserId, amount, note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet-balance'] })
      qc.invalidateQueries({ queryKey: ['wallet-history'] })
    },
  })
}
```

### 5.2 UI の変更箇所

通貨モードによって切り替える画面:

| 画面 | offchain | onchain |
|------|----------|---------|
| Home（残高表示） | `useBalance()` → API | `useYuiBalance()` → wagmi |
| QR 決済 | API 送金 → 即時完了 | MetaMask 署名 → ブロック確認 |
| 手動送金 | ユーザーID指定 + API | ウォレットアドレス + MetaMask |
| タスク報酬 | 承認時に API で自動送金 | 承認時に MetaMask で送金 |
| 残高一覧（管理者） | `wallets` テーブルから集計 | オンチェーン残高をRPC取得 |

### 5.3 モード別 UI 差分

```jsx
// 例: QRScan.jsx での分岐

function QRPayment({ recipient, amount }) {
  const { isOnChain } = useCurrency()
  const offchainTransfer = useTransfer()

  if (isOnChain) {
    // 既存のオンチェーン決済フロー（MetaMask署名）
    return <OnChainPayment recipient={recipient} amount={amount} />
  }

  // オフチェーン決済（API コール、署名不要）
  const handlePay = async () => {
    await offchainTransfer.mutateAsync({
      toUserId: recipient.id,
      amount,
      type: 'qr_payment',
    })
  }

  return (
    <button onClick={handlePay} disabled={offchainTransfer.isPending}>
      {offchainTransfer.isPending ? '処理中...' : `${amount} ポイントを支払う`}
    </button>
  )
}
```

### 5.4 通貨名の表示

オフチェーンモードでは「ポイント」、オンチェーンモードではトークンシンボルを表示。

```javascript
export function useCurrencyLabel() {
  const { community } = useCommunity()
  const { isOnChain } = useCurrency()

  if (isOnChain) {
    return community?.token_symbol || 'YUI'
  }
  return community?.token_symbol ? `${community.token_symbol}ポイント` : 'ポイント'
}

// 使用例:
// const label = useCurrencyLabel()
// <span>{balance} {label}</span>
// → "150 HKDポイント"（offchain）
// → "150 HKD"（onchain）
```

---

## 6. オンチェーン移行プロセス

### 6.1 移行フロー（詳細）

```
Step 1: 管理者が「移行準備」を開始
        GET /api/migration/status
        → メンバーのウォレット接続状況・残高サマリーを確認

Step 2: 全メンバーにウォレット接続を案内
        → Privy の埋め込みウォレット自動作成が理想的
        → または MetaMask インストールを案内

Step 3: コントラクトデプロイ
        → CommunityFactory.createCommunity() を管理者が実行
        → CommunityToken + CommunitySBT がデプロイされる

Step 4: 移行実行
        POST /api/migration/execute
        → 各メンバーの DB 残高リスト（mint_list）を取得

Step 5: オンチェーン mint（フロントエンドから実行）
        → mint_list の各エントリに対して CommunityToken.mint() を実行
        → 管理者のウォレットから署名（バッチ処理）

Step 6: 移行確定
        POST /api/migration/confirm { tx_hash }
        → currency_mode を 'onchain' に変更
        → DB 残高を 0 に（migration_burn として記録）
        → 以降の通貨操作はすべてオンチェーン
```

### 6.2 移行 UI

TenantAdmin の「設定」タブに移行セクションを追加。

```
┌─────────────────────────────────────────────────┐
│ 💱 通貨モード: オフチェーンポイント                    │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ オンチェーン移行                               │ │
│ │                                             │ │
│ │ メンバー:  28/28 ウォレット接続済み ✅           │ │
│ │ 総流通量:  4,250 HKDポイント                  │ │
│ │ コントラクト: 未デプロイ ❌                     │ │
│ │                                             │ │
│ │ [ コントラクトをデプロイ ]                      │ │
│ │ [ 移行を実行 ] (条件未達のためグレーアウト)       │ │
│ │                                             │ │
│ │ ⚠️ 移行は不可逆です。実行後はオフチェーンに      │ │
│ │    戻すことはできません。                       │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 7. 将来の拡張: 外部ポイント連携

### 7.1 設計上の考慮

CurrencyAdapter パターンにより、将来的に以下の移行先を追加できる。

```php
// 将来の拡張例
return match ($community->currency_mode) {
    'offchain'  => new OffchainAdapter($community),
    'onchain'   => new OnchainAdapter($community),
    'paypay'    => new PayPayAdapter($community),      // 将来
    'line_pay'  => new LinePayAdapter($community),     // 将来
    'regional'  => new RegionalCurrencyAdapter($community), // 将来
    default     => throw new \InvalidArgumentException("Unknown currency mode"),
};
```

### 7.2 外部連携の現実的なロードマップ

| 段階 | 連携先 | 難易度 | 前提条件 |
|------|--------|--------|---------|
| Phase 1 | オフチェーン → オンチェーン | 低 | ウォレット接続のみ |
| Phase 2 | 地域通貨プラットフォーム | 中 | API 連携契約 |
| Phase 3 | PayPay / LINE Pay | 高 | 法人設立 + 加盟店契約 |
| Phase 4 | Vポイント / 楽天ポイント | 高 | パートナー契約 |

### 7.3 法的考慮事項

| 通貨モード | 法的分類（推定） | 規制 |
|-----------|----------------|------|
| offchain（コミュニティ内限定） | 対象外の可能性が高い | 特になし |
| onchain（ERC-20、換金不可） | 暗号資産に該当しない可能性 | 要確認 |
| 外部ポイント交換可能 | 前払式支払手段 or 為替取引 | 資金決済法の対象になりうる |

> **注意**: 外部ポイントへの交換を実装する前に、弁護士に法的確認を取ること。

---

## 8. 実装タスク

### Phase DC-A: バックエンド（オフチェーン通貨基盤）

| # | タスク | 見積もり |
|---|-------|---------|
| DC-A-1 | DB マイグレーション（wallets + point_transactions + communities.currency_mode） | 2h |
| DC-A-2 | CurrencyAdapterInterface + OffchainAdapter 実装 | 4h |
| DC-A-3 | 通貨 API エンドポイント（balance / transfer / mint / history） | 4h |
| DC-A-4 | タスク報酬の自動送金（承認時に OffchainAdapter.transfer） | 2h |
| DC-A-5 | QR 決済の offchain 対応（API 経由の即時送金） | 2h |
| | **小計** | **14h** |

### Phase DC-B: フロントエンド（通貨抽象化）

| # | タスク | 見積もり |
|---|-------|---------|
| DC-B-1 | useCurrency / useBalance / useTransfer / usePointHistory フック | 3h |
| DC-B-2 | Home.jsx の残高表示を通貨モード対応 | 2h |
| DC-B-3 | QRScan.jsx のオフチェーン決済対応 | 3h |
| DC-B-4 | TokenTransfer.jsx のオフチェーン送金対応 | 2h |
| DC-B-5 | TaskDetail.jsx / ApproveWork.jsx の報酬送金対応 | 2h |
| DC-B-6 | 通貨ラベル表示（ポイント / トークン）の統一 | 1h |
| DC-B-7 | TenantAdmin に残高管理・ポイント発行 UI 追加 | 3h |
| | **小計** | **16h** |

### Phase DC-C: オンチェーン移行機能

| # | タスク | 見積もり |
|---|-------|---------|
| DC-C-1 | MigrationController（status / execute / confirm） | 3h |
| DC-C-2 | 移行 UI（TenantAdmin 設定タブ内） | 4h |
| DC-C-3 | バッチ mint スクリプト（フロントエンドから Factory 呼び出し） | 3h |
| DC-C-4 | 移行テスト（オフチェーン残高 → オンチェーン mint → モード切替） | 2h |
| | **小計** | **12h** |

### 合計見積もり

| カテゴリ | 時間 |
|---------|------|
| バックエンド（DC-A） | 14h |
| フロントエンド（DC-B） | 16h |
| 移行機能（DC-C） | 12h |
| **合計** | **42h** |

---

## 9. 実装順序（推奨）

```
DC-A-1 DBマイグレーション
  ↓
DC-A-2 CurrencyAdapter + OffchainAdapter
  ↓
DC-A-3 通貨 API
  ↓
DC-B-1 フロントエンドフック
  ↓
DC-B-2〜B-6 各画面のオフチェーン対応（並行可能）
  ↓
DC-A-4, A-5 タスク報酬・QR決済のバックエンド統合
  ↓
DC-B-7 管理画面 UI
  ↓
DC-C-1〜C-4 移行機能（オフチェーンが安定してから）
```

### 依存関係

- **DC-B は DC-A-3 に依存**: フロントエンドフックはバックエンド API が必要
- **DC-C は DC-A + DC-B 完了後**: 移行機能はオフチェーン運用が安定してから
- **DC-C-3 は Phase 1-A（スマートコントラクト）に依存**: mint には CommunityToken のデプロイが必要
- **Privy 統合（docs/15）との連携推奨**: オフチェーンモードではウォレット不要なので、Privy のメール/LINE 認証と相性が良い

---

## 10. コミュニティ作成ウィザードへの影響

CreateCommunity のステップ2「トークン設定」を通貨モード選択に変更。

```
ステップ2: 通貨設定

  ○ オフチェーンポイント（推奨）
    ウォレット不要。メンバーはすぐに参加できます。
    後からブロックチェーンに移行できます。

  ○ オンチェーントークン
    ブロックチェーン上のトークン。MetaMask が必要です。
    改ざん不可能な取引記録が残ります。

  ─────────────────────────────────

  通貨名: [ Hokkaido Community Dollar ]
  シンボル: [ HKD ]
  初期発行量: [ 10,000 ]
  推奨レート: [ 1時間の農作業 = 10 HKD（ポイント） ]
```

---

## 11. セキュリティ考慮事項

| リスク | 対策 |
|-------|------|
| 二重送金（同時リクエスト） | `lockForUpdate()` でウォレット行をロック |
| マイナス残高 | DB の CHECK 制約 + アプリ層のバリデーション |
| 不正な mint | admin ロールのみ mint 可能 + 監査ログ |
| 移行中のデータ不整合 | 移行中は送金を一時停止（メンテナンスモード） |
| オフチェーン履歴の改ざん | point_transactions は INSERT のみ（UPDATE/DELETE 禁止） |
