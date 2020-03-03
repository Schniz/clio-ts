import { flag } from '../../src/newimpl/flag';
import { option } from '../../src/newimpl/option';
import { restPositionals } from '../../src/newimpl/restPositionals';
import { tokenize } from '../../src/newparser/tokenizer';
import { parse } from '../../src/newparser/parser';
import { command } from '../../src/newimpl/command';
import { number, string, boolean } from './test-types';

const cmd = command({
  name: 'My command',
  args: {
    positionals: restPositionals({ decoder: string }),
    option: option({ decoder: number, long: 'option' }),
    secondOption: option({
      decoder: string,
      long: 'second-option',
    }),
    flag: flag({ decoder: boolean, long: 'flag' }),
  },
  failOnUnknownArguments: false,
  handler: _ => {},
});

test('merges options, positionals and flags', () => {
  const argv = `first --option=666 second --second-option works-too --flag third`.split(
    ' '
  );
  const tokens = tokenize(argv);

  const longOptionKeys = new Set<string>();
  const shortOptionKeys = new Set<string>();
  cmd.register({
    forceFlagLongNames: longOptionKeys,
    forceFlagShortNames: shortOptionKeys,
  });

  const nodes = parse(tokens, { longOptionKeys, shortOptionKeys });
  const result = cmd.parse({ nodes, visitedNodes: new Set() });

  expect(result).toEqual({
    outcome: 'success',
    value: {
      positionals: ['first', 'second', 'third'],
      option: 666,
      secondOption: 'works-too',
      flag: true,
    },
  });
});

test('fails if an argument fail to parse', () => {
  const argv = `first --option=hello second --second-option works-too --flag=fails-too third`.split(
    ' '
  );
  const tokens = tokenize(argv);

  const longOptionKeys = new Set<string>();
  const shortOptionKeys = new Set<string>();
  cmd.register({
    forceFlagLongNames: longOptionKeys,
    forceFlagShortNames: shortOptionKeys,
  });

  const nodes = parse(tokens, { longOptionKeys, shortOptionKeys });
  const result = cmd.parse({ nodes, visitedNodes: new Set() });

  expect(result).toEqual({
    outcome: 'failure',
    errors: [
      {
        nodes: nodes.filter(x => x.raw.startsWith('--option')),
        message: 'Not a number',
      },
      {
        nodes: nodes.filter(x => x.raw.startsWith('--flag')),
        message: `expected value to be either "true" or "false". got: "fails-too"`,
      },
    ],
  });
});

test('fails if providing unknown arguments', () => {
  const cmd = command({
    name: 'my command',
    failOnUnknownArguments: true,
    args: {
      positionals: restPositionals({ decoder: string }),
    },
    handler: _ => {},
  });
  const argv = `okay --option=failing alright --another=fail`.split(' ');
  const tokens = tokenize(argv);

  const longOptionKeys = new Set<string>();
  const shortOptionKeys = new Set<string>();
  cmd.register({
    forceFlagLongNames: longOptionKeys,
    forceFlagShortNames: shortOptionKeys,
  });

  const nodes = parse(tokens, { longOptionKeys, shortOptionKeys });
  const result = cmd.parse({ nodes, visitedNodes: new Set() });

  expect(result).toEqual({
    outcome: 'failure',
    errors: [
      {
        message: 'Unknown arguments',
        nodes: nodes.filter(
          node =>
            node.raw.startsWith('--option') || node.raw.startsWith('--another')
        ),
      },
    ],
  });
});
