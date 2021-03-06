var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
import { r as removeFederation, p as parse, e as extendSchema, g as getCachedDocumentNodeFromSchema, v as visit, b as buildASTSchema, K as Kind, i as isEnumType, G as GraphQLObjectType, o as oldVisit, T as TypeInfo, a as printIntrospectionSchema, c as isObjectType, d as getNamedType, f as visitWithTypeInfo, h as isIntrospectionType } from "./index.js";
import { O as OperationVariablesToObject, n as normalizeAvoidOptionals, B as BaseTypesVisitor, g as getConfigValue, a as autoBind, D as DeclarationBlock, i as indent, t as transformComment, w as wrapWithSingleQuotes } from "./index3.js";
import "https://esm.sh/typescript";
import "./loader.js";
import "./introspectionFromSchema.js";
function transformSchemaAST(schema, config) {
  schema = config.federation ? removeFederation(schema) : schema;
  if (config.includeIntrospectionTypes) {
    const introspectionAST = parse(`
      extend type Query {
        __schema: __Schema!
        __type(name: String!): __Type
      }
    `);
    schema = extendSchema(schema, introspectionAST);
  }
  let ast = getCachedDocumentNodeFromSchema(schema);
  ast = config.disableDescriptions ? visit(ast, {
    leave: (node) => __spreadProps(__spreadValues({}, node), {
      description: void 0
    })
  }) : ast;
  schema = config.disableDescriptions ? buildASTSchema(ast) : schema;
  return {
    schema,
    ast
  };
}
class TypeScriptOperationVariablesToObject extends OperationVariablesToObject {
  constructor(_scalars, _convertName, _avoidOptionals, _immutableTypes, _namespacedImportName = null, _enumNames = [], _enumPrefix = true, _enumValues = {}, _applyCoercion = false, _directiveArgumentAndInputFieldMappings = {}, _maybeType = "Maybe") {
    super(_scalars, _convertName, _namespacedImportName, _enumNames, _enumPrefix, _enumValues, _applyCoercion, _directiveArgumentAndInputFieldMappings);
    this._avoidOptionals = _avoidOptionals;
    this._immutableTypes = _immutableTypes;
    this._maybeType = _maybeType;
  }
  clearOptional(str) {
    const prefix = this._namespacedImportName ? `${this._namespacedImportName}.` : "";
    const rgx = new RegExp(`^${this.wrapMaybe(`(.*?)`)}$`, "i");
    if (str.startsWith(`${prefix}${this._maybeType}`)) {
      return str.replace(rgx, "$1");
    }
    return str;
  }
  wrapAstTypeWithModifiers(baseType, typeNode, applyCoercion = false) {
    if (typeNode.kind === Kind.NON_NULL_TYPE) {
      const type = this.wrapAstTypeWithModifiers(baseType, typeNode.type, applyCoercion);
      return this.clearOptional(type);
    } else if (typeNode.kind === Kind.LIST_TYPE) {
      const innerType = this.wrapAstTypeWithModifiers(baseType, typeNode.type, applyCoercion);
      const listInputCoercionExtension = applyCoercion ? ` | ${innerType}` : "";
      return this.wrapMaybe(`${this._immutableTypes ? "ReadonlyArray" : "Array"}<${innerType}>${listInputCoercionExtension}`);
    } else {
      return this.wrapMaybe(baseType);
    }
  }
  formatFieldString(fieldName, isNonNullType, hasDefaultValue) {
    return `${fieldName}${this.getAvoidOption(isNonNullType, hasDefaultValue) ? "?" : ""}`;
  }
  formatTypeString(fieldType, isNonNullType, hasDefaultValue) {
    if (!hasDefaultValue && isNonNullType) {
      return this.clearOptional(fieldType);
    }
    return fieldType;
  }
  wrapMaybe(type) {
    const prefix = this._namespacedImportName ? `${this._namespacedImportName}.` : "";
    return `${prefix}${this._maybeType}${type ? `<${type}>` : ""}`;
  }
  getAvoidOption(isNonNullType, hasDefaultValue) {
    const options = normalizeAvoidOptionals(this._avoidOptionals);
    return (options.object || !options.defaultValue) && hasDefaultValue || !options.object && !isNonNullType;
  }
  getPunctuation() {
    return ";";
  }
}
const EXACT_SIGNATURE = `type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };`;
const MAKE_OPTIONAL_SIGNATURE = `type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };`;
const MAKE_MAYBE_SIGNATURE = `type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };`;
class TsVisitor extends BaseTypesVisitor {
  constructor(schema, pluginConfig, additionalConfig = {}) {
    super(schema, pluginConfig, __spreadValues({
      noExport: getConfigValue(pluginConfig.noExport, false),
      avoidOptionals: normalizeAvoidOptionals(getConfigValue(pluginConfig.avoidOptionals, false)),
      maybeValue: getConfigValue(pluginConfig.maybeValue, "T | null"),
      inputMaybeValue: getConfigValue(pluginConfig.inputMaybeValue, getConfigValue(pluginConfig.maybeValue, "Maybe<T>")),
      constEnums: getConfigValue(pluginConfig.constEnums, false),
      enumsAsTypes: getConfigValue(pluginConfig.enumsAsTypes, false),
      futureProofEnums: getConfigValue(pluginConfig.futureProofEnums, false),
      futureProofUnions: getConfigValue(pluginConfig.futureProofUnions, false),
      enumsAsConst: getConfigValue(pluginConfig.enumsAsConst, false),
      numericEnums: getConfigValue(pluginConfig.numericEnums, false),
      onlyOperationTypes: getConfigValue(pluginConfig.onlyOperationTypes, false),
      immutableTypes: getConfigValue(pluginConfig.immutableTypes, false),
      useImplementingTypes: getConfigValue(pluginConfig.useImplementingTypes, false),
      entireFieldWrapperValue: getConfigValue(pluginConfig.entireFieldWrapperValue, "T"),
      wrapEntireDefinitions: getConfigValue(pluginConfig.wrapEntireFieldDefinitions, false)
    }, additionalConfig || {}));
    autoBind(this);
    const enumNames = Object.values(schema.getTypeMap()).filter(isEnumType).map((type) => type.name);
    this.setArgumentsTransformer(new TypeScriptOperationVariablesToObject(this.scalars, this.convertName, this.config.avoidOptionals, this.config.immutableTypes, null, enumNames, pluginConfig.enumPrefix, this.config.enumValues, false, this.config.directiveArgumentAndInputFieldMappings, "InputMaybe"));
    this.setDeclarationBlockConfig({
      enumNameValueSeparator: " =",
      ignoreExport: this.config.noExport
    });
  }
  _getTypeForNode(node) {
    const typeAsString = node.name;
    if (this.config.useImplementingTypes) {
      const allTypesMap = this._schema.getTypeMap();
      const implementingTypes = [];
      for (const graphqlType of Object.values(allTypesMap)) {
        if (graphqlType instanceof GraphQLObjectType) {
          const allInterfaces = graphqlType.getInterfaces();
          if (allInterfaces.some((int) => typeAsString === int.name)) {
            implementingTypes.push(this.convertName(graphqlType.name));
          }
        }
      }
      if (implementingTypes.length > 0) {
        return implementingTypes.join(" | ");
      }
    }
    const typeString = super._getTypeForNode(node);
    const schemaType = this._schema.getType(node.name);
    if (isEnumType(schemaType)) {
      const futureProofEnumUsageEnabled = this.config.futureProofEnums === true && this.config.enumsAsTypes !== true;
      if (futureProofEnumUsageEnabled && this.config.allowEnumStringTypes === true) {
        return `${typeString} | '%future added value' | \`\${` + typeString + "}`";
      }
      if (futureProofEnumUsageEnabled) {
        return `${typeString} | '%future added value'`;
      }
      if (this.config.allowEnumStringTypes === true) {
        return `${typeString} | \`\${` + typeString + "}`";
      }
    }
    return typeString;
  }
  getWrapperDefinitions() {
    const definitions = [
      this.getMaybeValue(),
      this.getInputMaybeValue(),
      this.getExactDefinition(),
      this.getMakeOptionalDefinition(),
      this.getMakeMaybeDefinition()
    ];
    if (this.config.wrapFieldDefinitions) {
      definitions.push(this.getFieldWrapperValue());
    }
    if (this.config.wrapEntireDefinitions) {
      definitions.push(this.getEntireFieldWrapperValue());
    }
    return definitions;
  }
  getExactDefinition() {
    return `${this.getExportPrefix()}${EXACT_SIGNATURE}`;
  }
  getMakeOptionalDefinition() {
    return `${this.getExportPrefix()}${MAKE_OPTIONAL_SIGNATURE}`;
  }
  getMakeMaybeDefinition() {
    return `${this.getExportPrefix()}${MAKE_MAYBE_SIGNATURE}`;
  }
  getMaybeValue() {
    return `${this.getExportPrefix()}type Maybe<T> = ${this.config.maybeValue};`;
  }
  getInputMaybeValue() {
    return `${this.getExportPrefix()}type InputMaybe<T> = ${this.config.inputMaybeValue};`;
  }
  clearOptional(str) {
    if (str.startsWith("Maybe")) {
      return str.replace(/Maybe<(.*?)>$/, "$1");
    }
    if (str.startsWith("InputMaybe")) {
      return str.replace(/InputMaybe<(.*?)>$/, "$1");
    }
    return str;
  }
  getExportPrefix() {
    if (this.config.noExport) {
      return "";
    }
    return super.getExportPrefix();
  }
  getMaybeWrapper(ancestors) {
    const currentVisitContext = this.getVisitorKindContextFromAncestors(ancestors);
    const isInputContext = currentVisitContext.includes(Kind.INPUT_OBJECT_TYPE_DEFINITION);
    return isInputContext ? "InputMaybe" : "Maybe";
  }
  NamedType(node, key, parent, path, ancestors) {
    return `${this.getMaybeWrapper(ancestors)}<${super.NamedType(node, key, parent, path, ancestors)}>`;
  }
  ListType(node, key, parent, path, ancestors) {
    return `${this.getMaybeWrapper(ancestors)}<${super.ListType(node, key, parent, path, ancestors)}>`;
  }
  UnionTypeDefinition(node, key, parent) {
    if (this.config.onlyOperationTypes)
      return "";
    let withFutureAddedValue = [];
    if (this.config.futureProofUnions) {
      withFutureAddedValue = [
        this.config.immutableTypes ? `{ readonly __typename?: "%other" }` : `{ __typename?: "%other" }`
      ];
    }
    const originalNode = parent[key];
    const possibleTypes = originalNode.types.map((t) => this.scalars[t.name.value] ? this._getScalar(t.name.value) : this.convertName(t)).concat(...withFutureAddedValue).join(" | ");
    return new DeclarationBlock(this._declarationBlockConfig).export().asKind("type").withName(this.convertName(node)).withComment(node.description).withContent(possibleTypes).string;
  }
  wrapWithListType(str) {
    return `${this.config.immutableTypes ? "ReadonlyArray" : "Array"}<${str}>`;
  }
  NonNullType(node) {
    const baseValue = super.NonNullType(node);
    return this.clearOptional(baseValue);
  }
  FieldDefinition(node, key, parent) {
    const typeString = this.config.wrapEntireDefinitions ? `EntireFieldWrapper<${node.type}>` : node.type;
    const originalFieldNode = parent[key];
    const addOptionalSign = !this.config.avoidOptionals.field && originalFieldNode.type.kind !== Kind.NON_NULL_TYPE;
    const comment = this.getFieldComment(node);
    const { type } = this.config.declarationKind;
    return comment + indent(`${this.config.immutableTypes ? "readonly " : ""}${node.name}${addOptionalSign ? "?" : ""}: ${typeString}${this.getPunctuation(type)}`);
  }
  InputValueDefinition(node, key, parent) {
    const originalFieldNode = parent[key];
    const addOptionalSign = !this.config.avoidOptionals.inputValue && (originalFieldNode.type.kind !== Kind.NON_NULL_TYPE || !this.config.avoidOptionals.defaultValue && node.defaultValue !== void 0);
    const comment = transformComment(node.description, 1);
    const declarationKind = this.config.declarationKind.type;
    let type = node.type;
    if (node.directives && this.config.directiveArgumentAndInputFieldMappings) {
      type = this._getDirectiveOverrideType(node.directives) || type;
    }
    return comment + indent(`${this.config.immutableTypes ? "readonly " : ""}${node.name}${addOptionalSign ? "?" : ""}: ${type}${this.getPunctuation(declarationKind)}`);
  }
  EnumTypeDefinition(node) {
    const enumName = node.name;
    if (this.config.enumValues[enumName] && this.config.enumValues[enumName].sourceFile) {
      return `export { ${this.config.enumValues[enumName].typeIdentifier} };
`;
    }
    const getValueFromConfig = (enumValue) => {
      if (this.config.enumValues[enumName] && this.config.enumValues[enumName].mappedValues && typeof this.config.enumValues[enumName].mappedValues[enumValue] !== "undefined") {
        return this.config.enumValues[enumName].mappedValues[enumValue];
      }
      return null;
    };
    const withFutureAddedValue = [
      this.config.futureProofEnums ? [indent("| " + wrapWithSingleQuotes("%future added value"))] : []
    ];
    const enumTypeName = this.convertName(node, { useTypesPrefix: this.config.enumPrefix });
    if (this.config.enumsAsTypes) {
      return new DeclarationBlock(this._declarationBlockConfig).export().asKind("type").withComment(node.description).withName(enumTypeName).withContent("\n" + node.values.map((enumOption) => {
        var _a;
        const name = enumOption.name;
        const enumValue = (_a = getValueFromConfig(name)) !== null && _a !== void 0 ? _a : name;
        const comment = transformComment(enumOption.description, 1);
        return comment + indent("| " + wrapWithSingleQuotes(enumValue));
      }).concat(...withFutureAddedValue).join("\n")).string;
    }
    if (this.config.numericEnums) {
      const block = new DeclarationBlock(this._declarationBlockConfig).export().withComment(node.description).withName(enumTypeName).asKind("enum").withBlock(node.values.map((enumOption, i) => {
        const valueFromConfig = getValueFromConfig(enumOption.name);
        const enumValue = valueFromConfig !== null && valueFromConfig !== void 0 ? valueFromConfig : i;
        const comment = transformComment(enumOption.description, 1);
        const optionName = this.makeValidEnumIdentifier(this.convertName(enumOption, { useTypesPrefix: false, transformUnderscore: true }));
        return comment + indent(optionName) + ` = ${enumValue}`;
      }).concat(...withFutureAddedValue).join(",\n")).string;
      return block;
    }
    if (this.config.enumsAsConst) {
      const typeName = `export type ${enumTypeName} = typeof ${enumTypeName}[keyof typeof ${enumTypeName}];`;
      const enumAsConst = new DeclarationBlock(__spreadProps(__spreadValues({}, this._declarationBlockConfig), {
        blockTransformer: (block) => {
          return block + " as const";
        }
      })).export().asKind("const").withName(enumTypeName).withComment(node.description).withBlock(node.values.map((enumOption) => {
        var _a;
        const optionName = this.convertName(enumOption, { useTypesPrefix: false, transformUnderscore: true });
        const comment = transformComment(enumOption.description, 1);
        const name = enumOption.name;
        const enumValue = (_a = getValueFromConfig(name)) !== null && _a !== void 0 ? _a : name;
        return comment + indent(`${optionName}: ${wrapWithSingleQuotes(enumValue)}`);
      }).join(",\n")).string;
      return [enumAsConst, typeName].join("\n");
    }
    return new DeclarationBlock(this._declarationBlockConfig).export().asKind(this.config.constEnums ? "const enum" : "enum").withName(enumTypeName).withComment(node.description).withBlock(this.buildEnumValuesBlock(enumName, node.values)).string;
  }
  getPunctuation(_declarationKind) {
    return ";";
  }
}
class TsIntrospectionVisitor extends TsVisitor {
  constructor(schema, pluginConfig = {}, typesToInclude) {
    super(schema, pluginConfig);
    this.typesToInclude = [];
    this.typesToInclude = typesToInclude;
    autoBind(this);
  }
  DirectiveDefinition() {
    return null;
  }
  ObjectTypeDefinition(node, key, parent) {
    const name = node.name;
    if (this.typesToInclude.some((type) => type.name === name)) {
      return super.ObjectTypeDefinition(node, key, parent);
    }
    return null;
  }
  EnumTypeDefinition(node) {
    const name = node.name;
    if (this.typesToInclude.some((type) => type.name === name)) {
      return super.EnumTypeDefinition(node);
    }
    return null;
  }
}
const plugin = (schema, documents, config) => {
  const { schema: _schema, ast } = transformSchemaAST(schema, config);
  const visitor = new TsVisitor(_schema, config);
  const visitorResult = oldVisit(ast, { leave: visitor });
  const introspectionDefinitions = includeIntrospectionTypesDefinitions(_schema, documents, config);
  const scalars = visitor.scalarsDefinition;
  const directiveArgumentAndInputFieldMappings = visitor.directiveArgumentAndInputFieldMappingsDefinition;
  return {
    prepend: [
      ...visitor.getEnumsImports(),
      ...visitor.getDirectiveArgumentAndInputFieldMappingsImports(),
      ...visitor.getScalarsImports(),
      ...visitor.getWrapperDefinitions()
    ].filter(Boolean),
    content: [
      scalars,
      directiveArgumentAndInputFieldMappings,
      ...visitorResult.definitions,
      ...introspectionDefinitions
    ].filter(Boolean).join("\n")
  };
};
function includeIntrospectionTypesDefinitions(schema, documents, config) {
  const typeInfo = new TypeInfo(schema);
  const usedTypes = [];
  const documentsVisitor = visitWithTypeInfo(typeInfo, {
    Field() {
      const type = getNamedType(typeInfo.getType());
      if (isIntrospectionType(type) && !usedTypes.includes(type)) {
        usedTypes.push(type);
      }
    }
  });
  documents.forEach((doc) => visit(doc.document, documentsVisitor));
  const typesToInclude = [];
  usedTypes.forEach((type) => {
    collectTypes(type);
  });
  const visitor = new TsIntrospectionVisitor(schema, config, typesToInclude);
  const result = oldVisit(parse(printIntrospectionSchema(schema)), { leave: visitor });
  function collectTypes(type) {
    if (typesToInclude.includes(type)) {
      return;
    }
    typesToInclude.push(type);
    if (isObjectType(type)) {
      const fields = type.getFields();
      Object.keys(fields).forEach((key) => {
        const field = fields[key];
        const type2 = getNamedType(field.type);
        collectTypes(type2);
      });
    }
  }
  return result.definitions;
}
export { EXACT_SIGNATURE, MAKE_MAYBE_SIGNATURE, MAKE_OPTIONAL_SIGNATURE, TsIntrospectionVisitor, TsVisitor, TypeScriptOperationVariablesToObject, includeIntrospectionTypesDefinitions, plugin };
