# Task Logger

**Task Logger** is a Chrome extension designed to easily record and visualize interruptions and project tasks during your work.

## Features

- **One-Click Logging**: Instantly record interruptions or tasks (e.g., Phone, Email, Design) with a single click.
- **Task Types & Memos**: Categorize tasks by process (e.g., Design, Dev) and add detailed notes.
- **Timer Tracking**: Automatically tracks the duration of each task.
- **Customization**: Fully customizable Categories and Task Types with Drag & Drop reordering.
- **Daily Stats**: Visualize daily task distribution and count via charts.
- **CSV Export**: Export your logs to CSV for further analysis in Excel or Sheets.

## Installation (Developer Mode)

1. **Clone or download this repository.**
2. **Open `chrome://extensions/` in Google Chrome.**
3. **Enable "Developer mode" at the top right.**
4. **Click "Load unpacked".**
5. **Select the directory containing `manifest.json`.**

## Development

To push changes to GitHub:

```powershell
# Initialize
git init

# Add files
git add .
git commit -m "Update extension"

# Push (replace URL with your repo)
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/interruption-tracker.git
git push -u origin main
git push -u origin main
```

### GitHub Actions (CI)

This repository includes a GitHub Actions workflow (`.github/workflows/main.yml`) that automatically runs on every push and pull request to the `main` branch.
- **Checks**: content of `manifest.json` (valid JSON) and file structure.
- **Usage**: Simply push your changes, and the "Actions" tab in GitHub will show the build status.

## License

MIT

---

# Task Logger (日本語)

**Task Logger** は、作業中に発生する「割り込み」やプロジェクトタスクをワンクリックで記録し、可視化・集計するためのChrome拡張機能です。

## 機能

- **ワンクリック記録**: アイコンをクリックして、割り込みの種類やタスクを選択するだけで記録を開始できます。
- **工程・メモ**: 「設計」「実装」などの工程選択や、詳細なメモ入力が可能です。
- **時間計測**: タスクごとの所要時間を自動で計測します。
- **カスタマイズ**: カテゴリや工程は自由に追加・削除でき、ドラッグ＆ドロップで並び替えも可能です。
- **日次集計**: 今日の記録回数や内訳をグラフで確認できます。
- **CSV書き出し**: 記録データをCSVとしてダウンロードし、Excelなどで分析できます。

## インストール方法 (開発者モード)

1. **このリポジトリをクローンまたはダウンロードします。**
2. **Chromeで `chrome://extensions/` を開きます。**
3. **右上の「デベロッパーモード」をオンにします。**
4. **「パッケージ化されていない拡張機能を読み込む」をクリックします。**
5. **`manifest.json` が含まれるフォルダを選択します。**

## 開発・貢献

GitHubへ変更をプッシュする手順例:

```powershell
# 初期化
git init

# ファイル追加とコミット
git add .
git commit -m "Update extension"

# プッシュ (URLはご自身のリポジトリに合わせて変更してください)
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/task-logger.git
git push -u origin main
git push -u origin main
```

### GitHub Actions (CI)

このリポジトリには GitHub Actions ワークフロー (`.github/workflows/main.yml`) が含まれており、`main` ブランチへのプッシュやプルリクエスト時に自動的に実行されます。
- **チェック内容**: `manifest.json` の構文チェックと基本的なファイル構成の確認。
- **使い方**: 変更をプッシュするだけで、GitHubの「Actions」タブで実行結果（成功/失敗）を確認できます。
