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
            sprint: reportData.sprint,
            since: reportData.since,
            summary: {
                totalOffences,
                totalConversions,
                muiPercentage
            },
            topConverters,
            offences
        };
        
        // Create the complete HTML dashboard matching the original style
        const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MUI Sprint Dashboard</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
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
        .header .sprint-info {
            margin-top: 15px;
            font-size: 1em;
            opacity: 0.8;
        }
        .content {
            padding: 30px;
        }
        .stats-section {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #1976d2;
            position: relative;
        }
        .stat-number {
            font-size: 3.5em;
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 10px;
        }
        .stat-label {
            color: #666;
            font-size: 1.1em;
            font-weight: 500;
        }
        .tabs-container {
            margin-top: 30px;
        }
        .tabs-header {
            display: flex;
            border-bottom: 2px solid #e3f2fd;
            margin-bottom: 20px;
        }
        .tab-button {
            padding: 15px 30px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1.1em;
            font-weight: 500;
            color: #666;
            border-bottom: 3px solid transparent;
            transition: all 0.3s ease;
        }
        .tab-button.active {
            color: #1976d2;
            border-bottom-color: #1976d2;
            background-color: #f8f9fa;
        }
        .tab-button:hover {
            background-color: #f0f0f0;
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
        .section h2 {
            color: #1976d2;
            border-bottom: 2px solid #e3f2fd;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #333;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        .offender-row {
            background-color: #fff3e0;
        }
        .offender-row:hover {
            background-color: #ffe0b2;
        }
        .performer-row {
            background-color: #e8f5e8;
        }
        .performer-row:hover {
            background-color: #c8e6c9;
        }
        .rank {
            font-weight: bold;
            color: #1976d2;
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
            <h1>MUI Report</h1>
            <p>Report Date: ${dashboardData.date}</p>
            <div class="sprint-info">
                Period: ${dashboardData.since}
            </div>
        </div>
        
        <div class="content">
            <!-- Top Stats Section -->
            <div class="stats-section">
                <div class="stat-card">
                    <div class="stat-number" id="totalOffences">${dashboardData.summary.totalOffences}</div>
                    <div class="stat-label">Total offences</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="totalConversions">${dashboardData.summary.totalConversions}</div>
                    <div class="stat-label">Total conversions</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="muiPercentage">${dashboardData.summary.muiPercentage}%</div>
                    <div class="stat-label">Product MUI %</div>
                </div>
            </div>

            <!-- Tabs Section -->
            <div class="tabs-container">
                <div class="tabs-header">
                    <button class="tab-button active" onclick="showTab('top-converters')">Top Converters</button>
                    <button class="tab-button" onclick="showTab('offences')">Offences</button>
                </div>

                <!-- Top Converters Tab -->
                <div id="top-converters" class="tab-content active">
                    <div class="section">
                        <h2>Top Converters</h2>
                        <p>Engineers who have converted the most components to MUI this sprint:</p>
                        
                        <table>
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Name</th>
                                    <th>Conversions</th>
                                    <th>Components Converted</th>
                                </tr>
                            </thead>
                            <tbody id="top-converters-table">
                                ${dashboardData.topConverters.map(converter => `
                                    <tr class="performer-row">
                                        <td class="rank">${converter.rank}</td>
                                        <td>${converter.name}</td>
                                        <td>${converter.conversions}</td>
                                        <td>${converter.components.join(', ')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Offences Tab -->
                <div id="offences" class="tab-content">
                    <div class="section">
                        <h2>Offences</h2>
                        <p>Engineers who modified legacy components but didn't update them to MUI:</p>
                        
                        <table>
                            <thead>
                                <tr>
                                    <th>Component</th>
                                    <th>Name</th>
                                    <th>Legacy library</th>
                                </tr>
                            </thead>
                            <tbody id="offences-table">
                                ${dashboardData.offences.map(offence => `
                                    <tr class="offender-row">
                                        <td>${offence.component}</td>
                                        <td>${offence.name}</td>
                                        <td>${offence.legacyLibrary}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Generated by MUI Adoption Tracking System</p>
        </div>
    </div>

    <script>
        // Tab switching functionality
        function showTab(tabName) {
            // Hide all tab contents
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Remove active class from all tab buttons
            const tabButtons = document.querySelectorAll('.tab-button');
            tabButtons.forEach(button => button.classList.remove('active'));
            
            // Show selected tab content
            document.getElementById(tabName).classList.add('active');
            
            // Add active class to clicked button
            event.target.classList.add('active');
        }
    </script>
</body>
</html>`;
        
        // Write the complete dashboard
        fs.writeFileSync(DASHBOARD_PATH, htmlTemplate);
        
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
