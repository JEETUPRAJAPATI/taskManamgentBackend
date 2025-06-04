import { spawn } from 'child_process';
import path from 'path';

// Set environment variables
process.env.NODE_ENV = 'development';

// Start the server
const serverProcess = spawn('node', ['server/simple-index.js'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

serverProcess.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  serverProcess.kill('SIGTERM');
});