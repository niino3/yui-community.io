# Railway デプロイ手順

## 前提
- Railway アカウント作成済み
- GitHub リポジトリ `niino3/yui-community.io` を Railway に連携済み

## 1. プロジェクト作成

1. https://railway.app/dashboard を開く
2. **New Project** → **Deploy from GitHub Repo**
3. リポジトリ `yui-community.io` を選択
4. **Root Directory** を `backend` に設定  
   （サービス → Settings → Source → Root Directory）

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
