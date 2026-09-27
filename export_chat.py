import json

input_path = r'C:\Users\dhrum\.gemini\antigravity-ide\brain\5ecd5ffa-eb73-48fc-904a-acc9b4a897de\.system_generated\logs\transcript_full.jsonl'
output_path = r'g:\Project\TYAG_Connect_bot\chat.md'

with open(input_path, 'r', encoding='utf-8') as fin, open(output_path, 'w', encoding='utf-8') as fout:
    fout.write('# Chat Transcript\n\n')
    for line in fin:
        if not line.strip(): continue
        try:
            data = json.loads(line)
            source = data.get('source')
            msg_type = data.get('type')
            content = data.get('content')
            
            if source == 'USER_EXPLICIT' and msg_type == 'USER_INPUT':
                fout.write('**User:**\n' + str(content) + '\n\n---\n\n')
            elif source == 'MODEL' and msg_type == 'PLANNER_RESPONSE' and content:
                fout.write('**Antigravity:**\n' + str(content) + '\n\n---\n\n')
        except Exception as e:
            print("Error parsing line", e)
            
print("Done writing to", output_path)
