from flask import Flask, render_template, request, jsonify, session
import openai
import os
import json

app = Flask(__name__)
app.secret_key = 'your-secret-key'

openai.api_key = ''

CONV_DIR = 'conversations'
os.makedirs(CONV_DIR, exist_ok=True)

def get_next_conv_id():
    files = [f for f in os.listdir(CONV_DIR) if f.startswith('Conversation_') and f.endswith('.json')]
    if not files:
        return 0
    ids = [int(f.split('_')[1].split('.')[0]) for f in files]
    return max(ids) + 1

def get_conv_path(conv_id):
    return os.path.join(CONV_DIR, f'Conversation_{conv_id}.json')

def get_all_conversations():
    files = [f for f in os.listdir(CONV_DIR) if f.startswith('Conversation_') and f.endswith('.json')]
    ids = sorted([int(f.split('_')[1].split('.')[0]) for f in files])
    return [{"id": i, "name": f"Chat {i}"} for i in ids]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/conversations', methods=['GET'])
def conversations():
    return jsonify(get_all_conversations())

SYSTEM_PROMPT = (
    "你是江景哲/JIANGJINGZHE的电子分身，部署于他的网站上，身份是冷静理性、幽默直接、温和耐心且批判性强的INFP型机械工程大三学生兼量化交易员，具备量化交易与机械建模设计背景；你说话简洁温暖，偏好中英文结合、通俗逻辑推导、风格类似刘慈欣；你永远以“我本人”身份发言，不编造不浮夸，观点基于分析，偏好理论原理，伦理上支持民主自由，遇创意需求先澄清，再生成内容，对新手细讲概念，对专业人士精炼回应，不主动给未经验证信息或无意义鼓励，除非用户另有要求。"
)

@app.route('/api/new_chat', methods=['POST'])
def new_chat():
    conv_id = get_next_conv_id()
    conv_path = get_conv_path(conv_id)
    # 新会话时写入system prompt
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    with open(conv_path, 'w', encoding='utf-8') as f:
        json.dump(messages, f, ensure_ascii=False, indent=2)
    return jsonify({"id": conv_id, "name": f"Chat {conv_id}"})

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    message = data['message']
    model = data.get('model', 'gpt-3.5-turbo')
    conv_id = int(data.get('conv_id', 0))

    # 取出历史消息
    conv_path = get_conv_path(conv_id)
    if os.path.exists(conv_path):
        with open(conv_path, 'r', encoding='utf-8') as f:
            messages = json.load(f)
    else:
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.append({"role": "user", "content": message})

    try:
        response = openai.chat.completions.create(
            model=model,
            messages=messages
        )
        assistant_reply = response.choices[0].message.content
        messages.append({"role": "assistant", "content": assistant_reply})

        # 保存到文件
        with open(get_conv_path(conv_id), 'w', encoding='utf-8') as f:
            json.dump(messages, f, ensure_ascii=False, indent=2)

        return jsonify({
            'response': assistant_reply,
            'tokens': response.usage.total_tokens if hasattr(response.usage, 'total_tokens') else 0,
            'status': 'success'
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/history/<int:conv_id>', methods=['GET'])
def get_history(conv_id):
    conv_path = get_conv_path(conv_id)
    if os.path.exists(conv_path):
        with open(conv_path, 'r', encoding='utf-8') as f:
            messages = json.load(f)
        return jsonify({"messages": messages})
    else:
        return jsonify({"messages": []})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80, debug=True)
