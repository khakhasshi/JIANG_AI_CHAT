# JIANGJINGZHE-GPT Terminal - 个人AI对话终端

## 项目简介

这是一个具有复古终端风格的AI对话网站，基于Flask框架和OpenAI API构建，模拟了老式CRT显示器的视觉效果，为用户提供独特的聊天体验。

## 主要特性

- 💬 **个性化AI角色**：模拟江景哲的电子分身，具有特定性格和专业知识背景
- 📁 **对话历史管理**：自动保存所有对话记录，支持多会话切换
- 🎨 **复古终端风格**：CRT显示器视觉效果，包括扫描线、噪点和辉光效果
- 🤖 **多模型支持**：可选择GPT-4o、GPT-4 Turbo或GPT-3.5 Turbo
- ⚡ **实时交互**：流畅的对话体验，带有打字机效果

## 技术栈

### 后端
- **Flask** - Python轻量级Web框架
- **OpenAI API** - 提供AI对话能力
- **文件存储** - 使用JSON文件存储对话历史

### 前端
- **HTML5/CSS3** - 复古终端界面实现
- **JavaScript** - 交互逻辑处理
- **KaTeX** - 数学公式渲染
- **Marked.js** - Markdown解析

## 快速开始

### 前提条件

- Python 3.7+
- OpenAI API密钥
- Node.js (可选，用于前端构建)

### 安装步骤

1. 克隆仓库：
   ```bash
   git clone https://github.com/yourusername/jiangjingzhe-gpt-terminal.git
   cd jiangjingzhe-gpt-terminal
   ```

2. 创建并激活虚拟环境：
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```

3. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```

4. 配置环境变量：
   创建`.env`文件并添加：
   ```
   OPENAI_API_KEY=your_api_key_here
   FLASK_SECRET_KEY=your_secret_key_here
   ```

### 运行项目

1. 启动Flask开发服务器：
   ```bash
   python app.py
   ```

2. 访问应用：
   ```
   http://localhost:5000
   ```

3. (可选) 使用Ngrok公开访问：
   ```bash
   ngrok http 5000
   ```

## 项目结构

```
.
├── app.py                 # Flask主应用文件
├── static/                # 静态资源
│   ├── css/               # 样式文件
│   └── js/                # JavaScript文件
├── templates/             # HTML模板
│   └── index.html         # 主页面
├── conversations/         # 对话历史存储目录
├── requirements.txt       # Python依赖
├── README.md              # 项目文档
└── .env                   # 环境变量配置
```

## 配置选项

可在`app.py`中修改以下配置：

- `SYSTEM_PROMPT`: 调整AI的系统角色设定
- `CONV_DIR`: 更改对话历史存储目录
- 模型列表: 修改可选的AI模型

## 使用说明

1. **开始新对话**：点击侧边栏的"+ NEW CHAT"按钮
2. **切换对话**：在侧边栏点击已有对话
3. **发送消息**：在输入框键入内容后按Enter或点击发送按钮
4. **选择模型**：使用顶部下拉菜单切换不同AI模型

## 开发建议

1. **前端修改**：
   - CSS样式主要在`static/css/style.css`
   - 交互逻辑在`static/js/script.js`

2. **后端扩展**：
   - 添加新API路由在`app.py`
   - 修改对话存储逻辑在`get_conv_path`等相关函数

3. **样式定制**：
   - 调整`style.css`中的颜色变量可改变主题
   - 修改扫描线效果在`.scanlines`类

## 部署选项

### 生产环境部署

1. **使用Waitress**：
   ```bash
   pip install waitress
   waitress-serve --port=5000 app:app
   ```

2. **Docker部署**：
   ```dockerfile
   FROM python:3.9
   WORKDIR /app
   COPY . .
   RUN pip install -r requirements.txt
   CMD ["python", "app.py"]
   ```

### 云平台部署

- **Vercel**: 适合前端部署
- **Railway**: 全栈应用一键部署
- **Heroku**: 免费方案适合小型项目

## 贡献指南

欢迎提交Pull Request或Issue。主要开发方向包括：

- 添加用户认证系统
- 实现对话导出功能
- 优化移动端体验
- 添加更多个性化设置

## 许可证

本项目采用 [MIT License](LICENSE)。

## 联系方式

如有问题或建议，请联系：jiangjingzhe2004@gmail.com

---

**提示**：本项目仅供学习交流使用，实际部署时请注意OpenAI API的使用成本和流量限制。
