# Privy/Web3Auth + LINE 通知連携 — 実装仕様書

**バージョン**: 0.1.0  
**作成日**: 2026-03-10  
**目標**: 高齢農家でも使える認証体験と、LINE を通じた通知でアクティブ率を向上

---

## 1. 課題

### 認証の課題
- 現在の MetaMask 接続は Web3 経験者にはよいが、高齢農家には難しい
- MetaMask のインストール・シークレットフレーズの管理がハードル
- LINE や Google でログインできれば、既存のスマホ操作感で使える

### 通知の課題
- 現在の通知は DB に保存するだけで、ユーザーに能動的に届かない
- 「タスクに応募があった」「作業完了報告が来た」を即時に知りたい
- パーマカルチャーコミュニティの主要コミュニケーションツールは LINE

---

## 2. Privy / Web3Auth の比較と選定

| 比較項目 | Privy | Web3Auth |
|---------|-------|----------|
| LINE ログイン | ✅ カスタム OAuth で対応 | ✅ ネイティブ対応 |
| Google ログイン | ✅ | ✅ |
| メールログイン | ✅ | ✅ |
| 埋め込みウォレット | ✅ MPC ウォレット | ✅ MPC ウォレット |
| MetaMask 併用 | ✅ | ✅ |
| React SDK | ✅ `@privy-io/react-auth` | ✅ `@web3auth/modal` |
| 無料枠 | 1,000 MAU | 1,000 MAU |
| Polygon 対応 | ✅ | ✅ |
| 日本語ドキュメント | △ | △ |
| セットアップの容易さ | ✅ 簡単 | △ やや複雑 |

### 推奨: Privy

- セットアップが簡単で、React SDK が使いやすい
- 埋め込みウォレットにより、ユーザーが秘密鍵を管理する必要がない
- MetaMask 利用者はそのまま MetaMask も使える（ハイブリッド対応）
- 1,000 MAU 無料枠はフェーズ0〜1に十分

---

## 3. Privy 導入設計

### 3.1 認証フロー

```
ユーザーがアプリを開く
  ↓
┌─────────────────────────────────┐
│  ログイン方法を選択              │
│                                 │
│  [📱 LINE でログイン]            │
│  [📧 Google でログイン]          │
│  [🦊 MetaMask で接続]           │
│  [✉️ メールアドレスで登録]       │
└─────────────────────────────────┘
  ↓
[LINE / Google / メール]         [MetaMask]
  ↓                               ↓
Privy が MPC ウォレットを          既存ウォレットを
自動生成（ユーザーは意識しない）     そのまま使用
  ↓                               ↓
ウォレットアドレスが確定
  ↓
バックエンド認証（/api/auth/wallet）
  ↓
ログイン完了
```

### 3.2 Privy の設定

```javascript
// src/main.jsx
import { PrivyProvider } from '@privy-io/react-auth'

<PrivyProvider
  appId={import.meta.env.VITE_PRIVY_APP_ID}
  config={{
    loginMethods: ['google', 'email', 'wallet'],
    appearance: {
      theme: 'light',
      accentColor: '#22c55e',
      logo: '/logo.svg',
      landingHeader: 'yui にログイン',
      loginMessage: 'パーマカルチャーコミュニティへようこそ',
    },
    embeddedWallets: {
      createOnLogin: 'users-without-wallets',
    },
    defaultChain: polygon, // or polygonAmoy
    supportedChains: [polygon, polygonAmoy],
    // LINE は Custom OAuth として設定
    externalWallets: {
      metamask: { enabled: true },
    },
  }}
>
  <App />
</PrivyProvider>
```

### 3.3 LINE ログイン設定

LINE ログインは Privy の Custom OAuth Provider として設定。

**LINE Developers Console で必要な設定:**
1. LINE Login チャネルを作成
2. Callback URL: `https://auth.privy.io/api/v1/oauth/callback`
3. チャネル ID と チャネルシークレットを Privy ダッシュボードに登録

**Privy ダッシュボードの設定:**
1. Login Methods → Custom OAuth → Add Provider
2. Provider Name: `LINE`
3. Authorization URL: `https://access.line.me/oauth2/v2.1/authorize`
4. Token URL: `https://api.line.me/oauth2/v2.1/token`
5. User Info URL: `https://api.line.me/v2/profile`
6. Client ID / Secret: LINE Developers Console の値
7. Scopes: `profile openid`

### 3.4 AuthContext の変更（Privy 対応）

```javascript
import { usePrivy, useWallets } from '@privy-io/react-auth'

export function AuthProvider({ children }) {
  const { ready, authenticated, user: privyUser, login, logout: privyLogout } = usePrivy()
  const { wallets } = useWallets()
  const [user, setUser] = useState(getStoredUser())

  const wallet = wallets[0]
  const address = wallet?.address

  // Privy ログイン成功後、バックエンドにも認証
  useEffect(() => {
    if (authenticated && address && !user) {
      authenticateWithBackend(address)
    }
  }, [authenticated, address])

  async function authenticateWithBackend(walletAddress) {
    const { nonce, message } = await api.auth.nonce(walletAddress)
    const provider = await wallet.getEthersProvider()
    const signer = provider.getSigner()
    const signature = await signer.signMessage(message)
    const { token, user } = await api.auth.wallet(walletAddress, message, signature)
    setAuthToken(token)
    setStoredUser(user)
    setUser(user)
  }

  return (
    <AuthContext.Provider value={{
      user,
      address,
      isAuthenticated: !!user,
      isReady: ready,
      login,
      logout: () => { privyLogout(); clearAuth(); setUser(null) },
      loginMethod: privyUser?.linkedAccounts?.[0]?.type,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### 3.5 ユーザーモデルの拡張

バックエンドの users テーブルに SNS 連携情報を追加。

```
users（既存テーブルに追加）
  + privy_id (string, nullable, unique)
  + line_user_id (string, nullable, unique)
  + google_id (string, nullable, unique)
  + login_method (enum: 'wallet', 'line', 'google', 'email', default 'wallet')
```

---

## 4. LINE Messaging API 通知

### 4.1 通知タイプと LINE メッセージ

| 通知タイプ | トリガー | LINE メッセージ |
|-----------|---------|---------------|
| `task_applied` | タスクに応募あり | 「🙋 {name}さんが「{task_title}」に応募しました」 |
| `task_completed` | 作業完了報告 | 「✅ {name}さんが「{task_title}」の作業完了を報告しました。承認してください」 |
| `task_approved` | 依頼者が承認 | 「🎉 「{task_title}」が承認されました！{amount} YUI を受け取りました」 |
| `token_received` | トークン受信 | 「💰 {name}さんから {amount} YUI を受け取りました」 |
| `earth_care_approved` | Earth Care 活動が承認 | 「🌱 あなたの Earth Care 活動「{type}」が承認されました！」 |
| `equipment_reserved` | 農機具予約 | 「🔧 {name}さんが「{equipment}」を {date} に予約しました」 |

### 4.2 LINE Messaging API 設定

**LINE Developers Console:**
1. Messaging API チャネルを作成（Login チャネルとは別）
2. チャネルアクセストークンを発行
3. Webhook URL: `https://api.yui-community.io/api/webhook/line`

### 4.3 バックエンド実装

```php
// app/Services/LineNotificationService.php

class LineNotificationService
{
    private string $channelToken;
    private string $apiUrl = 'https://api.line.me/v2/bot/message/push';

    public function send(string $lineUserId, string $message): void
    {
        Http::withHeaders([
            'Authorization' => "Bearer {$this->channelToken}",
        ])->post($this->apiUrl, [
            'to' => $lineUserId,
            'messages' => [
                ['type' => 'text', 'text' => $message],
            ],
        ]);
    }
}
```

```php
// app/Services/NotificationService.php

class NotificationService
{
    public function notify(User $user, string $type, string $title, string $body): void
    {
        // 1. DB に保存（既存の通知テーブル）
        Notification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'body' => $body,
        ]);

        // 2. LINE 通知（line_user_id がある場合）
        if ($user->line_user_id) {
            app(LineNotificationService::class)
                ->send($user->line_user_id, "{$title}\n{$body}");
        }

        // 3. 将来: Web Push
    }
}
```

### 4.4 通知の送信タイミング

```php
// TaskController.php の assign() に追加
app(NotificationService::class)->notify(
    $task->requester,
    'task_applied',
    'タスクに応募がありました',
    "{$request->user()->display_name}さんが「{$task->title}」に応募しました"
);

// TaskController.php の complete() に追加
app(NotificationService::class)->notify(
    $task->requester,
    'task_completed',
    '作業完了報告',
    "{$task->worker->display_name}さんが「{$task->title}」の作業完了を報告しました"
);

// TaskController.php の approve() に追加
app(NotificationService::class)->notify(
    $task->worker,
    'task_approved',
    'タスクが承認されました',
    "「{$task->title}」が承認されました！{$task->token_reward} YUI を受け取りました"
);
```

---

## 5. 環境変数

### Privy

```env
VITE_PRIVY_APP_ID=your-privy-app-id
```

### LINE（バックエンド）

```env
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-access-token
LINE_CHANNEL_SECRET=your-line-channel-secret
LINE_LOGIN_CHANNEL_ID=your-line-login-channel-id
```

---

## 6. 実装タスク

### Auth（Privy 導入）

| # | タスク | 見積もり |
|---|-------|---------|
| AUTH-1 | Privy アカウント作成 + ダッシュボード設定 | 1h |
| AUTH-2 | LINE Developers Console でチャネル作成 | 1h |
| AUTH-3 | `@privy-io/react-auth` 導入 + PrivyProvider 設定 | 3h |
| AUTH-4 | AuthContext を Privy 対応に変更 | 3h |
| AUTH-5 | ログイン画面（LINE / Google / MetaMask 選択） | 2h |
| AUTH-6 | バックエンド users テーブル拡張 + 認証フロー対応 | 3h |
| AUTH-7 | LINE Login の Custom OAuth 設定 + テスト | 2h |

### 通知（LINE Messaging API）

| # | タスク | 見積もり |
|---|-------|---------|
| NOTIF-1 | LINE Messaging API チャネル作成 + トークン取得 | 1h |
| NOTIF-2 | LineNotificationService 実装 | 2h |
| NOTIF-3 | NotificationService 実装（DB + LINE 統合） | 2h |
| NOTIF-4 | 各コントローラーに通知送信を追加 | 3h |
| NOTIF-5 | LINE ユーザー ID の紐付けフロー | 2h |
| NOTIF-6 | Webhook エンドポイント（LINE → バックエンド） | 2h |

### 合計見積もり

| カテゴリ | 時間 |
|---------|------|
| Privy 認証 | 15h |
| LINE 通知 | 12h |
| **合計** | **27h** |

---

## 7. 実装順序（推奨）

```
AUTH-1, AUTH-2（アカウント・チャネル準備）
  ↓
AUTH-3, AUTH-4（Privy 導入 + AuthContext）
  ↓
AUTH-5（ログイン画面）
  ↓
AUTH-6, AUTH-7（バックエンド + LINE Login）
  ↓
NOTIF-1〜NOTIF-6（LINE 通知）
```

Privy 導入が先。LINE 通知は Privy で LINE ログインが動いた後に進める（line_user_id が必要なため）。

---

## 8. フォールバック戦略

Privy の導入が遅れる場合や、無料枠を超える場合のフォールバック：

| 状況 | 対応 |
|------|------|
| Privy 無料枠超過 | MetaMask のみに戻す（現状の仕組みで動作） |
| LINE Login 設定が間に合わない | Google + MetaMask のみで先行リリース |
| LINE 通知が間に合わない | DB 通知 + アプリ内表示のみ（現状のまま） |

既存の MetaMask 接続は残すため、Privy が使えなくても機能は損なわれない。
