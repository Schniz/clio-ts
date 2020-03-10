import { ArgParser, ParsingResult, ParseContext } from './argparser';
import { OutputOf } from './from';
import { PositionalArgument } from './newparser/parser';
import { ProvidesHelp, Descriptive, Displayed } from './helpdoc';
import { Type, HasType } from './type';

type PositionalConfig<Decoder extends Type<string, any>> = HasType<Decoder> &
  Displayed &
  Partial<Descriptive>;

/**
 * A positional command line argument.
 *
 * Decodes one argument that is not a flag or an option:
 * In `hello --key value world` we have 2 positional arguments — `hello` and `world`.
 *
 * @param config positional argument config
 */
export function positional<Decoder extends Type<string, any>>(
  config: PositionalConfig<Decoder>
): ArgParser<OutputOf<Decoder>> & ProvidesHelp & Partial<Descriptive> {
  return {
    description: config.description ?? config.type.description,
    helpTopics() {
      return [
        {
          category: 'arguments',
          usage: `<${config.displayName}>`,
          description:
            config.description ?? config.type.description ?? 'self explanatory',
          defaults: [],
        },
      ];
    },
    register(_opts) {},
    async parse({
      nodes,
      visitedNodes,
    }: ParseContext): Promise<ParsingResult<OutputOf<Decoder>>> {
      const positionals = nodes.filter(
        (node): node is PositionalArgument =>
          node.type === 'positionalArgument' && !visitedNodes.has(node)
      );

      const positional = positionals[0];

      if (!positional) {
        return {
          outcome: 'failure',
          errors: [
            {
              nodes: [],
              message: `No value provided for ${config.displayName}`,
            },
          ],
        };
      }

      visitedNodes.add(positional);
      const decoded = await config.type.from(positional.raw);

      if (decoded.result === 'error') {
        return {
          outcome: 'failure',
          errors: [
            {
              nodes: [positional],
              message: decoded.message,
            },
          ],
        };
      }

      return { outcome: 'success', value: decoded.value };
    },
  };
}
