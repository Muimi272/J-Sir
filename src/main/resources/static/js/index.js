const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('input');
const sendBtn = document.getElementById('send');
const stopBtn = document.getElementById('stop');
const themeToggleBtn = document.getElementById('themeToggle');

let activeController = null;
let messageHistory = [];
let currentStatusEl = null;

function ensureEmptyState() {
    let emptyStateEl = document.getElementById('emptyState');
    if (emptyStateEl) {
        return emptyStateEl;
    }

    emptyStateEl = document.createElement('div');
    emptyStateEl.id = 'emptyState';
    emptyStateEl.className = 'empty-state';
    emptyStateEl.setAttribute('aria-live', 'polite');
    emptyStateEl.innerHTML = '<h1>J-Sir</h1><p>你的专属 Java 学习助手</p><p>在下方输入问题，开始第一轮对话。</p>';
    messagesEl.appendChild(emptyStateEl);
    return emptyStateEl;
}

function toggleEmptyState() {
    const emptyStateEl = ensureEmptyState();
    const hasMessage = Boolean(messagesEl.querySelector('.message'));
    emptyStateEl.classList.toggle('hidden', hasMessage);
    messagesEl.classList.toggle('is-empty', !hasMessage);
    messagesEl.classList.toggle('is-active', hasMessage);
}

function applyTheme(theme) {
    const nextTheme = theme === 'dark' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', nextTheme);
    if (themeToggleBtn) {
        themeToggleBtn.textContent = nextTheme === 'dark' ? 'Light' : 'Dark';
        themeToggleBtn.setAttribute('aria-label', nextTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('uiTheme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
        applyTheme(savedTheme);
        return;
    }

    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
}

function toggleTheme() {
    const current = document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('uiTheme', next);
}

// 每次打开页面都重置浏览器中缓存的历史
function resetHistoryOnOpen() {
    messageHistory = [];
    localStorage.removeItem('chatHistory');
    renderHistory();
}

// 保存消息历史到localStorage
function saveHistory() {
    localStorage.setItem('chatHistory', JSON.stringify(messageHistory));
}

// 渲染所有历史消息
function renderHistory() {
    messagesEl.innerHTML = '';
    for (const msg of messageHistory) {
        addMessageToUI(msg.role, msg.content, false);
    }
    toggleEmptyState();
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function addMessage(role, text) {
    messageHistory.push({ role, content: text });
    saveHistory();
    return addMessageToUI(role, text, true);
}

function createMessageStatus(anchorMessageEl) {
    const status = document.createElement('div');
    status.className = 'message-status loading';
    status.innerHTML = '<span class="status-icon spinner"></span><span class="status-text">Thinking...</span>';
    messagesEl.insertBefore(status, anchorMessageEl.nextSibling);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return status;
}

function updateMessageStatus(statusEl, state, text) {
    if (!statusEl) {
        return;
    }
    const iconEl = statusEl.querySelector('.status-icon');
    const textEl = statusEl.querySelector('.status-text');
    statusEl.className = 'message-status ' + state;

    if (state === 'loading') {
        iconEl.className = 'status-icon spinner';
        iconEl.textContent = '';
    } else if (state === 'success') {
        iconEl.className = 'status-icon';
        iconEl.textContent = '✓';
    } else {
        iconEl.className = 'status-icon';
        iconEl.textContent = '✕';
    }

    textEl.textContent = text;
}

function addMessageToUI(role, text, scroll = true) {
    const div = document.createElement('div');
    div.className = 'message ' + role;
    if (role === 'assistant') {
        renderAssistantMarkdown(div, text);
    } else {
        div.textContent = text;
    }
    messagesEl.appendChild(div);
    toggleEmptyState();
    if (scroll) {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }
    return div;
}

function renderAssistantMarkdown(targetEl, content) {
    const text = content || '';

    // Fallback to plain text if CDN libs are unavailable.
    if (typeof marked === 'undefined' || typeof DOMPurify === 'undefined') {
        targetEl.textContent = text;
        return;
    }

    marked.setOptions({
        breaks: true,
        gfm: true
    });

    const rawHtml = marked.parse(text);
    const cleanHtml = DOMPurify.sanitize(rawHtml);
    targetEl.innerHTML = cleanHtml;
    enhanceCodeBlocks(targetEl);
}


function enhanceCodeBlocks(container) {
    const codeBlocks = container.querySelectorAll('pre code');
    for (const codeEl of codeBlocks) {
        const pre = codeEl.parentElement;
        if (!pre || pre.querySelector('.copy-code-btn')) {
            continue;
        }

        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'copy-code-btn';
        copyBtn.textContent = 'copy';

        copyBtn.addEventListener('click', async function () {
            const codeText = codeEl.innerText;
            try {
                await navigator.clipboard.writeText(codeText);
                copyBtn.textContent = 'copied';
                setTimeout(function () {
                    copyBtn.textContent = 'copy';
                }, 1200);
            } catch (error) {
                copyBtn.textContent = 'failed';
                setTimeout(function () {
                    copyBtn.textContent = 'copy';
                }, 1200);
            }
        });

        pre.appendChild(copyBtn);
    }
}

function setSendingState(sending) {
    sendBtn.disabled = sending;
    stopBtn.disabled = !sending;
    inputEl.disabled = sending;
}

function stopStreaming(reason) {
    if (activeController) {
        activeController.abort();
        activeController = null;
    }
    setSendingState(false);
    if (currentStatusEl && reason) {
        updateMessageStatus(currentStatusEl, 'error', reason);
    }
}

async function sendMessage() {
    const msg = inputEl.value.trim();
    if (!msg) {
        return;
    }

    if (activeController) {
        stopStreaming('stopped');
    }

    const userMessageEl = addMessage('user', msg);
    currentStatusEl = createMessageStatus(userMessageEl);
    const aiMessageEl = addMessageToUI('assistant', '', true);

    setSendingState(true);
    updateMessageStatus(currentStatusEl, 'loading', 'Thinking...');

    activeController = new AbortController();

    try {
        const response = await fetch('/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ msg: msg }),
            signal: activeController.signal
        });

        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }

        const contentType = response.headers.get('content-type') || '';
        let aiResponse = '';

        if (contentType.includes('application/json')) {
            const jsonData = await response.json();
            if (Array.isArray(jsonData)) {
                aiResponse = jsonData.join('');
            } else if (typeof jsonData === 'string') {
                aiResponse = jsonData;
            } else {
                aiResponse = JSON.stringify(jsonData);
            }

            aiMessageEl.textContent = aiResponse;
            renderAssistantMarkdown(aiMessageEl, aiResponse);
            if (aiResponse) {
                messageHistory[messageHistory.length - 1] = { role: 'assistant', content: aiResponse };
                saveHistory();
            }
            setSendingState(false);
            updateMessageStatus(currentStatusEl, 'success', 'success');
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            const normalized = buffer
                .replace(/\r/g, '')
                .replace(/^event:.*$/gm, '')
                .replace(/^data:\s?/gm, '')
                .replace(/\[DONE\]/g, '')
                .trim();

            if (normalized) {
                aiResponse = normalized;
                renderAssistantMarkdown(aiMessageEl, aiResponse);
                messagesEl.scrollTop = messagesEl.scrollHeight;
            }
        }

        if (aiResponse) {
            messageHistory[messageHistory.length - 1] = { role: 'assistant', content: aiResponse };
            saveHistory();
        }
        setSendingState(false);
        updateMessageStatus(currentStatusEl, 'success', 'success');
    } catch (error) {
        if (error.name !== 'AbortError') {
            aiMessageEl.textContent += '\n[错误] ' + error.message;
            setSendingState(false);
            updateMessageStatus(currentStatusEl, 'error', 'failed');
            console.error('Error:', error);
        } else {
            setSendingState(false);
            updateMessageStatus(currentStatusEl, 'error', 'stopped');
        }
    } finally {
        activeController = null;
    }

    inputEl.value = '';
}

sendBtn.addEventListener('click', sendMessage);
stopBtn.addEventListener('click', function () {
    stopStreaming('stopped');
});

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
}

inputEl.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (!sendBtn.disabled) {
            sendMessage();
        }
    }
});

initTheme();
resetHistoryOnOpen();
toggleEmptyState();

