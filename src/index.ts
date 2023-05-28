import { appendFileSync, readFileSync, writeFileSync } from "fs";
import { parseSync } from "@babel/core";
import traverse, { NodePath } from "@babel/traverse";
import generate_ from "@babel/generator";
import * as t from "@babel/types";
import evaluator from "./evaluator";

const code: string = readFileSync("../out/captcha.js", "utf8");

const ast = parseSync(code);

let sandbox: evaluator = new evaluator();

traverse(ast, {
  ForStatement(path: NodePath<t.ForStatement>) {
    const { body } = path.node;

    if (!t.isTryStatement(body)) return;
    if (body.handler.body.body.length == 0) return;

    const parentPath = path.parentPath;

    if (!t.isBlockStatement(parentPath.node)) {
      return;
    }
    parentPath.traverse({
      VariableDeclaration(path) {
        if (path.node.declarations.length == 0) return;
        const { init } = path.node.declarations[0];
        if (!t.isCallExpression(init)) return;
        if (!t.isIdentifier(init.callee)) return;

        let binding = path.scope.getBinding(init.callee.name).path;

        sandbox.generateCode(binding.node);
        path.stop();
      },
    });

    //function rotating thing
    path.traverse({
      IfStatement(path: NodePath<t.IfStatement>) {
        path.traverse({
          CallExpression(path) {
            const { arguments: args, callee } = path.node;

            if (args.length !== 2) return;
            if (!t.isIdentifier(callee)) return;

            const binding = path.scope.getBinding(callee.name).path;

            if (!t.isFunctionDeclaration(binding.node)) return;

            //binary function check
            if (binding.node.body.body.length == 1) {
              binding.traverse({
                CallExpression(path) {
                  const { arguments: args, callee } = path.node;
                  if (!t.isIdentifier(callee)) return;
                  const binding = path.scope.getBinding(callee.name).path;
                  sandbox.generateCode(binding.node);
                },
              });
            }
            // sandbox.generateCode(binding.node);
            path.stop();
          },
        });
      },
    });

    sandbox.generateCode(path.parentPath.node);
  },
});
sandbox.execute();

traverse(ast, {
  CallExpression(path) {
    const { callee, arguments: args } = path.node;

    if (
      t.isIdentifier(callee) &&
      args.length == 2 &&
      (t.isUnaryExpression(args[0]) || t.isNumericLiteral(args[0])) &&
      (t.isUnaryExpression(args[1]) || t.isNumericLiteral(args[1]))
    ) {
      const binding = path.scope.getBinding(callee.name);
      if (!binding) return; // built-in functions
      const funcPath = binding.path;

      if (!t.isFunctionDeclaration(funcPath.node)) return;

      // if (funcPath.node.body.body.length !== 2) {
      //   console.log("left out a function ", funcPath.node.id.name);
      //   // debugger;
      //   return;
      // }

      if (
        !t.isIdentifier(funcPath.node.params[0]) ||
        !t.isIdentifier(funcPath.node.params[1])
      )
        return;
      const offsets: number[] = args.map((arg: t.Expression) => {
        if (t.isUnaryExpression(arg) && arg.operator === "-") {
          return -(arg.argument as t.NumericLiteral).value;
        }
        if (t.isNumericLiteral(arg)) {
          return (arg as t.NumericLiteral).value;
        }
        throw new Error("offset must be a number");
      });

      const argMap = new Map();
      argMap.set(funcPath.node.params[0].name, offsets[0]);
      argMap.set(funcPath.node.params[1].name, offsets[1]);

      let newCallee: string, returnArgs;
      if (funcPath.node.body.body.length == 2) {
        newCallee = funcPath.node.id.name;
        returnArgs = offsets;
      } else {
        [newCallee, returnArgs] = recursive(funcPath, argMap);
      }

      const output = sandbox.evalCode(`${newCallee}(${returnArgs.join(",")})`);

      path.replaceWith(t.stringLiteral(output));

      // evalCode(funcPath);
    }
  },
});

function recursive(funcPath, argMap) {
  let callee, returnArgs;

  funcPath.traverse({
    CallExpression(path) {
      callee = path.node.callee.name;
      returnArgs = path.node.arguments.map((arg) => {
        if (t.isIdentifier(arg)) {
          return argMap.get(arg.name);
        }

        if (t.isBinaryExpression(arg)) {
          let rightValue;
          if (t.isUnaryExpression(arg.right)) {
            rightValue = -(arg.right.argument as t.NumericLiteral).value;
          } else {
            rightValue = (arg.right as t.NumericLiteral).value;
          }
          return argMap.get((arg.left as t.Identifier).name) - rightValue;
        }
      });

      const binding = path.scope.getBinding(callee);
      if (binding == undefined) {
        debugger;
      }
      const function2 = binding.path;
      if (function2.node.body.body.length == 2) {
      }
      if (function2.node.body.body.length == 1) {
        // update argMap with the new values
        argMap.set(function2.node.params[0].name, returnArgs[0]);
        argMap.set(function2.node.params[1].name, returnArgs[1]);
        const [callee2, returnArgs2] = recursive(function2, argMap);
        callee = callee2;
        returnArgs = returnArgs2;
      }
    },
  });

  return [callee, returnArgs];
}

// //this is doing xor and base64 decode
traverse(ast, {
  CallExpression(path) {
    const { callee, arguments: args } = path.node;
    if (
      args.length > 1 ||
      !t.isStringLiteral(args[0]) ||
      !t.isIdentifier(callee) ||
      args[0].value == ""
    )
      return;
    const binding = path.scope.getBinding(callee.name);

    if (args[0].value == "FhQFWCA9ARULAVsx") {
      debugger;
    }

    if (!binding) return; // built-in functions

    path.replaceWith(t.stringLiteral(decode(args[0].value)));
  },
});

// //Remove unused functions
// traverse(ast, {
//   FunctionDeclaration(path: NodePath<t.FunctionDeclaration>) {
//     const { node, scope } = path;
//     const { constant, referenced } = scope.getBinding(node.id.name);
//     // If the variable is constant and never referenced, remove it.
//     if (constant && !referenced) {
//       path.remove();
//     }
//   },
// });

function decode(str) {
  let cache = {};
  let cached = cache[str];
  if (cached) return cached;
  let decoded = "";
  // Convert the string from base64 to ascii
  let converted = atob(str);
  // For each character in the string, XOR it with a character from "pfd5Exm"
  for (let i = 0; i < converted.length; ++i) {
    let xor = "pfd5Exm".charCodeAt(i % 7);
    decoded += String.fromCharCode(xor ^ converted.charCodeAt(i));
  }
  cache[str] = decoded;
  return decoded;
}
function atob(str) {
  return Buffer.from(str, "base64").toString("ascii");
}
writeFileSync("../out/out.js", generate_(ast).code);
