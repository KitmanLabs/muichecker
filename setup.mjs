#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  console.log('🚀 MUI Sprint Dashboard Setup');
  console.log('=============================');
  console.log('');
  
  // Check if config already exists
  const configPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(configPath)) {
    const currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('Current configuration:');
    console.log(`Frontend repo path: ${currentConfig.frontendRepoPath}`);
    console.log('');
    
    const update = await question('Do you want to update the configuration? (y/n): ');
    if (update.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }
  
  console.log('Please provide the path to your frontend repository:');
  console.log('Example: /Users/username/projects/my-frontend-app');
  console.log('');
  
  const frontendPath = await question('Frontend repo path: ');
  
  // Validate the path
  if (!fs.existsSync(frontendPath)) {
    console.error('❌ Path does not exist. Please check the path and try again.');
    rl.close();
    return;
  }
  
  if (!fs.existsSync(path.join(frontendPath, 'package.json'))) {
    console.error('❌ No package.json found at that path. Please provide a valid frontend repository path.');
    rl.close();
    return;
  }
  
  // Create config
  const config = {
    frontendRepoPath: frontendPath,
    sprintLengthDays: 14,
    daysSinceSprintEnd: 2
  };
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  console.log('');
  console.log('✅ Configuration saved!');
  console.log('');
  console.log('You can now run:');
  console.log('  node mui-sprint-tracker.mjs');
  console.log('');
  console.log('To test the setup, run:');
  console.log('  node mui-sprint-tracker.mjs');
  console.log('  node mui-sprint-dashboard-generator.mjs');
  console.log('  open mui-sprint-dashboard.html');
  
  rl.close();
}

setup().catch(console.error);
