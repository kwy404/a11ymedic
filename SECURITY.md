# Security policy

## Supported versions

The latest release of a11ymedic receives security fixes.

## Reporting a vulnerability

Please do not open a public issue for security problems. Use GitHub private vulnerability reporting on [github.com/kwy404/a11ymedic](https://github.com/kwy404/a11ymedic/security/advisories/new). You will get an answer within a few days.

## What to keep in mind

- a11ymedic never executes scripts from the HTML it checks: files are parsed with jsdom with scripts disabled, and the docs site renders sample pages in a sandboxed iframe without `allow-scripts`.
- When checking a URL with a headless browser, the page runs in that browser as it would for a visitor. Only check sites you trust or run the browser in an isolated environment.
- The overlay only reads the page and draws its own elements inside a shadow root. It does not send data anywhere.
