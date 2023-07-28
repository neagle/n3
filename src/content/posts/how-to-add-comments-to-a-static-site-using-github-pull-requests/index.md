---
title: How to add comments to a static site using GitHub Pull Requests
description: Adding comments to a statically generated site presents unique challenges.
date: 2023-07-28 13:17:39
tags:
- serverless
---
There are a lot of advantages to building a website statically, which means compiling it once and serving up the results to the visitors, rather than generating a site _dynamically_, which means programmatically generating the contents of a site in response to individual requests. For content that doesn't change, there's obvious efficiency: build once, serve many times. From your server's perspective, it gets to serve up a site like it's 1995: all files! And with the CDNs and edge locations that are part of the modern infrastructure of the web, visitors can receive that static content incredibly quickly from a location near them no matter where they are on the globe.

As a developer, static sites are appealing for even more reasons: writing and manipulating content just involves working with files, which I can pull open in the IDE I use for my regular coding work. They can also be relatively evergreen: as the tech world puts out new CMSes and new frameworks at a pretty rapid clip, building a site from a collection of files can work the same way for years and years. [This website is statically generated](https://github.com/neagle/n3), via custom JavaScript code so that I only need to update it in response to changes in my own needs, but I use almost the same system for organizing source files that I first picked up from [Jekyll](), a ruby-powered static site generator that was the first tool of its kind I used.

There are a ton of great static site generators out there. [Gatsby](https://www.gatsbyjs.com/) is probably the most high-octane, and it's great for a production site (especially since its acquisition by Netlify), as it has had a ton of development put into its power features. (One of my favorite Gatsby evangelists is [Queen Raae](https://queen.raae.codes/).) But if you're working on a site for yourself, why not give writing your own a try? You'll probably learn some things, and you'll have the pleasure of having something that works _exactly the way you like it_.

## What happens when you want comments on your static site?

The first place statically generated sites run into trouble is with user interactions. If you want your site to collect user data (like emails) or allow interactive features (like commenting), you have an interesting problem to solve.

For forms, a straightforward answer is to use some kind of a compute service to receive data and perform an action in response to it, whether it's emailing you (like with a contact form) or saving data in a database. These days, there are a lot of services for that like [Netlify Forms](https://www.netlify.com/products/forms/) or Vercel's [Formspree](https://vercel.com/integrations/formspree).

It would be possible to treat comments in a similar fashion:

1. Have the user submit comments to an endpoint and get saved to a db
2. Trigger a rebuild of the site (or of the specific page)
3. Have the site's build script hit an endpoint to get any relevant comments from the db at build time

There's nothing wrong with this approach, but for my personal site it was a bit unappealing. As soon as you add a database to your site's tech stack, you've moved away from the earlier file-based simplicity of a statically generated site. Now you're tied to a specific service with data that has to have its durability separately managed and, if necessary, migrated. The site is no longer fully self-contained within its git repository.

I wanted a solution where comments would live along with entries themselves as files.

This is how I thought about what I needed to do:

1. Have the user submit comments to an endpoint
2. Have that endpoint create a file with the comment in my repo
3. Trigger a rebuild of the site
4. Update my site's build script to read files in a comment folder, if it exists, for every entry

## Building an Endpoint to Receive Comment Submissions

In order to have users submit their comments, we need a permanent URL (an endpoint) and a server that can react to what it receives. It's a perfect use for functions as a service (FaaS), where we let someone else manage the server and the runtime and pay for the compute time we actually use. For a personal site, a use like this will almost certainly fall well within whatever their free tier's limit happens to be. AWS Lambda, for instance, allows one _million_ free requests per month. (And 3.2 million seconds of compute time, though requests are usually more relevant for situations like this.) AWS Lambda even offers [URLs for functions](https://docs.aws.amazon.com/lambda/latest/dg/lambda-urls.html), so you don't need to mess with API gateways if you don't want to.

But many modern deploy services offer their own packaged versions of functions as a service that come with some niceties. (The cost is usually a lower free tier and a higher cost than you would pay if you used AWS Lambda directly.) Netlify, which I use to deploy this site, offers [Netlify functions](https://www.netlify.com/products/functions/), and the most relevant benefit of using them for me is that you can put the code for those functions in a folder as files in your repo. That means that the compute functions I use for dynamic features of my site sit alongside the files and code that power everything else.

For my personal site, simplicity is tremendously important: I want to have fun maintaining and working with this site and I don't want to spend much time dealing with the kinds of complexities I deal with in my regular job. Netlify functions _do_ come with a [much lower threshold](https://www.netlify.com/products/functions/) for the free tier: 125,000 requests per month and 100 hours of compute time. But it should still easily accomodate the needs of my humble site.

Functions are appealingly simple: they handle a request and return a response. In the middle, you do all the things that make your function special.

## Creating a Serverless Function

Here's a boilerplate for a Netlify function using Typescript:

```typescript
// Import types
import { Handler, HandlerEvent } from '@netlify/functions';

export const handler: Handler = (event: HandlerEvent) => {
	// The event's body is where all the content you're interested in is
	const body = JSON.parse(event.body);

	return {
		statusCode: 200,
		body: JSON.stringify({
			message: 'Heard you loud and clear!',
		}),
	};
};
```

You can put this in a file called `comment.ts` in a folder called `netlify/functions/` off the root of your site. (Note: you can [customize the location of your functions](https://docs.netlify.com/configure-builds/file-based-configuration/#functions) via a `netlify.toml` file.)

Another benefit of using Netlify functions is that they're very easy to test locally using the [Netlify CLI](https://docs.netlify.com/cli/get-started/). Fire up `netlify dev` in your project root, and it should tell you, among other things, which functions it has loaded:

```
Loaded function comment http://localhost:8888/.netlify/functions/comment.
```

Since we're not handling any data coming from a post request yet, you can just pull up that URL in your browser to test it as a GET request. You should get a response like this:

```
// 20230722150049
// http://localhost:8888/.netlify/functions/test

{
  "message": "Heard you loud and clear!"
}
```

This setup makes it really easy to test and debug our code as we figure out how to take the next steps in actually responding to incoming requests.

## Where to Put the Actual Comment Files

Where should you put your actual comment files? This step in the process will depend on your own setup and preferences. For my site, every post has its own folder and an `index.md` with its content. This gets built to an `index.html` file, which makes it possible to have URLs without filenames or extensions in them (`nateeagle.com/posts/my-hypothetical-post/`). For comments, I decided to add a `comments` folder in the particular post folder, and have every comment have a filename constructed of epoch time (`+new Date()`), which both gives us filenames that are easy to sort by date and ensures uniqueness, plus the slugified name of the commenter. (Slugification ensures that whatever the person put in the Name field for their comment, the filename receives only characters that are valid for a filename.)

How you parse those files and turn them into data that can be acted upon in your post template will be unique to your static site generator.

## Creating a Comment File via GitHub's REST API

To create the comment file using our serverless function, we will use the [GitHub REST API](https://docs.github.com/en/rest) to perform some tasks that are similar to how we'd add a file ourselves.

1. Create a new branch.
2. Get the data we want from the comment form submission (commenter name, email, content) and use it to create a comment file for the post in question.
3. Commit that file.
4. Create a pull request for the new branch.

I recommend getting this workflow working completely independently of your serverless function at the start. Debugging multiple, interleaved concerns can be frustrating and time-consuming: when you have the ability to manipulate and examine something independently, it's easy to understand and to fix issues that come up. [Postman](https://www.postman.com/) has been my go-to tool for a long time for working with APIs.

The first thing we'll need to interact with the GitHub API is a [personal access token (PAT)](https://docs.netlify.com/configure-builds/environment-variables/), which is essentially a password that lets your code act on your behalf. We'll store the PAT as an environment variable so that it never gets committed as part of our code. Locally, we can store the value in a `.env` file, and then we'll store it in Netlify's environment variables interface for the public build.

GitHub has tucked the [personal access tokens admin](https://docs.netlify.com/configure-builds/environment-variables/) in a slightly hard-to-find location. From anywhere in GitHub, you can click on your profile image -> [Settings](https://github.com/settings/profile) -> [Developer Settings](https://github.com/settings/apps) -> [Personal Access Tokens](https://github.com/settings/tokens).

Here are the actual steps we'll need to follow to use the API to create a comment PR. For all of these calls, you'll need to [send an authorization header](https://docs.github.com/en/rest/overview/authenticating-to-the-rest-api).

1. [Get the SHA of the latest commit from the `main` branch.](https://docs.github.com/en/rest/git/refs)

```
GET https://api.github.com/repos/:owner/:repo/git/refs/heads/main
```

2. [Create a new branch](https://docs.github.com/en/rest/guides/using-the-rest-api-to-interact-with-your-git-database):

```
POST https://api.github.com/repos/:owner/:repo/git/refs
```

```json
body: {
  "ref": "refs/heads/new-branch-name",
  "sha": "the-commit-sha-from-the-previous-call",
}
```

3. [Create a new comment file](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents):

```
PUT https://api.github.com/repos/:owner/:repo/contents/path/to/your/file.txt
```

```json
body: {
  "message": "your commit message",
  "branch": "new-branch-name",
  "content": "base64-encoded-file-content",
}
```

Please note a few things: the path in the API URL determines where your actual file goes, and after `contents` it proceeds from the root of your git repository. Your actual file content needs to be base64 encoded--this is a bit like packing your file in a safe shipping container that ensures nothing in its content can get interfered with (or interfere with anything else!) on its way to its destination.

In our function we can use `Buffer.from(newComment).toString('base64')` to encode our content, but for testing purposes you can use the command line:

```sh
# Outputs: dGVzdCE=
echo -n 'test!' | base64
```

4. [Open a PR](https://docs.github.com/en/rest/pulls/pulls#create-a-pull-request):

```
POST https://api.github.com/repos/:owner/:repo/pulls
```

```json
body: {
  "title": "Pull request title",
  "body": "So-and-so wants to add a comment",
  "head": "new-branch-name",
  "base": "main", // the branch you want to merge the PR into
}
```

Once we get all of these working in Postman or your API-testing tool of choice, we're ready to implement these calls in our serverless function.

## An Aside About SPAM

Any public-facing comment system has to worry about SPAM comments. Creating Pull Requests for comments means that nothing can get published to the site without being manually merged in, but it would be nice to avoid having to manually delete a lot of bot-created PRs, if possible.

I've added a simple honeypot technique that will filter out at least some automated SPAM by adding a hidden field that will cause our comment function to reject the comment if there's any content inside it.

## Implementing a Comment Function

Without further ado, here is my implemented comment function:

```typescript
import slugify from '@sindresorhus/slugify';
import dayjs from 'dayjs@1.11.7';
import fetch from 'node-fetch';
import { Handler, HandlerEvent } from '@netlify/functions';

const DEBUG = false;

const API_URL = 'https://api.github.com';
const REPO_URL = '/repos/neagle/n3';

// This is a convenience method that lets us turn on/off verbose console logging
// with a single argument
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
```

Note that this requires that an environment variable of `GITHUB_PERSONAL_ACCESS_TOKEN` be set.

Also note that any packages you use in your Netlify functions need to be added in a package.json file at the root of your project. For my function, I need to `npm add @sindresorhus/slugify dayjs node-fetch`.

In my actual comment form, there is an input labeled "website" that is hidden via CSS. This will only filter out naïve SPAM bots, but it's a place to start.

## Getting Notifications for New Comments

Now, any time a PR is submitted, I get an email notification via Github's own notification system. If it's important to have more timely notifications, though, it would be very possible to hook in to a service like Slack or Twilio to send yourself a Slack message or even an SMS notification.

## Final Thoughts

For me, this is a particularly satisfying solution for a development blog. It builds on the strengths of a statically generated site in keeping all content organized as files, including the serverless function we use to make commenting possible. Static sites have proven their value over time, and modern services like FaaS are making it easier to add dynamic functionality.

Let me know if you've implemented something similar or chosen a different solution to the same problem. I'd love to see other approaches.
