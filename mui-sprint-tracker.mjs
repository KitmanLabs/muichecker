#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration
function loadConfig() {
  const configPath = path.join(__dirname, 'config.json');
  
  if (!fs.existsSync(configPath)) {
    console.error('❌ config.json not found! Please create it with your frontend repo path.');
    console.error('Example:');
    console.error('{');
    console.error('  "frontendRepoPath": "/path/to/your/frontend/repo"');
    console.error('}');
    process.exit(1);
  }
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  if (!config.frontendRepoPath) {
    console.error('❌ frontendRepoPath not specified in config.json');
    process.exit(1);
  }
  
  if (!fs.existsSync(config.frontendRepoPath)) {
    console.error(`❌ Frontend repo path does not exist: ${config.frontendRepoPath}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(path.join(config.frontendRepoPath, 'package.json'))) {
    console.error(`❌ Invalid frontend repo path. No package.json found at: ${config.frontendRepoPath}`);
    process.exit(1);
  }
  
  return config;
}

const config = loadConfig();
const PROJECT_ROOT = config.frontendRepoPath;

// Configuration
const TARGET_DIRECTORIES = [
  'packages/modules/src',
  'packages/components/src',
  'packages/playbook/src'
].map(dir => path.join(PROJECT_ROOT, dir));

const UI_FILE_PATTERNS = [/\.jsx?$/, /\.tsx?$/];
const IGNORED_FILE_PATTERNS = [
  /\.test\./, /\.spec\./, /\.stories\./, /\.mdx?$/, /\.config\./, /\.setup\./
];

const MUI_PACKAGES = [
  '@mui/material',
  '@mui/icons-material',
  '@mui/lab',
  '@mui/base',
  '@mui/x-data-grid-pro',
  '@mui/x-data-grid-premium',
  '@mui/x-date-pickers-pro',
  '@mui/x-charts',
  '@kitman/playbook'
];

const LEGACY_LIBRARIES = [
  'bootstrap',
  'react-bootstrap',
  'semantic-ui-react',
  'antd',
  'chakra-ui',
  'styled-components',
  'emotion',
  'react-select',
  'react-datepicker',
  'react-modal'
];

// Helper functions
function isUIFile(filename) {
  return UI_FILE_PATTERNS.some(pattern => pattern.test(filename)) &&
         !IGNORED_FILE_PATTERNS.some(pattern => pattern.test(filename));
}

function isInTargetDirectory(filepath) {
  return TARGET_DIRECTORIES.some(dir => filepath.includes(dir));
}

function analyzeImports(fileContent) {
  const imports = [];
  const lines = fileContent.split('\n');
  
  for (const line of lines) {
    const importMatch = line.match(/import.*from\s+['"`]([^'"`]+)['"`]/);
    if (importMatch) {
      imports.push(importMatch[1]);
    }
  }
  
  return imports;
}

function categorizeComponent(imports) {
  const muiImports = imports.filter(imp => 
    MUI_PACKAGES.some(pkg => imp.includes(pkg))
  );
  
  const legacyImports = imports.filter(imp => 
    LEGACY_LIBRARIES.some(lib => imp.includes(lib))
  );
  
  if (muiImports.length > 0 && legacyImports.length === 0) {
    return 'MUI';
  } else if (muiImports.length === 0 && legacyImports.length > 0) {
    return 'Legacy';
  } else if (muiImports.length > 0 && legacyImports.length > 0) {
    return 'Mixed';
  } else {
    return 'No UI';
  }
}

function getLegacyLibraries(imports) {
  return imports.filter(imp => 
    LEGACY_LIBRARIES.some(lib => imp.includes(lib))
  );
}

function getGitHistory(since = '2 weeks ago') {
  try {
    const output = execSync(
      `git log --name-only --since="${since}" --pretty=format:"%H|%an|%s"`,
      { cwd: PROJECT_ROOT, encoding: 'utf8' }
    );
    return output.trim().split('\n').filter(line => line.trim());
  } catch (error) {
    console.error('Error getting git history:', error.message);
    return [];
  }
}

function getFileContent(filepath) {
  try {
    return fs.readFileSync(filepath, 'utf8');
  } catch (error) {
    return '';
  }
}

function analyzeSprint() {
  console.log('🏃‍♂️ MUI Sprint Tracker');
  console.log('=====================');
  console.log(`📁 Analyzing repo: ${PROJECT_ROOT}`);
  console.log('');
  
  // Get sprint dates
  const sprintEndDate = new Date();
  sprintEndDate.setDate(sprintEndDate.getDate() - config.daysSinceSprintEnd);
  const sprintStartDate = new Date(sprintEndDate);
  sprintStartDate.setDate(sprintStartDate.getDate() - config.sprintLengthDays);
  
  const sprintEndStr = sprintEndDate.toISOString().split('T')[0];
  const sprintStartStr = sprintStartDate.toISOString().split('T')[0];
  
  console.log('📅 Sprint Schedule Analysis:');
  console.log(`Last Sprint: ${sprintStartStr} to ${sprintEndStr}`);
  
  const since = `${sprintStartStr}..${sprintEndStr}`;
  console.log(`🔍 Analyzing last completed sprint (${sprintStartStr} to ${sprintEndStr})...`);
  console.log(`Analyzing MUI adoption since: ${since}`);
  
  // Get git history
  const gitHistory = getGitHistory(since);
  
  // Process commits
  const modifiedFiles = new Set();
  const fileAuthors = new Map();
  const commitMessages = new Map();
  
  let currentCommit = null;
  let currentAuthor = null;
  let currentMessage = null;
  
  for (const line of gitHistory) {
    if (line.includes('|')) {
      const [hash, author, message] = line.split('|');
      currentCommit = hash;
      currentAuthor = author;
      currentMessage = message;
    } else if (line.trim() && currentCommit) {
      const filepath = line.trim();
      if (isUIFile(filepath) && isInTargetDirectory(filepath)) {
        modifiedFiles.add(filepath);
        fileAuthors.set(filepath, currentAuthor);
        commitMessages.set(filepath, currentMessage);
      }
    }
  }
  
  // Analyze components
  const components = [];
  const offenders = [];
  const bestPerformers = new Map();
  const legacyBreakdown = new Map();
  
  for (const filepath of modifiedFiles) {
    const content = getFileContent(filepath);
    const imports = analyzeImports(content);
    const category = categorizeComponent(imports);
    const author = fileAuthors.get(filepath);
    const component = path.basename(filepath);
    
    components.push({
      filepath,
      component,
      author,
      category,
      legacyLibraries: getLegacyLibraries(imports),
      suggestion: category === 'Legacy' ? 'Consider using MUI components' : null
    });
    
    // Track offenders
    if (category === 'Legacy') {
      offenders.push({
        component,
        engineer: author,
        legacyLibrary: getLegacyLibraries(imports)[0] || 'Unknown',
        suggestion: 'Consider using MUI components',
        filePath: filepath
      });
      
      // Track legacy library usage
      const legacyLibs = getLegacyLibraries(imports);
      for (const lib of legacyLibs) {
        legacyBreakdown.set(lib, (legacyBreakdown.get(lib) || 0) + 1);
      }
    }
    
    // Track best performers (MUI components)
    if (category === 'MUI') {
      if (!bestPerformers.has(author)) {
        bestPerformers.set(author, {
          engineer: author,
          conversions: 0,
          components: [],
          totalValue: 0,
          rank: 0
        });
      }
      
      const performer = bestPerformers.get(author);
      performer.conversions++;
      performer.components.push(component);
      performer.totalValue = performer.conversions;
    }
  }
  
  // Rank best performers
  const bestPerformersList = Array.from(bestPerformers.values())
    .sort((a, b) => b.conversions - a.conversions)
    .map((performer, index) => ({
      ...performer,
      rank: index + 1
    }));
  
  // Calculate summary
  const summary = {
    totalComponents: components.length,
    muiComponents: components.filter(c => c.category === 'MUI').length,
    legacyComponents: components.filter(c => c.category === 'Legacy').length,
    mixedComponents: components.filter(c => c.category === 'Mixed').length,
    noUIComponents: components.filter(c => c.category === 'No UI').length,
    adoptionRate: 0
  };
  
  const uiComponents = summary.muiComponents + summary.legacyComponents + summary.mixedComponents;
  if (uiComponents > 0) {
    summary.adoptionRate = Math.round((summary.muiComponents / uiComponents) * 100);
  }
  
  // Create report
  const report = {
    sprint: `Sprint-${sprintStartStr.replace(/-/g, '')}-${sprintEndStr.replace(/-/g, '')}`,
    date: new Date().toISOString().split('T')[0],
    since,
    summary,
    offenders,
    legacyBreakdown: Object.fromEntries(legacyBreakdown),
    bestPerformers: bestPerformersList,
    components
  };
  
  // Save report
  const reportPath = path.join(__dirname, 'sprint-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📊 Sprint report saved to: ${reportPath}`);
  console.log(`📈 Sprint dashboard saved to: ${path.join(__dirname, 'mui-sprint-dashboard.html')}`);
  console.log('');
  console.log('📋 Last Sprint MUI Adoption Summary:');
  console.log(`Sprint: ${report.sprint}`);
  console.log(`Period: ${sprintStartStr} to ${sprintEndStr}`);
  console.log(`Components Modified: ${summary.totalComponents}`);
  console.log(`MUI Components: ${summary.muiComponents} (${summary.adoptionRate}%)`);
  console.log(`Legacy Components: ${summary.legacyComponents}`);
  console.log(`Mixed Components: ${summary.mixedComponents}`);
  console.log('');
  
  if (offenders.length === 0) {
    console.log('✅ No offenders found! All components are using MUI.');
  } else {
    console.log(`🚨 ${offenders.length} offenders found. Check the report for details.`);
  }
  
  console.log('');
  console.log(`🌐 Open ${path.join(__dirname, 'mui-sprint-dashboard.html')} in your browser to view the sprint dashboard`);
  console.log('');
  console.log('📁 All tracking data is organized in: mui-data/');
}

// Run the analysis
analyzeSprint();
