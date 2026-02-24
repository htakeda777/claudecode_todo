#!/usr/bin/env python3
"""メールサマリーツール - Claude APIを使ってメールを要約する"""

import json
import sys
from datetime import datetime

import anthropic


SUMMARY_PROMPT = """以下のメール一覧を日本語で簡潔に要約してください。
各メールについて以下の情報を含めてください：
- 差出人
- 件名
- 要点（1〜2文）
- 重要度（高/中/低）

最後に、今日のメール全体の概要を3行程度でまとめてください。

メール一覧:
{emails}
"""


def load_emails(filepath: str) -> list[dict]:
    """JSONファイルからメールデータを読み込む"""
    with open(filepath, encoding="utf-8") as f:
        return json.load(f)


def format_emails(emails: list[dict]) -> str:
    """メールデータを文字列にフォーマットする"""
    parts = []
    for i, email in enumerate(emails, 1):
        parts.append(
            f"--- メール {i} ---\n"
            f"差出人: {email.get('from', '不明')}\n"
            f"件名: {email.get('subject', '(件名なし)')}\n"
            f"日時: {email.get('date', '不明')}\n"
            f"本文:\n{email.get('body', '(本文なし)')}\n"
        )
    return "\n".join(parts)


def summarize_emails(emails: list[dict]) -> str:
    """Claude APIを使ってメールを要約する"""
    client = anthropic.Anthropic()
    formatted = format_emails(emails)
    prompt = SUMMARY_PROMPT.format(emails=formatted)

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


def main():
    if len(sys.argv) < 2:
        print("使い方: python email_summary.py <メールJSONファイル>")
        print("例:     python email_summary.py sample_emails.json")
        sys.exit(1)

    filepath = sys.argv[1]
    emails = load_emails(filepath)
    today = datetime.now().strftime("%Y年%m月%d日")

    print(f"=== {today} のメールサマリー ===\n")
    print(f"メール件数: {len(emails)}通\n")

    summary = summarize_emails(emails)
    print(summary)


if __name__ == "__main__":
    main()
