import * as vscode from 'vscode';
import fetch from 'node-fetch';
import * as path from 'path';

interface FileContext {
    fileName: string;
    filePath: string;
    content: string;
    language: string;
    lineCount: number;
    selection?: {
        start: number;
        end: number;
        text: string;
    };
}

interface DiffChange {
    type: 'add' | 'remove' | 'modify';
    lineNumber: number;
    content: string;
    originalContent?: string;
}

export function activate(context: vscode.ExtensionContext) {
    const provider = new CodeAssistViewProvider(context.extensionUri);
    
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('nexusAiCodeAssist', provider)
    );

    // Command to open the chat
    let openChatCommand = vscode.commands.registerCommand('nexus-ai-code-assist.openChat', () => {
        vscode.commands.executeCommand('workbench.view.extension.nexus-ai-code');
    });

    // Command to analyze current file
    let analyzeFileCommand = vscode.commands.registerCommand('nexus-ai-code-assist.analyzeFile', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const context = getFileContext(editor);
            provider.analyzeFile(context);
        } else {
            vscode.window.showWarningMessage('No active file to analyze');
        }
    });

    context.subscriptions.push(openChatCommand, analyzeFileCommand);

    // Listen for active editor changes
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            const context = getFileContext(editor);
            provider.updateFileContext(context);
        }
    });

    // Listen for text changes
    vscode.workspace.onDidChangeTextDocument(event => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document) {
            const context = getFileContext(editor);
            provider.updateFileContext(context);
        }
    });

    // Initialize with current file if available
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        const context = getFileContext(activeEditor);
        provider.updateFileContext(context);
    }
}

function getFileContext(editor: vscode.TextEditor): FileContext {
    const document = editor.document;
    const selection = editor.selection;
    
    const context: FileContext = {
        fileName: path.basename(document.fileName),
        filePath: document.fileName,
        content: document.getText(),
        language: document.languageId,
        lineCount: document.lineCount
    };

    // Include selection if there's one
    if (!selection.isEmpty) {
        context.selection = {
            start: selection.start.line + 1,
            end: selection.end.line + 1,
            text: document.getText(selection)
        };
    }

    return context;
}

class CodeAssistViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private _currentFileContext?: FileContext;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'sendMessage':
                        await this.sendToGemini(message.text);
                        break;
                    case 'applyDiff':
                        await this.applyDiff(message.changes);
                        break;
                    case 'getFileContext':
                        this.sendFileContext();
                        break;
                }
            },
            undefined,
            []
        );
    }

    public updateFileContext(context: FileContext) {
        this._currentFileContext = context;
        this._view?.webview.postMessage({
            command: 'updateFileContext',
            context: context
        });
    }

    public analyzeFile(context: FileContext) {
        this._currentFileContext = context;
        this._view?.webview.postMessage({
            command: 'analyzeFile',
            context: context
        });
    }

    private sendFileContext() {
        if (this._currentFileContext) {
            this._view?.webview.postMessage({
                command: 'updateFileContext',
                context: this._currentFileContext
            });
        }
    }

    private async sendToGemini(userMessage: string) {
        const config = vscode.workspace.getConfiguration('nexusAiCodeAssist');
        const apiKey = config.get<string>('apiKey');

        if (!apiKey) {
            vscode.window.showErrorMessage('Please set your Gemini API key in settings');
            return;
        }

        if (!this._currentFileContext) {
            vscode.window.showWarningMessage('No active file context available');
            return;
        }

        try {
            // Show typing indicator
            this._view?.webview.postMessage({
                command: 'showTyping'
            });

            // Construct context-aware prompt
            const contextPrompt = this.buildContextPrompt(userMessage, this._currentFileContext);

            // Use the working endpoint
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: contextPrompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json() as any;
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
                const aiResponse = data.candidates[0].content.parts[0].text;
                
                // Parse response to check if it contains code changes
                const parsedResponse = this.parseAIResponse(aiResponse);
                
                this._view?.webview.postMessage({
                    command: 'displayResponse',
                    text: parsedResponse.text,
                    hasDiff: parsedResponse.hasDiff,
                    diff: parsedResponse.diff
                });
            } else {
                throw new Error('Unexpected response structure from Gemini API');
            }
        } catch (error) {
            console.error('Gemini API Error:', error);
            vscode.window.showErrorMessage(`Error connecting to Gemini API: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            // Hide typing indicator
            this._view?.webview.postMessage({
                command: 'hideTyping'
            });
        }
    }

    private buildContextPrompt(userMessage: string, context: FileContext): string {
        const selectionInfo = context.selection 
            ? `\n\nCurrent selection (lines ${context.selection.start}-${context.selection.end}):\n${context.selection.text}`
            : '';

        return `You are a code assistant helping with file editing. Here's the current file context:

File: ${context.fileName}
Language: ${context.language}
Lines: ${context.lineCount}

Current file content:
\`\`\`${context.language}
${context.content}
\`\`\`${selectionInfo}

User request: ${userMessage}

Please analyze the request and provide:
1. A clear explanation of what changes are needed
2. If code changes are required, provide the complete modified file content in this format:

DIFF_START
${context.content}
[Add your modifications here - show the complete file content with the requested changes]
DIFF_END

Make sure to:
- Be context-aware of the existing code
- Provide the complete, modified file content (not just the changes)
- Explain the reasoning behind changes
- Consider the existing code style and patterns
- Only suggest changes that are necessary and safe
- Preserve all existing content unless explicitly asked to remove it`;
    }

    private parseAIResponse(response: string): { text: string; hasDiff: boolean; diff?: string } {
        const diffStart = response.indexOf('DIFF_START');
        const diffEnd = response.indexOf('DIFF_END');
        
        if (diffStart !== -1 && diffEnd !== -1) {
            const text = response.substring(0, diffStart).trim();
            const diff = response.substring(diffStart + 10, diffEnd).trim();
            
            return {
                text,
                hasDiff: true,
                diff
            };
        }
        
        return {
            text: response,
            hasDiff: false
        };
    }

    private async applyDiff(diffContent: string) {
        if (!this._currentFileContext) {
            vscode.window.showErrorMessage('No active file context available');
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        // Show confirmation dialog
        const action = await vscode.window.showWarningMessage(
            `Apply changes to ${this._currentFileContext.fileName}?`,
            { modal: true },
            'Apply Changes',
            'Cancel'
        );

        if (action === 'Apply Changes') {
            try {
                // Parse the diff content to extract the actual code
                const cleanedContent = this.extractCodeFromDiff(diffContent);
                
                const fullRange = new vscode.Range(
                    editor.document.positionAt(0),
                    editor.document.positionAt(editor.document.getText().length)
                );

                await editor.edit(editBuilder => {
                    editBuilder.replace(fullRange, cleanedContent);
                });

                vscode.window.showInformationMessage('Changes applied successfully');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to apply changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }

    private extractCodeFromDiff(diffContent: string): string {
        // Since we're providing complete file content, just return it cleaned up
        let cleanedContent = diffContent;
        
        // Remove code block markers if present
        cleanedContent = cleanedContent.replace(/^```[\w]*\n?/gm, '');
        cleanedContent = cleanedContent.replace(/\n?```$/gm, '');
        
        // Remove DIFF_START/DIFF_END markers if present
        cleanedContent = cleanedContent.replace(/^DIFF_START\n?/gm, '');
        cleanedContent = cleanedContent.replace(/\n?DIFF_END$/gm, '');
        
        return cleanedContent.trim();
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nexus AI Code Assist</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    padding: 10px;
                    background: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    margin: 0;
                }
                
                .file-context {
                    background: var(--vscode-textBlockQuote-background);
                    border-left: 4px solid var(--vscode-textBlockQuote-border);
                    padding: 10px;
                    margin-bottom: 10px;
                    font-size: 12px;
                }
                
                .file-context h4 {
                    margin: 0 0 5px 0;
                    color: var(--vscode-textPreformat-foreground);
                }
                
                #chatContainer {
                    height: 400px;
                    overflow-y: auto;
                    border: 1px solid var(--vscode-input-border);
                    padding: 10px;
                    margin-bottom: 10px;
                    background: var(--vscode-input-background);
                }
                
                #inputContainer {
                    display: flex;
                    gap: 5px;
                }
                
                #messageInput {
                    flex: 1;
                    padding: 8px;
                    background: var(--vscode-input-background);
                    border: 1px solid var(--vscode-input-border);
                    color: var(--vscode-input-foreground);
                    border-radius: 3px;
                }
                
                #sendButton {
                    padding: 8px 15px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    cursor: pointer;
                    border-radius: 3px;
                }
                
                #sendButton:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                
                #sendButton:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .message {
                    margin: 10px 0;
                    padding: 10px;
                    border-radius: 5px;
                    max-width: 90%;
                }
                
                .user {
                    background: var(--vscode-textBlockQuote-background);
                    margin-left: auto;
                    border-left: 4px solid #0078d4;
                }
                
                .ai {
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-input-border);
                    border-left: 4px solid #28a745;
                }
                
                .diff-container {
                    margin-top: 10px;
                    background: var(--vscode-textCodeBlock-background);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 3px;
                }
                
                .diff-header {
                    background: var(--vscode-textBlockQuote-background);
                    padding: 8px;
                    border-bottom: 1px solid var(--vscode-input-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .diff-content {
                    padding: 10px;
                    font-family: var(--vscode-editor-font-family);
                    font-size: var(--vscode-editor-font-size);
                    white-space: pre-wrap;
                    overflow-x: auto;
                }
                
                .apply-button {
                    padding: 4px 12px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    cursor: pointer;
                    border-radius: 3px;
                    font-size: 12px;
                }
                
                .apply-button:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                
                .typing-indicator {
                    display: none;
                    padding: 10px;
                    font-style: italic;
                    color: var(--vscode-descriptionForeground);
                }
                
                .typing-indicator.show {
                    display: block;
                }
                
                .no-file {
                    text-align: center;
                    color: var(--vscode-descriptionForeground);
                    font-style: italic;
                    padding: 20px;
                }
            </style>
        </head>
        <body>
            <div id="fileContext" class="file-context">
                <div class="no-file">No file selected. Open a file to start.</div>
            </div>
            
            <div id="chatContainer"></div>
            
            <div class="typing-indicator" id="typingIndicator">
                AI is thinking...
            </div>
            
            <div id="inputContainer">
                <input type="text" id="messageInput" placeholder="Ask me to edit the current file..." />
                <button id="sendButton">Send</button>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                const chatContainer = document.getElementById('chatContainer');
                const messageInput = document.getElementById('messageInput');
                const sendButton = document.getElementById('sendButton');
                const fileContext = document.getElementById('fileContext');
                const typingIndicator = document.getElementById('typingIndicator');

                let currentFileContext = null;

                // Request file context on load
                vscode.postMessage({ command: 'getFileContext' });

                function updateFileContext(context) {
                    currentFileContext = context;
                    if (context) {
                        const selectionInfo = context.selection 
                            ? \` (lines \${context.selection.start}-\${context.selection.end} selected)\`
                            : '';
                        
                        fileContext.innerHTML = \`
                            <h4>📄 \${context.fileName}</h4>
                            <div>Language: \${context.language} | Lines: \${context.lineCount}\${selectionInfo}</div>
                        \`;
                    } else {
                        fileContext.innerHTML = '<div class="no-file">No file selected. Open a file to start.</div>';
                    }
                }

                function addMessage(text, isUser, hasDiff = false, diff = null) {
                    const message = document.createElement('div');
                    message.className = 'message ' + (isUser ? 'user' : 'ai');
                    
                    let content = \`<div>\${text}</div>\`;
                    
                    if (hasDiff && diff) {
                        const diffId = 'diff_' + Date.now();
                        content += \`
                            <div class="diff-container">
                                <div class="diff-header">
                                    <span>📝 Proposed Changes</span>
                                    <button class="apply-button" onclick="applyDiffFromButton('\${diffId}')">Apply Changes</button>
                                </div>
                                <div class="diff-content" id="\${diffId}">\${diff}</div>
                            </div>
                        \`;
                    }
                    
                    message.innerHTML = content;
                    chatContainer.appendChild(message);
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }

                function applyDiffFromButton(diffId) {
                    const diffElement = document.getElementById(diffId);
                    if (diffElement) {
                        const diffContent = diffElement.textContent;
                        vscode.postMessage({
                            command: 'applyDiff',
                            changes: diffContent
                        });
                    }
                }

                function sendMessage() {
                    const text = messageInput.value.trim();
                    if (text && currentFileContext) {
                        addMessage(text, true);
                        sendButton.disabled = true;
                        vscode.postMessage({
                            command: 'sendMessage',
                            text: text
                        });
                        messageInput.value = '';
                    } else if (!currentFileContext) {
                        alert('Please open a file first');
                    }
                }

                function showTyping() {
                    typingIndicator.classList.add('show');
                }

                function hideTyping() {
                    typingIndicator.classList.remove('show');
                    sendButton.disabled = false;
                }

                sendButton.addEventListener('click', sendMessage);
                messageInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                    }
                });

                // Make function globally accessible
                window.applyDiffFromButton = applyDiffFromButton;

                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'updateFileContext':
                            updateFileContext(message.context);
                            break;
                        case 'displayResponse':
                            addMessage(message.text, false, message.hasDiff, message.diff);
                            break;
                        case 'showTyping':
                            showTyping();
                            break;
                        case 'hideTyping':
                            hideTyping();
                            break;
                        case 'analyzeFile':
                            updateFileContext(message.context);
                            addMessage(\`Analyzing \${message.context.fileName}...\`, false);
                            break;
                    }
                });
            </script>
        </body>
        </html>`;
    }
}

export function deactivate() {}