(() => {
  const chatLog = document.getElementById('chat-log');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');
  const typingIndicator = document.getElementById('typing-indicator');
  const statusIndicator = document.getElementById('status-indicator');

  const NPC_NAME = '세라피나';
  const OPENING_LINE =
    '…낯선 얼굴이군. 방금 성문을 넘어온 모양이지? 나는 세라피나, 이 여명 마을 광장을 지키는 불꽃 기사단 소속 경비대장이다. 궁금한 게 있다면 뭐든 물어보게—단, 내가 아는 범위 안에서 말이야.';

  // Conversation history sent to the backend on every request (system prompt is injected server-side).
  const history = [{ role: 'assistant', content: OPENING_LINE }];

  function appendMessage(role, text) {
    const bubble = document.createElement('div');
    if (role === 'assistant') {
      bubble.className = 'msg msg--npc';
      const name = document.createElement('span');
      name.className = 'msg__name';
      name.textContent = NPC_NAME;
      bubble.appendChild(name);
      bubble.appendChild(document.createTextNode(text));
    } else if (role === 'user') {
      bubble.className = 'msg msg--player';
      bubble.textContent = text;
    } else {
      bubble.className = 'msg msg--error';
      bubble.textContent = text;
    }
    chatLog.appendChild(bubble);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function setBusy(isBusy) {
    chatInput.disabled = isBusy;
    chatSend.disabled = isBusy;
    typingIndicator.hidden = !isBusy;
    statusIndicator.textContent = '';
    const dot = document.createElement('span');
    dot.className = 'status-dot';
    statusIndicator.appendChild(dot);
    statusIndicator.appendChild(document.createTextNode(isBusy ? '생각 중' : '대화 가능'));
    if (!isBusy) chatInput.focus();
  }

  async function sendToNpc(userText) {
    history.push({ role: 'user', content: userText });
    setBusy(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      if (!res.ok || !data.reply) {
        throw new Error(data.error || '알 수 없는 오류');
      }
      history.push({ role: 'assistant', content: data.reply });
      appendMessage('assistant', data.reply);
    } catch (err) {
      console.error(err);
      appendMessage('error', '...소리가 잘 들리지 않는군. 잠시 후 다시 말을 걸어보게.');
    } finally {
      setBusy(false);
    }
  }

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    appendMessage('user', text);
    chatInput.value = '';
    sendToNpc(text);
  });

  // Graceful fallback if the provided artwork files haven't been dropped into public/assets/ yet.
  function watchImageFallback(imgEl, fallbackFn) {
    imgEl.addEventListener('error', fallbackFn, { once: true });
    if (imgEl.complete && imgEl.naturalWidth === 0) fallbackFn();
  }

  watchImageFallback(document.querySelector('.scene__bg'), () => {
    document.querySelector('.scene').classList.add('scene--fallback');
  });

  watchImageFallback(document.querySelector('.nameplate'), () => {
    document.querySelector('.nameplate').classList.add('is-missing');
  });

  // Opening greeting.
  appendMessage('assistant', OPENING_LINE);
  chatInput.focus();
})();
