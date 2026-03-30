const path = require('path');

let binding;
if (process.platform === 'darwin') {
  try {
    binding = require('./build/Release/macos_vibrancy.node');
  } catch {
    try {
      binding = require('./build/Debug/macos_vibrancy.node');
    } catch {
      console.warn('[macos-vibrancy] Native addon not found, vibrancy disabled');
      binding = { setVibrancy() {}, removeVibrancy() {} };
    }
  }
} else {
  binding = { setVibrancy() {}, removeVibrancy() {} };
}

module.exports = binding;
