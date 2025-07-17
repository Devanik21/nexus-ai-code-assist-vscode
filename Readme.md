# Nexus AI Code Assist

A context-aware VS Code extension that uses Google Gemini AI to help you edit and improve your code. Unlike basic chatbots, this extension understands your current file context and can generate precise diffs for code changes.

## Features

- **Context-Aware**: Automatically reads and understands your current file
- **Smart Diff Generation**: Generates precise code changes with diff preview
- **Safe Edits**: Always asks for permission before applying changes
- **Real-time Updates**: Tracks file changes and selections in real-time
- **Multi-language Support**: Works with any programming language VS Code supports

## Installation

1. Copy the extension files to your VS Code extensions directory
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Reload VS Code
5. Configure your Gemini API key in settings

## Configuration

Open VS Code settings and configure:

- `nexusAiCodeAssist.apiKey`: Your Google Gemini API key
- `nexusAiCodeAssist.model`: Gemini model to use (default: gemini-pro)

## Usage

1. **Open a file** you want to work with
2. **Open the AI Code Assist panel** from the Activity Bar (or use `Ctrl+Shift+P` → "Open AI Code Assist")
3. **Ask questions** about your code:
   - "Add error handling to this function"
   - "Convert this to TypeScript"
   - "Optimize this algorithm"
   - "Add comments to explain this code"
   - "Fix the bug in this function"
   - "Refactor this code to be more readable"

4. **Review the proposed changes** in the diff preview
5. **Apply changes** if you approve them

## Example Interactions

**User**: "Add input validation to this function"
**AI**: Reviews your function and suggests validation code with a diff preview

**User**: "Convert this JavaScript to TypeScript"
**AI**: Analyzes your JS code and provides TypeScript conversion with type annotations

**User**: "Fix the performance issue in this loop"
**AI**: Identifies bottlenecks and suggests optimized code

## Commands

- `Nexus AI: Open AI Code Assist` - Opens the assistant panel
- `Nexus AI: Analyze Current File` - Analyzes the currently open file

## How It Works

1. **Context Detection**: The extension monitors your active file and automatically provides context about:
   - File name and language
   - Complete file content
   - Current selection (if any)
   - Line numbers and structure

2. **Intelligent Prompting**: Your questions are enhanced with file context before being sent to Gemini

3. **Diff Generation**: The AI response is parsed to extract code changes and present them as reviewable diffs

4. **Safe Application**: Changes are never applied automatically - you always review and approve first

## Requirements

- VS Code 1.74.0 or higher
- Google Gemini API key
- Node.js 16.x or higher

## Extension Settings

This extension contributes the following settings:

- `nexusAiCodeAssist.apiKey`: Your Gemini API key
- `nexusAiCodeAssist.model`: Gemini model to use

## Known Issues

- Large files (>10MB) may have slower response times
- Some complex diff formats may need manual review
- API rate limits may apply based on your Gemini plan

## Release Notes

### 1.0.0

- Initial release
- Context-aware code assistance
- Diff generation and preview
- Safe change application
- Multi-language support

## Contributing

This extension is open for contributions. Feel free to submit issues and enhancement requests.

## License

MIT License - see LICENSE file for details.

---

**Enjoy coding with AI assistance!** 🚀