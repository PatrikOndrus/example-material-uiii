import { i as isEnumType, c4 as concatAST, K as Kind, o as oldVisit, O as isNonNullType } from "./index.js";
import { b as BaseDocumentsVisitor, g as getConfigValue, n as normalizeAvoidOptionals, a as autoBind, c as wrapTypeWithModifiers, S as SelectionSetToObject, d as generateFragmentImportStatement, o as optimizeOperations, P as PreResolveTypesProcessor, e as BaseSelectionSetProcessor } from "./index3.js";
import { TypeScriptOperationVariablesToObject as TypeScriptOperationVariablesToObject$1 } from "./index2.js";
import "https://esm.sh/typescript";
import "./loader.js";
import "./introspectionFromSchema.js";
class TypeScriptOperationVariablesToObject extends TypeScriptOperationVariablesToObject$1 {
  formatTypeString(fieldType, isNonNullType2, _hasDefaultValue) {
    return fieldType;
  }
}
class TypeScriptSelectionSetProcessor extends BaseSelectionSetProcessor {
  transformPrimitiveFields(schemaType, fields) {
    if (fields.length === 0) {
      return [];
    }
    const parentName = (this.config.namespacedImportName ? `${this.config.namespacedImportName}.` : "") + this.config.convertName(schemaType.name, {
      useTypesPrefix: true
    });
    let hasConditionals = false;
    const conditilnalsList = [];
    let resString = `Pick<${parentName}, ${fields.map((field) => {
      if (field.isConditional) {
        hasConditionals = true;
        conditilnalsList.push(field.fieldName);
      }
      return `'${field.fieldName}'`;
    }).join(" | ")}>`;
    if (hasConditionals) {
      const avoidOptional = this.config.avoidOptionals === true || this.config.avoidOptionals.field || this.config.avoidOptionals.inputValue || this.config.avoidOptionals.object;
      const transform = avoidOptional ? "MakeMaybe" : "MakeOptional";
      resString = `${this.config.namespacedImportName ? `${this.config.namespacedImportName}.` : ""}${transform}<${resString}, ${conditilnalsList.map((field) => `'${field}'`).join(" | ")}>`;
    }
    return [resString];
  }
  transformTypenameField(type, name) {
    return [`{ ${name}: ${type} }`];
  }
  transformAliasesPrimitiveFields(schemaType, fields) {
    if (fields.length === 0) {
      return [];
    }
    const parentName = (this.config.namespacedImportName ? `${this.config.namespacedImportName}.` : "") + this.config.convertName(schemaType.name, {
      useTypesPrefix: true
    });
    return [
      `{ ${fields.map((aliasedField) => {
        const value = aliasedField.fieldName === "__typename" ? `'${schemaType.name}'` : `${parentName}['${aliasedField.fieldName}']`;
        return `${aliasedField.alias}: ${value}`;
      }).join(", ")} }`
    ];
  }
  transformLinkFields(fields) {
    if (fields.length === 0) {
      return [];
    }
    return [`{ ${fields.map((field) => `${field.alias || field.name}: ${field.selectionSet}`).join(", ")} }`];
  }
}
class TypeScriptDocumentsVisitor extends BaseDocumentsVisitor {
  constructor(schema, config, allFragments) {
    super(config, {
      arrayInputCoercion: getConfigValue(config.arrayInputCoercion, true),
      noExport: getConfigValue(config.noExport, false),
      avoidOptionals: normalizeAvoidOptionals(getConfigValue(config.avoidOptionals, false)),
      immutableTypes: getConfigValue(config.immutableTypes, false),
      nonOptionalTypename: getConfigValue(config.nonOptionalTypename, false),
      preResolveTypes: getConfigValue(config.preResolveTypes, true)
    }, schema);
    autoBind(this);
    const preResolveTypes = getConfigValue(config.preResolveTypes, true);
    const defaultMaybeValue = "T | null";
    const maybeValue = getConfigValue(config.maybeValue, defaultMaybeValue);
    const wrapOptional = (type) => {
      if (preResolveTypes === true) {
        return maybeValue.replace("T", type);
      }
      const prefix = this.config.namespacedImportName ? `${this.config.namespacedImportName}.` : "";
      return `${prefix}Maybe<${type}>`;
    };
    const wrapArray = (type) => {
      const listModifier = this.config.immutableTypes ? "ReadonlyArray" : "Array";
      return `${listModifier}<${type}>`;
    };
    const formatNamedField = (name, type, isConditional = false) => {
      const optional = isConditional || !this.config.avoidOptionals.field && !!type && !isNonNullType(type);
      return (this.config.immutableTypes ? `readonly ${name}` : name) + (optional ? "?" : "");
    };
    const processorConfig = {
      namespacedImportName: this.config.namespacedImportName,
      convertName: this.convertName.bind(this),
      enumPrefix: this.config.enumPrefix,
      scalars: this.scalars,
      formatNamedField,
      wrapTypeWithModifiers(baseType, type) {
        return wrapTypeWithModifiers(baseType, type, { wrapOptional, wrapArray });
      },
      avoidOptionals: this.config.avoidOptionals
    };
    const processor = new (preResolveTypes ? PreResolveTypesProcessor : TypeScriptSelectionSetProcessor)(processorConfig);
    this.setSelectionSetHandler(new SelectionSetToObject(processor, this.scalars, this.schema, this.convertName.bind(this), this.getFragmentSuffix.bind(this), allFragments, this.config));
    const enumsNames = Object.keys(schema.getTypeMap()).filter((typeName) => isEnumType(schema.getType(typeName)));
    this.setVariablesTransformer(new TypeScriptOperationVariablesToObject(this.scalars, this.convertName.bind(this), this.config.avoidOptionals.object, this.config.immutableTypes, this.config.namespacedImportName, enumsNames, this.config.enumPrefix, this.config.enumValues, this.config.arrayInputCoercion, void 0, "InputMaybe"));
    this._declarationBlockConfig = {
      ignoreExport: this.config.noExport
    };
  }
  getImports() {
    return !this.config.globalNamespace && this.config.inlineFragmentTypes === "combine" ? this.config.fragmentImports.map((fragmentImport) => generateFragmentImportStatement(fragmentImport, "type")) : [];
  }
  getPunctuation(_declarationKind) {
    return ";";
  }
  applyVariablesWrapper(variablesBlock) {
    const prefix = this.config.namespacedImportName ? `${this.config.namespacedImportName}.` : "";
    return `${prefix}Exact<${variablesBlock === "{}" ? `{ [key: string]: never; }` : variablesBlock}>`;
  }
}
const plugin = (schema, rawDocuments, config) => {
  const documents = config.flattenGeneratedTypes ? optimizeOperations(schema, rawDocuments, {
    includeFragments: config.flattenGeneratedTypesIncludeFragments
  }) : rawDocuments;
  const allAst = concatAST(documents.map((v) => v.document));
  const allFragments = [
    ...allAst.definitions.filter((d) => d.kind === Kind.FRAGMENT_DEFINITION).map((fragmentDef) => ({
      node: fragmentDef,
      name: fragmentDef.name.value,
      onType: fragmentDef.typeCondition.name.value,
      isExternal: false
    })),
    ...config.externalFragments || []
  ];
  const visitor = new TypeScriptDocumentsVisitor(schema, config, allFragments);
  const visitorResult = oldVisit(allAst, {
    leave: visitor
  });
  let content = visitorResult.definitions.join("\n");
  if (config.addOperationExport) {
    const exportConsts = [];
    allAst.definitions.forEach((d) => {
      if ("name" in d) {
        exportConsts.push(`export declare const ${d.name.value}: import("graphql").DocumentNode;`);
      }
    });
    content = visitorResult.definitions.concat(exportConsts).join("\n");
  }
  if (config.globalNamespace) {
    content = `
    declare global {
      ${content}
    }`;
  }
  return {
    prepend: [...visitor.getImports(), ...visitor.getGlobalDeclarations(visitor.config.noExport)],
    content
  };
};
export { TypeScriptDocumentsVisitor, plugin };
