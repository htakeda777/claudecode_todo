# メールサマリーツール

Claude APIを使って、メールの内容を日本語で要約するツールです。

## セットアップ

```bash
pip install -r requirements.txt
export ANTHROPIC_API_KEY="your-api-key"
```

## 使い方

メールデータをJSON形式で用意し、スクリプトに渡します。

```bash
python email_summary.py sample_emails.json
```

## メールJSONフォーマット

```json
[
  {
    "from": "差出人 <email@example.com>",
    "subject": "件名",
    "date": "2026-02-24 09:00",
    "body": "メール本文"
  }
]
```

## 出力例

各メールについて以下の情報が出力されます：
- 差出人
- 件名
- 要点（1〜2文）
- 重要度（高/中/低）
- 全体の概要
