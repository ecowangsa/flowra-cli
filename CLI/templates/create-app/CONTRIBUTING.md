# Contributing to Flowra Framework

Thank you for your interest in contributing to **Flowra Framework**!
We’re excited to build an expressive, modular Node.js framework — and your help makes it better for everyone.

---

## Code of Conduct

Please read our [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) before participating.
We expect all contributors to uphold a respectful and inclusive environment.

---

## Reporting Bugs

If you find a bug in Flowra:

1. **Check existing issues** to avoid duplicates.
2. **Open a new issue** with the following details:

   * A concise title (e.g., `fix(cli): error when creating app in existing project`)
   * A clear description of the problem
   * Steps to reproduce the issue
   * Environment information (Node.js version, OS, etc.)

**Example:**

```
### Steps to Reproduce
1. Run `flowra create-app demo`
2. Observe missing `Bootstrap` directory
3. Expected: app/Bootstrap should be generated
```

---

## Suggesting Enhancements

We welcome ideas for new features or improvements!

When submitting an enhancement proposal:

* Use a descriptive title (`proposal(core): support multiple database connections`)
* Explain **why** this adds value to Flowra.
* Include mockups, diagrams, or pseudocode if possible.

---

## Contributing Code

### 1. Fork and Clone

```bash
git clone https://github.com/<your-username>/flowra.git
cd flowra
npm install
```

### 2. Create a Feature Branch

```bash
git checkout -b feature/create-app-scaffold
```

### 3. Make Your Changes

Follow the project’s code style (ESLint + Prettier).
We use the **Conventional Commits** format for consistency:

```
feat(core): add dependency injection container
fix(cli): handle missing directory in scaffold
chore(docs): update contributing guide
```

### 4. Test Before You Commit

Always run tests before submitting your PR:

```bash
npm test
```

If you’re adding a new feature, please include corresponding test cases.

### 5. Commit and Push

```bash
git add .
git commit -m "feat(cli): add bootstrap scaffolding for new apps"
git push origin feature/create-app-scaffold
```

### 6. Submit a Pull Request

* Open a **Pull Request** to the `main` branch.
* Provide a clear description of your changes.
* Link to any related issues.

---

## Development Guidelines

* Keep commits **atomic** — one feature or fix per commit.
* Avoid large PRs that mix unrelated changes.
* Match the folder structure:

  ```
  app/
  ├── Bootstrap/
  ├── Modules/
  ├── ...
  core/
  main/
  ```
* Document new features and public APIs.
* Use dependency injection and modular patterns consistently.

---

## Testing

Flowra uses **Jest** for testing.

To run tests locally:

```bash
npm run test
```

---

## Releasing (Maintainers Only)

1. Update version in `package.json`.
2. Run tests.
3. Commit using:

   ```bash
   git commit -m "chore(release): v0.2.0"
   ```
4. Tag and publish:

   ```bash
   git tag v0.2.0
   git push origin --tags
   npm publish
   ```

---

## Recognition

All contributors are listed in the project’s changelog and contributor section.
Your ideas, code, and feedback make Flowra possible 

---

**Let’s build something powerful, modular, and elegant together.**
— *The Flowra Framework Team*
