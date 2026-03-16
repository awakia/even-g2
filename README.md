# Even G2 Smart Glasses Apps

Even Realities G2 スマートグラス用アプリ集。

## G2 とは

- デュアル micro-LED ディスプレイ（各レンズ 576x288px、4bit グレースケール＝16段階の緑）
- カメラなし、スピーカーなし（マイクあり）のプライバシー重視設計
- R1 コントロールリングでスクロール・クリック入力
- iPhone と BLE 5.x で接続

```
[Web サーバー] <--HTTPS--> [iPhone WebView] <--BLE--> [G2 グラス]
```

## アプリ一覧

| アプリ | 説明 | 状態 |
|--------|------|------|
| [pomodoro](apps/pomodoro/) | ポモドーロタイマー（25分作業/5分休憩） | 開発中 |

## セットアップ

```bash
cd apps/pomodoro    # 使いたいアプリのディレクトリへ
npm install
npm run dev         # 開発サーバー起動
npm run qr          # QRコード生成（Even App でスキャン）
```

## シミュレータでの開発

```bash
git clone https://github.com/BxNxM/even-dev.git
cd even-dev && npm install
APP_PATH=../even-g2/apps/pomodoro ./start-even.sh
```

## プロジェクト構造

```
even-g2/
├── apps/               # 各アプリ（独立したWebアプリ）
│   └── pomodoro/
├── docs/
│   └── ideas.md        # アプリアイディア集
├── CLAUDE.md           # 開発ガイド
└── README.md
```

各アプリは独立した `package.json` を持ち、単体で開発・ビルド・パッケージングできる。

## アプリアイディア

[docs/ideas.md](docs/ideas.md) を参照。

## 参考リソース

- [Even G2 開発ノート](https://github.com/nickustinov/even-g2-notes) - コミュニティによるリバースエンジニアリングドキュメント
- [Even Hub SDK (npm)](https://www.npmjs.com/package/@evenrealities/even_hub_sdk)
- [even-dev シミュレータ](https://github.com/BxNxM/even-dev)
- 参考アプリ: [chess](https://github.com/dmyster145/EvenChess), [reddit](https://github.com/fuutott/rdt-even-g2-rddit-client), [weather](https://github.com/nickustinov/weather-even-g2)
