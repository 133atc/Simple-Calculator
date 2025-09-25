// === 1) Grab our UI once (why: avoid repeated DOM lookups) ===
  const display = document.getElementById('display');
  const keys = document.getElementById('keys');

  // === 2) Centralized, predictable state (why: 1 source of truth) ===
  const state = {
    previousOperand: null, // left-hand number
    currentOperand: '0',   // number the user is typing/seeing
    operator: null,        // 'add' | 'subtract' | 'multiply' | 'divide' | null
    overwrite: true        // if true, next digit replaces current (after op/=)
  };

  // === 3) Rendering (why: keep UI updates in one place) ===
  function updateDisplay() {
    display.textContent = state.currentOperand;
  }

  // === 4) Pure math (why: easy to test, no UI inside) ===
  function operate(a, b, operator) {
    switch (operator) {
      case 'add':      return a + b;
      case 'subtract': return a - b;
      case 'multiply': return a * b;
      case 'divide':   return b === 0 ? 'DIV0' : a / b;
      default:         return b; // no-op fallback
    }
  }

  // Nicely format numbers (why: tame floating-point noise, trim zeros)
  function formatNumber(n) {
    if (typeof n !== 'number' || !isFinite(n)) return String(n);
    // 12 significant digits -> parseFloat removes trailing zeros
    return parseFloat(n.toPrecision(12)).toString();
  }

  // === 5) State transitions (small, single-purpose functions) ===
  function clearAll() {
    state.previousOperand = null;
    state.currentOperand = '0';
    state.operator = null;
    state.overwrite = true;
    updateDisplay();
  }

  function inputDigit(d) {
    if (state.overwrite) {
      // replace leading 0 unless digit is also 0
      state.currentOperand = d === '0' ? '0' : d;
      state.overwrite = false;
    } else {
      state.currentOperand =
        state.currentOperand === '0' ? d : state.currentOperand + d;
    }
    updateDisplay();
  }

  function inputDecimal() {
    if (state.overwrite) {
      state.currentOperand = '0.';
      state.overwrite = false;
    } else if (!state.currentOperand.includes('.')) {
      state.currentOperand += '.';
    }
    updateDisplay();
  }

 function chooseOperator(op) {
  // If user presses operators back-to-back, just swap the operator.
  if (state.operator && state.overwrite) {
    state.operator = op;
    return;
  }

  if (state.operator && !state.overwrite) {
    compute();
    // ✅ carry result forward for chaining (e.g., 2 + 3 × 4)
    state.previousOperand = state.currentOperand;
  } else {
    state.previousOperand = state.currentOperand;
  }

  state.operator = op;
  state.overwrite = true;
}

  function compute() {
    const a = parseFloat(state.previousOperand);
    const b = parseFloat(state.currentOperand);

    if (state.operator == null || isNaN(a) || isNaN(b)) return;

    const raw = operate(a, b, state.operator);

    if (raw === 'DIV0') {
      state.currentOperand = 'Cannot divide by 0';
      state.previousOperand = null;
      state.operator = null;
      state.overwrite = true;
      updateDisplay();
      return;
    }

    state.currentOperand = formatNumber(raw);
    state.previousOperand = null;
    state.operator = null;
    state.overwrite = true;
    updateDisplay();
  }

  // === 6) One event listener (why: event delegation = simpler wiring) ===
  keys.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const action = btn.dataset.action;

    if (action === 'digit')   return inputDigit(btn.dataset.digit);
    if (action === 'decimal') return inputDecimal();
    if (action === 'operator')return chooseOperator(btn.dataset.operator);
    if (action === 'equal')   return compute();
    if (action === 'clear')   return clearAll();
  });

  // Initial paint
  updateDisplay();