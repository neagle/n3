import slugify from '@sindresorhus/slugify';
import dayjs from 'dayjs';
import fetch from 'node-fetch';
import { Handler, HandlerEvent } from '@netlify/functions';

const DEBUG = false;

const API_URL = 'https://api.github.com';
const REPO_URL = '/repos/neagle/n3';

function log(...args: any[]) {
	if (DEBUG) {
		console.log(...args);
	}
}

async function getLatestCommitSHA(headers: Record<string, string>) {
	const response = await fetch(`${API_URL}${REPO_URL}/git/refs/heads/main`, {
		method: 'GET',
		headers,
	});
	const data = await response.json();
	log('getLatestCommitSHA', data);
	return data.object.sha;
}

async function createNewBranch(
	headers: Record<string, string>,
	headSha: string,
	newBranchName: string,
) {
	const response = await fetch(`${API_URL}${REPO_URL}/git/refs`, {
		method: 'POST',
		headers,
		body: JSON.stringify({
			ref: `refs/heads/${newBranchName}`,
			sha: headSha,
		}),
	});
	const data = await response.json();
	log('createNewBranch', data);
	return data;
}

async function createNewComment(
	headers: Record<string, string>,
	name: string,
	email: string,
	text: string,
	postSlug: string,
	newBranchName: string,
) {
	// Construct a valid filename for the new comment
	const slugifiedCommenterName = slugify(name, {
		lowercase: true,
	});
	const commentSlug = `${+new Date()}-${slugifiedCommenterName}`;
	const commentPath =
		`src/content/posts/${postSlug}/comments/${commentSlug}.md`;

	// Construct the new comment
	const newComment = [
		'---',
		`name: ${name}`,
		`email: ${email}`,
		`date: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
		'---',
		text,
	].join('\n');

	// Create new comment file
	const response = await fetch(
		`${API_URL}${REPO_URL}/contents/${commentPath}`,
		{
			method: 'PUT',
			headers,
			body: JSON.stringify({
				message: `Add new comment from ${name}`,
				branch: newBranchName,
				content: Buffer.from(newComment).toString('base64'),
			}),
		},
	);

	const data = await response.json();
	log('createNewComment', data);
	return { data, newComment };
}

async function createPullRequest(
	headers: Record<string, string>,
	name: string,
	newBranchName: string,
	newComment: string,
	postTitle: string,
	postSlug: string,
) {
	const response = await fetch(
		`${API_URL}/repos/neagle/n3/pulls`,
		{
			method: 'POST',
			headers,
			body: JSON.stringify({
				title: `Add new comment on "${postTitle}" from ${name}`,
				body:
					`${name} wants to add a new comment on [${postTitle}](https://nateeagle.com/posts/${postSlug}).\n\n\`\`\`\n${newComment}\n\`\`\``,
				head: newBranchName,
				base: 'main',
			}),
		},
	);

	return await response.json();
}

export const handler: Handler = async (event: HandlerEvent) => {
	const accessToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
	const body = JSON.parse(event.body);
	const { name, email, text, website, postTitle, postSlug } = body;

	// Use a honey trap to prevent spam
	if (website) {
		return {
			statusCode: 422,
			body: JSON.stringify({ message: 'No website links allowed' }),
		};
	}

	if (!postSlug) {
		return {
			statusCode: 422,
			body: JSON.stringify({ message: 'Missing postSlug' }),
		};
	}

	try {
		const headers = {
			Authorization: `Bearer ${accessToken}`,
		};

		// Get the SHA of the latest commit
		const headSha = await getLatestCommitSHA(headers);

		// Create a new branch for the comment
		const newBranchName = `new-comment-${+new Date()}`;
		await createNewBranch(
			headers,
			headSha,
			newBranchName,
		);

		const { newComment } = await createNewComment(
			headers,
			name,
			email,
			text,
			postSlug,
			newBranchName,
		);

		const newPullRequest = await createPullRequest(
			headers,
			name,
			newBranchName,
			newComment,
			postTitle,
			postSlug,
		);

		const pullRequestUrl = newPullRequest?.html_url || '';

		return {
			statusCode: 200,
			body: JSON.stringify({
				message: `Comment added!`,
				pullRequestUrl,
			}),
		};
	} catch (err) {
		return {
			statusCode: 500,
			body: JSON.stringify({ message: `Error adding comment: ${err}` }),
		};
	}
};
