import * as vscode from "vscode";
const fs = require("fs");
const clipboardy = require("clipboardy");

function extractTableField(fileContent: string): string {
  const re = /[\s\S]*colums:([\s\S]*\}\s+\])[\s\S]*/;
  const found = re.exec(fileContent);

  if (!Array.isArray(found) || found.length < 2) {
    return "fail to extract table field";
  }

  const matchStr = found[1];
  // 给属性名加上双引号，不然 parse 的时候会报错
  const formatedStr = matchStr.replace(/\s{2,}(\w+)/g, (match, key) => {
    return `"${key}"`;
  });

  const fieldList = JSON.parse(formatedStr);

  if (Array.isArray(fieldList)) {
    fieldList.forEach(item => {
      item.render = (data: object) => data;
    });
  }

  // parse 默认忽略方法，指定方法直接转成字符串
  let strToWrite = JSON.stringify(fieldList, (key, value) => {
    if (typeof value === "function") {
      return value.toString();
    } else {
      return value;
    }
  });

  // 去掉属性名两边的引号
  strToWrite = strToWrite.replace(/"(\w+)":/g, (match, key) => {
    return `${key}:`;
  });

  // 去掉方法两边的引号
  strToWrite = strToWrite.replace(/"(\([\s\S]*?data)"/g, (match, key) => {
    return key;
  });

  return strToWrite;
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "extension.generateCode",
    param => {
      let currentlyOpenTabfilePath;
      const textEditor = vscode.window.activeTextEditor;

      if (textEditor) {
        currentlyOpenTabfilePath = textEditor.document.fileName;

        fs.readFile(
          currentlyOpenTabfilePath,
          "utf8",
          (err: any, data: string) => {
            if (err) throw err;

            if (!data) {
              vscode.window.showInformationMessage("fail to read file");
              return;
            }

            const strToWrite = extractTableField(data);

            clipboardy.writeSync(strToWrite);

            vscode.window.showInformationMessage(
              "file content has been written to clipboard"
            );
          }
        );
      } else {
        vscode.window.showInformationMessage(
          "pls open the file your code generated from"
        );
      }
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
