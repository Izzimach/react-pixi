import * as ts from "typescript";
import * as fs from "fs";

const reactPixiDeclarationFile = "./react-pixi.d.ts";
const reactPixiDeclarationFileTemplate = "./react-pixi.d.ts.template";
const pixiDeclarationFile = "./node_modules/@types/pixi.js/index.d.ts";

const pixiDeclaration = ts.createSourceFile(
    pixiDeclarationFile,
    fs.readFileSync(pixiDeclarationFile, "utf-8"),
    ts.ScriptTarget.ES2015
);

const targetClasses = {
    DisplayObject: {},
    Container: {},
    ParticleContainer: {},
    Sprite: {
        "image?": "string",
    },
    Text: {
        text: "string",
        "style?": "PIXI.TextStyleOptions | PIXI.TextStyle",
    },
    BitmapText: {
        text: "string",
        "style?": "PIXI.extras.IBitmapTextStyle",
    },
    TilingSprite: {},
    Graphics: {},
};

const nativeTypes = [
    "Float32Array",
    "HTMLCanvasElement",
    "CanvasRenderingContext2D",
];

const extrasTypes = [
    "TextureTransform",
];

function coercePointType(typeText: string) {
    return typeText === "PIXI.Point" || typeText === "PIXI.ObservablePoint" ?
        `${typeText} | number[] | number | string` :
        typeText;
}

function typeNameText(typeName: ts.EntityName): string {
    if (typeName.kind === ts.SyntaxKind.QualifiedName) {
        return `${typeNameText((<ts.QualifiedName> typeName).left)}.${(<ts.QualifiedName> typeName).right.text}`;
    } else {
        return (<ts.Identifier> typeName).text;
    }
}

function getTypeText(type: ts.TypeNode): string {
    switch (type.kind) {
        case ts.SyntaxKind.TypeReference:
            const text = typeNameText((<ts.TypeReferenceNode> type).typeName);
            if (/^PIXI\./.test(text) || nativeTypes.indexOf(text) !== -1) {
                return coercePointType(text);
            } else if (extrasTypes.indexOf(text) !== -1) {
                return coercePointType(`PIXI.extras.${text}`);
            } else {
                return coercePointType(`PIXI.${text}`);
            }
        case ts.SyntaxKind.ObjectKeyword: return "object";
        case ts.SyntaxKind.StringKeyword: return "string";
        case ts.SyntaxKind.NumberKeyword: return "number";
        case ts.SyntaxKind.BooleanKeyword: return "boolean";
        case ts.SyntaxKind.SymbolKeyword: return "symbol";
        case ts.SyntaxKind.UndefinedKeyword: return "undefined";
        case ts.SyntaxKind.AnyKeyword: return "any";
        case ts.SyntaxKind.NullKeyword: return "null";
        case ts.SyntaxKind.ArrayType: return getTypeText((<ts.ArrayTypeNode> type).elementType) + "[]";
        case ts.SyntaxKind.UnionType: return (<ts.UnionTypeNode> type).types.map(type => getTypeText(type)).join(" | ");
        case ts.SyntaxKind.TypeLiteral:
            const properties = getProperties(type, true);
            return "{" + Object.keys(properties).map(name => `${name}: ${properties[name]};`).join(" ") + "}";
        default: console.log(type); return "UNKNOWN";
    }
}

function getProperties(node: ts.Node, flag = false) {
    const properties = {};
    ts.forEachChild(node, (member) => {
        if (member.kind === ts.SyntaxKind.PropertyDeclaration || member.kind === ts.SyntaxKind.PropertySignature) {
            const questionToken = (<ts.PropertyDeclaration> member).questionToken;
            const modifilers = (<ts.PropertyDeclaration> member).modifiers;
            const hiddenModifierKinds = [
                ts.SyntaxKind.ProtectedKeyword,
                ts.SyntaxKind.PrivateKeyword,
                ts.SyntaxKind.ReadonlyKeyword,
            ];
            if (modifilers && modifilers.find(modifier => hiddenModifierKinds.indexOf(modifier.kind) !== -1)) {
                return;
            }
            const nameText = (<ts.Identifier> (<ts.PropertyDeclaration> member).name).text;
            const typeText = getTypeText((<ts.PropertyDeclaration> member).type);
            properties[nameText + (questionToken ? "?" : "")] = typeText;
        }
    });
    return properties;
}

function classToPropsType(node: ts.Node) {
    const classText = (<ts.ClassDeclaration>node).name.text;
    let extendsText: string;
    const heritageClauses = (<ts.ClassDeclaration>node).heritageClauses;
    if (heritageClauses) {
        extendsText = (<ts.Identifier> heritageClauses[0].types[0].expression).text;
    }
    const properties = getProperties(node);
    let str = `  interface ${classText}PropsType ${extendsText ? `extends ${extendsText}PropsType ` : ""}{\n`;
    const reservedProperties = targetClasses[classText];
    for (const name of Object.keys(reservedProperties)) {
        str += `    ${name}: ${reservedProperties[name]};\n`;
    }
    for (const name of Object.keys(properties)) {
        const requiredType = reservedProperties[name];
        if (!reservedProperties[name] && !reservedProperties[`${name}?`] && !reservedProperties[name.replace(/\?$/, "")]) {
            str += `    ${name}?: ${properties[name]};\n`;
        }
    }
    str += "  }\n"
    return str;
}

let propTypes = "";

ts.forEachChild(pixiDeclaration, (topLevelNode) => {
    if (topLevelNode.kind === ts.SyntaxKind.ModuleDeclaration && (<ts.NamespaceDeclaration>topLevelNode).name.text === "PIXI") {
        ts.forEachChild((<ts.NamespaceDeclaration>topLevelNode).body, (node) => {
            if (
                node.kind === ts.SyntaxKind.ClassDeclaration &&
                targetClasses[(<ts.ClassDeclaration>node).name.text]
            ) {
                propTypes += classToPropsType(node);
            } else if (node.kind === ts.SyntaxKind.ModuleDeclaration) {
                ts.forEachChild((<ts.NamespaceDeclaration> node).body, (extraNode) => {
                    if (
                        extraNode.kind === ts.SyntaxKind.ClassDeclaration &&
                        targetClasses[(<ts.ClassDeclaration>extraNode).name.text]
                    ) {
                        propTypes += classToPropsType(extraNode);
                    }
                });
            }
        });
    }
});

const template = <string> fs.readFileSync(reactPixiDeclarationFileTemplate, "utf-8");
const declarationStr = template.replace("  /* GENERATE */", propTypes);
fs.writeFileSync(reactPixiDeclarationFile, declarationStr);
