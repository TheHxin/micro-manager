//NOTE:
// the setting file for vscode is not "setting.json" is it "settings.json" [it is plural]

const vscode = require('vscode');
//const { exec } = require("child_process");

/**
 * @param {vscode.ExtensionContext} context
 */
let rootPath;
let extentionPath;

async function getRootPath() { //if there are more than one workspace it will ask the user to pick one of them
	let workspaces = vscode.workspace.workspaceFolders?.map(folder => folder.uri);
	if (workspaces.length > 1) { // note that in if statment anything morethan 0 is a 1 so no need to say > 1
		let workspace = (await vscode.window.showWorkspaceFolderPick()).uri
		return workspace
	}

	return workspaces[0]
}

async function initProject() {

	//vscode.window.showInformationMessage("python3 -m venv " + rootPath + "/.venv");
	//exec("python3 -m venv " + rootPath + "/.venv", () => {vscode.window.showInformationMessage("Python venv created")});

	const CreatePythonEnvTask = new vscode.Task(
		{ type: 'shell' }, // TaskDefinition
		vscode.TaskScope.Workspace,
		'python venv',            // Label shown in UI
		'micropython-manager',     // "Source" of the task -> a label to help user understand where the task is comming from
		new vscode.ShellExecution('python3 -m venv .venv && source .venv/bin/activate && pip install pyserial mpremote micropython-stm32-stubs', {
			cwd: rootPath.path // passing the working directory where the shell command must be ran
		}),
		[] // problemMatchers if any
	);

	vscode.tasks.executeTask(CreatePythonEnvTask).then(() => {
		vscode.commands.executeCommand("python.setInterpreter");
	});
}

async function test() {

	console.log(vscode.workspace.getConfiguration("python"));

	vscode.workspace.getConfiguration("python").update(
		"venvPath",
		vscode.Uri.joinPath(rootPath, ".venv"),
		vscode.ConfigurationTarget.workspace
	);

	vscode.window.createTerminal().show();

	vscode.window.showInformationMessage(
		vscode.Uri.joinPath(rootPath, ".venv")
	);

	await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(rootPath, ".vscode"));

	const vscode_setting = Buffer.from(
		`{
	"python.languageServer": "Pylance",
	"python.analysis.typeCheckingMode": "basic",
	"python.analysis.diagnosticSeverityOverrides": {
		"reportMissingModuleSource": "none"
	},
	
	"python.analysis.typeshedPaths": [
		".venv/Lib/site-packages",
		"typings"
	]	
}`);

	await vscode.workspace.fs.writeFile(
		vscode.Uri.joinPath(rootPath, ".vscode", "setting.json"),
		vscode_setting
	);
}

async function test2() {
	vscode.window.showInformationMessage(extentionPath);

	await vscode.workspace.fs.copy(
		vscode.Uri.joinPath(extentionPath, "resources", "settings.json"),
		vscode.Uri.joinPath(rootPath, ".vscode", "settings.json")
	)
}
async function activate(context) {
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json

	rootPath = await getRootPath();
	extentionPath = context.extensionUri; //note: the Uri object is not just a string, the string part is the .path 

	console.log(rootPath.path);
	console.log(extentionPath.path);

	const disposable = vscode.commands.registerCommand('micropython-manager.init-project', test2);
	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
