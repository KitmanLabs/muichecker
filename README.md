# MUI Sprint Dashboard

A standalone MUI adoption tracking system that generates sprint reports and dashboards.

## Quick Setup

1. **Clone this repo**
2. **Run the setup script:**
   ```bash
   node setup.mjs
   ```
3. **Follow the prompts** to configure your frontend repo path
4. **Run the tracker:**
   ```bash
   node mui-sprint-tracker.mjs
   ```

## Quick Start

```bash
# Generate sprint report
node mui-sprint-tracker.mjs

# Generate dashboard from report
node mui-sprint-dashboard-generator.mjs

# View dashboard
open mui-sprint-dashboard.html
```

## Files

- `setup.mjs` - **Run this first** to configure your frontend repo path
- `config.json` - Configuration file (created by setup script)
- `mui-sprint-tracker.mjs` - Analyzes git history and generates sprint report
- `mui-sprint-dashboard-generator.mjs` - Creates dashboard from report data
- `automation-setup.mjs` - Provides cron job setup instructions
- `sprint-report.json` - Generated sprint data (created by tracker)
- `mui-sprint-dashboard.html` - Generated dashboard (created by generator)

## Automation

To set up automatic generation every 2 weeks:

```bash
node automation-setup.mjs
```

Follow the instructions to add a cron job.

## What It Tracks

- **Total Offences:** Engineers who modified legacy components without updating to MUI
- **Total Conversions:** Engineers who contributed to MUI migration
- **Product MUI %:** Overall MUI adoption rate across the codebase

## Dashboard Tabs

1. **Top Converters:** Engineers who converted the most components to MUI
2. **Offences:** Engineers who violated the MUI mandate

## How Metrics Are Calculated

**Total Offences:** Counts every entry in the offenders array from the JSON report, where each entry represents one engineer who modified a component using legacy libraries but didn't update it to MUI.

**Total Conversions:** Sums up the conversions field from each engineer in the bestPerformers array, where each engineer gets credit for every MUI component they modified during the sprint period.

**Product MUI %:** Uses the existing adoptionRate calculation from the JSON report, which divides MUI components by total UI components (MUI + Legacy + Mixed) and multiplies by 100.

**Top Converters Tab:** Shows the first 10 engineers from the bestPerformers array, ranked by their conversion count, displaying their name, conversion count, and first 3 components they worked on.

**Offences Tab:** Shows every entry from the offenders array, displaying the component filename, engineer name, and which legacy library they're still using.
