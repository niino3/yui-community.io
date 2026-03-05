# 実装計画

**バージョン**: 0.1.0  
**作成日**: 2026-03-03  
**ステータス**: ドラフト

---

## 1. プロジェクト全体レイヤー

```
┌──────────────────────────────────────────────────────────────┐
│  L1: フロントエンド                                            │
│  React (Vite) → 将来 Next.js に移行                           │
│  Tailwind CSS / wagmi+viem / Privy or Web3Auth                │
├──────────────────────────────────────────────────────────────┤
│  L2: バックエンド                                              │
│  Laravel (PHP) + PostgreSQL + Redis                           │
│  オフチェーンデータ / マッチングロジック / 通知                     │
├──────────────────────────────────────────────────────────────┤
│  L3: ブロックチェーン (スマートコントラクト)                       │
│  Solidity + Hardhat + OpenZeppelin → Polygon                  │
├──────────────────────────────────────────────────────────────┤
│  L4: 物理世界接続 (Phygital)                                   │
│  QRコード / AIカメラ / IoTセンサー                               │
└──────────────────────────────────────────────────────────────┘
```

> **技術選定メモ**  
> - ドキュメント `03_technical-design.md` ではバックエンドに Node.js (Hono) を記載しているが、開発メンバーの Laravel 経験を考慮し **Laravel** を採用する。
> - フロントエンドは現在 React + Vite でプロトタイプを構築済み。Next.js への移行はフェーズ0後半〜フェーズ1で検討する。

---

## 2. 現在の進捗

### 完了済み

| # | 成果物 | レイヤー | 詳細 |
|---|--------|---------|------|
| 1 | UIプロトタイプ | L1 | 全16画面、iOS風画面遷移アニメーション付き。Vercel デプロイ済み（https://yui-community-io.vercel.app/） |
| 2 | プロジェクト設計ドキュメント | — | 01〜08 の設計ドキュメント一式 |
| 3 | スマートコントラクト最小検証 | L3 | YuiToken (ERC-20) + MembershipSBT (Soulbound)。テスト12件パス、ローカルデプロイ検証済み |
| 4 | 環境変数によるネットワーク切替 | L3 | localhost / amoy (テストネット) / polygon (本番) を `--network` で切替 |
| 5 | テストネットデプロイ | L3 | Polygon Amoy にデプロイ完了。YuiToken: `0x414e...f796`, MembershipSBT: `0x2317...0e15` |
| 6 | コントラクト検証 | L3 | Sourcify で YuiToken / MembershipSBT ともに検証済み |
| 7 | フロントエンド × コントラクト接続 | L1+L3 | wagmi+viem 導入、MetaMask 接続、オンチェーン残高表示、送金UI、SBT状態表示 |

### 未着手

| レイヤー | 未着手の主要項目 |
|---------|----------------|
| L1 | ~~ウォレット接続~~ ✅、~~コントラクト操作UI~~ ✅、Next.js移行 |
| L2 | バックエンド全体（DB設計、API、認証、通知） |
| L3 | テストネットデプロイ、ContributionSBT、EarthCareSBT、Escrow、Governance、Treasury、Demurrage |
| L4 | QRコード決済、AIカメラ、IoT（フェーズ2以降） |

---

## 3. フェーズ0: プロトタイプ（シングルテナント）

**目標**: 1つのパーマカルチャー教室（〜30名）で動作実証

### 3.1 マイルストーン一覧

```
M0: 設計・UIプロトタイプ .............. ✅ 完了
M1: コントラクト検証 .................. ✅ 完了（最小版）
M2: バックエンド基盤 .................. 未着手
M3: コントラクト → テストネット ........ ✅ 完了
M4: フロントエンド × コントラクト接続 ... ✅ 完了
M5: QR決済 MVP ....................... 未着手
M6: パーマカルチャー教室で試験運用 ..... 未着手
```

---

### M2: バックエンド基盤

**レイヤー**: L2  
**技術**: Laravel + PostgreSQL + Redis  
**ブランチ**: `feature/backend`  
**サブブランチ**:

| サブブランチ | タスク |
|------------|-------|
| `feature/backend-setup` | M2-1: Laravel プロジェクト作成 + Docker Compose |
| `feature/backend-db` | M2-2: DB マイグレーション |
| `feature/backend-auth` | M2-3: 認証 API（ウォレット署名検証） |
| `feature/backend-tasks` | M2-4: タスク CRUD API |
| `feature/backend-transactions` | M2-5: トランザクション記録 API |
| `feature/backend-equipment` | M2-6: 農機具管理 API |
| `feature/backend-earthcare` | M2-7: Earth Care API |
| `feature/backend-notifications` | M2-8: 通知 API |

> 各サブブランチは `feature/backend` から切り、完了後に `feature/backend` へマージ。  
> `feature/backend` が完成したら `main` へマージする。

#### DB設計（初期テーブル）

```
users
  id, wallet_address, display_name, avatar_url,
  email, line_id, role(member/operator/admin),
  created_at, updated_at

communities
  id, name, slug, token_name, token_symbol,
  contract_address, sbt_contract_address,
  demurrage_rate, created_at

community_members
  id, community_id, user_id, membership_sbt_token_id,
  joined_at, status(active/inactive)

tasks
  id, community_id, requester_id, worker_id,
  title, description, category(people_care/earth_care),
  token_reward, status(open/assigned/in_progress/completed/cancelled),
  location_lat, location_lng,
  started_at, completed_at, created_at

transactions
  id, community_id, from_user_id, to_user_id,
  amount, tx_type(mint/transfer/demurrage/escrow),
  tx_hash, status(pending/confirmed/failed),
  created_at

equipment
  id, community_id, name, description,
  qr_code, daily_rate_token,
  status(available/in_use/maintenance),
  created_at

equipment_reservations
  id, equipment_id, user_id,
  start_date, end_date, token_amount,
  status(reserved/active/returned/cancelled),
  created_at

earth_care_activities
  id, community_id, user_id,
  activity_type(composting/planting/pesticide_free/water_conservation),
  description, photo_hash, gps_lat, gps_lng,
  approval_count, status(pending/approved/rejected),
  sbt_token_id, created_at

notifications
  id, user_id, type, title, body,
  read_at, created_at
```

#### API エンドポイント（MVP）

| メソッド | パス | 機能 |
|---------|------|------|
| POST | `/api/auth/wallet` | ウォレットアドレスで認証（署名検証） |
| GET | `/api/users/me` | 自分のプロフィール・残高取得 |
| GET | `/api/tasks` | タスク一覧 |
| POST | `/api/tasks` | タスク投稿 |
| PATCH | `/api/tasks/{id}/assign` | タスクに応募 |
| PATCH | `/api/tasks/{id}/complete` | 作業完了報告 |
| PATCH | `/api/tasks/{id}/approve` | 依頼者が承認 → トークン送金トリガー |
| GET | `/api/transactions` | 取引履歴 |
| GET | `/api/equipment` | 農機具一覧 |
| POST | `/api/equipment/{id}/reserve` | 農機具予約 |
| GET | `/api/earth-care` | Earth Care 活動一覧 |
| POST | `/api/earth-care` | Earth Care 活動報告 |
| POST | `/api/earth-care/{id}/approve` | Earth Care 承認投票 |

#### 実装タスク

| # | タスク | 詳細 |
|---|-------|------|
| M2-1 | Laravel プロジェクト作成 | `backend/` ディレクトリに Laravel セットアップ、Docker Compose (PostgreSQL + Redis) |
| M2-2 | DB マイグレーション | 上記テーブルのマイグレーションファイル作成 |
| M2-3 | 認証 API | ウォレット署名検証（EIP-4361 / SIWE）またはPrivy連携 |
| M2-4 | タスク CRUD API | 投稿・一覧・応募・完了・承認 |
| M2-5 | トランザクション記録 API | オフチェーン残高管理 + オンチェーン連携 |
| M2-6 | 農機具管理 API | 一覧・予約・返却 |
| M2-7 | Earth Care API | 活動報告・承認投票 |
| M2-8 | 通知 API | プッシュ通知 / LINE Messaging API |

---

### M3: コントラクト → テストネットデプロイ

**レイヤー**: L3  
**ブランチ**: `feature/testnet-deploy`

| # | タスク | 詳細 |
|---|-------|------|
| M3-1 | Alchemy アカウント作成 | Polygon Amoy の RPC URL を取得 |
| M3-2 | テスト用ウォレット準備 | MetaMask でテスト用アカウント作成、Amoy faucet でテスト MATIC 取得 |
| M3-3 | `.env` 設定 | `PRIVATE_KEY` と `AMOY_RPC_URL` を設定 |
| M3-4 | テストネットデプロイ | `npx hardhat run scripts/deploy.js --network amoy` |
| M3-5 | Polygonscan で確認 | デプロイしたコントラクトをブラウザで確認 |
| M3-6 | コントラクト検証 | Polygonscan でソースコードを verify（`npx hardhat verify`） |

---

### M4: フロントエンド × コントラクト接続

**レイヤー**: L1 + L3  
**ブランチ**: `feature/wallet-connect`  
**サブブランチ**:

| サブブランチ | タスク |
|------------|-------|
| `feature/wallet-web3-libs` | M4-1 + M4-2: wagmi/viem + Privy/Web3Auth 導入 |
| `feature/wallet-token-ui` | M4-3〜M4-6: ABI読み込み・残高表示・送金・SBT表示 |

| # | タスク | 詳細 |
|---|-------|------|
| M4-1 | wagmi + viem 導入 | React アプリに Web3 ライブラリを追加 |
| M4-2 | Privy or Web3Auth 導入 | SNSログイン（LINE / Google）→ ウォレット自動生成 |
| M4-3 | コントラクト ABI の読み込み | Hardhat のコンパイル生成物からフロントエンドへ ABI をコピー |
| M4-4 | 残高表示 | `YuiToken.balanceOf()` をフロントエンドから呼び出し |
| M4-5 | トークン送金 UI | `YuiToken.transfer()` を MetaMask/Privy 経由で実行 |
| M4-6 | SBT 表示 | `MembershipSBT.balanceOf()` でメンバーシップ状態を表示 |

---

### M5: QR決済 MVP

**レイヤー**: L1 + L2 + L3  
**ブランチ**: `feature/qr-payment`  
**前提**: M2（バックエンド） + M4（ウォレット接続）が完了していること

| # | タスク | 詳細 |
|---|-------|------|
| M5-1 | QRコード生成 | `qrcode.react` でウォレットアドレス + 金額を埋め込んだ QR を生成 |
| M5-2 | QRコード読み取り | `html5-qrcode` でカメラスキャン → 送金画面へ遷移 |
| M5-3 | 送金確認画面 | 相手のアドレス・金額を表示 → 署名 → トークン送金 |
| M5-4 | 取引履歴連携 | オンチェーンの Transfer イベントをバックエンドに同期 |

---

### M6: 試験運用準備

**ブランチ**: `release/v0.1.0`  
**前提**: M5（QR決済 MVP）が完了していること

| # | タスク | 詳細 |
|---|-------|------|
| M6-1 | 本番デプロイ | Polygon 本番にコントラクトをデプロイ |
| M6-2 | フロントエンド本番ビルド | Vercel にデプロイ |
| M6-3 | バックエンド本番デプロイ | AWS / Railway / Fly.io 等にデプロイ |
| M6-4 | 運用マニュアル作成 | パーマカルチャー教室向けの利用ガイド |
| M6-5 | 30名でのテスト運用 | フィードバック収集 → 改善 |

---

## 4. フェーズ1: マルチテナント化（将来）

> フェーズ0で1コミュニティの動作実証が完了してから着手。

**ブランチ**: `feature/multi-tenant`

| # | タスク | レイヤー | ブランチ |
|---|-------|---------|---------|
| 1 | `CommunityFactory.sol` 実装 | L3 | `feature/mt-factory` |
| 2 | `CommunityRegistry.sol` 実装 | L3 | `feature/mt-registry` |
| 3 | PostgreSQL スキーマ分離 | L2 | `feature/mt-schema` |
| 4 | フロントエンド サブドメイン対応 | L1 | `feature/mt-subdomain` |
| 5 | コミュニティ作成オンボーディングフロー | L1 + L2 + L3 | `feature/mt-onboarding` |

---

## 5. フェーズ2: 信頼・Earth Care（将来）

**ブランチ**: `feature/trust-earthcare`

| # | タスク | レイヤー | ブランチ |
|---|-------|---------|---------|
| 1 | `ContributionSBT.sol` 実装 | L3 | `feature/contribution-sbt` |
| 2 | `EarthCareSBT.sol` + 検証ロジック | L3 | `feature/earthcare-sbt` |
| 3 | `Escrow.sol` 実装 | L3 | `feature/escrow` |
| 4 | `ReputationScore.sol` 実装 | L3 | `feature/reputation` |
| 5 | 信頼スコア表示 UI | L1 | `feature/trust-ui` |
| 6 | Earth Care 活動記録 UI（写真・GPS） | L1 + L2 | `feature/earthcare-ui` |
| 7 | コミュニティ Oracle（承認投票フロー） | L2 + L3 | `feature/oracle` |

---

## 6. フェーズ3: DAO・Fair Share（将来）

**ブランチ**: `feature/dao`

| # | タスク | レイヤー | ブランチ |
|---|-------|---------|---------|
| 1 | `GovernanceToken.sol` 実装 | L3 | `feature/dao-governance-token` |
| 2 | `Governance.sol` 実装（投票・提案） | L3 | `feature/dao-voting` |
| 3 | `Treasury.sol` 実装 | L3 | `feature/dao-treasury` |
| 4 | `CommunityToken.sol` に Demurrage 機能追加 | L3 | `feature/dao-demurrage` |
| 5 | トークン有効期限・自動消却 | L3 | `feature/dao-token-expiry` |
| 6 | 管理者ダッシュボード（トークン流通分析） | L1 + L2 | `feature/dao-dashboard` |

---

## 7. ブランチ戦略

### 命名規則

| プレフィックス | 用途 | 例 |
|-------------|------|---|
| `feature/` | 新機能開発 | `feature/backend-setup` |
| `fix/` | バグ修正 | `fix/token-transfer-error` |
| `release/` | リリース準備 | `release/v0.1.0` |

### ブランチツリー（フェーズ0）

```
main
 ├── feature/smart-contracts ........... ✅ M1 完了（コミット済み）
 │
 ├── feature/testnet-deploy ............ M3: テストネットデプロイ
 │
 ├── feature/backend ................... M2: バックエンド統合ブランチ
 │    ├── feature/backend-setup ........ M2-1: Laravel + Docker
 │    ├── feature/backend-db ........... M2-2: マイグレーション
 │    ├── feature/backend-auth ......... M2-3: 認証 API
 │    ├── feature/backend-tasks ........ M2-4: タスク API
 │    ├── feature/backend-transactions . M2-5: トランザクション API
 │    ├── feature/backend-equipment .... M2-6: 農機具 API
 │    ├── feature/backend-earthcare .... M2-7: Earth Care API
 │    └── feature/backend-notifications  M2-8: 通知 API
 │
 ├── feature/wallet-connect ............ M4: ウォレット接続統合ブランチ
 │    ├── feature/wallet-web3-libs ..... M4-1〜2: wagmi/Privy 導入
 │    └── feature/wallet-token-ui ...... M4-3〜6: トークン操作 UI
 │
 ├── feature/qr-payment ................ M5: QR決済 MVP
 │
 └── release/v0.1.0 .................... M6: 試験運用リリース
```

### マージフロー

```
サブブランチ → 統合ブランチ（feature/backend 等） → main
```

- サブブランチでの作業が完了したら、統合ブランチへ PR を作成してマージ
- 統合ブランチの全タスクが完了したら、main へ PR を作成してマージ
- main は常にデプロイ可能な状態を維持する

---

## 8. 推奨作業順序（フェーズ0）

依存関係を考慮した推奨順序:

```
M3 テストネットデプロイ（L3 単独、すぐ着手可）
 ↓
M2 バックエンド基盤（L2 単独、並行着手可）
 ↓
M4 フロントエンド × コントラクト接続（L1+L3、M3 完了後）
 ↓
M5 QR決済 MVP（L1+L2+L3、M2+M4 完了後）
 ↓
M6 試験運用準備（全レイヤー、M5 完了後）
```

M3 と M2 は独立しているため並行して進められる。

---

## 9. 未決定事項

| # | 項目 | 選択肢 | 決定期限 |
|---|------|--------|---------|
| 1 | フロントエンド FW | React (Vite) のまま / Next.js に移行 | M4 着手前 |
| 2 | ウォレット認証 | Privy / Web3Auth / Magic | M4 着手前 |
| 3 | バックエンドホスティング | AWS / Railway / Fly.io / VPS | M6 着手前 |
| 4 | ブロックチェーン | Polygon PoS / Base / Arbitrum | M3 着手前（暫定: Polygon） |
| 5 | ライセンス | MIT / Apache 2.0 | 公開前 |
