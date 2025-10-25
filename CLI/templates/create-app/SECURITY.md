# Security Policy — Flowra Framework

The Flowra Framework team takes the security of our software seriously.
We appreciate your efforts to responsibly disclose vulnerabilities and help us maintain a safe ecosystem for developers and users.

---

## Supported Versions

Security updates and patches are provided only for actively maintained versions of the Flowra Framework.

| Version | Supported | Notes                                   |
| ------- | --------- | --------------------------------------- |
| 0.x.x   | ✅         | Actively maintained (development phase) |
| < 0.x   | ❌         | Not supported                           |

---

## Reporting a Vulnerability

If you discover a security vulnerability within Flowra Framework, **please do not disclose it publicly** until we have had a chance to investigate and address the issue.

### To report a vulnerability:

1. Email our security team at **[security@flowra.id](mailto:security@flowra.id)**.
2. Include as much detail as possible:

   * Description of the issue
   * Steps to reproduce
   * Potential impact
   * Any suggested mitigation steps (if known)

You may encrypt sensitive details using PGP if desired. We will acknowledge receipt of your report within **48 hours** and provide an estimated timeline for resolution.

---

## Handling Procedure

1. **Initial Review** — The Flowra security team validates and reproduces the issue.
2. **Impact Assessment** — Evaluate the severity (low / medium / high / critical).
3. **Patch Development** — Prepare a fix in a private branch.
4. **Release** — Publish the patched version and update release notes.
5. **Disclosure** — Coordinate with the reporter to publicly disclose the fix responsibly.

---

## Disclosure Policy
We follow a **responsible disclosure** model:
* Security vulnerabilities will not be disclosed publicly until a patch is released.
* Credits will be given to the original reporter (if desired).
* Severe vulnerabilities may result in a dedicated security advisory post.

---

## Best Practices for Users
* Always keep your Flowra dependencies up to date.
* Avoid sharing `.env` files or credentials publicly.
* Use HTTPS and secure configuration for your server environment.
* Regularly audit your project using:

  ```bash
  npm audit fix
  ```
---

## Contact
For any security-related inquiries, please contact us:

- **[security@flowra.id](mailto:security@flowra.id)**
- [https://flowra.id](https://flowra.id)

Thank you for helping keep the Flowra ecosystem safe and secure.

— *The Flowra Framework Security Team*
