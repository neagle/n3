// Make it easy to grab the latest image from the Downloads folder and copy it
// to the current directory. Especially useful for taking screenshots and adding
// them to a blog entry.

// This is intended to be to be run from the directory of an individual post
// where you want the image to be placed.

import { extname, resolve } from 'https://deno.land/std/path/mod.ts';

const downloadsDir = resolve(Deno.env.get('HOME') || '', 'Downloads');

async function findLatestImage(dir: string): Promise<string | null> {
	let latestFile: { path: string; mtime?: Date | null } | null = null;

	for await (const dirEntry of Deno.readDir(dir)) {
		if (
			dirEntry.isFile &&
			['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(
				extname(dirEntry.name).toLowerCase(),
			)
		) {
			const filePath = resolve(dir, dirEntry.name);
			const fileInfo = await Deno.stat(filePath);
			if (
				!latestFile ||
				(fileInfo.mtime &&
					(!latestFile.mtime || fileInfo.mtime > latestFile.mtime))
			) {
				latestFile = {
					path: filePath,
					mtime: fileInfo.mtime,
				};
			}
		}
	}

	return latestFile?.path || null;
}

async function promptForNewName(defaultName: string): Promise<string> {
	const extension = defaultName.split('.').pop() || '';
	const baseName = defaultName.slice(0, -extension.length - 1); // remove the extension and the dot
	const newNameInput = await prompt(
		`New image name (${baseName})":`,
	);

	// If the user provides a new name, use it; otherwise, use the default base name.
	const newNameBase = newNameInput ? newNameInput.trim() : baseName;

	// Return the full name by appending the original extension.
	return `${newNameBase}.${extension}`;
}

async function promptToDeleteOriginal(filePath: string): Promise<boolean> {
	const answer = await prompt(
		`Would you like to delete the original file at ${filePath}? (y/N)`,
		'N',
	);
	return answer ? ['yes', 'y'].includes(answer.toLowerCase()) : false;
}

async function main() {
	const latestImagePath = await findLatestImage(downloadsDir);

	if (latestImagePath) {
		const defaultFileName = latestImagePath.split('/').pop() || '';
		const newFileName = await promptForNewName(defaultFileName);
		const destination = resolve(
			Deno.env.get('INIT_CWD') || Deno.cwd(),
			newFileName,
		);

		await Deno.copyFile(latestImagePath, destination);
		console.log(`Copied ${latestImagePath} to ${destination}`);

		if (await promptToDeleteOriginal(latestImagePath)) {
			await Deno.remove(latestImagePath);
			console.log(`Deleted the original file at ${latestImagePath}`);
		}
	} else {
		console.log('No recent PNG, JPG, or GIF found in the Downloads directory.');
	}
}

main();
