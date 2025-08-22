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
    console.error('❌ config.json not found! Please run setup.mjs first.');
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
  /\.test\./, /\.spec\./, /\.stories\./, /\.mdx?$/, /\.config\./, /\.setup\./, /\.d\.ts$/
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
  'reactstrap',
  'react-bootstrap-table',
  'react-bootstrap-table2',
  'react-bootstrap-table-next',
  'semantic-ui-react',
  'antd',
  'chakra-ui',
  'styled-components',
  'emotion',
  '@emotion/react',
  '@emotion/styled',
  'react-select',
  'react-select/async',
  'react-datepicker',
  'react-modal'
];

// Helper functions
function isUIFile(filename) {
  return UI_FILE_PATTERNS.some(pattern => pattern.test(filename)) &&
         !IGNORED_FILE_PATTERNS.some(pattern => pattern.test(filename));
}

function isInTargetDirectory(filepath) {
  const relativeTargetDirs = [
    'packages/modules/src',
    'packages/components/src',
    'packages/playbook/src'
  ];
  return relativeTargetDirs.some(dir => filepath.startsWith(dir));
}

function analyzeImports(fileContent) {
  const imports = [];
  const lines = fileContent.split('\n');
  
  for (const line of lines) {
    // Match both "import ... from 'package'" and "import 'package'"
    const importMatch = line.match(/import.*(?:from\s+)?['"`]([^'"`]+)['"`]/);
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
    LEGACY_LIBRARIES.some(lib => imp.includes(lib)) ||
    imp.includes('bootstrap/js/') ||
    imp.includes('bootstrap-select') ||
    imp.includes('bootstrap-datepicker')
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
    LEGACY_LIBRARIES.some(lib => imp.includes(lib)) ||
    imp.includes('bootstrap/js/') ||
    imp.includes('bootstrap-select') ||
    imp.includes('bootstrap-datepicker')
  );
}

function getAllFiles() {
  const allFiles = [];
  
  for (const targetDir of TARGET_DIRECTORIES) {
    if (!fs.existsSync(targetDir)) {
      console.log(`⚠️  Directory not found: ${targetDir}`);
      continue;
    }
    
    function walkDir(dir) {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else if (isUIFile(file)) {
          const relativePath = path.relative(PROJECT_ROOT, filePath);
          if (isInTargetDirectory(relativePath)) {
            allFiles.push(relativePath);
          }
        }
      }
    }
    
    walkDir(targetDir);
  }
  
  return allFiles;
}

function analyzeSystemWideUI() {
  console.log('🔍 System-Wide UI Analysis');
  console.log('==========================');
  console.log(`📁 Analyzing repo: ${PROJECT_ROOT}`);
  console.log('');
  
  // Get all files
  console.log('📂 Scanning all UI files...');
  const allFiles = getAllFiles();
  console.log(`Found ${allFiles.length} UI files to analyze`);
  

  
  // Analyze components
  const components = [];
  const legacyBreakdown = new Map();
  const muiBreakdown = new Map();
  const moduleBreakdown = new Map();
  
  console.log('🔍 Analyzing component imports...');
  let processed = 0;
  
  for (const filepath of allFiles) {
    try {
      const fullPath = path.join(PROJECT_ROOT, filepath);
      const content = fs.readFileSync(fullPath, 'utf8');
      const imports = analyzeImports(content);
      const category = categorizeComponent(imports);
      const component = path.basename(filepath);
      
      // Get module name
      const moduleMatch = filepath.match(/packages\/([^\/]+)/);
      const moduleName = moduleMatch ? moduleMatch[1] : 'unknown';
      
      components.push({
        filepath,
        component,
        category,
        legacyLibraries: getLegacyLibraries(imports),
        module: moduleName
      });
      
      // Track legacy library usage
      if (category === 'Legacy' || category === 'Mixed') {
        const legacyLibs = getLegacyLibraries(imports);
        for (const lib of legacyLibs) {
          legacyBreakdown.set(lib, (legacyBreakdown.get(lib) || 0) + 1);
        }
        

      }
      
      // Track MUI package usage
      if (category === 'MUI' || category === 'Mixed') {
        const muiImports = imports.filter(imp => 
          MUI_PACKAGES.some(pkg => imp.includes(pkg))
        );
        for (const pkg of muiImports) {
          muiBreakdown.set(pkg, (muiBreakdown.get(pkg) || 0) + 1);
        }
      }
      
      // Track module breakdown
      moduleBreakdown.set(moduleName, (moduleBreakdown.get(moduleName) || 0) + 1);
      
      processed++;
      if (processed % 100 === 0) {
        console.log(`Processed ${processed}/${allFiles.length} files...`);
      }
    } catch (error) {
      console.log(`⚠️  Error reading ${filepath}: ${error.message}`);
    }
  }
  
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
  
  // Create detailed report
  const report = {
    analysisDate: new Date().toISOString().split('T')[0],
    summary,
    legacyBreakdown: Object.fromEntries(legacyBreakdown),
    muiBreakdown: Object.fromEntries(muiBreakdown),
    moduleBreakdown: Object.fromEntries(moduleBreakdown),
    components: components.slice(0, 1000) // Limit to first 1000 for performance
  };
  
  // Save report
  const reportPath = path.join(__dirname, 'system-wide-ui-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Generate HTML dashboard
  generateSystemWideDashboard(report);
  
  // Console output
  console.log('');
  console.log('📊 System-Wide UI Analysis Complete!');
  console.log('====================================');
  console.log(`📅 Analysis Date: ${report.analysisDate}`);
  console.log(`📁 Total UI Files: ${summary.totalComponents}`);
  console.log(`🎨 MUI Components: ${summary.muiComponents} (${summary.adoptionRate}%)`);
  console.log(`🔧 Legacy Components: ${summary.legacyComponents}`);
  console.log(`🔄 Mixed Components: ${summary.mixedComponents}`);
  console.log(`📄 No UI Components: ${summary.noUIComponents}`);
  console.log('');
  
  console.log('');
  console.log('📈 Legacy Library Breakdown:');
  const sortedLegacy = Array.from(legacyBreakdown.entries()).sort((a, b) => b[1] - a[1]);
  if (sortedLegacy.length === 0) {
    console.log('   No legacy libraries detected');
  } else {
    sortedLegacy.forEach(([lib, count]) => {
      console.log(`   ${lib}: ${count} components`);
    });
  }
  
  console.log('');
  console.log('🎨 MUI Package Usage:');
  const sortedMui = Object.entries(muiBreakdown).sort((a, b) => b[1] - a[1]);
  sortedMui.forEach(([pkg, count]) => {
    console.log(`   ${pkg}: ${count} components`);
  });
  
  console.log('');
  console.log('📦 Module Breakdown:');
  const sortedModules = Object.entries(moduleBreakdown).sort((a, b) => b[1] - a[1]);
  sortedModules.forEach(([module, count]) => {
    console.log(`   ${module}: ${count} components`);
  });
  
  console.log('');
  console.log(`📊 Report saved to: ${reportPath}`);
  console.log(`🌐 Dashboard saved to: ${path.join(__dirname, 'system-wide-ui-dashboard.html')}`);
}

function generateSystemWideDashboard(report) {
  const dashboardPath = path.join(__dirname, 'system-wide-ui-dashboard.html');
  
  const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>System-Wide UI Analysis Dashboard</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #1976d2, #42a5f5);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 1.1em;
        }
        .content {
            padding: 30px;
        }
        .stats-section {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #1976d2;
        }
        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 10px;
        }
        .stat-label {
            color: #666;
            font-size: 1em;
            font-weight: 500;
        }
        .charts-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
        }
        .chart-container {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
        }
        .chart-title {
            font-size: 1.3em;
            font-weight: 600;
            color: #333;
            margin-bottom: 20px;
            text-align: center;
        }
        .breakdown-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .breakdown-item:last-child {
            border-bottom: none;
        }
        .breakdown-name {
            font-weight: 500;
            color: #333;
        }
        .breakdown-count {
            font-weight: bold;
            color: #1976d2;
        }
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e0e0e0;
            border-radius: 4px;
            margin-top: 5px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #1976d2, #42a5f5);
            transition: width 0.3s ease;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            border-top: 1px solid #e9ecef;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>System-Wide UI Analysis</h1>
            <p>Complete codebase UI composition breakdown</p>
            <p>Analysis Date: ${report.analysisDate}</p>
        </div>
        
        <div class="content">
            <!-- Top Stats Section -->
            <div class="stats-section">
                <div class="stat-card">
                    <div class="stat-number">${report.summary.totalComponents}</div>
                    <div class="stat-label">Total UI Files</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${report.summary.muiComponents}</div>
                    <div class="stat-label">MUI Components</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${report.summary.legacyComponents}</div>
                    <div class="stat-label">Legacy Components</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${report.summary.adoptionRate}%</div>
                    <div class="stat-label">MUI Adoption Rate</div>
                </div>
            </div>

            <!-- Charts Section -->
            <div class="charts-section">
                <div class="chart-container">
                    <div class="chart-title">Legacy Library Usage</div>
                    ${Object.entries(report.legacyBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([lib, count]) => {
                        const percentage = Math.round((count / report.summary.totalComponents) * 100);
                        return `
                        <div class="breakdown-item">
                            <div>
                                <div class="breakdown-name">${lib}</div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${percentage}%"></div>
                                </div>
                            </div>
                            <div class="breakdown-count">${count}</div>
                        </div>`;
                      }).join('')}
                </div>
                
                <div class="chart-container">
                    <div class="chart-title">MUI Package Usage</div>
                    ${Object.entries(report.muiBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([pkg, count]) => {
                        const percentage = Math.round((count / report.summary.totalComponents) * 100);
                        return `
                        <div class="breakdown-item">
                            <div>
                                <div class="breakdown-name">${pkg}</div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${percentage}%"></div>
                                </div>
                            </div>
                            <div class="breakdown-count">${count}</div>
                        </div>`;
                      }).join('')}
                </div>
            </div>
            
            <div class="chart-container">
                <div class="chart-title">Module Distribution</div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    ${Object.entries(report.moduleBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([module, count]) => {
                        const percentage = Math.round((count / report.summary.totalComponents) * 100);
                        return `
                        <div class="breakdown-item">
                            <div>
                                <div class="breakdown-name">${module}</div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${percentage}%"></div>
                                </div>
                            </div>
                            <div class="breakdown-count">${count}</div>
                        </div>`;
                      }).join('')}
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Generated by System-Wide UI Analysis Tool</p>
        </div>
    </div>
</body>
</html>`;
  
  fs.writeFileSync(dashboardPath, htmlTemplate);
}

// Run the analysis
analyzeSystemWideUI();
