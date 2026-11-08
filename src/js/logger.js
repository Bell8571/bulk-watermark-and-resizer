export class DebugLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 60;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const entry = { message, type, timestamp };
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) this.logs.shift();
    this._renderLog(entry);
    this._consoleOutput(message, type);
  }

  error(message, error = null) {
    const fullMsg = error ? `${message}: ${error.message || error}` : message;
    this.log(fullMsg, 'error');
  }

  success(message) {
    this.log(message, 'success');
  }

  warning(message) {
    this.log(message, 'warning');
  }

  _consoleOutput(message, type) {
    const prefix = `[${type.toUpperCase()}]`;
    if (type === 'error') console.error(prefix, message);
    else if (type === 'warning') console.warn(prefix, message);
    else console.log(prefix, message);
  }

  _renderLog(entry) {
    const debugConsole = document.getElementById('debugConsole');
    if (!debugConsole) return;
    const div = document.createElement('div');
    div.className = `debug-entry ${entry.type}`;
    div.textContent = `${entry.timestamp} | ${entry.message}`;
    debugConsole.appendChild(div);
    debugConsole.scrollTop = debugConsole.scrollHeight;
  }

  clear() {
    this.logs = [];
    const debugConsole = document.getElementById('debugConsole');
    if (debugConsole) {
      debugConsole.innerHTML = '<div class="debug-entry success">Debug log cleared.</div>';
    }
  }
}

export const logger = new DebugLogger();
window.logger = logger;
