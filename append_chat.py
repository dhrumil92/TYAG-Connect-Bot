import json
import os

input_path = r'C:\Users\dhrum\.gemini\antigravity-ide\brain\5ecd5ffa-eb73-48fc-904a-acc9b4a897de\.system_generated\logs\transcript_full.jsonl'
output_path = r'g:\Project\TYAG_Connect_bot\chat.md'

messages = []
with open(input_path, 'r', encoding='utf-8') as fin:
    for line in fin:
        if not line.strip(): continue
        try:
            data = json.loads(line)
            source = data.get('source')
            msg_type = data.get('type')
            content = data.get('content')
            created_at = data.get('created_at', '')
            
            # Only get messages from July 29th onwards
            if created_at > '2026-07-29T00:00:00Z':
                if source == 'USER_EXPLICIT' and msg_type == 'USER_INPUT':
                    messages.append('**User:**\n' + str(content) + '\n\n---\n\n')
                elif source == 'MODEL' and msg_type == 'PLANNER_RESPONSE' and content:
                    messages.append('**Antigravity:**\n' + str(content) + '\n\n---\n\n')
        except Exception as e:
            pass

# Read existing file
existing_content = ""
try:
    with open(output_path, 'r', encoding='utf-8') as f:
        existing_content = f.read()
except:
    pass

# Append new messages that aren't already in the file
appended = 0
with open(output_path, 'a', encoding='utf-8') as fout:
    for msg in messages:
        if msg.strip() not in existing_content:
            fout.write(msg)
            existing_content += msg
            appended += 1

print(f"Successfully appended {appended} new messages to chat.md!")
