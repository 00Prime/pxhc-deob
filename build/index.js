"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const core_1 = require("@babel/core");
const traverse_1 = __importDefault(require("@babel/traverse"));
const generator_1 = __importDefault(require("@babel/generator"));
const t = __importStar(require("@babel/types"));
const code = (0, fs_1.readFileSync)("../out/captcha.js", "utf8");
const ast = (0, core_1.parseSync)(code);
let arrayFunctionVisted = [];
let codeToEval = "";
(0, traverse_1.default)(ast, {
    ForStatement(path) {
        const { body } = path.node;
        if (!t.isTryStatement(body))
            return;
        //convert to code and print out
        if (!path.node.init) {
            //set it to code above
            const variable = path.getPrevSibling().node;
            const code = (0, generator_1.default)(variable).code;
            codeToEval += code + "\n\n";
        }
        const code = (0, generator_1.default)(path.node).code;
        codeToEval += code + "\n\n";
    },
});
console.log(codeToEval);
// traverse_(ast, {
//   CallExpression(path) {
//     const {
//       callee,
//       arguments: args,
//     } = path.node;
//     if (t.isIdentifier(callee) && args.length == 2 && (t.isUnaryExpression(args[0]) || t.isNumericLiteral(args[0])) && (t.isUnaryExpression(args[1]) || t.isNumericLiteral(args[1]))) {
//       const binding = path.scope.getBinding(callee.name);
//       if (!binding) return; // built-in functions
//       const funcPath = binding.path;
//       if (!t.isFunctionDeclaration(funcPath.node)) return;
//       if (funcPath.node.body.body.length !== 2) {
//         // console.log('left out a function ', funcPath.node.id.name);
//         // debugger;
//         return;
//       }
//       const offsets: number[] = args.map((arg: t.Expression) => {
//         if (t.isUnaryExpression(arg) && arg.operator === '-') {
//           return -(arg.argument as t.NumericLiteral).value;
//         }
//         if (t.isNumericLiteral(arg)) {
//           return (arg as t.NumericLiteral).value;
//         }
//         throw new Error('offset must be a number');
//       });
//       evalCode(funcPath);
//     }
//   }
// });
function evalCode(funcPath) {
    const code = (0, generator_1.default)(funcPath.node).code;
    let calleeName;
    funcPath.traverse({
        CallExpression(path) {
            const { callee } = path.node;
            if (!t.isIdentifier(callee))
                return;
            calleeName = callee.name;
            path.stop();
        },
    });
    const arrayFunction = funcPath.scope.getBinding(calleeName);
    const arrayFuncCode = (0, generator_1.default)(arrayFunction.path.node).code;
    const findParentFunctionExpression = (path) => {
        if (path.isUnaryExpression()) {
            return path;
        }
        if (path &&
            (!path.isFunctionExpression() || !path.isFunctionDeclaration())) {
            return findParentFunctionExpression(path.parentPath);
        }
        return path;
    };
    const unaryExpression = findParentFunctionExpression(funcPath.scope.getBinding(calleeName).referencePaths[1]);
    const unaryExpressionCode = (0, generator_1.default)(unaryExpression.node).code;
    if (!arrayFunctionVisted.includes(calleeName)) {
        (0, fs_1.appendFileSync)("../out/evalCode.js", unaryExpressionCode + "\n\n");
    }
    arrayFunctionVisted.push(calleeName);
    //there is also a function that is modifying arrayFuncCode get the functionexpress which references calleeName
    // console.log(arrayFuncCode);
}
(0, traverse_1.default)(ast, {
    //function expression or function declaration or unary expression
    FunctionExpression(path) {
        //
    },
    FunctionDeclaration(path) { },
    UnaryExpression(path) { },
});
//# sourceMappingURL=index.js.map