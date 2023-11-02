// Make it easy to grab the latest image from the Downloads folder and copy it
// to the current directory. Especially useful for taking screenshots and adding
// them to a blog entry.

// This is intended to be to be run from the directory of an individual post
// where you want the image to be placed.

import { extname, join, resolve } from 'https://deno.land/std/path/mod.ts';

const IMAGE_FILE_TYPES = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

const downloadsDir = resolve(Deno.env.get('HOME') || '', 'Downloads');

function isPostDirectory(cwd: string): boolean {
	const pattern = /src\/content\/posts\/[^\/]+\/?$/;
	return pattern.test(cwd);
}

async function findMostRecentPostDir(postsDir: string): Promise<string | null> {
	let mostRecentDir: { path: string; mtime: Date | null } | null = null;

	for await (const entry of Deno.readDir(postsDir)) {
		if (entry.isDirectory) {
			const dirPath = join(postsDir, entry.name);
			const dirInfo = await Deno.stat(dirPath);
			if (
				!mostRecentDir ||
				(dirInfo.mtime &&
					(!mostRecentDir.mtime || dirInfo.mtime > mostRecentDir.mtime))
			) {
				mostRecentDir = { path: dirPath, mtime: dirInfo.mtime };
			}
		}
	}

	return mostRecentDir?.path || null;
}

async function findLatestImage(dir: string): Promise<string | null> {
	let latestFile: { path: string; mtime?: Date | null } | null = null;

	for await (const dirEntry of Deno.readDir(dir)) {
		if (
			dirEntry.isFile &&
			IMAGE_FILE_TYPES.includes(
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
		`Delete original file? ${filePath}? (y/N)`,
		'N',
	);
	return answer ? ['yes', 'y'].includes(answer.toLowerCase()) : false;
}

function joinWithConjunction(list: string[], conjunction = 'and') {
	const first = list.slice(0, -1);
	const last = list.slice(-1);
	return first.join(', ') + (first.length > 0 ? `, ${conjunction} ` : '') +
		last;
}

async function main() {
	const latestImagePath = await findLatestImage(downloadsDir);

	if (latestImagePath) {
		const cwd = Deno.cwd();
		const postsDir = join(cwd, 'src/content/posts');
		const defaultFileName = latestImagePath.split('/').pop() || '';
		const newFileName = await promptForNewName(defaultFileName);

		let destination = '';
		if (!isPostDirectory(cwd)) {
			const recentPostDir = await findMostRecentPostDir(postsDir);
			if (recentPostDir) {
				const useRecentPostDir = await prompt(
					`Put in "${recentPostDir.split('/').at(-1)}"? (y/N)`,
					'N',
				);
				if (
					useRecentPostDir &&
					['yes', 'y'].includes(useRecentPostDir.toLowerCase())
				) {
					// Set the destination to the most recent post directory
					destination = resolve(recentPostDir, newFileName);
				}
			}
		} else {
			destination = resolve(
				Deno.env.get('INIT_CWD') || Deno.cwd(),
				newFileName,
			);
		}

		await Deno.copyFile(latestImagePath, destination);
		console.log(`Copied ${latestImagePath} to ${destination}`);

		if (await promptToDeleteOriginal(latestImagePath)) {
			await Deno.remove(latestImagePath);
			console.log(`Deleted the original file at ${latestImagePath}`);
		}
	} else {
		console.log(
			`No recent ${
				joinWithConjunction(IMAGE_FILE_TYPES, 'or')
			} found in the Downloads directory.`,
		);
	}
}

main();
