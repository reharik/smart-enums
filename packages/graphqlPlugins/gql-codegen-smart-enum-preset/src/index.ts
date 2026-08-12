import type { Types } from '@graphql-codegen/plugin-helpers';
import * as smartEnumCodegen from '@reharik/graphql-codegen-smart-enum';
import * as typePoliciesCodegen from '@reharik/graphql-codegen-smart-enum-type-policies';
import { isEnumType, type GraphQLSchema } from 'graphql';

const SMART_ENUM_PLUGIN = '@reharik/graphql-codegen-smart-enum';
const TYPE_POLICIES_PLUGIN = '@reharik/graphql-codegen-smart-enum-type-policies';

/**
 * Modes the preset can operate in.
 *
 * - `enums`: emit smart-enum definitions (and, when `externalEnums` is set,
 *   `define<Name>Input` functions that pin hand-authored enums to the schema).
 *   Runs the @reharik/graphql-codegen-smart-enum plugin. Without
 *   `externalEnums`, the single output also contains `enumRegistry`. WITH
 *   `externalEnums`, the preset emits a SECOND file — a sibling named
 *   `<name>Registry.<ext>` — holding `enumRegistry`, because the registry
 *   imports the hand-authored enums and must not live in (or be re-exported
 *   from) the widely-imported enums file, or the module graph gains a
 *   load-order-dependent cycle that TDZ-crashes at runtime.
 *
 * - `type-policies`: emit Apollo typePolicies for client-side enum rehydration.
 *   Runs the @reharik/graphql-codegen-smart-enum-type-policies plugin.
 *
 * - `with-enum-values`: contribute an auto-derived `enumValues` map to the
 *   consumer-supplied plugin list (e.g. typescript-operations,
 *   typescript-resolvers). The preset does not pick the plugins — the consumer
 *   does. The preset merges its enumValues map into the consumer's config.
 */
export type PresetMode = 'enums' | 'type-policies' | 'with-enum-values';

export type SmartEnumPresetConfig = {
  mode: PresetMode;

  /**
   * Where smart-enum objects live. Required for `type-policies` and
   * `with-enum-values` modes. Ignored for `enums` mode.
   *
   * For `type-policies` mode, this becomes the import statement in the
   * generated file: `import { Foo, Bar } from '<enumImportPath>'`.
   *
   * For `with-enum-values` mode, this is the `from` half of every
   * `enumValues` mapping: `Foo: '<enumImportPath>#Foo'`.
   */
  enumImportPath?: string;

  /** Skip these GraphQL enum type names. Applies in all modes. */
  skipEnums?: string[];

  /**
   * Suffix appended to enum names. Must match the suffix used in the `enums`
   * mode codegen. Defaults to ''.
   */
  enumClassSuffix?: string;

  /**
   * Only used in `enums` mode. Passed through to the enum-definition plugin.
   */
  emitDescriptionsAsDisplay?: boolean;

  /**
   * Only used in `enums` mode. Passed through to the enum-definition plugin;
   * also shown in each emitted `define<Name>Input` usage example so
   * hand-authored enums copy the matching `enumeration()` call.
   */
  serializeAs?: 'value' | 'wrapped';

  /**
   * Only used in `enums` mode. Map of GraphQL enum type name → import path
   * (relative to the enums output file) for hand-authored enums. Listing a
   * name here implies it is skipped from generation; it does not also need to
   * appear in `skipEnums` (though it may).
   *
   * When set, the preset emits TWO files from the one `generates` entry: the
   * enums output (generated enums + `define<Name>Input` functions, importing
   * no user code) and a sibling `<name>Registry.<ext>` file holding
   * `enumRegistry` (which imports the hand-authored enums). Point bootstrap
   * code (patchSchemaEnumSerializers, Apollo typePolicies setup) at the
   * registry file; never import it from code reachable by an enum.
   */
  externalEnums?: Record<string, string>;
};

const PRESET_PREFIX = '[graphql-codegen-smart-enum-preset]';

const validateConfig = (config: SmartEnumPresetConfig): void => {
  if (
    config.mode !== 'enums' &&
    config.mode !== 'type-policies' &&
    config.mode !== 'with-enum-values'
  ) {
    throw new TypeError(
      `${PRESET_PREFIX} presetConfig.mode must be one of 'enums', 'type-policies', or 'with-enum-values'. Got: ${String(config.mode)}`,
    );
  }

  if (config.externalEnums !== undefined) {
    const externalEnums = config.externalEnums;
    if (
      typeof externalEnums !== 'object' ||
      externalEnums === null ||
      Array.isArray(externalEnums)
    ) {
      throw new TypeError(
        `${PRESET_PREFIX} presetConfig.externalEnums must be a plain object of enum type name → import path.`,
      );
    }
  }

  if (config.mode === 'type-policies' || config.mode === 'with-enum-values') {
    if (
      typeof config.enumImportPath !== 'string' ||
      config.enumImportPath.length === 0
    ) {
      throw new TypeError(
        `${PRESET_PREFIX} presetConfig.enumImportPath is required for mode '${config.mode}'.`,
      );
    }
  }

  if (config.skipEnums !== undefined && !Array.isArray(config.skipEnums)) {
    throw new TypeError(
      `${PRESET_PREFIX} presetConfig.skipEnums must be an array of strings.`,
    );
  }

  if (
    config.serializeAs !== undefined &&
    config.serializeAs !== 'value' &&
    config.serializeAs !== 'wrapped'
  ) {
    throw new TypeError(
      `${PRESET_PREFIX} presetConfig.serializeAs must be 'value' or 'wrapped'.`,
    );
  }
};

/**
 * Walk the schema and return non-introspection enum type names,
 * minus any that the consumer wants skipped.
 */
const getSchemaEnumNames = (
  schema: GraphQLSchema,
  skipEnums: readonly string[] | undefined,
): string[] => {
  const skipSet = new Set(skipEnums ?? []);
  return Object.keys(schema.getTypeMap())
    .filter(name => !name.startsWith('__'))
    .filter(name => isEnumType(schema.getType(name)))
    .filter(name => !skipSet.has(name))
    .sort();
};

/**
 * Verify that every name in skipEnums actually corresponds to an enum type
 * in the schema. Catches typos in consumer config.
 */
const validateSkipEnumsAgainstSchema = (
  schema: GraphQLSchema,
  skipEnums: readonly string[] | undefined,
): void => {
  if (skipEnums === undefined || skipEnums.length === 0) return;

  const allEnumNames = new Set(
    Object.keys(schema.getTypeMap())
      .filter(name => !name.startsWith('__'))
      .filter(name => isEnumType(schema.getType(name))),
  );

  const unknown = skipEnums.filter(name => !allEnumNames.has(name));

  if (unknown.length > 0) {
    throw new Error(
      `${PRESET_PREFIX} presetConfig.skipEnums contains names that don't correspond to enum types in the schema: ${unknown
        .map(n => `'${n}'`)
        .join(', ')}. ` +
        `Available enum types: ${
          [...allEnumNames]
            .sort()
            .map(n => `'${n}'`)
            .join(', ') || '(none)'
        }.`,
    );
  }
};

/**
 * Build the enumValues map for typescript / typescript-operations /
 * typescript-resolvers plugins. Each entry maps a GraphQL enum type name
 * to a TypeScript import descriptor of the form `path#ExportedName`.
 */
const buildEnumValuesMap = (
  schema: GraphQLSchema,
  config: SmartEnumPresetConfig,
): Record<string, string> => {
  const enumNames = getSchemaEnumNames(schema, config.skipEnums);
  const suffix = config.enumClassSuffix ?? '';
  const importPath = config.enumImportPath as string; // validated above

  const map: Record<string, string> = {};
  for (const enumName of enumNames) {
    map[enumName] = `${importPath}#${enumName}${suffix}`;
  }
  return map;
};

/**
 * Derive the sibling registry file for an enums output, plus the import path
 * from the registry file back to the enums file.
 *
 * './src/enums/graphqlSmartEnums.ts' →
 *   registryFilename: './src/enums/graphqlSmartEnumsRegistry.ts'
 *   enumsImportPath:  './graphqlSmartEnums'
 *
 * The registry always sits in the same directory as the enums file so that
 * the (output-file-relative) `externalEnums` import paths stay valid for both.
 */
const deriveRegistryOutput = (
  baseOutputDir: string,
): { registryFilename: string; enumsImportPath: string } => {
  const slashIndex = baseOutputDir.lastIndexOf('/');
  const dir = slashIndex >= 0 ? baseOutputDir.slice(0, slashIndex + 1) : '';
  const basename =
    slashIndex >= 0 ? baseOutputDir.slice(slashIndex + 1) : baseOutputDir;

  const extIndex = basename.lastIndexOf('.');
  const stem = extIndex > 0 ? basename.slice(0, extIndex) : basename;
  const ext = extIndex > 0 ? basename.slice(extIndex) : '';

  return {
    registryFilename: `${dir}${stem}Registry${ext}`,
    enumsImportPath: `./${stem}`,
  };
};

export const preset: Types.OutputPreset<SmartEnumPresetConfig> = {
  buildGeneratesSection: (options): Types.GenerateOptions[] => {
    const presetConfig = options.presetConfig as SmartEnumPresetConfig;
    validateConfig(presetConfig);

    const schemaAst = options.schemaAst;
    if (!schemaAst) {
      throw new Error(
        `${PRESET_PREFIX} schemaAst is required. Make sure your codegen config has a 'schema' field.`,
      );
    }

    validateSkipEnumsAgainstSchema(schemaAst, presetConfig.skipEnums);
    if (presetConfig.mode === 'enums') {
      const sharedPluginConfig = {
        ...(presetConfig.enumClassSuffix !== undefined
          ? { enumClassSuffix: presetConfig.enumClassSuffix }
          : {}),
        ...(presetConfig.serializeAs !== undefined
          ? { serializeAs: presetConfig.serializeAs }
          : {}),
        ...(presetConfig.skipEnums !== undefined
          ? { skipEnums: presetConfig.skipEnums }
          : {}),
        ...(presetConfig.externalEnums !== undefined
          ? { externalEnums: presetConfig.externalEnums }
          : {}),
      };

      const enumsEntry = {
        ...options,
        filename: options.baseOutputDir,
        plugins: [{ [SMART_ENUM_PLUGIN]: {} }],
        pluginMap: {
          ...options.pluginMap,
          [SMART_ENUM_PLUGIN]: smartEnumCodegen,
        },
        config: {
          ...options.config,
          ...sharedPluginConfig,
          ...(presetConfig.emitDescriptionsAsDisplay !== undefined
            ? {
                emitDescriptionsAsDisplay:
                  presetConfig.emitDescriptionsAsDisplay,
              }
            : {}),
        },
      };

      const hasExternalEnums =
        presetConfig.externalEnums !== undefined &&
        Object.keys(presetConfig.externalEnums).length > 0;

      if (!hasExternalEnums) {
        return [enumsEntry];
      }

      // With external enums, enumRegistry moves to an auto-emitted sibling
      // file. The registry imports the hand-authored enums, so it must not
      // live in (or be re-exported from) the enums file that user code
      // imports — that edge completes a load-order-dependent import cycle
      // that TDZ-crashes at module evaluation.
      const { registryFilename, enumsImportPath } = deriveRegistryOutput(
        options.baseOutputDir,
      );

      return [
        enumsEntry,
        {
          ...options,
          filename: registryFilename,
          plugins: [{ [SMART_ENUM_PLUGIN]: {} }],
          pluginMap: {
            ...options.pluginMap,
            [SMART_ENUM_PLUGIN]: smartEnumCodegen,
          },
          config: {
            ...options.config,
            ...sharedPluginConfig,
            emit: 'enumRegistry',
            enumsImportPath,
          },
        },
      ];
    }

    if (presetConfig.mode === 'type-policies') {
      return [
        {
          ...options,
          filename: options.baseOutputDir,
          plugins: [{ [TYPE_POLICIES_PLUGIN]: {} }],
          pluginMap: {
            ...options.pluginMap,
            [TYPE_POLICIES_PLUGIN]: typePoliciesCodegen,
          },
          config: {
            ...options.config,
            enumImportPath: presetConfig.enumImportPath,
            ...(presetConfig.enumClassSuffix !== undefined
              ? { enumClassSuffix: presetConfig.enumClassSuffix }
              : {}),
            ...(presetConfig.skipEnums !== undefined
              ? { skipEnums: presetConfig.skipEnums }
              : {}),
          },
        },
      ];
    }

    // mode === 'with-enum-values'
    // Consumer supplied their own plugins; we merge enumValues into config.
    if (!Array.isArray(options.plugins) || options.plugins.length === 0) {
      throw new Error(
        `${PRESET_PREFIX} mode 'with-enum-values' requires the consumer to provide a 'plugins' array in their codegen config.`,
      );
    }

    const enumValues = buildEnumValuesMap(schemaAst, presetConfig);

    // Merge: consumer-supplied enumValues entries win over auto-derived ones,
    // so consumers can override individual mappings if needed.
    const consumerEnumValues = (options.config as Record<string, unknown>)
      ?.enumValues as Record<string, string> | undefined;
    const mergedEnumValues = {
      ...enumValues,
      ...(consumerEnumValues ?? {}),
    };

    return [
      {
        ...options,
        filename: options.baseOutputDir,
        plugins: options.plugins,
        pluginMap: options.pluginMap,
        config: {
          ...options.config,
          enumValues: mergedEnumValues,
        },
      },
    ];
  },
};

export default preset;
