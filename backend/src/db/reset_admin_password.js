import bcrypt from 'bcrypt';
import { createInterface } from 'readline/promises';
import { stdin, stdout } from 'process';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/index.js';
import { isValidPassword } from '../utils/validators.js';

function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
      reject(new Error('Run this command directly in an interactive terminal.'));
      return;
    }

    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    let value = '';

    const finish = (error) => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener('data', onData);
      stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    };

    const onData = (input) => {
      for (const character of input.toString('utf8')) {
        if (character === '\u0003') return finish(new Error('Password reset cancelled.'));
        if (character === '\r' || character === '\n') return finish();
        if (character === '\u007f' || character === '\b') {
          value = value.slice(0, -1);
          continue;
        }
        value += character;
      }
    };

    stdin.on('data', onData);
  });
}

async function resetAdminPassword() {
  const terminal = createInterface({ input: stdin, output: stdout });
  try {
    const email = (process.env.SEED_ADMIN_EMAIL || await terminal.question('Admin email: ')).trim().toLowerCase();
    terminal.close();
    const password = await readHidden('New password (input hidden): ');
    const confirmation = await readHidden('Confirm new password (input hidden): ');

    if (password !== confirmation) throw new Error('Passwords do not match.');
    if (!isValidPassword(password)) throw new Error('Password must be at least 10 characters and include a letter and a number.');

    await connectDB();
    const user = await User.findOne({ email, role: 'ADMIN' });
    if (!user) throw new Error('No ADMIN account was found for that email.');

    user.password_hash = await bcrypt.hash(password, 12);
    await user.save();
    console.log('Admin password reset successfully.');
  } finally {
    terminal.close();
    await disconnectDB();
  }
}

resetAdminPassword().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});