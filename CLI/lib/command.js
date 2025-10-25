'use strict';

class Command {
  constructor(name = '') {
    this._name = name;
    this._aliases = [];
    this._description = '';
    this._version = '';
    this._parent = null;
    this._commands = [];
    this._args = [];
    this._options = [];
    this._action = async () => {};
    this._hooks = {
      preAction: [],
    };
    this.commands = this._commands;
  }

  name(value) {
    if (value === undefined) {
      return this._name;
    }
    this._name = value;
    return this;
  }

  description(value) {
    if (value === undefined) {
      return this._description;
    }
    this._description = value;
    return this;
  }

  version(value) {
    if (value === undefined) {
      return this._version;
    }
    this._version = value;
    return this;
  }

  command(spec) {
    const { name, args } = parseCommandSpec(spec);
    const child = new Command(name);
    child._parent = this;
    child._args = args;
    this._commands.push(child);
    return child;
  }

  alias(value) {
    if (!this._aliases.includes(value)) {
      this._aliases.push(value);
    }
    return this;
  }

  aliases() {
    return [...this._aliases];
  }

  option(flags, description) {
    const option = parseOption(flags, description);
    this._options.push(option);
    return this;
  }

  action(handler) {
    this._action = handler;
    return this;
  }

  hook(event, handler) {
    if (!this._hooks[event]) {
      this._hooks[event] = [];
    }
    this._hooks[event].push(handler);
    return this;
  }

  exitOverride() {
    this._exitOverride = true;
    return this;
  }

  configureOutput() {
    return this;
  }

  _findCommand(token) {
    return this._commands.find((command) => command._matches(token));
  }

  _matches(token) {
    return this._name === token || this._aliases.includes(token);
  }

  async parseAsync(argv) {
    const tokens = argv.slice(2);
    if (tokens.length === 0) {
      return;
    }

    const commandToken = tokens.shift();
    const command = this._findCommand(commandToken);
    if (!command) {
      const error = new Error(`Unknown command: ${commandToken}`);
      error.code = 'commander.unknownCommand';
      throw error;
    }

    const { args, options } = command._parseTokens(tokens);

    const hooks = this._hooks.preAction || [];
    for (const hook of hooks) {
      // Commander passes (thisCommand, actionCommand)
      // eslint-disable-next-line no-await-in-loop
      await hook(this, command);
    }

    if (command._hooks.preAction) {
      for (const hook of command._hooks.preAction) {
        // eslint-disable-next-line no-await-in-loop
        await hook(command, command);
      }
    }

    const actionArgs = [];
    if (command._args.length > 0) {
      actionArgs.push(...args);
    }

    actionArgs.push(options);
    actionArgs.push(command);
    return command._action(...actionArgs);
  }

  _parseTokens(tokens) {
    const args = [];
    const options = {};

    let index = 0;
    while (index < tokens.length && args.length < this._args.length) {
      const token = tokens[index];
      if (token.startsWith('-')) {
        break;
      }
      args.push(token);
      index += 1;
    }

    for (const argDef of this._args) {
      if (argDef.required && (args[argDef.position] === undefined || args[argDef.position] === '')) {
        const error = new Error(`Missing required argument: ${argDef.name}`);
        error.code = 'commander.missingArgument';
        throw error;
      }
    }

    while (index < tokens.length) {
      const token = tokens[index];
      if (!token.startsWith('-')) {
        index += 1;
        continue;
      }

      let name;
      let value;
      let raw = token;

      if (token.includes('=')) {
        const [optionName, optionValue] = token.split('=');
        raw = optionName;
        value = optionValue;
      }

      if (raw.startsWith('--')) {
        name = raw.slice(2);
      } else if (raw.startsWith('-')) {
        name = raw.slice(1);
      }

      const optionDef = this._findOption(name);
      if (!optionDef) {
        index += 1;
        continue;
      }

      if (optionDef.requiredValue) {
        if (value === undefined) {
          index += 1;
          value = tokens[index];
        }
        if (value === undefined || value.startsWith('-')) {
          const error = new Error(`Option "${optionDef.long || optionDef.short}" argument missing`);
          error.code = 'commander.optionMissingArgument';
          throw error;
        }
      } else if (optionDef.optionalValue) {
        if (value === undefined) {
          const next = tokens[index + 1];
          if (next && !next.startsWith('-')) {
            index += 1;
            value = next;
          }
        }
      }

      if (value === undefined) {
        value = true;
      }

      options[optionDef.key] = value;
      index += 1;
    }

    return { args, options };
  }

  _findOption(name) {
    return this._options.find((option) => option.matches(name));
  }
}

function parseCommandSpec(spec) {
  const parts = spec.trim().split(/\s+/);
  const name = parts.shift();
  const args = parts.map((part, index) => {
    if (part.startsWith('<') && part.endsWith('>')) {
      return { name: part.slice(1, -1), required: true, position: index };
    }
    if (part.startsWith('[') && part.endsWith(']')) {
      return { name: part.slice(1, -1), required: false, position: index };
    }
    return null;
  }).filter(Boolean);
  return { name, args };
}

function parseOption(flags, description) {
  const parts = flags.split(',').map((part) => part.trim());
  const option = {
    flags,
    description,
    short: null,
    long: null,
    requiredValue: false,
    optionalValue: false,
    key: null,
    matches(name) {
      return name === this.short || name === this.long;
    },
  };

  for (const part of parts) {
    if (part.startsWith('--')) {
      option.long = part.replace(/^--/, '');
    } else if (part.startsWith('-')) {
      option.short = part.replace(/^-/, '');
    }

    if (part.includes('<')) {
      option.requiredValue = true;
    } else if (part.includes('[')) {
      option.optionalValue = true;
    }
  }

  option.key = option.long || option.short;
  return option;
}

module.exports = { Command };
