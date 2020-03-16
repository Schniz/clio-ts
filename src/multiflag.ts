import {
  ArgParser,
  ParsingResult,
  ParseContext,
  ParsingError,
} from './argparser';
import { From, OutputOf } from './from';
import { findOption } from './newparser/findOption';
import { ProvidesHelp, LongDoc, Descriptive, ShortDoc } from './helpdoc';
import { boolean } from './flag';
import { HasType } from './type';
import * as Result from './Result';

type MultiFlagConfig<Decoder extends From<boolean[], any>> = HasType<Decoder> &
  LongDoc &
  Partial<Descriptive & ShortDoc>;

/**
 * Like `option`, but can accept multiple options, and expects a decoder from a list of strings.
 * An error will highlight all option occurences.
 */
export function multiflag<Decoder extends From<boolean[], any>>(
  config: MultiFlagConfig<Decoder>
): ArgParser<OutputOf<Decoder>> & ProvidesHelp {
  return {
    helpTopics() {
      let usage = `--${config.long}`;
      if (config.short) {
        usage += `, -${config.short}`;
      }
      return [
        {
          category: 'flags',
          usage,
          defaults: [],
          description: config.description ?? 'self explanatory',
        },
      ];
    },
    register(opts) {
      opts.forceFlagLongNames.add(config.long);
      if (config.short) {
        opts.forceFlagShortNames.add(config.short);
      }
    },
    async parse({
      nodes,
      visitedNodes,
    }: ParseContext): Promise<ParsingResult<OutputOf<Decoder>>> {
      const options = findOption(nodes, {
        longNames: [config.long],
        shortNames: config.short ? [config.short] : [],
      }).filter(x => !visitedNodes.has(x));

      for (const option of options) {
        visitedNodes.add(option);
      }

      const optionValues: boolean[] = [];
      const errors: ParsingError[] = [];

      for (const option of options) {
        const decoded = await Result.safeAsync(
          boolean.from(option.value?.node.raw ?? 'true')
        );
        if (Result.isLeft(decoded)) {
          errors.push({ nodes: [option], message: decoded.error.message });
        } else {
          optionValues.push(decoded.value);
        }
      }

      if (errors.length > 0) {
        return Result.err({
          errors,
        });
      }

      const multiDecoded = await Result.safeAsync(
        config.type.from(optionValues)
      );

      if (Result.isLeft(multiDecoded)) {
        return Result.err({
          errors: [
            {
              nodes: options,
              message: multiDecoded.error.message,
            },
          ],
        });
      }

      return multiDecoded;
    },
  };
}
