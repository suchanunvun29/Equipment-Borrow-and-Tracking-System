---
name: equipment-borrow-project-rules
description: Enforce mandatory implementation standards for the Equipment Borrow project. Use when creating or modifying frontend pages, forms, APIs, data flow, and logging in this repository. Apply these constraints: data pages must render in table format, create/edit must use modal popup, calendar must use Thai Buddhist Era year and Thai month names, mock data is not allowed, detailed logs must be added for each important step, all documents/comments must be written in Thai, and the UI theme must use warm color tones.
---

# Equipment Borrow Project Rules

## Purpose

Apply a strict project standard so all new and updated features follow the same UX, data, and observability rules.  
Use this skill as a guardrail during implementation and review.

## Mandatory Rules

1. Data display pages must use a table layout.
2. Create and edit actions must be implemented via modal popup.
3. Calendar/date display must use Buddhist Era (พ.ศ.) and Thai month names.
4. Do not use mock or simulated data.
5. Add detailed logs for key steps in frontend and backend flows.
6. All project documents and code comments must be in Thai.
7. UI theme must use warm color tones consistently across pages.

## Implementation Workflow

1. Confirm the feature has a real API/data source before coding.
2. Build list/read pages with a table structure first.
3. Build add/edit UX with modal popup only.
4. Apply Thai Buddhist date formatting in UI output and date controls.
5. Add detailed logs for request start, validation, decision branch, DB/API call result, and completion/failure.
6. Verify no hardcoded sample dataset remains.
7. Ensure documentation and code comments are written in Thai.
8. Apply warm-tone color tokens to shared styles/components.

## Required Logging Detail

For every key operation, log:
- actor/user id (if available)
- action name
- target id/entity
- input summary (without sensitive data)
- result status
- error detail and stack (on failure)
- timestamp and correlation id/request id

## Thai Date Standard

- Frontend output should use Thai locale and Buddhist calendar, for example: `th-TH-u-ca-buddhist`.
- Thai month names must be displayed in Thai.
- If backend returns date strings, frontend formatting still must follow this standard.

## Pre-merge Checklist

- [ ] All list/data pages render as table.
- [ ] Add/edit flows open in modal popup.
- [ ] Date shown as พ.ศ. with Thai month names.
- [ ] No mock data or fake repository left in code.
- [ ] Detailed logs added and reviewed.
- [ ] All documents and code comments are in Thai.
- [ ] UI theme uses warm tones consistently.

## Reference

Read [project-standards.md](references/project-standards.md) for concrete implementation patterns and examples.
