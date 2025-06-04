#!/usr/bin/env node

// Development server startup - Pure JavaScript/Node.js only
process.env.NODE_ENV = 'development';

console.log('Starting TaskSetu Server with Node.js...');
console.log('Environment:', process.env.NODE_ENV);

// Start the server
import('./server/index.js').catch(err => {
  console.error('Server startup failed:', err);
  process.exit(1);
});