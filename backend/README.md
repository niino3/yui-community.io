# Yui Backend

パーマカルチャーコミュニティ向け地域通貨プラットフォーム「Yui」のバックエンド API サーバー。

## 技術スタック

| 項目 | 技術 |
|------|------|
| フレームワーク | Laravel 12 |
| 言語 | PHP 8.4 |
| データベース | PostgreSQL 16 |
| キャッシュ / セッション / キュー | Redis 7 |
| Web サーバー | Nginx 1.25 |
| コンテナ | Docker Compose |

## セットアップ

### 前提条件

- Docker Desktop
- Docker Compose v2+

### 起動手順

```bash
# 1. backend ディレクトリに移動
cd backend

# 2. .env ファイルを作成（初回のみ）
cp .env.example .env

# 3. コンテナをビルド＆起動
docker compose up -d

# 4. アプリケーションキーを生成（初回のみ）
docker compose exec app php artisan key:generate

# 5. マイグレーション実行
docker compose exec app php artisan migrate

# 6. 動作確認
curl http://localhost:8080/api/health
```

### コンテナ一覧

| コンテナ | 役割 | ポート |
|---------|------|--------|
| `yui-app` | PHP-FPM (Laravel) | 9000（内部） |
| `yui-nginx` | リバースプロキシ | **8080** → 80 |
| `yui-db` | PostgreSQL | **5432** |
| `yui-redis` | Redis | **6379** |

### よく使うコマンド

```bash
# コンテナの状態確認
docker compose ps

# Laravel Artisan コマンド
docker compose exec app php artisan <command>

# マイグレーション
docker compose exec app php artisan migrate

# マイグレーションリセット
docker compose exec app php artisan migrate:fresh

# テスト実行
docker compose exec app php artisan test

# コンテナ停止
docker compose down

# コンテナ停止 + ボリューム削除（DB データもリセット）
docker compose down -v
```

## API エンドポイント

### 公開

| メソッド | パス | 機能 |
|---------|------|------|
| GET | `/api/health` | ヘルスチェック |
| GET | `/up` | Laravel ヘルスチェック |
| GET | `/api/communities` | コミュニティ一覧 |

### 認証

| メソッド | パス | 機能 |
|---------|------|------|
| POST | `/api/auth/nonce` | nonce 取得（ウォレット署名用） |
| POST | `/api/auth/wallet` | ウォレット認証（署名検証 → トークン発行） |
| POST | `/api/auth/logout` | ログアウト |
| GET | `/api/users/me` | 自分のプロフィール取得 |

### タスク

| メソッド | パス | 機能 |
|---------|------|------|
| GET | `/api/tasks` | タスク一覧（`community_id`, `status`, `category` フィルタ） |
| POST | `/api/tasks` | タスク投稿 |
| GET | `/api/tasks/{id}` | タスク詳細 |
| PATCH | `/api/tasks/{id}/assign` | タスクに応募 |
| PATCH | `/api/tasks/{id}/complete` | 作業完了報告 |
| PATCH | `/api/tasks/{id}/approve` | 依頼者が承認 |

### トランザクション

| メソッド | パス | 機能 |
|---------|------|------|
| GET | `/api/transactions` | 取引履歴（`community_id` フィルタ） |
| POST | `/api/transactions/record` | オンチェーン送金完了を DB に記録 |

### 農機具

| メソッド | パス | 機能 |
|---------|------|------|
| GET | `/api/equipment` | 農機具一覧（`community_id`, `status` フィルタ） |
| GET | `/api/equipment/{id}` | 農機具詳細（予約履歴付き） |
| POST | `/api/equipment/{id}/reserve` | 農機具予約 |
| PATCH | `/api/equipment/{id}/return` | 農機具返却 |

### Earth Care

| メソッド | パス | 機能 |
|---------|------|------|
| GET | `/api/earth-care` | 活動一覧（`community_id`, `status`, `activity_type` フィルタ） |
| POST | `/api/earth-care` | 活動報告 |
| GET | `/api/earth-care/{id}` | 活動詳細 |
| POST | `/api/earth-care/{id}/approve` | 承認投票（3票で自動承認） |

### 通知

| メソッド | パス | 機能 |
|---------|------|------|
| GET | `/api/notifications` | 通知一覧 |
| GET | `/api/notifications/unread-count` | 未読件数 |
| PATCH | `/api/notifications/{id}/read` | 既読にする |
| POST | `/api/notifications/read-all` | 全件既読 |

## ディレクトリ構成

```
backend/
├── app/                  # アプリケーションコード
├── bootstrap/            # アプリケーション起動設定
├── config/               # 設定ファイル
├── database/             # マイグレーション・シーダー
├── docker/               # Docker 設定
│   ├── nginx/            # Nginx 設定
│   │   └── default.conf
│   └── php/              # PHP 設定
│       ├── Dockerfile
│       └── php.ini
├── public/               # Web ルート
├── resources/            # ビュー・言語ファイル
├── routes/               # ルーティング
│   ├── api.php           # API ルート
│   ├── console.php       # コンソールルート
│   └── web.php           # Web ルート
├── storage/              # ログ・キャッシュ
├── tests/                # テスト
├── .env.example          # 環境変数テンプレート
├── composer.json         # PHP 依存関係
└── docker-compose.yml    # Docker Compose 設定
```
