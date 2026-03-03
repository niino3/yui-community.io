# yui

> パーマカルチャーコミュニティのための、オープンソース地域通貨プラットフォーム

**「農のある生活」× Web3 × マルチテナント**

---

## このプロジェクトについて

農作業のお手伝いや農産物の交換を通じて、地域コミュニティへの貢献度を可視化・トークン化するプラットフォームです。

**パーマカルチャーを実践するすべてのコミュニティ・教室に無償で提供（MIT License）します。**

```
1コミュニティ = 1独立した経済圏
各コミュニティが独自のトークン名・ルール・DAOを持つ
```

## 特徴

- **マルチテナント対応** — 複数のパーマカルチャー教室・コミュニティが独立して運用できる
- **パーマカルチャー × DAO** — Earth Care / People Care / Fair Share の3倫理をトークン設計に反映
- **Phygital** — QRコード・AIカメラ・IoTで農機具・農作業・作物をデジタルと接続
- **Web3ながら誰でも使える** — LINEログイン・QRコード決済で高齢農家でも操作可能
- **法的に安全な設計** — 現金とトークンを完全分離（寄付・実費割り勘のみ）

## ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [プロジェクト概要](./docs/01_project-overview.md) | ビジョン・解決する課題・ペルソナ |
| [ビジネス要件定義](./docs/02_business-requirements.md) | ガバナンス・トークノミクス・UX要件・法的リスク |
| [技術設計](./docs/03_technical-design.md) | 技術スタック・コントラクト一覧・ロードマップ |
| [パーマカルチャー × DAOフレームワーク](./docs/04_permaculture-dao-framework.md) | 設計思想・多機能性原則・Earth Careトークン設計 |
| [Phygital Interface](./docs/05_phygital-interface.md) | QRコード・AIカメラ・IoTによる物理 ↔ デジタル接続層 |
| [ユーザーストーリー](./docs/06_user-stories.md) | ペルソナ4名・操作シナリオ・画面一覧 |
| [トークンエコノミクス数値設計](./docs/07_tokenomics-numbers.md) | 換算レート・Demurrage・流通シミュレーション |
| [マルチテナント アーキテクチャ](./docs/08_multi-tenant-architecture.md) | Factory Pattern・コミュニティ作成フロー・OSS提供モデル |

## 現在のステータス

**フェーズ：** 構想・要件定義（ドキュメント整備完了）

## 技術スタック（予定）

- **ブロックチェーン：** Polygon
- **スマートコントラクト：** Solidity + Hardhat + OpenZeppelin Upgradeable
  - 共通：`CommunityFactory` / `CommunityRegistry`
  - コミュニティごと：`CommunityToken` / `GovernanceToken` / `MembershipSBT` / `ContributionSBT` / `EarthCareSBT` / `Escrow` / `Governance` / `ReputationScore` / `Treasury`
- **フロントエンド：** Next.js + Tailwind CSS + wagmi/viem（マルチテナント・サブドメイン対応）
- **バックエンド：** Hono + PostgreSQL（スキーマ分離） + Redis
- **ウォレット：** Privy / Web3Auth（LINEログイン対応）

## ライセンス

MIT License — 自由に使用・改変・配布できます。
パーマカルチャーコミュニティへの導入・フォークを歓迎します。
