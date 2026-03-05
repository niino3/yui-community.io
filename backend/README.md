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

| メソッド | パス | 機能 |
|---------|------|------|
| GET | `/api/health` | ヘルスチェック |
| GET | `/up` | Laravel ヘルスチェック |

> M2-2 以降のサブタスクで API エンドポイントが追加されます。

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
