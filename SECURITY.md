# Security Policy

## Supported Versions

This project is under active development on a single `main` branch and does not currently ship tagged releases. Only the latest commit on `main` receives security fixes.

| Version         | Supported |
| --------------- | --------- |
| `main` (latest) | Yes       |
| Older commits   | No        |

## Reporting a Vulnerability

**Please do not open public GitHub issues for security vulnerabilities.**

Instead, report them privately through GitHub's [private vulnerability reporting](https://github.com/Open-Source-Kigali/oskbackend/security/advisories/new). This keeps the report between you and the maintainers until a fix is ready.

When reporting, please include:

- A clear description of the vulnerability
- Steps to reproduce, or a proof of concept if possible
- The affected endpoint, file, or area of the codebase
- Any potential impact you've identified

## What to expect

- **Acknowledgement:** within 7 days of your report.
- **Initial assessment:** within 14 days, we'll let you know if the report is accepted, needs more information, or is being declined (with reasons).
- **Fix and disclosure:** for accepted reports, we aim to ship a fix within 30 days. We'll coordinate disclosure timing with you and credit you in the advisory if you'd like.

If you don't hear back within these timeframes, feel free to nudge by commenting on the advisory.

## Scope

In scope:

- The oskbackend API (routes, controllers, middleware)
- Database access patterns and Prisma queries
- Authentication and authorization (admin API key flow)
- File upload handling (Cloudinary integration)
- Dependencies declared in `package.json`

Out of scope:

- Issues in Render, Cloudinary, GitHub, or other third-party services we depend on (please report those directly to the vendor)
- Denial of service through obvious resource exhaustion (no rate limiting is in place yet; this is tracked as known work)
- Findings that require physical access to a developer's machine

## Thank you

Responsible disclosure helps keep our users and contributors safe. We appreciate the time and care it takes to report vulnerabilities responsibly.
