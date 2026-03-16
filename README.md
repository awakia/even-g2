# Even G2 Smart Glasses App

Even Realities G2 スマートグラス上で動作するアプリケーション。

## G2 とは

- デュアル micro-LED ディスプレイ（各レンズ 576x288px、4bit グレースケール＝16段階の緑）
- カメラなし、スピーカーなし（マイクあり）のプライバシー重視設計
- R1 コントロールリングでスクロール・クリック入力
- テンプル部分のタッチジェスチャー、頭の動きによる操作
- iPhone と BLE 5.x で接続

## アーキテクチャ

```
[Web サーバー] <--HTTPS--> [iPhone WebView] <--BLE--> [G2 グラス]
```

アプリは通常の Web アプリ。iPhone の Even App が WebView でアプリを読み込み、BLE 経由でグラスにUIを送信する。グラス上でコードは動かない。

## セットアップ

```bash
npm install
npm run dev        # 開発サーバー起動
npm run qr         # QRコード生成（Even App でスキャン）
npm run pack       # .ehpk パッケージング
```

## 技術スタック

- TypeScript + Vite
- `@evenrealities/even_hub_sdk` - グラス制御 SDK
- `@evenrealities/evenhub-cli` - 開発ツール（QR生成、パッケージング）

## 開発ワークフロー

1. `npm run dev` で開発サーバーを起動
2. `npm run qr` で QR コードを生成
3. iPhone の Even App で QR をスキャン
4. グラスにアプリが表示される（Vite HMR で即反映）

シミュレータでの開発: [even-dev](https://github.com/BxNxM/even-dev)

```bash
git clone https://github.com/BxNxM/even-dev.git
cd even-dev && npm install
APP_PATH=../even-g2 ./start-even.sh
```

## アプリアイディア

### 実用系
- **ポモドーロタイマー** - 作業25分 / 休憩5分のタイマー。テキストコンテナで残り時間とUnicodeプログレスバー（━/─）を表示。リングクリックで開始/一時停止。シンプルで実装しやすく、日常的に使える
- **天気＋予定グランス** - 天気APIとGoogleカレンダーから情報を取得し、「今日の天気」と「次の予定」を1画面で表示。定期更新。バックエンドでAPI処理
- **語学フラッシュカード** - 単語帳アプリ。表面（単語）→クリックで裏面（意味）→スクロールで次のカード。スキマ時間の学習に最適
- **通知ビューア** - Slack/GitHub等の未読通知をグラスに表示。リストコンテナで一覧、クリックで詳細表示

### ゲーム系
- **数当てゲーム (Higher/Lower)** - ランダムな数字を当てる。スクロールで上下、クリックで決定。テキストのみで実装可能
- **テキストアドベンチャー** - 選択肢付きストーリー。リストコンテナで選択肢、テキストコンテナで物語。ページフリップで長文対応
- **リアクションゲーム** - ランダムなタイミングで表示される合図にできるだけ速くクリック。反応速度を測定

### 実験系
- **AIアシスタント** - マイクで音声入力→バックエンドでLLM処理→テキストで回答表示。ハンズフリーAI
- **音声メモ** - マイクで録音→Whisperで文字起こし→テキスト表示＋保存

## 参考リソース

- [Even G2 開発ノート](https://github.com/nickustinov/even-g2-notes) - コミュニティによるリバースエンジニアリングドキュメント
- [Even Hub SDK (npm)](https://www.npmjs.com/package/@evenrealities/even_hub_sdk)
- [even-dev シミュレータ](https://github.com/BxNxM/even-dev)
- 参考アプリ: [chess](https://github.com/dmyster145/EvenChess), [reddit](https://github.com/fuutott/rdt-even-g2-rddit-client), [weather](https://github.com/nickustinov/weather-even-g2), [pong](https://github.com/nickustinov/pong-even-g2)
