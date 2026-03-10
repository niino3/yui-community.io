# yui

> パーマカルチャーコミュニティのための、オープンソース地域通貨プラットフォーム
>
> An open-source community currency platform for permaculture communities

**「農のある生活」× ブロックチェーン × マルチテナント**

**"Farming Life" × Blockchain × Multi-tenant**

---

## このプロジェクトについて / About

農作業のお手伝いや農産物の交換を通じて、地域コミュニティへの貢献度を可視化・トークン化するプラットフォームです。

**パーマカルチャーを実践するすべてのコミュニティ・教室に無償で提供（MIT License）します。**

A platform that visualizes and tokenizes contributions to local communities through mutual help with farm work and exchange of produce.

**Free for all permaculture communities and schools (MIT License).**

```
1 community = 1 independent economy
Each community has its own token name, rules, and DAO

1コミュニティ = 1独立した経済圏
各コミュニティが独自のトークン名・ルール・DAOを持つ
```

## 特徴 / Features

- **マルチテナント対応 / Multi-tenant** — 複数のパーマカルチャー教室・コミュニティが独立して運用できる / Multiple permaculture schools and communities can operate independently
- **パーマカルチャー × DAO / Permaculture × DAO** — Earth Care / People Care / Fair Share の3倫理をトークン設計に反映 / The three ethics are reflected in token design
- **Phygital** — QRコード・AIカメラ・IoTで農機具・農作業・作物をデジタルと接続 / QR codes, AI cameras, and IoT connect farm tools, work, and produce to the digital world
- **Web3ながら誰でも使える / Web3 for Everyone** — LINEログイン・QRコード決済で高齢農家でも操作可能 / LINE login and QR code payments make it accessible even for elderly farmers
- **法的に安全な設計 / Legally Safe Design** — 現金とトークンを完全分離 / Complete separation of cash and tokens

## デモ / Demo

UIプロトタイプを公開しています。MetaMask でウォレット接続すると、Polygon Amoy テストネット上のオンチェーンデータ（YUI トークン残高・SBT）を表示します。

UI prototype is live. Connect your MetaMask wallet to see on-chain data (YUI token balance, SBT) on Polygon Amoy testnet.

https://yui-community-io.vercel.app/

## 現在のステータス / Current Status

**フェーズ0：プロトタイプ開発中 / Phase 0: Prototype in Development**

| 項目 / Item | 状態 / Status |
|------------|--------------|
| 設計ドキュメント（01〜09） / Design documents | ✅ 完了 / Done |
| UIプロトタイプ（16画面） / UI prototype (16 screens) | ✅ Vercel デプロイ済み / Deployed |
| スマートコントラクト / Smart contracts (YuiToken + MembershipSBT) | ✅ テスト12件パス / 12 tests pass |
| テストネットデプロイ / Testnet deploy (Polygon Amoy) | ✅ Sourcify 検証済み / Verified |
| フロントエンド × コントラクト接続 / Frontend × contract | ✅ wagmi + viem / Connected |
| バックエンド / Backend (Laravel + PostgreSQL) | ✅ Railway デプロイ済み / Deployed |
| QR 決済 MVP / QR payment MVP | ✅ 完了 / Done |
| 試験運用準備 / Pre-launch preparation | 🔨 準備中 / In progress |

詳細は [実装計画書](./docs/09_implementation-plan.md) を参照。

See [Implementation Plan](./docs/09_implementation-plan.md) for details.

## 技術スタック / Tech Stack

- **Blockchain:** Polygon (Solidity + Hardhat + OpenZeppelin)
- **Frontend:** React + Vite + Tailwind CSS + wagmi + viem
- **Backend:** Laravel + PostgreSQL + Redis
- **Wallet:** MetaMask（Privy / Web3Auth による LINE ログイン対応を検討中）
- **Contracts:** YuiToken (ERC-20) / MembershipSBT (ERC-721 Soulbound) — [Polygon Amoy にデプロイ済み](https://amoy.polygonscan.com/address/0x414e5d24208c394210A1D61D78b2C42125f7f796)

## ドキュメント / Documentation

| ドキュメント / Document | 内容 / Contents |
|----------------------|----------------|
| [プロジェクト概要 / Project Overview](./docs/01_project-overview.md) | ビジョン・課題・ペルソナ / Vision, problems, personas |
| [ビジネス要件 / Business Requirements](./docs/02_business-requirements.md) | ガバナンス・トークノミクス・法的リスク / Governance, tokenomics, legal risks |
| [技術設計 / Technical Design](./docs/03_technical-design.md) | 技術スタック・コントラクト一覧 / Tech stack, contract list |
| [パーマカルチャー × DAO](./docs/04_permaculture-dao-framework.md) | 設計思想・Earth Care設計 / Design philosophy, Earth Care design |
| [Phygital Interface](./docs/05_phygital-interface.md) | QR・AIカメラ・IoT接続層 / QR, AI camera, IoT layer |
| [ユーザーストーリー / User Stories](./docs/06_user-stories.md) | ペルソナ4名・画面一覧 / 4 personas, screen list |
| [トークンエコノミクス / Tokenomics](./docs/07_tokenomics-numbers.md) | 換算レート・Demurrage・シミュレーション / Rates, demurrage, simulation |
| [マルチテナント / Multi-tenant Architecture](./docs/08_multi-tenant-architecture.md) | Factory Pattern・OSS提供モデル / Factory pattern, OSS model |
| [実装計画 / Implementation Plan](./docs/09_implementation-plan.md) | マイルストーン・ブランチ戦略・DB設計 / Milestones, branches, DB design |

## 仲間募集中 / Looking for Contributors

このプロジェクトに興味を持ってくださった方、一緒に作りませんか？

Interested in this project? Let's build it together!

「yui」は、地域コミュニティの農のある生活を「お互い様」で助け合うためのアプリです。草取りや収穫を手伝うとコミュニティ独自のトークンがもらえ、農産物の購入や農機具の共有に使えます。植樹や堆肥作りなど環境再生活動もトークンで評価。パーマカルチャーの3倫理——地球への配慮・人への配慮・余剰の分かち合い——をそのまま仕組みに落とし込み、使わないトークンは自然にコミュニティへ還る循環型の設計です。

"yui" is an app for mutual aid in farming communities. Help with weeding or harvesting and earn community tokens, which can be used to buy produce or share farm equipment. Environmental activities like composting and tree planting are also rewarded. The three ethics of permaculture — Earth Care, People Care, Fair Share — are built directly into the system, with unused tokens naturally flowing back to the community.

### こんな方を探しています / Who We're Looking For

- **Web3 / Solidity エンジニア / Engineers** — スマートコントラクトの設計・実装 / Smart contract design and implementation
- **フロントエンドエンジニア / Frontend Engineers** — React / Next.js でのUI開発 / UI development
- **バックエンドエンジニア / Backend Engineers** — Laravel / Node.js でのAPI開発 / API development
- **UI/UXデザイナー / Designers** — 高齢者にも使いやすいインターフェース / Interfaces accessible to elderly users
- **パーマカルチャー実践者 / Permaculture Practitioners** — 実際のコミュニティでのフィードバック / Real-world community feedback

スキルや経験は問いません。「面白そう」と思ったらお気軽にどうぞ。

No specific skills or experience required. If it sounds interesting, jump in!

### 参加方法 / How to Contribute

- **GitHub Issue** — 質問・提案・バグ報告 / Questions, proposals, bug reports
- **Pull Request** — コードを貢献 / Code contributions
- **Discussion** — 設計や方針についての議論 / Design and direction discussions

まずは [実装計画書](./docs/09_implementation-plan.md) と [プロジェクト概要](./docs/01_project-overview.md) を読んでみてください。

Start with the [Implementation Plan](./docs/09_implementation-plan.md) and [Project Overview](./docs/01_project-overview.md).

## ライセンス / License

MIT License — 自由に使用・改変・配布できます。パーマカルチャーコミュニティへの導入・フォークを歓迎します。

MIT License — Free to use, modify, and distribute. Forks and adoption by permaculture communities are welcome.
