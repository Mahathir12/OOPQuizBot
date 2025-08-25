// -------- script.js --------
document.addEventListener('DOMContentLoaded', () => {
  // Use Render in production (GitHub Pages), relative paths locally
  const API_BASE = location.hostname.endsWith('github.io')
    ? 'https://oopquizbot.onrender.com'
    : '';

  // Tabs
  const tabs = {
    notebook: document.getElementById('section-notebook'),
    quiz: document.getElementById('section-quiz'),
    ai: document.getElementById('section-ai')
  };
  const tabLinks = {
    notebook: document.getElementById('tab-notebook'),
    quiz: document.getElementById('tab-quiz'),
    ai: document.getElementById('tab-ai')
  };
  function showTab(name) {
    for (let t in tabs) {
      tabs[t].classList.remove('active');
      tabLinks[t].classList.remove('active');
    }
    tabs[name].classList.add('active');
    tabLinks[name].classList.add('active');
  }
  tabLinks.notebook.addEventListener('click', () => showTab('notebook'));
  tabLinks.quiz.addEventListener('click', () => { showTab('quiz'); loadQuiz(); });
  tabLinks.ai.addEventListener('click', () => showTab('ai'));

  // Notebook
  const noteText = document.getElementById('note-text');
  const noteStatus = document.getElementById('note-status');

  document.getElementById('btn-save-note').addEventListener('click', async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/saveNote`, { method: 'POST', body: noteText.value });
      if (resp.ok) { noteStatus.textContent = 'Note saved!'; noteStatus.classList.remove('error'); }
      else { noteStatus.textContent = 'Save failed: ' + await resp.text(); noteStatus.classList.add('error'); }
    } catch (e) { noteStatus.textContent = 'Save failed: ' + e; noteStatus.classList.add('error'); }
  });

  document.getElementById('btn-load-note').addEventListener('click', async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/loadNote`);
      if (resp.ok) { noteText.value = await resp.text(); noteStatus.textContent = 'Note loaded.'; noteStatus.classList.remove('error'); }
      else { noteStatus.textContent = 'Load failed (' + resp.status + ')'; noteStatus.classList.add('error'); }
    } catch (e) { noteStatus.textContent = 'Load error: ' + e; noteStatus.classList.add('error'); }
  });

  // Quiz
  const quizContentDiv = document.getElementById('quiz-content');
  const quizResult = document.getElementById('quiz-result');

  async function loadQuiz() {
    if (quizContentDiv.childElementCount > 0) return; // load once
    try {
      const resp = await fetch(`${API_BASE}/api/getQuiz`);
      const questions = await resp.json();
      quizContentDiv.innerHTML = '';
      questions.forEach((q, i) => {
        const div = document.createElement('div');
        div.className = 'question';
        div.innerHTML = `<p>Q${i + 1}: ${q}</p><input type="text" id="answer-${i}" placeholder="Your answer">`;
        quizContentDiv.appendChild(div);
      });
    } catch {
      quizContentDiv.innerHTML = "<p class='status error'>Failed to load quiz questions.</p>";
    }
  }

  document.getElementById('btn-submit-quiz').addEventListener('click', async () => {
    const answers = Array.from(quizContentDiv.querySelectorAll("input[id^='answer-']")).map(i => i.value);
    try {
      const resp = await fetch(`${API_BASE}/api/submitQuiz`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers }) });
      const result = await resp.json();
      if (resp.ok) { quizResult.textContent = `You scored ${result.score} out of ${result.outOf}.`; quizResult.classList.remove('error'); }
      else { quizResult.textContent = result.error || 'Error submitting quiz.'; quizResult.classList.add('error'); }
    } catch (e) { quizResult.textContent = 'Submit failed: ' + e; quizResult.classList.add('error'); }
  });

  // AI
  const aiQuestion = document.getElementById('ai-question');
  const aiAnswer   = document.getElementById('ai-answer');

  document.getElementById('btn-ask-ai').addEventListener('click', async () => {
    const q = aiQuestion.value.trim(); if (!q) return;
    aiAnswer.textContent = 'Thinking...';
    try {
      const resp = await fetch(`${API_BASE}/api/askAI?q=${encodeURIComponent(q)}`);
      aiAnswer.textContent = await resp.text(); aiAnswer.classList.remove('error');
    } catch (e) { aiAnswer.textContent = 'Error: ' + e; aiAnswer.classList.add('error'); }
  });

  document.getElementById('btn-ai-to-notebook').addEventListener('click', () => {
    const text = aiAnswer.textContent; if (!text) return;
    noteText.value += `\n[AI Answer] ${text}\n`;
    showTab('notebook');
    noteStatus.textContent = 'AI answer copied to notebook (not yet saved)';
    noteStatus.classList.remove('error');
  });
});
// -------- end script.js --------
