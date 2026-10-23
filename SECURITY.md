# Security policy

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Report it privately through GitHub: open the [Security tab](https://github.com/Dallas-Ng/ntu-mods/security/advisories/new) and choose **Report a vulnerability**.

Include what you found, the steps to reproduce it, and the impact you expect. You can expect an acknowledgement within a few days. This is a volunteer project, so fixes are made on a best-effort basis.

## Scope

The live site at [ntumods.com](https://ntumods.com) and the code in this repository. Please do not run automated scanners or load tests against production, and do not access data that is not yours.

## Secrets

No credentials belong in this repository. Runtime secrets are Cloudflare Worker secrets. If you find a committed secret, report it privately as above.
