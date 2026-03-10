# フロントエンド改善 — 実装仕様書

**バージョン**: 0.1.0  
**作成日**: 2026-03-10  
**前提**: フェーズ0完了（モックデータで動作するUIプロトタイプが Vercel にデプロイ済み）  
**目標**: モックデータを実 API に接続し、認証・管理画面を完全実装する

---

## 1. 現状分析

### モックデータを使用している画面

| 画面 | ファイル | モックデータ | 接続先 API |
|------|---------|------------|-----------|
| ホーム | `Home.jsx` | `mockData.js` の `currentUser`, `notifications` | `/api/users/me`, `/api/notifications` |
| タスク一覧 | `TaskList.jsx` | `mockData.js` の `tasks` | `/api/tasks` |
| タスク詳細 | `TaskDetail.jsx` | `mockData.js` の `tasks[id]` | `/api/tasks/{id}` |
| タスク投稿 | `TaskPost.jsx` | ローカル state のみ | `/api/tasks` (POST) |
| プロフィール | `Profile.jsx` | `mockData.js` の `currentUser` | `/api/users/me` |
| 農機具一覧 | `Equipment.jsx` | `mockData.js` の `equipmentList` | `/api/equipment` |
| 農機具詳細 | `EquipmentDetail.jsx` | `mockData.js` の `equipmentList[id]` | `/api/equipment/{id}` |
| Earth Care | `EarthCare.jsx` | `mockData.js` の `earthCareActivities` | `/api/earth-care` |
| 管理者ダッシュボード | `AdminDashboard.jsx` | `mockData.js` の `communityStats` | `/api/community/stats` |
| 作業完了 | `WorkComplete.jsx` | `mockData.js` | `/api/tasks/{id}/complete` |
| 承認 | `ApproveWork.jsx` | `mockData.js` | `/api/tasks/{id}/approve` |

### 実 API に接続済みの画面

| 画面 | ファイル | 接続済み API |
|------|---------|-------------|
| QR 決済 | `QRScan.jsx` | オンチェーン（wagmi） |
| 手動送金 | `TokenTransfer.jsx` | オンチェーン（wagmi）+ `/api/transactions/record` |
| ウォレット接続 | `WalletConnect.jsx` | wagmi |

---

## 2. 認証フロー完全実装

### 2.1 現状

- `AuthContext.jsx` で認証状態を管理
- ウォレット署名 → バックエンド認証の仕組みは API (`/api/auth/nonce`, `/api/auth/wallet`) に実装済み
- フロントエンドからの呼び出しが未完成

### 2.2 実装する認証フロー

```
1. ユーザーが「ウォレット接続」をタップ
   → MetaMask 接続（wagmi useConnect）

2. 接続成功後、自動的にバックエンド認証を開始
   → POST /api/auth/nonce { wallet_address }
   → nonce を受け取る

3. MetaMask で nonce に署名
   → wagmi useSignMessage で署名

4. 署名をバックエンドに送信
   → POST /api/auth/wallet { wallet_address, message, signature }
   → API トークン + user 情報を受け取る

5. トークンを localStorage に保存
   → 以降の API リクエストに Bearer トークンを付与

6. AuthContext の状態を更新
   → isAuthenticated: true, user: { ... }
```

### 2.3 AuthContext の変更

```javascript
// 現在: 手動ログイン
// 変更後: ウォレット接続と連動した自動ログイン

export function AuthProvider({ children }) {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [user, setUser] = useState(getStoredUser())
  const [isLoading, setIsLoading] = useState(false)

  // ウォレット接続時に自動でバックエンド認証
  useEffect(() => {
    if (isConnected && address && !user) {
      authenticateWithWallet(address)
    }
    if (!isConnected) {
      clearAuth()
      setUser(null)
    }
  }, [isConnected, address])

  async function authenticateWithWallet(walletAddress) {
    setIsLoading(true)
    try {
      const { nonce, message } = await api.auth.nonce(walletAddress)
      const signature = await signMessageAsync({ message })
      const { token, user } = await api.auth.wallet(walletAddress, message, signature)
      setAuthToken(token)
      setStoredUser(user)
      setUser(user)
    } catch (err) {
      console.error('Authentication failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      logout: () => { clearAuth(); setUser(null) },
    }}>
      {children}
    </AuthContext.Provider>
  )
}
```

---

## 3. 画面ごとの API 接続仕様

### 3.1 ホーム画面（Home.jsx）

**現状**: `mockData.currentUser`, `mockData.notifications` を使用  
**変更後**:

```javascript
// ユーザー情報: AuthContext から取得
const { user } = useAuth()

// 残高: オンチェーンから取得（既に実装済み）
const { balance } = useYuiBalance(address)

// 通知: バックエンドから取得
const { data: notifications } = useQuery({
  queryKey: ['notifications'],
  queryFn: () => api.notifications.list(),
  enabled: isAuthenticated,
})

// 未読件数
const { data: unread } = useQuery({
  queryKey: ['notifications-unread'],
  queryFn: () => api.notifications.unreadCount(),
  enabled: isAuthenticated,
})
```

### 3.2 タスク一覧（TaskList.jsx）

```javascript
const { data: tasks, isLoading } = useQuery({
  queryKey: ['tasks', { status, category }],
  queryFn: () => api.tasks.list({ status, category }),
})

// ページネーション対応
// バックエンドは paginate(20) で返すので、
// data.data が配列、data.meta にページ情報
```

### 3.3 タスク投稿（TaskPost.jsx）

```javascript
const mutation = useMutation({
  mutationFn: (data) => api.tasks.create({
    community_id: community.id,
    title: data.title,
    description: data.description,
    category: data.category,
    token_reward: data.tokens,
    location_lat: data.location?.lat,
    location_lng: data.location?.lng,
  }),
  onSuccess: () => {
    queryClient.invalidateQueries(['tasks'])
    navigate('tasks')
  },
})
```

### 3.4 タスク詳細 + アクション（TaskDetail.jsx）

```javascript
const { data: task } = useQuery({
  queryKey: ['task', taskId],
  queryFn: () => api.tasks.get(taskId),
})

// 応募
const assignMutation = useMutation({
  mutationFn: () => api.tasks.assign(taskId),
})

// 完了報告
const completeMutation = useMutation({
  mutationFn: () => api.tasks.complete(taskId),
})

// 承認
const approveMutation = useMutation({
  mutationFn: () => api.tasks.approve(taskId),
})
```

### 3.5 農機具一覧（Equipment.jsx）

```javascript
const { data: equipment } = useQuery({
  queryKey: ['equipment'],
  queryFn: () => api.equipment.list(),
})
```

### 3.6 農機具詳細 + 予約・返却（EquipmentDetail.jsx）

```javascript
const { data: equipment } = useQuery({
  queryKey: ['equipment', equipmentId],
  queryFn: () => api.equipment.get(equipmentId),
})

const reserveMutation = useMutation({
  mutationFn: (dates) => api.equipment.reserve(equipmentId, dates),
})

const returnMutation = useMutation({
  mutationFn: () => api.equipment.return(equipmentId),
})
```

### 3.7 Earth Care 活動一覧 + 報告（EarthCare.jsx）

```javascript
const { data: activities } = useQuery({
  queryKey: ['earth-care'],
  queryFn: () => api.earthCare.list(),
})

const reportMutation = useMutation({
  mutationFn: (data) => api.earthCare.create({
    community_id: community.id,
    activity_type: data.type,
    description: data.description,
    photo_hash: data.photoHash,
    gps_lat: data.lat,
    gps_lng: data.lng,
  }),
})

const approveMutation = useMutation({
  mutationFn: (id) => api.earthCare.approve(id),
})
```

### 3.8 管理者ダッシュボード（AdminDashboard.jsx）

```javascript
// 現在: communityStats モックデータ
// 変更後: バックエンド API から取得

const { data: stats } = useQuery({
  queryKey: ['community-stats'],
  queryFn: () => api.get('/community/stats'),
  enabled: isAuthenticated && user?.role !== 'member',
})
```

**表示制限**: `user.role` が `operator` または `admin` の場合のみ表示。Profile 画面の「コミュニティ統計」ボタンも条件付きに。

---

## 4. データフェッチング戦略

### React Query の設定

```javascript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30秒はキャッシュを使う
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
})
```

### カスタムフック

各ドメインごとにカスタムフックを作成し、画面コンポーネントをシンプルに保つ。

```javascript
// src/hooks/useTasks.js
export function useTasks(filters) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => api.tasks.list(filters),
  })
}

export function useTask(id) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => api.tasks.get(id),
    enabled: !!id,
  })
}

// src/hooks/useEquipment.js
// src/hooks/useEarthCare.js
// src/hooks/useNotifications.js
```

---

## 5. エラー処理・ローディング

### グローバルエラーハンドリング

```javascript
// 401 エラー: 自動ログアウト → ウォレット再接続を促す
// 403 エラー: 権限不足のメッセージ表示
// 422 エラー: バリデーションエラーをフォームに表示
// 500 エラー: 汎用エラーメッセージ
```

### ローディングスケルトン

モックデータの即時表示から API 取得に変わるため、ローディング中のスケルトン表示が必要。

```javascript
function TaskListSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="card p-4 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-3 bg-gray-200 rounded w-1/3" />
        </div>
      ))}
    </div>
  )
}
```

### 空状態

データがない場合の表示。

```javascript
function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <span className="text-5xl mb-3">{icon}</span>
      <h3 className="text-lg font-bold text-gray-700">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
      {action}
    </div>
  )
}
```

---

## 6. 実装タスク

| # | タスク | 見積もり |
|---|-------|---------|
| FE-1 | 認証フロー完全実装（AuthContext + WalletConnect 連携） | 4h |
| FE-2 | カスタムフック作成（useTasks, useEquipment, useEarthCare, useNotifications） | 3h |
| FE-3 | Home.jsx の実 API 接続 | 2h |
| FE-4 | TaskList.jsx / TaskDetail.jsx の実 API 接続 | 3h |
| FE-5 | TaskPost.jsx の実 API 接続 | 2h |
| FE-6 | Equipment.jsx / EquipmentDetail.jsx の実 API 接続 | 3h |
| FE-7 | EarthCare.jsx の実 API 接続 | 3h |
| FE-8 | AdminDashboard.jsx の実 API 接続 + 権限制御 | 3h |
| FE-9 | WorkComplete.jsx / ApproveWork.jsx の実 API 接続 | 2h |
| FE-10 | ローディングスケルトン + 空状態 + エラー表示 | 3h |
| FE-11 | Profile.jsx の実 API 接続（取引履歴含む） | 2h |
| **合計** | | **30h** |

---

## 7. 実装順序（推奨）

```
FE-1 認証フロー（全 API の前提）
  ↓
FE-2 カスタムフック（共通基盤）
  ↓
FE-10 ローディング・エラー（UX 基盤）
  ↓
FE-3〜FE-9, FE-11（各画面を順次接続）
```

認証フローが最優先。これが動かないと他の API が呼べない。
