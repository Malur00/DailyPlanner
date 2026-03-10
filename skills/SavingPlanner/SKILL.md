---
name: saving-planner
description: >
  Use this skill to manage personal finances, import bank transactions, track
  cash flow, or monitor saving goals. Triggers for Excel import, monthly
  balance view, recurring transactions, or financial report requests.
---

# SavingPlanner

## Overview
SavingPlanner helps the user build a personal cash flow, categorize income
and expenses, and monitor progress toward savings goals. Transactions are
imported from bank-exported Excel files using bank-specific file formats
and category mapping rules configured in the global Configuration menu.

## Menu Pages

### Transactions
List, filter, and manage all financial transactions.

  Import Cash Flow:
  - Select bank from dropdown
  - Drag & drop .xls / .xlsx file (max 20 MB)
  - Engine applies FileFormat column mapping + CategoryMapping rules
  - Import History table:
      Bank (badge) | File | Import Date | Imported # | Skipped # |
      Period (from → to) | Status (IMPORTED / ERROR) | Delete

  Transaction list:
  - Fields: date, type (income/expense), amount (€), category
            (micro → macro), note, is_recurring
  - Filter by date range, category, bank, type
  - Manual add / edit / delete

### Cash Flow
- Monthly income vs. expenses bar chart
- Net balance per month
- Cumulative balance timeline
- Category breakdown (pie / donut chart)
- Recurring vs. one-time split view

### Saving Goals
- Create goals: label, target amount (€), deadline
- Track current amount vs. target per goal
- Progress bar visualization
- Estimated completion date based on current saving rate

### Reports
- On-screen view only (no export)
- Monthly summary: total income, total expenses, net, savings rate %
- Year-to-date summary
- Category ranking by spending

## Data Model (summary)
- Transaction   : id, date, type, amount_eur, micro_category_id,
                  note, is_recurring, bank_id, import_id
- MacroCategory : id, name, type (income/expense), color
- MicroCategory : id, macro_category_id, name
- SavingGoal    : id, label, target_eur, current_eur, deadline, notes
- RecurringRule : id, transaction_id, frequency, next_date
- ImportSession : id, bank_id, filename, import_date,
                  count_imported, count_skipped,
                  period_from, period_to, status
