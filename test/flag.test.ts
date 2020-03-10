import { flag } from '../src/flag';
import { tokenize } from '../src/newparser/tokenizer';
import { parse } from '../src/newparser/parser';
import { boolean } from '../src/types';

test('fails on incompatible value', async () => {
  const argv = `--hello=world`;
  const tokens = tokenize(argv.split(' '));
  const shortOptionKeys = new Set<string>();
  const longOptionKeys = new Set<string>();
  const argparser = flag({
    type: boolean,
    long: 'hello',
    description: 'description',
  });
  argparser.register({
    forceFlagShortNames: shortOptionKeys,
    forceFlagLongNames: longOptionKeys,
  });
  const nodes = parse(tokens, {
    shortFlagKeys: shortOptionKeys,
    longFlagKeys: longOptionKeys,
  });

  const result = argparser.parse({
    nodes,
    visitedNodes: new Set(),
  });

  await expect(result).resolves.toEqual({
    outcome: 'failure',
    errors: [
      {
        nodes: nodes,
        message: 'expected value to be either "true" or "false". got: "world"',
      },
    ],
  });
});

test('defaults to false', async () => {
  const argv = ``;
  const tokens = tokenize(argv.split(' '));
  const shortOptionKeys = new Set<string>();
  const longOptionKeys = new Set<string>();
  const argparser = flag({
    type: boolean,
    long: 'hello',
    description: 'description',
  });
  argparser.register({
    forceFlagShortNames: shortOptionKeys,
    forceFlagLongNames: longOptionKeys,
  });
  const nodes = parse(tokens, {
    shortFlagKeys: shortOptionKeys,
    longFlagKeys: longOptionKeys,
  });

  const result = argparser.parse({
    nodes,
    visitedNodes: new Set(),
  });

  await expect(result).resolves.toEqual({
    outcome: 'success',
    value: false,
  });
});

test('allows short arguments', async () => {
  const argv = `-abc`;
  const tokens = tokenize(argv.split(' '));
  const shortOptionKeys = new Set<string>();
  const longOptionKeys = new Set<string>();
  const argparser = flag({
    type: boolean,
    long: 'hello',
    short: 'b',
    description: 'description',
  });
  argparser.register({
    forceFlagShortNames: shortOptionKeys,
    forceFlagLongNames: longOptionKeys,
  });
  const nodes = parse(tokens, {
    shortFlagKeys: shortOptionKeys,
    longFlagKeys: longOptionKeys,
  });

  const result = argparser.parse({
    nodes,
    visitedNodes: new Set(),
  });

  await expect(result).resolves.toEqual({
    outcome: 'success',
    value: true,
  });
});
