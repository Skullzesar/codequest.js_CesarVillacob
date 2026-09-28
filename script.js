/* ==========================================================================
   CodeQuest English — script.js
   Vanilla JS, no build step, no dependencies. Everything lives in memory
   plus a small localStorage-backed progress tracker (with an in-memory
   fallback if storage is unavailable, so the game never breaks).
   ========================================================================== */

/* ---------------------------------------------------------------------- */
/* Helpers                                                                 */
/* ---------------------------------------------------------------------- */

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Very small syntax highlighter for the fixed set of snippets in this app. */
function highlightCode(code) {
  const escaped = escapeHtml(code);
  return escaped.replace(
    /("(?:[^"\\]|\\.)*")|\b(function|return|if|else|for|while|let|const|true|false)\b|\b(\d+(?:\.\d+)?)\b/g,
    (match, str, keyword, number) => {
      if (str) return `<span class="tok-string">${match}</span>`;
      if (keyword) return `<span class="tok-keyword">${match}</span>`;
      if (number) return `<span class="tok-number">${match}</span>`;
      return match;
    }
  );
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function logConsole(el, message, type) {
  if (!el) return;
  el.innerHTML = `<p class="console-line console-${type}">&gt; ${escapeHtml(message)}</p>`;
}

/** Storage wrapper: real localStorage when available, in-memory fallback otherwise. */
const memoryStore = {};
function storageGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return memoryStore[key] ?? null; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { memoryStore[key] = value; }
}

/* ---------------------------------------------------------------------- */
/* Content: vocabulary + quiz data                                        */
/* ---------------------------------------------------------------------- */

const VOCAB = {
  variables: [
    { term: 'Variable', def: 'A container that stores a value you can use and change later.' },
    { term: 'Declare', def: 'To create a new variable for the first time.' },
    { term: 'Assign', def: 'To give a variable a value using the = sign.' },
    { term: 'Value', def: 'The actual data stored inside a variable.' },
    { term: 'Data type', def: 'The kind of value a variable holds, like a number or text.' },
    { term: 'String', def: 'Text data, written between quotes.' },
    { term: 'Boolean', def: 'A value that is only ever true or false.' },
    { term: 'Array', def: 'A single variable that holds a list of values.' }
  ],
  conditionals: [
    { term: 'Condition', def: 'A statement that is checked and is either true or false.' },
    { term: 'If statement', def: 'Runs a block of code only when a condition is true.' },
    { term: 'Else statement', def: 'Runs a block of code when the if condition is false.' },
    { term: 'Comparison operator', def: 'A symbol like ==, >, or < used to compare two values.' },
    { term: 'Boolean', def: 'A value that is only ever true or false.' },
    { term: 'Statement', def: 'A single instruction in your code.' }
  ],
  loops: [
    { term: 'Loop', def: 'A block of code that repeats automatically.' },
    { term: 'For loop', def: 'A loop that repeats a fixed number of times.' },
    { term: 'While loop', def: 'A loop that repeats as long as a condition stays true.' },
    { term: 'Iterate', def: 'To repeat a process, once per item or step.' },
    { term: 'Iteration', def: 'One single pass through a loop.' },
    { term: 'Increment', def: 'To increase a value, usually by one.' },
    { term: 'Counter', def: 'A variable used to keep track of how many times a loop has run.' }
  ],
  functions: [
    { term: 'Function', def: 'A reusable block of code that performs a task.' },
    { term: 'Parameter', def: 'A named input a function expects to receive.' },
    { term: 'Argument', def: 'The actual value you pass into a function when you call it.' },
    { term: 'Return', def: 'The value a function sends back after it runs.' },
    { term: 'Call', def: 'To run a function by using its name and parentheses.' }
  ]
};

const VOCAB_TITLES = {
  variables: 'Variable Vault — Vocabulary',
  conditionals: 'If/Else Island — Vocabulary',
  loops: 'Loop Runner — Vocabulary',
  functions: 'Function Factory — Vocabulary'
};

const VARIABLE_PAIRS = [
  { code: 'let score = 100;', type: 'Number' },
  { code: 'let playerName = "Zesharr";', type: 'String' },
  { code: 'let isOnline = true;', type: 'Boolean' },
  { code: 'let skills = ["HTML", "CSS", "JS"];', type: 'Array' },
  { code: 'let user = { level: 3 };', type: 'Object' }
];

const CONDITIONAL_QUESTIONS = [
  {
    code: 'let age = 20;\nif (age >= 18) {\n  print("Adult");\n} else {\n  print("Minor");\n}',
    question: 'What does this code print?',
    options: ['Adult', 'Minor', '20', 'Nothing'],
    answer: 0,
    explanation: 'age (20) is greater than or equal to 18, so the condition is true and the if block runs.'
  },
  {
    code: 'let temperature = 15;\nif (temperature > 30) {\n  print("Hot day");\n} else {\n  print("Cool day");\n}',
    question: 'What does this code print?',
    options: ['Hot day', '30', 'Cool day', 'Error'],
    answer: 2,
    explanation: '15 is not greater than 30, so the condition is false and the else block runs.'
  },
  {
    code: 'let hasTicket = false;\nif (hasTicket) {\n  print("Welcome in!");\n} else {\n  print("Buy a ticket first.");\n}',
    question: 'What does this code print?',
    options: ['true', 'Welcome in!', 'false', 'Buy a ticket first.'],
    answer: 3,
    explanation: 'hasTicket is false, so the condition fails and the else block runs.'
  },
  {
    code: 'let score = 75;\nif (score >= 90) {\n  print("Grade: A");\n} else if (score >= 70) {\n  print("Grade: B");\n} else {\n  print("Grade: C");\n}',
    question: 'What does this code print?',
    options: ['Grade: C', 'Grade: A', 'Grade: B', '75'],
    answer: 2,
    explanation: '75 is not 90 or higher, but it is 70 or higher, so the else if block runs.'
  },
  {
    code: 'let isRaining = true;\nlet hasUmbrella = true;\nif (isRaining && !hasUmbrella) {\n  print("You will get wet.");\n} else {\n  print("You are prepared.");\n}',
    question: 'What does this code print?',
    options: ['You will get wet.', 'true', 'You are prepared.', 'isRaining'],
    answer: 2,
    explanation: 'hasUmbrella is true, so !hasUmbrella is false, which makes the whole condition false.'
  },
  {
    code: 'let num = 7;\nif (num % 2 === 0) {\n  print("Even");\n} else {\n  print("Odd");\n}',
    question: 'What does this code print?',
    options: ['Even', '0', '7', 'Odd'],
    answer: 3,
    explanation: '7 divided by 2 leaves a remainder, so num % 2 is not 0, and the else block runs.'
  }
];

const LOOP_QUESTIONS = [
  {
    code: 'for (let i = 0; i < 4; i++) {\n  print(i);\n}',
    question: 'How many times does this loop run?',
    options: ['3', '5', '4', 'Infinite'],
    answer: 2,
    explanation: 'i starts at 0 and stops before 4, so it runs for 0, 1, 2, 3 — four times.'
  },
  {
    code: 'for (let i = 1; i <= 3; i++) {\n  print(i);\n}',
    question: 'What values does this loop print, in order?',
    options: ['0, 1, 2', '1, 2, 3, 4', '1, 2, 3', '3, 2, 1'],
    answer: 2,
    explanation: 'i starts at 1 and the loop continues while i is 3 or less, printing 1, then 2, then 3.'
  },
  {
    code: 'let count = 0;\nwhile (count < 3) {\n  print("Hi");\n  count++;\n}',
    question: "How many times does this loop print 'Hi'?",
    options: ['4', '2', '0', '3'],
    answer: 3,
    explanation: "count starts at 0 and the loop keeps going while it's less than 3, so it runs 3 times."
  },
  {
    code: 'for (let i = 0; i < 10; i += 2) {\n  print(i);\n}',
    question: 'What is the last value printed?',
    options: ['9', '6', '8', '10'],
    answer: 2,
    explanation: 'i increases by 2 each time: 0, 2, 4, 6, 8. The loop stops before reaching 10.'
  },
  {
    code: 'let total = 0;\nfor (let i = 1; i <= 5; i++) {\n  total += i;\n}\nprint(total);',
    question: 'What does this code print?',
    options: ['10', '20', '15', '5'],
    answer: 2,
    explanation: 'The loop adds 1 + 2 + 3 + 4 + 5, and total ends up as 15.'
  },
  {
    code: 'let tries = 5;\nwhile (tries > 0) {\n  tries--;\n}\nprint(tries);',
    question: 'What does this code print?',
    options: ['5', '1', 'Infinite loop', '0'],
    answer: 3,
    explanation: 'tries decreases by 1 each time until it is no longer greater than 0, ending at 0.'
  }
];

const FUNCTION_ROUNDS = [
  {
    tokens: ['function', 'greet(name)', '{', 'return "Hello, " + name + "!";', '}'],
    code: 'function greet(name) {\n  return "Hello, " + name + "!";\n}',
    predict: {
      question: 'What does greet("Ana") return?',
      options: ['"Hello, name!"', '"Hello, Ana!"', 'undefined', 'Error'],
      answer: 1,
      explanation: 'The parameter name receives the argument "Ana", so the function returns "Hello, Ana!".'
    }
  },
  {
    tokens: ['function', 'double(number)', '{', 'return number * 2;', '}'],
    code: 'function double(number) {\n  return number * 2;\n}',
    predict: {
      question: 'What does double(5) return?',
      options: ['7', 'Error', '10', '5 * 2'],
      answer: 2,
      explanation: 'The function returns number multiplied by 2, and 5 * 2 is 10.'
    }
  },
  {
    tokens: ['function', 'isEven(num)', '{', 'return num % 2 === 0;', '}'],
    code: 'function isEven(num) {\n  return num % 2 === 0;\n}',
    predict: {
      question: 'What does isEven(4) return?',
      options: ['NaN', 'false', '4', 'true'],
      answer: 3,
      explanation: '4 % 2 is 0, and 0 === 0 is true, so the function returns true.'
    }
  }
];

const GAME_KEYS = ['variables', 'conditionals', 'loops', 'functions'];
const MAX_SCORES = { variables: 50, conditionals: 60, loops: 60, functions: 60 };
const STORAGE_KEY = 'codequestEnglishProgress';

const LEVELS = [
  { min: 0, title: 'Rookie Coder' },
  { min: 50, title: 'Code Explorer' },
  { min: 120, title: 'Code Ninja' },
  { min: 200, title: 'Code Master' }
];

/* ---------------------------------------------------------------------- */
/* Progress system                                                         */
/* ---------------------------------------------------------------------- */

function defaultProgress() {
  const games = {};
  GAME_KEYS.forEach((k) => { games[k] = { bestScore: 0, completed: false }; });
  return { games };
}

function loadProgress() {
  const raw = storageGet(STORAGE_KEY);
  const base = defaultProgress();
  if (!raw) return base;
  try {
    const parsed = JSON.parse(raw);
    GAME_KEYS.forEach((k) => {
      if (parsed.games && parsed.games[k]) base.games[k] = parsed.games[k];
    });
  } catch (e) { /* ignore malformed data, use defaults */ }
  return base;
}

function saveProgress(progress) {
  storageSet(STORAGE_KEY, JSON.stringify(progress));
}

function updateProgress(gameKey, score) {
  const progress = loadProgress();
  const g = progress.games[gameKey];
  g.completed = true;
  if (score > g.bestScore) g.bestScore = score;
  saveProgress(progress);
  refreshHomeUI();
}

function getLevelTitle(xp) {
  let title = LEVELS[0].title;
  LEVELS.forEach((lvl) => { if (xp >= lvl.min) title = lvl.title; });
  return title;
}

function refreshHomeUI() {
  const progress = loadProgress();
  let totalXP = 0;
  let completedCount = 0;

  GAME_KEYS.forEach((k) => {
    totalXP += progress.games[k].bestScore;
    if (progress.games[k].completed) completedCount++;

    const statusEl = document.getElementById(`status-${k}`);
    const fillEl = document.getElementById(`cardfill-${k}`);
    const pct = Math.min(100, Math.round((progress.games[k].bestScore / MAX_SCORES[k]) * 100));

    if (fillEl) fillEl.style.width = `${pct}%`;
    if (statusEl) {
      statusEl.textContent = progress.games[k].completed ? `✓ Best: ${progress.games[k].bestScore}` : 'Not started';
      statusEl.classList.toggle('is-done', progress.games[k].completed);
    }
  });

  const statXp = document.getElementById('stat-xp');
  const statLevel = document.getElementById('stat-level');
  const statCompleted = document.getElementById('stat-completed');
  const navXp = document.getElementById('nav-xp');

  if (statXp) statXp.textContent = totalXP;
  if (statLevel) statLevel.textContent = getLevelTitle(totalXP);
  if (statCompleted) statCompleted.textContent = `${completedCount}/${GAME_KEYS.length}`;
  if (navXp) navXp.textContent = totalXP;
}

function renderVocabRecap(el, key) {
  if (!el) return;
  el.innerHTML = `
    <p class="recap-label">New words you practiced:</p>
    <div class="recap-chips">
      ${VOCAB[key].map((v) => `<span class="recap-chip">${escapeHtml(v.term)}</span>`).join('')}
    </div>
  `;
}

/* ---------------------------------------------------------------------- */
/* Generic quiz engine (used by Conditionals and Loops)                   */
/* ---------------------------------------------------------------------- */

function createQuizGame(config) {
  const key = config.key;
  let index = 0;
  let score = 0;
  let answered = false;

  const els = {
    content: document.getElementById(`content-${key}`),
    score: document.getElementById(`score-${key}`),
    label: document.getElementById(`label-${key}`),
    progress: document.getElementById(`progress-${key}`),
    console: document.getElementById(`console-${key}`),
    complete: document.getElementById(`complete-${key}`),
    finalScore: document.getElementById(`finalscore-${key}`),
    recap: document.getElementById(`recap-${key}`)
  };

  function start() {
    index = 0;
    score = 0;
    answered = false;
    els.complete.hidden = true;
    els.content.hidden = false;
    els.progress.style.width = '0%';
    logConsole(els.console, 'Ready when you are.', 'info');
    if (config.onStart) config.onStart();
    renderQuestion();
  }

  function renderQuestion() {
    answered = false;
    const q = config.questions[index];
    els.label.textContent = `Question ${index + 1} of ${config.questions.length}`;
    els.progress.style.width = `${(index / config.questions.length) * 100}%`;
    els.score.textContent = score;

    els.content.innerHTML = `
      <pre class="code-block">${highlightCode(q.code)}</pre>
      <p class="question-text">${escapeHtml(q.question)}</p>
      <div class="options-grid">
        ${q.options.map((opt, i) => `<button class="option-btn" data-i="${i}" type="button">${escapeHtml(opt)}</button>`).join('')}
      </div>
    `;

    $$('.option-btn', els.content).forEach((btn) => {
      btn.addEventListener('click', () => selectOption(Number(btn.dataset.i)));
    });
  }

  function selectOption(i) {
    if (answered) return;
    answered = true;
    const q = config.questions[index];
    const buttons = $$('.option-btn', els.content);
    buttons.forEach((b) => { b.disabled = true; });

    if (i === q.answer) {
      buttons[i].classList.add('is-correct');
      score += config.xpPerCorrect;
      els.score.textContent = score;
      logConsole(els.console, `Correct! +${config.xpPerCorrect} XP — ${q.explanation}`, 'success');
      if (config.onCorrectStep) config.onCorrectStep(index + 1, config.questions.length);
    } else {
      buttons[i].classList.add('is-wrong');
      buttons[q.answer].classList.add('is-correct');
      logConsole(els.console, `Not quite. ${q.explanation}`, 'error');
    }

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'btn-primary btn-next';
    nextBtn.textContent = index + 1 < config.questions.length ? 'Next question' : 'See results';
    nextBtn.addEventListener('click', goNext);
    els.content.appendChild(nextBtn);
  }

  function goNext() {
    index++;
    if (index >= config.questions.length) {
      finish();
    } else {
      renderQuestion();
    }
  }

  function finish() {
    els.progress.style.width = '100%';
    els.content.hidden = true;
    els.complete.hidden = false;
    els.finalScore.textContent = score;
    renderVocabRecap(els.recap, key);
    updateProgress(key, score);
  }

  return { start };
}

/* ---------------------------------------------------------------------- */
/* Variables game: click-to-match                                         */
/* ---------------------------------------------------------------------- */

function createVariablesGame() {
  const key = 'variables';
  let score = 0;
  let matchedCount = 0;
  let selectedCode = null;
  let selectedType = null;
  let shuffledTypes = [];

  const els = {
    content: document.getElementById(`content-${key}`),
    score: document.getElementById(`score-${key}`),
    label: document.getElementById(`label-${key}`),
    progress: document.getElementById(`progress-${key}`),
    console: document.getElementById(`console-${key}`),
    complete: document.getElementById(`complete-${key}`),
    finalScore: document.getElementById(`finalscore-${key}`),
    recap: document.getElementById(`recap-${key}`)
  };

  function start() {
    score = 0;
    matchedCount = 0;
    selectedCode = null;
    selectedType = null;
    els.complete.hidden = true;
    els.content.hidden = false;
    shuffledTypes = VARIABLE_PAIRS.map((p, i) => ({ pairIndex: i, type: p.type }));
    shuffle(shuffledTypes);
    render();
    logConsole(els.console, 'Ready when you are.', 'info');
    updateReadout();
  }

  function updateReadout() {
    els.score.textContent = score;
    els.label.textContent = `Matched ${matchedCount} of ${VARIABLE_PAIRS.length}`;
    els.progress.style.width = `${(matchedCount / VARIABLE_PAIRS.length) * 100}%`;
  }

  function render() {
    const codeColumn = VARIABLE_PAIRS.map((p, i) =>
      `<button class="match-card code-card" data-idx="${i}" type="button"><span class="code-block">${highlightCode(p.code)}</span></button>`
    ).join('');
    const typeColumn = shuffledTypes.map((t, i) =>
      `<button class="match-card type-card" data-idx="${i}" type="button">${escapeHtml(t.type)}</button>`
    ).join('');

    els.content.innerHTML = `
      <div class="match-columns">
        <div class="match-column">${codeColumn}</div>
        <div class="match-column">${typeColumn}</div>
      </div>
    `;

    $$('.code-card', els.content).forEach((btn) => btn.addEventListener('click', () => pickCode(btn)));
    $$('.type-card', els.content).forEach((btn) => btn.addEventListener('click', () => pickType(btn)));
  }

  function pickCode(btn) {
    if (btn.classList.contains('is-matched')) return;
    if (selectedCode) selectedCode.el.classList.remove('is-selected');
    selectedCode = { idx: Number(btn.dataset.idx), el: btn };
    btn.classList.add('is-selected');
    tryMatch();
  }

  function pickType(btn) {
    if (btn.classList.contains('is-matched')) return;
    if (selectedType) selectedType.el.classList.remove('is-selected');
    selectedType = { idx: Number(btn.dataset.idx), el: btn };
    btn.classList.add('is-selected');
    tryMatch();
  }

  function tryMatch() {
    if (!selectedCode || !selectedType) return;
    const codeIdx = selectedCode.idx;
    const typeEntry = shuffledTypes[selectedType.idx];

    if (typeEntry.pairIndex === codeIdx) {
      selectedCode.el.classList.remove('is-selected');
      selectedType.el.classList.remove('is-selected');
      selectedCode.el.classList.add('is-matched');
      selectedType.el.classList.add('is-matched');
      score += 10;
      matchedCount++;
      logConsole(els.console, `Match found: ${typeEntry.type} (+10 XP)`, 'success');
      updateReadout();
      selectedCode = null;
      selectedType = null;
      if (matchedCount === VARIABLE_PAIRS.length) finish();
    } else {
      const codeEl = selectedCode.el;
      const typeEl = selectedType.el;
      codeEl.classList.add('is-wrong');
      typeEl.classList.add('is-wrong');
      logConsole(els.console, 'Not a match. Try again.', 'error');
      setTimeout(() => {
        codeEl.classList.remove('is-selected', 'is-wrong');
        typeEl.classList.remove('is-selected', 'is-wrong');
      }, 450);
      selectedCode = null;
      selectedType = null;
    }
  }

  function finish() {
    els.content.hidden = true;
    els.complete.hidden = false;
    els.finalScore.textContent = score;
    renderVocabRecap(els.recap, key);
    updateProgress(key, score);
  }

  return { start };
}

/* ---------------------------------------------------------------------- */
/* Functions game: order the pieces, then predict the output              */
/* ---------------------------------------------------------------------- */

function createFunctionsGame() {
  const key = 'functions';
  let roundIndex = 0;
  let score = 0;
  let clickedOrder = [];
  let shuffledTokens = [];

  const els = {
    content: document.getElementById(`content-${key}`),
    score: document.getElementById(`score-${key}`),
    label: document.getElementById(`label-${key}`),
    progress: document.getElementById(`progress-${key}`),
    console: document.getElementById(`console-${key}`),
    complete: document.getElementById(`complete-${key}`),
    finalScore: document.getElementById(`finalscore-${key}`),
    recap: document.getElementById(`recap-${key}`)
  };

  function start() {
    roundIndex = 0;
    score = 0;
    els.complete.hidden = true;
    els.content.hidden = false;
    logConsole(els.console, 'Ready when you are.', 'info');
    renderRound();
  }

  function updateReadout() {
    els.score.textContent = score;
    els.label.textContent = `Round ${roundIndex + 1} of ${FUNCTION_ROUNDS.length}`;
    els.progress.style.width = `${(roundIndex / FUNCTION_ROUNDS.length) * 100}%`;
  }

  function renderRound() {
    clickedOrder = [];
    updateReadout();
    const round = FUNCTION_ROUNDS[roundIndex];
    shuffledTokens = round.tokens.map((t, i) => ({ text: t, original: i }));
    shuffle(shuffledTokens);

    els.content.innerHTML = `
      <p class="builder-label">// Click the pieces in order to build the function</p>
      <div class="assembly-box" id="assembly-box"></div>
      <div class="token-bank" id="token-bank">
        ${shuffledTokens.map((t, i) => `<button class="token-chip" data-i="${i}" type="button">${escapeHtml(t.text)}</button>`).join('')}
      </div>
      <div class="builder-actions">
        <button class="btn-secondary" id="reset-tokens" type="button">Reset</button>
        <button class="btn-primary" id="check-order" type="button" disabled>Check order</button>
      </div>
    `;

    $$('.token-chip', els.content).forEach((btn) => btn.addEventListener('click', () => pickToken(Number(btn.dataset.i), btn)));
    $('#reset-tokens', els.content).addEventListener('click', renderRound);
    $('#check-order', els.content).addEventListener('click', checkOrder);
  }

  function pickToken(i, btn) {
    if (btn.disabled) return;
    btn.disabled = true;
    btn.classList.add('is-used');
    clickedOrder.push(shuffledTokens[i].original);

    const assembly = $('#assembly-box', els.content);
    const line = document.createElement('div');
    line.className = 'assembly-line';
    line.innerHTML = highlightCode(shuffledTokens[i].text);
    assembly.appendChild(line);

    const round = FUNCTION_ROUNDS[roundIndex];
    $('#check-order', els.content).disabled = clickedOrder.length !== round.tokens.length;
  }

  function checkOrder() {
    const correct = clickedOrder.every((val, i) => val === i);
    if (correct) {
      score += 10;
      logConsole(els.console, 'Function built correctly! +10 XP', 'success');
      updateReadout();
      renderPredict();
    } else {
      logConsole(els.console, 'That order will not run correctly. Try again.', 'error');
      renderRound();
    }
  }

  function renderPredict() {
    const round = FUNCTION_ROUNDS[roundIndex];
    els.content.innerHTML = `
      <pre class="code-block">${highlightCode(round.code)}</pre>
      <p class="question-text">${escapeHtml(round.predict.question)}</p>
      <div class="options-grid">
        ${round.predict.options.map((opt, i) => `<button class="option-btn" data-i="${i}" type="button">${escapeHtml(opt)}</button>`).join('')}
      </div>
    `;
    $$('.option-btn', els.content).forEach((btn) => btn.addEventListener('click', () => selectPredict(Number(btn.dataset.i))));
  }

  function selectPredict(i) {
    const round = FUNCTION_ROUNDS[roundIndex];
    const buttons = $$('.option-btn', els.content);
    buttons.forEach((b) => { b.disabled = true; });

    if (i === round.predict.answer) {
      buttons[i].classList.add('is-correct');
      score += 10;
      logConsole(els.console, `Correct! +10 XP — ${round.predict.explanation}`, 'success');
    } else {
      buttons[i].classList.add('is-wrong');
      buttons[round.predict.answer].classList.add('is-correct');
      logConsole(els.console, `Not quite. ${round.predict.explanation}`, 'error');
    }
    updateReadout();

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'btn-primary btn-next';
    nextBtn.textContent = roundIndex + 1 < FUNCTION_ROUNDS.length ? 'Next round' : 'See results';
    nextBtn.addEventListener('click', () => {
      roundIndex++;
      if (roundIndex >= FUNCTION_ROUNDS.length) finish();
      else renderRound();
    });
    els.content.appendChild(nextBtn);
  }

  function finish() {
    els.progress.style.width = '100%';
    els.content.hidden = true;
    els.complete.hidden = false;
    els.finalScore.textContent = score;
    renderVocabRecap(els.recap, key);
    updateProgress(key, score);
  }

  return { start };
}

/* ---------------------------------------------------------------------- */
/* Wiring it all together                                                  */
/* ---------------------------------------------------------------------- */

let games = null;

function showView(id) {
  $$('.view').forEach((v) => v.classList.remove('active'));
  document.getElementById(`view-${id}`).classList.add('active');
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

function moveRunner(stepIndex, total) {
  const runner = document.getElementById('runner-icon');
  if (!runner) return;
  const pct = (stepIndex / total) * 88;
  runner.style.left = `${pct}%`;
}

function resetRunner() {
  const runner = document.getElementById('runner-icon');
  if (runner) runner.style.left = '0%';
}

function openVocabModal(key) {
  const modal = document.getElementById('vocab-modal');
  document.getElementById('vocab-modal-title').textContent = VOCAB_TITLES[key] || 'Vocabulary';
  const list = document.getElementById('vocab-modal-list');
  list.innerHTML = VOCAB[key].map((v) => `<dt>${escapeHtml(v.term)}</dt><dd>${escapeHtml(v.def)}</dd>`).join('');
  modal.hidden = false;
}

function closeVocabModal() {
  document.getElementById('vocab-modal').hidden = true;
}

function runTypewriter() {
  const el = document.getElementById('typewriter');
  if (!el) return;
  const text = "Hello, World! Let's learn to code \u2014 in English.";
  if (prefersReducedMotion()) {
    el.textContent = text;
    return;
  }
  let i = 0;
  function tick() {
    el.textContent = text.slice(0, i);
    i++;
    if (i <= text.length) setTimeout(tick, 32);
  }
  tick();
}

function init() {
  games = {
    variables: createVariablesGame(),
    conditionals: createQuizGame({ key: 'conditionals', questions: CONDITIONAL_QUESTIONS, xpPerCorrect: 10 }),
    loops: createQuizGame({
      key: 'loops',
      questions: LOOP_QUESTIONS,
      xpPerCorrect: 10,
      onStart: resetRunner,
      onCorrectStep: moveRunner
    }),
    functions: createFunctionsGame()
  };

  refreshHomeUI();
  runTypewriter();

  $('.brand').addEventListener('click', () => showView('home'));

  $$('[data-play]').forEach((btn) => btn.addEventListener('click', () => {
    const key = btn.dataset.play;
    showView(key);
    games[key].start();
  }));

  $$('[data-back]').forEach((btn) => btn.addEventListener('click', () => showView('home')));

  $$('[data-replay]').forEach((btn) => btn.addEventListener('click', () => {
    games[btn.dataset.replay].start();
  }));

  $$('[data-vocab]').forEach((btn) => btn.addEventListener('click', () => openVocabModal(btn.dataset.vocab)));
  $('#vocab-close').addEventListener('click', closeVocabModal);
  $('#vocab-modal').addEventListener('click', (e) => {
    if (e.target.id === 'vocab-modal') closeVocabModal();
  });

  $('#reset-progress').addEventListener('click', () => {
    if (confirm('Reset all progress? This cannot be undone.')) {
      saveProgress(defaultProgress());
      refreshHomeUI();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
