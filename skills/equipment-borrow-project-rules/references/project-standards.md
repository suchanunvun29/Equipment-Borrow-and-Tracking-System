# Project Standards Reference

## 1) Table-Only Data Display

- Use table components for data list pages (headers, rows, cell alignment).
- Keep actions (view/edit/delete) in an action column.
- Avoid card/grid replacement for primary data pages unless explicitly approved.

## 2) Modal Popup for Create/Edit

- Add and edit actions must open a modal popup.
- Validate form inputs inside modal before submit.
- Keep modal state explicit: open/close/loading/error.
- Refresh table data after successful submit.

## 3) Thai Buddhist Calendar and Thai Month

Frontend formatting example:

```ts
export function formatThaiDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}
```

- Require locale to be Thai and calendar to be Buddhist Era.
- Ensure month text is Thai (e.g., มกราคม, กุมภาพันธ์).

## 4) No Mock Data

- Do not ship hardcoded arrays as production data source.
- Do not keep fake API handlers for core flows.
- Connect to real backend endpoint and real database records.

## 5) Detailed Logging

Backend logging guideline:

```csharp
_logger.LogInformation(
    "BorrowApprove start RequestId={RequestId} Request={BorrowRequestId} Admin={AdminId}",
    requestId, borrowRequestId, adminId);
```

Minimum logging points:

- request start
- input validation result
- branch decision (approve/reject/return reason)
- database/API result
- completion or failure
- exception details (with stack trace in server logs)

Frontend logging guideline:

- Log action start (button click / submit).
- Log API request/response status and key ids.
- Log UI state transition (modal open/close, success/fail).
- Do not log sensitive fields.

## 6) Thai-Only for Documents and Comments

- All project documents must be written in Thai.
- All code comments must be written in Thai.
- If existing docs/comments are not in Thai, convert them during related feature work.

## 7) Warm Tone UI Theme

- Use warm-tone colors as project default (orange/red-brown/gold family).
- Define shared color tokens in Tailwind config and reuse across components.
- Keep status colors readable but stay within warm-theme style for primary UI surfaces.
- Suggested warm palette:
  - `primary`: `#C2410C`
  - `primary-dark`: `#9A3412`
  - `accent`: `#F59E0B`
  - `surface`: `#FFF7ED`
  - `sidebar`: `#7C2D12`
