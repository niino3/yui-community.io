# Railway デプロイ手順

## 前提
- Railway アカウント作成済み
- GitHub リポジトリ `niino3/yui-community.io` を Railway に連携済み

## 1. プロジェクト作成

1. https://railway.app/dashboard を開く
2. **New Project** → **Deploy from GitHub Repo**
3. リポジトリ `yui-community.io` を選択
4. **Root Directory** を必ず `backend` に設定  
   - 対象サービスをクリック → **Settings** → **Source** → **Root Directory** に `backend` を入力  
   - ⚠️ 未設定のままだとリポジトリ直下の **React フロントエンド** がデプロイされ、`/api/health` が HTML を返す

## 2. データベース追加

5. **+ New** → **Database** → **Add PostgreSQL**
6. **+ New** → **Database** → **Add Redis**

## 3. 環境変数（Shared Variables）

プロジェクトの **Variables** で以下を設定：

| 変数名 | 値 |
|--------|-----|
| `APP_NAME` | `Yui` |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_KEY` | `base64:$(openssl rand -base64 32)` で生成 |
| `APP_URL` | デプロイ後の URL（例: `https://xxx.up.railway.app`） |
| `DB_CONNECTION` | `pgsql` |
| `SESSION_DRIVER` | `redis` |
| `CACHE_STORE` | `redis` |
| `QUEUE_CONNECTION` | `redis` |
| `RAILWAY_HEALTHCHECK_TIMEOUT_SEC` | `120`（推奨: migrate 完了まで余裕を持たせる） |
| `CORS_ALLOWED_ORIGINS` | フロントエンドのオリジン（例: `https://yui-community-io.vercel.app,http://localhost:5173`） |

## 4. 参照変数の追加

**Add Reference** で以下を追加：

- **PostgreSQL** の `DATABASE_URL` → 変数名 `DATABASE_URL`
- **Redis** の `REDIS_URL` → 変数名 `REDIS_URL`

※ 同じプロジェクト内の DB/Redis を参照として選択

## 5. デプロイ

- Railway は GitHub への push で自動デプロイ
- 初回は手動で **Redeploy** を実行しても可

## 6. APP_URL の設定

デプロイ後、**Settings** → **Networking** → **Generate Domain** で URL を発行し、  
`APP_URL` をその URL（例: `https://yui-backend-production.up.railway.app`）に設定。

## 7. 動作確認

`https://[あなたのドメイン]/api/health` にアクセスし、以下が返れば OK：

```json
{"status":"ok","service":"yui-backend","timestamp":"..."}
```

---

## トラブルシューティング

### `/api/health` が HTML を返す

**原因**: Root Directory が未設定で、フロントエンド（React）がデプロイされている。

**対処**:
1. Railway ダッシュボードでデプロイ中のサービスを選択
2. **Settings** → **Source** → **Root Directory**
3. `backend` と入力（先頭に `/` は付けない）
4. 保存後、**Redeploy** を実行

### ヘルスチェックが "service unavailable" で失敗する

**原因**: 起動完了前にヘルスチェックが開始されている（migrate に時間がかかる）。

**対処**:
1. `RAILWAY_HEALTHCHECK_TIMEOUT_SEC` を環境変数で `120` に設定
2. 起動スクリプト（`scripts/start.sh`）で migrate をバックグラウンド実行し、serve を先行起動済み
3. それでも失敗する場合: **Settings** → **Deploy** → **Health Check Timeout** を 120 秒以上に変更
