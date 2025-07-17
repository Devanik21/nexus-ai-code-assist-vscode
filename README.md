# 🚀 Nexus AI Code Assist

<div align="center">

![VS Code](https://img.shields.io/badge/VS%20Code-1.74.0+-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Version](https://img.shields.io/badge/Version-1.0.0-brightgreen?style=for-the-badge)

**🧠 Context-aware AI code assistant with intelligent diff generation**

*Unlike basic chatbots, this extension understands your code and generates precise, reviewable changes*

</div>

## ✨ Key Features

- 🎯 **Context-Aware**: Automatically reads and understands your current file
- 🔍 **Smart Diff Generation**: Creates precise code changes with diff preview
- 🛡️ **Safe Edits**: Always asks permission before applying changes
- ⚡ **Real-time Updates**: Tracks file changes and selections live
- 🌐 **Multi-language Support**: Works with any programming language
- 🤖 **Intelligent Automation**: Handles complex refactoring and optimization

## 🛠️ Installation

### Prerequisites
- VS Code 1.74.0+
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Setup
```bash
# Clone and install
git clone <your-repo-url>
cd nexus-ai-code-assist
npm install
npm run compile
```

### Configuration
1. Open VS Code settings (`Ctrl+,`)
2. Search for "Nexus AI Code Assist"
3. Configure:
   - `nexusAiCodeAssist.apiKey`: Your Gemini API key
   - `nexusAiCodeAssist.model`: Choose model (gemini-pro or gemini-pro-latest)

## 🎮 Usage

### Basic Workflow
1. **Open a file** you want to work with
2. **Click the code icon** in Activity Bar or use `Ctrl+Shift+P` → "Open AI Code Assist"
3. **Ask intelligent questions**:
   - "Add error handling to this function"
   - "Convert this to TypeScript"
   - "Optimize this algorithm"
   - "Add comprehensive comments"
   - "Fix the bug in this function"
   - "Refactor for better readability"

4. **Review diff preview** of proposed changes
5. **Apply changes** if approved

### Example Interactions

```typescript
// Before
function processData(data) {
    return data.map(item => item.value * 2);
}
```

**User**: "Add input validation and TypeScript types"

**AI Response**: 
```diff
- function processData(data) {
+ function processData(data: Array<{value: number}>): number[] {
+     if (!Array.isArray(data)) {
+         throw new Error('Input must be an array');
+     }
+     
+     data.forEach(item => {
+         if (typeof item.value !== 'number') {
+             throw new Error('All items must have numeric value property');
+         }
+     });
+     
      return data.map(item => item.value * 2);
  }
```

## 🔧 Advanced Features

### Context Detection
- **File Analysis**: Complete file content understanding
- **Selection Tracking**: Works with highlighted code
- **Language Detection**: Automatic syntax awareness
- **Structure Analysis**: Understands code organization

### Intelligent Capabilities
- **Code Optimization**: Performance improvements
- **Type Safety**: TypeScript conversions
- **Error Handling**: Robust error management
- **Documentation**: Comprehensive commenting
- **Refactoring**: Structure improvements
- **Bug Detection**: Issue identification and fixes

## ⚙️ Configuration

| Setting | Description | Default | Options |
|---------|-------------|---------|---------|
| `nexusAiCodeAssist.apiKey` | Your Gemini API key | `""` | String |
| `nexusAiCodeAssist.model` | AI model to use | `"gemini-pro"` | `gemini-pro`, `gemini-pro-latest` |

## 🎯 Commands

| Command | Description | Shortcut |
|---------|-------------|----------|
| `nexus-ai-code-assist.openChat` | Open AI Code Assist panel | Activity Bar |
| `nexus-ai-code-assist.analyzeFile` | Analyze current file | Command Palette |

## 🏗️ How It Works

1. **Context Detection**: Monitors active file and provides:
   - File name and language
   - Complete file content
   - Current selection
   - Line numbers and structure

2. **Intelligent Prompting**: Enhances questions with file context

3. **Diff Generation**: Parses AI responses into reviewable diffs

4. **Safe Application**: Manual review and approval required

## 🚀 Development

### Project Structure
```
nexus-ai-code-assist/
├── src/
│   └── extension.ts      # Main extension logic
├── out/                  # Compiled output
├── package.json          # Extension manifest
├── tsconfig.json         # TypeScript config
└── README.md            # This file
```

### Scripts
```bash
npm run compile     # Build once
npm run watch      # Watch mode
npm run vscode:prepublish  # Pre-publish build
```

## 📋 Requirements

- **VS Code**: 1.74.0 or higher
- **Node.js**: 16.x (for development)
- **Gemini API Key**: Required for AI functionality

## 🐛 Troubleshooting

- **No responses**: Verify API key configuration
- **Slow responses**: Large files (>10MB) may be slower
- **Diff issues**: Some complex formats need manual review
- **Rate limits**: Check your Gemini API plan limits

## 📝 Release Notes

### 1.0.0
- 🎉 Initial release
- 🧠 Context-aware code assistance
- 🔍 Smart diff generation and preview
- 🛡️ Safe change application system
- 🌐 Multi-language support
- 🤖 Intelligent automation features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test thoroughly
4. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini team for powerful AI capabilities
- VS Code extension API developers
- Open source community for inspiration

---

<div align="center">

**🚀 Supercharge your coding with intelligent AI assistance!** 

*Context-aware • Diff-powered • Safe • Fast*

⭐ **Star this repo if it boosted your productivity!** ⭐

</div>
