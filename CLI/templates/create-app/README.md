# flowra

### Introduction
This is a collection of flowra modules that can be used to build a basic RESTful API. The code includes modules for creating models, controllers, and validation rules. These modules can be used as building blocks for your application.

### Requirements

To use the flowra framework effectively, please ensure that your development environment meets the following requirements:

- Node.js version 16 or higher:
  
  flowra framework requires Node.js version 16 or higher to function properly. Ensure that you have Node.js installed on your system and that it meets the minimum required version.
- Package Manager:

    flowra uses npm (Node Package Manager) or Yarn as its package manager. Make sure you have either npm or Yarn installed on your system to manage the framework's dependencies.
- Operating System:

    flowra is compatible with major operating systems such as Windows, macOS, and Linux. Ensure that your operating system is supported and meets the minimum requirements for Node.js and the package manager you choose.

### Installation
Install the framework and CLI utilities locally:

```bash
npm install flowra
```

To explore the CLI without installing globally you can use `npx`:

```bash
npx flowra list
```

### Usage

Scaffold a fresh application and start the HTTP server:

```bash
npx flowra create-app river-app
cd river-app
npm install
flowra serve
```

Full Documentation => [Read More](https://flowra.id)
