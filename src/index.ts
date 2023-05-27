import { appendFileSync, readFileSync, writeFileSync } from "fs";

import { VM } from "vm2";

import { parseSync } from "@babel/core";
import traverse_, { NodePath } from "@babel/traverse";
import generate_ from "@babel/generator";
import * as t from "@babel/types";

const code: string = readFileSync("../out/captcha.js", "utf8");

const ast = parseSync(code);

let arrayFunctionVisted: string[] = [];

let codeToEval: string = "";

traverse_(ast, {
  ForStatement(path: NodePath<t.ForStatement>) {
    const { body } = path.node;

    if (!t.isTryStatement(body)) return;

    //convert to code and print out
    if (!path.node.init) {
      //set it to code above
      const variable = path.getPrevSibling().node;

      const code = generate_(variable).code;

      codeToEval += code + "\n\n";
    }
    const code = generate_(path.node).code;
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

function evalCode(funcPath: NodePath) {
  const code = generate_(funcPath.node).code;

  let calleeName;
  funcPath.traverse({
    CallExpression(path) {
      const { callee } = path.node;
      if (!t.isIdentifier(callee)) return;
      calleeName = callee.name;
      path.stop();
    },
  });

  const arrayFunction = funcPath.scope.getBinding(calleeName);
  const arrayFuncCode = generate_(arrayFunction.path.node).code;

  const findParentFunctionExpression: (path: NodePath) => NodePath = (path) => {
    if (path.isUnaryExpression()) {
      return path;
    }
    if (
      path &&
      (!path.isFunctionExpression() || !path.isFunctionDeclaration())
    ) {
      return findParentFunctionExpression(path.parentPath);
    }
    return path;
  };

  const unaryExpression = findParentFunctionExpression(
    funcPath.scope.getBinding(calleeName).referencePaths[1]
  );

  const unaryExpressionCode = generate_(unaryExpression.node).code;

  if (!arrayFunctionVisted.includes(calleeName)) {
    appendFileSync("../out/evalCode.js", unaryExpressionCode + "\n\n");
  }
  arrayFunctionVisted.push(calleeName);
  //there is also a function that is modifying arrayFuncCode get the functionexpress which references calleeName

  // console.log(arrayFuncCode);
}

traverse_(ast, {
  //function expression or function declaration or unary expression
  FunctionExpression(path) {
    //
  },
  FunctionDeclaration(path) {},
  UnaryExpression(path) {},
});
