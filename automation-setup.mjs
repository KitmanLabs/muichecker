#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function setupCronInstructions() {
    console.log('🚀 MUI Dashboard Automation Setup');
    console.log('================================');
    console.log('');
    console.log('To automate MUI dashboard generation every 2 weeks (2 days after sprint day):');
    console.log('');
    console.log('1. Open your crontab:');
    console.log('   crontab -e');
    console.log('');
    console.log('2. Add one of these lines (choose based on your sprint schedule):');
    console.log('');
    console.log('   # For sprints ending on Fridays (run on Sundays):');
    console.log('   0 9 * * 0 cd /path/to/kitman-frontend/mui-data && node mui-sprint-tracker.mjs && node mui-sprint-dashboard-generator.mjs');
    console.log('');
    console.log('   # For sprints ending on Wednesdays (run on Fridays):');
    console.log('   0 9 * * 5 cd /path/to/kitman-frontend/mui-data && node mui-sprint-tracker.mjs && node mui-sprint-dashboard-generator.mjs');
    console.log('');
    console.log('   # For sprints ending on Tuesdays (run on Thursdays):');
    console.log('   0 9 * * 4 cd /path/to/kitman-frontend/mui-data && node mui-sprint-tracker.mjs && node mui-sprint-dashboard-generator.mjs');
    console.log('');
    console.log('3. Replace "/path/to/kitman-frontend" with your actual project path');
    console.log('');
    console.log('4. The dashboard will be generated at: mui-data/mui-sprint-dashboard.html');
    console.log('');
    console.log('📋 Manual Commands:');
    console.log('   cd mui-data && node mui-sprint-tracker.mjs          # Generate sprint report');
    console.log('   cd mui-data && node mui-sprint-dashboard-generator.mjs # Generate dashboard from report');
    console.log('');
    console.log('📊 View Dashboard:');
    console.log('   open mui-data/mui-sprint-dashboard.html');
    console.log('');
}

// Run the setup
setupCronInstructions();
