#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import and run the CLI
import('../dist/index.js').then(module => {
  module.run();
}).catch(err => {
  console.error('Failed to start gICM CLI:', err);
  process.exit(1);
});
