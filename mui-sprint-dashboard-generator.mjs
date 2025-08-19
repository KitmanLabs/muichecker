#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - updated paths to work from mui-data folder
const REPORT_PATH = path.join(__dirname, 'sprint-report.json');
const DASHBOARD_PATH = path.join(__dirname, 'mui-sprint-dashboard.html');

function generateDashboard() {
    try {
        // Read the report data
        const reportData = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
        
        // Read the template
        let template = fs.readFileSync(DASHBOARD_PATH, 'utf8');
        
        // Calculate stats
        const totalOffences = reportData.offenders.length;
        const totalConversions = reportData.bestPerformers.reduce((sum, performer) => sum + performer.conversions, 0);
        const muiPercentage = reportData.summary.adoptionRate;
        
        // Prepare top converters data (using bestPerformers)
        const topConverters = reportData.bestPerformers.slice(0, 10).map(performer => ({
            rank: performer.rank,
            name: performer.engineer,
            conversions: performer.conversions,
            components: performer.components.slice(0, 3) // Show first 3 components
        }));
        
        // Prepare offences data
        const offences = reportData.offenders.map(offender => ({
            component: offender.component,
            name: offender.engineer,
            legacyLibrary: offender.legacyLibrary
        }));
        
        // Create the data object
        const dashboardData = {
            date: reportData.date,
            summary: {
                totalOffences,
                totalConversions,
                muiPercentage
            },
            topConverters,
            offences
        };
        
        // Replace the sample data in the template
        const dataScript = `
        // Report data - generated from ${reportData.sprint} report
        const reportData = ${JSON.stringify(dashboardData, null, 2)};
        `;
        
        // Find and replace the sample data section
        const sampleDataRegex = /\/\/ Sample data.*?};/s;
        template = template.replace(sampleDataRegex, dataScript);
        
        // Write the updated dashboard
        fs.writeFileSync(DASHBOARD_PATH, template);
        
        console.log('✅ MUI Sprint Dashboard generated successfully!');
        console.log(`📊 Dashboard saved to: ${DASHBOARD_PATH}`);
        console.log(`📅 Report date: ${reportData.date}`);
        console.log(`📈 Total offences: ${totalOffences}`);
        console.log(`🔄 Total conversions: ${totalConversions}`);
        console.log(`📊 MUI percentage: ${muiPercentage}%`);
        
    } catch (error) {
        console.error('❌ Error generating dashboard:', error.message);
        process.exit(1);
    }
}

// Run the generator
generateDashboard();
