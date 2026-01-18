# Skill: Performance Metrics & OEE

## Context
Industrial efficiency is measured through standardized metrics. This skill defines how to calculate and visualize these within WorkOrderPro.

## Reliability Metrics
1. **MTBF (Mean Time Between Failures)**:
   - `MTBF = (Total Operating Time - Total Downtime) / Number of Reactive Failures`.
   - Goal: Maximize.
2. **MTTR (Mean Time To Repair)**:
   - `MTTR = Total Maintenance Time / Total Number of Repairs`.
   - Goal: Minimize.

## OEE (Overall Equipment Effectiveness)
OEE is calculated as `Availability * Performance * Quality`.

### 1. Availability
- Ratio of `Actual Uptime` to `Scheduled Production Time`.
- Downtime is captured via reactive Work Orders.

### 2. Performance (Future Enhancement)
- Ratio of `Actual Throughput` to `Theoretical Max Throughput`.
- Requires integration with production counters or IoT sensors.

### 3. Quality (Future Enhancement)
- Ratio of `Good Units` to `Total Units Produced`.

## Implementation in Reports
- **Trends**: Always show metrics over time (Weekly/Monthly) to identify improvements or degradation.
- **Drill-down**: Allow users to see the underlying work orders or assets that are driving "Bad" metrics.

## Common Pitfalls
- **Data Gaps**: Ensure "Scheduled Production Time" is configurable (e.g., 24/7 vs 8/5) otherwise availability scores will be wrong.
- **Negative Uptime**: Ensure date logic handles overlapping work orders correctly.
