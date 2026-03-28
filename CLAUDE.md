# CLAUDE.md

## プロジェクト概要

Even Realities G2 スマートグラス用アプリ集。通常のWebアプリとして構築し、iPhone経由でBLEでグラスに表示する。

## プロジェクト構造

```
apps/{name}/   # 各アプリ（独立したWebアプリ、個別のpackage.json）
docs/          # ドキュメント（ideas.md等）
```

新しいアプリを追加するときは `apps/{name}/` に以下を作成:
- `package.json`, `app.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `src/main.ts`

## 技術リファレンス

詳細ドキュメント: https://github.com/nickustinov/even-g2-notes/tree/main/docs

### ディスプレイ
- キャンバス: 576x288px、座標原点は左上
- 4bit グレースケール（16段階の緑）、micro-LED
- 最大4コンテナ/ページ（テキスト・リスト・画像を混在可）
- 必ず1つのコンテナに `isEventCapture: 1` を設定

### コンテナタイプ
- **TextContainerProperty**: テキスト表示。左寄せ・上寄せ固定。フォント選択不可。`\n`で改行。~400-500文字で全画面
- **ListContainerProperty**: ネイティブスクロールリスト。最大20項目。ファームウェアがスクロール処理
- **ImageContainerProperty**: グレースケール画像。20-200px幅、20-100px高さ。起動時は空、`updateImageRawData`で更新

### SDK (`@evenrealities/even_hub_sdk`)
```typescript
import { waitForEvenAppBridge } from '@evenrealities/even_hub_sdk'
const bridge = await waitForEvenAppBridge()
```

### ページライフサイクル
- `createStartUpPageContainer` - 起動時に1回だけ呼ぶ（テキスト最大1000文字）
- `rebuildPageContainer` - ページ全体を再構築（画面遷移用、テキスト最大1000文字）
- `textContainerUpgrade` - テキストの部分更新（フリッカーなし、最大2000文字）
- `updateImageRawData` - 画像データ更新（同時送信不可、キューで処理）
- `shutDownPageContainer(0|1)` - アプリ終了

### 入力イベント
```typescript
bridge.onEvenHubEvent(event => {
  // event.listEvent / event.textEvent / event.sysEvent / event.audioEvent
})
```
- CLICK_EVENT=0, SCROLL_TOP_EVENT=1, SCROLL_BOTTOM_EVENT=2, DOUBLE_CLICK_EVENT=3
- **重要**: CLICK_EVENT(0)は`undefined`になることがある。`eventType === 0 || eventType === undefined` でチェック
- スクロールイベントは300msのクールダウン推奨

### デバイスAPI
- `bridge.getDeviceInfo()` - バッテリー、装着検知等
- `bridge.getUserInfo()` - ユーザー情報
- `bridge.audioControl(true/false)` - マイク制御（PCM 16kHz, S16LE, mono）
- `bridge.setLocalStorage(key, value)` / `bridge.getLocalStorage(key)` - 永続化

### SDK の制約
- 直接BLEアクセス不可
- テキスト配置（中央/右寄せ）不可（スペースでパディング）
- フォントサイズ・ウェイト・ファミリー変更不可
- 背景色・塗りつぶし不可
- リスト項目の個別スタイリング不可
- アニメーション不可

### UI パターン
- フェイクボタン: `>` カーソルでテキスト内選択を表現
- プログレスバー: `━`(filled) + `─`(empty) のUnicode文字
- 画像アプリのイベント受信: 背面にテキストコンテナ(`isEventCapture:1`)を配置
- 長文: ~400文字ずつページ分割、SCROLL_TOP/BOTTOM_EVENTで前後ページ

### パッケージング
- `evenhub pack app.json dist -o app.ehpk`
- `app.json` のスキーマ（evenhub-cli v0.1.7時点）:

```json
{
  "package_id": "com.awakia.appname",  // リバースドメイン、小文字英数のみ
  "edition": "202601",                 // 固定値。CLIが受け付ける唯一の値
  "name": "AppName",
  "version": "1.0.0",
  "min_app_version": "0.1.0",
  "min_sdk_version": "0.1.0",         // 必須
  "tagline": "短い説明",
  "description": "詳細な説明",
  "author": "awakia",
  "entrypoint": "index.html",
  "permissions": [],                   // 文字列の配列（オブジェクトではない）
  "supported_languages": ["en", "ja"]  // 文字列の配列、必須
}
```

## 開発コマンド
```bash
cd apps/{name}     # アプリディレクトリへ移動
npm install        # 初回のみ
npm run dev        # Vite 開発サーバー
npm run qr         # QR コード生成
npm run build      # ビルド
npm run pack       # .ehpk パッケージング
```

## デプロイ

### Even Hub に .ehpk をアップロード
```bash
npm run build
npm run pack       # → app.ehpk
```
[Even Hub](https://hub.evenrealities.com/) のWebポータル（「Upload package」ボタン）から `.ehpk` を提出。CLIにupload/deployコマンドはない（v0.1.7時点）。

### 実機へのインストール（2026-03時点: 未開放）
- Even Realities App 内の Even Hub ストア → **coming soon**
- QRコードサイドロード（`npm run qr`）→ アプリ内にQRスキャナーが **まだない**
- 現状はシミュレータ（even-dev）でのテストのみ可能

## コミット規約

Conventional Commits、日本語で簡潔に。

```
feat: ポモドーロタイマーの基本実装
fix: クリックイベントの判定漏れを修正
docs: READMEにセットアップ手順を追加
refactor: イベントハンドラを整理
chore: 依存パッケージを更新
```

## シミュレータ
```bash
# even-dev で実行
APP_PATH=../even-g2/apps/pomodoro ./start-even.sh
```
