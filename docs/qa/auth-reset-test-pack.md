# Auth Reset QA Test Pack
Date: 2026-02-12
Scope: `OBS-003` for forgot password flow in `src/components/auth/AuthCard.tsx` and `src/hooks/useAuthCardController.ts`

## Preconditions
- Clerk email/password sign-in is enabled for the environment under test.
- Test user account exists with a verified email.
- QA can access email inbox for reset code retrieval.
- Run on desktop and mobile viewport.

## Manual Test Matrix
| ID | Scenario | Steps | Expected |
|---|---|---|---|
| AR-01 | Open forgot password from login | Go to login card, click `Forgot password?` | Reset screen appears with email input and back-to-login control |
| AR-02 | Request code success | Enter valid account email, submit | Success info is shown, UI advances to code + new password form |
| AR-03 | Request code invalid email | Enter malformed email, submit | Actionable error from Clerk displayed in auth card |
| AR-04 | Request code unknown account | Enter non-existing account email, submit | Actionable error displayed; no crash |
| AR-05 | Request code rate limited | Trigger repeated reset requests quickly | Rate-limit error shown; submit button recovers after loading ends |
| AR-06 | Reset success | Enter valid code + strong password + confirm, submit | User is signed in and redirected to `/` |
| AR-07 | Reset wrong code | Enter invalid/expired code and valid password | Actionable error shown; user remains on reset form |
| AR-08 | Reset mismatched passwords | Enter different password/confirm | Client-side mismatch error shown; API call not sent |
| AR-09 | Reset weak password | Enter valid code with weak password | Clerk validation message shown; no silent failure |
| AR-10 | Back navigation | Click back-to-login from forgot password flow | Returns to login mode and clears reset-specific UI state |

## Viewport Coverage
- Desktop: 1440x900
- Mobile: 390x844

## Regression Checks
- Login and register still work after reset flow usage.
- OAuth buttons still trigger provider redirects.
- Error banner resets when changing flow modes.

## Optional E2E Candidates
- Automate AR-01, AR-02, AR-08, AR-10.
- Keep AR-05 and AR-07 as manual until deterministic stubs/mocks are in place.
