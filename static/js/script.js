class RetroGPT {
  constructor() {
    this.currentConvId = null;
    this.conversations = [];
    this.initElements();
    this.initEvents();
    this.updateTime();
    setInterval(() => this.updateTime(), 1000);
    this.isProcessing = false;
    this.eventSource = null;
    this.loadConversations();
  }

  initElements() {
    this.chatContainer = document.getElementById('chat-container');
    this.userInput = document.getElementById('user-input');
    this.sendButton = document.getElementById('send-button');
    this.modelSelect = document.getElementById('model-select');
    this.statusElement = document.getElementById('status');
    this.tokenCountElement = document.getElementById('token-count');
    this.latencyElement = document.getElementById('latency');
    this.timeElement = document.getElementById('update-time');
    this.conversationList = document.querySelector('.conversation-list');
    this.newChatBtn = document.querySelector('.new-chat-btn');
    this.ctrlButtons = document.querySelectorAll('.ctrl-btn');
  }

  initEvents() {
    this.sendButton.addEventListener('click', () => this.sendMessage());
    this.userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Auto-resize textarea
    this.userInput.addEventListener('input', () => {
      this.userInput.style.height = 'auto';
      this.userInput.style.height = this.userInput.scrollHeight + 'px';
    });

    // New chat button
    this.newChatBtn.addEventListener('click', () => {
      this.createNewConversation();
    });

    // Control buttons (minimize/maximize/close)
    this.ctrlButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.classList.contains('minimize') ? 'minimize' : 
                       e.target.classList.contains('maximize') ? 'maximize' : 'close';
        this.handleControlAction(action);
      });
    });
  }

  async loadConversations() {
    const res = await fetch('/api/conversations');
    const data = await res.json();
    this.conversations = data;
    this.renderConversationList();
    // 默认选中最后一个会话（最新）
    if (this.conversations.length > 0) {
      this.selectConversation(this.conversations[this.conversations.length - 1].id);
    }
  }

  renderConversationList() {
    this.conversationList.innerHTML = '';
    this.conversations.forEach(conv => {
      const item = document.createElement('div');
      item.className = 'conversation-item';
      item.dataset.id = conv.id;
      item.innerHTML = `<span class="icon">💬</span> ${conv.name}`;
      if (conv.id === this.currentConvId) item.classList.add('active');
      item.addEventListener('click', () => {
        this.selectConversation(conv.id);
      });
      this.conversationList.appendChild(item);
    });
  }

  async selectConversation(convId) {
    this.currentConvId = convId;
    // 激活高亮
    document.querySelectorAll('.conversation-item').forEach(i => {
      i.classList.toggle('active', Number(i.dataset.id) === convId);
    });
    // 加载历史
    const res = await fetch(`/api/history/${convId}`);
    const data = await res.json();
    this.renderHistory(data.messages || []);
    this.tokenCountElement.textContent = '0';
    this.latencyElement.textContent = '0ms';
    this.statusElement.textContent = 'READY';
  }

  addMessage(role, content, id = '') {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';

    const userDiv = document.createElement('div');
    userDiv.className = 'message-user';
    userDiv.textContent = role === 'user' ? 'USER:' : 'GPT-4o:';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    // 只对 AI 回复做基础的 LaTeX 包裹
    if (role !== 'user') {
      content = this.autoWrapMath(content);
    }

    // 用 marked 解析 markdown
    contentDiv.innerHTML = marked.parse(content);

    if (id) {
      contentDiv.id = id;
      contentDiv.innerHTML = '> ';
    }

    messageDiv.appendChild(userDiv);
    messageDiv.appendChild(contentDiv);
    this.chatContainer.appendChild(messageDiv);

    // 渲染公式
    this.renderMath(contentDiv);

    this.scrollToBottom();
    return contentDiv;
  }

  // 只在输出完毕后渲染公式
  async typeWriter(element, text, delay = 20) {
    element.innerHTML = '';
    for (let i = 0; i < text.length; i++) {
      element.innerHTML = marked.parse(text.slice(0, i + 1));
      await new Promise(res => setTimeout(res, delay));
      this.scrollToBottom();
    }
    this.renderMath(element);
  }

  // 只做最基础的 LaTeX 包裹
  autoWrapMath(content) {
    // 块级公式
    content = content.replace(/\\\[(.+?)\\\]/gs, (_, expr) => `\n$$${expr.trim()}$$\n`);
    content = content.replace(/\$\$(.+?)\$\$/gs, (_, expr) => `\n$$${expr.trim()}$$\n`);
    // 行内公式
    content = content.replace(/\\\((.+?)\\\)/gs, (_, expr) => `$${expr.trim()}$`);
    return content;
  }

  // 单独封装公式渲染
  renderMath(element) {
    if (window.renderMathInElement) {
      renderMathInElement(element, {
        delimiters: [
          {left: "$$", right: "$$", display: true},
          {left: "$", right: "$", display: false}
        ]
      });
    }
  }

  renderHistory(messages) {
    this.chatContainer.innerHTML = '';
    if (!messages || messages.length === 0) {
      this.showWelcome();
      return;
    }
    messages.forEach(msg => {
      if (msg.role === 'system') return;
      this.addMessage(msg.role, msg.content);
    });
    this.scrollToBottom();
  }

  showWelcome() {
    this.chatContainer.innerHTML = `
      <div class="welcome-message">
        <div class="welcome-title">RETRO-GPT TERMINAL v1.0</div>
        <div class="welcome-text">
          > SYSTEM INITIALIZED<br>
          > READY FOR USER INPUT<br>
          > MODEL: ${this.modelSelect.value.toUpperCase()} ONLINE
        </div>
      </div>
    `;
  }

  async createNewConversation() {
    const res = await fetch('/api/new_chat', {method: 'POST'});
    const data = await res.json();
    this.conversations.push(data);
    this.renderConversationList();
    this.selectConversation(data.id);
  }

  async sendMessage() {
    if (this.isProcessing || !this.currentConvId) return;
    const message = this.userInput.value.trim();
    if (!message) return;
    this.setProcessingState(true);
    this.addMessage('user', message);
    this.userInput.value = '';
    this.userInput.style.height = 'auto';

    const messageId = 'msg-' + Date.now();
    const contentDiv = this.addMessage('assistant', '', messageId);

    try {
      const startTime = Date.now();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          message: message,
          model: this.modelSelect.value,
          conv_id: this.currentConvId
        })
      });
      const data = await response.json();
      await this.typeWriter(contentDiv, '> ' + data.response);
      this.setProcessingState(false);
      this.latencyElement.textContent = `${Date.now() - startTime}ms`;
      this.updateTokenCount(data.tokens || 0);
      this.scrollToBottom();
    } catch (error) {
      this.addMessage('assistant', `> SYSTEM ERROR: ${error.message}`);
      this.setProcessingState(false);
    }
  }

  scrollToBottom() {
    this.chatContainer.scrollTo({
      top: this.chatContainer.scrollHeight,
      behavior: 'smooth'
    });
  }

  updateTokenCount(count) {
    this.tokenCountElement.textContent = Math.floor(count);
  }

  setProcessingState(isProcessing) {
    this.isProcessing = isProcessing;
    this.statusElement.textContent = isProcessing ? 'THINKING...' : 'READY';
    this.userInput.disabled = isProcessing;
    this.sendButton.disabled = isProcessing;
  }

  updateTime() {
    const now = new Date();
    this.timeElement.textContent = 
      `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ` +
      `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  }

  handleControlAction(action) {
    switch(action) {
      case 'minimize':
        console.log('Minimize window');
        break;
      case 'maximize':
        console.log('Maximize window');
        break;
      case 'close':
        if(confirm('Are you sure you want to close the terminal?')) {
          window.close();
        }
        break;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new RetroGPT();
});

// Katex CSS
const style = document.createElement('style');
style.textContent = `
.katex-display { margin: 1em 0; }

@media (max-width: 768px) {
  #user-input {
    font-size: 1.1em;
    min-height: 48px;
    padding: 10px;
  }
  .send-btn {
    font-size: 1.2em;
    padding: 10px 16px;
  }
}
`;
document.head.appendChild(style);
