import fetch from 'node-fetch'
import slugify from 'slugify'
import dayjs from 'dayjs'

export const handler = async (event, context) => {
	const accessToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN
	// console.log('accessToken', accessToken)
	// console.log('event', event)
	const body = JSON.parse(event.body)
	// console.log('body', body)
	const { name, email, text, website, postSlug } = body

	if (website) {
		return {
			statusCode: 422,
			body: JSON.stringify({ message: 'No website links allowed' }),
		}
	}

	if (!postSlug) {
		return {
			statusCode: 422,
			body: JSON.stringify({ message: 'Missing postSlug' }),
		}
	}

	const query = `
		query getLastCommitOid {
			repository(name: "n3", owner: "neagle") {
				defaultBranchRef {
					target {
						... on Commit {
							history(first: 1) {
								nodes {
									oid
								}
							}
						}
					}
				}
			}
		}
	`

	const queryResponse = await fetch('https://api.github.com/graphql', {
		method: 'POST',
		body: JSON.stringify({ query }),
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	})
		.then((res) => res.json())
		.catch((err) => console.log('err', err))

	// console.log('response!', queryResponse)
	const oid =
		queryResponse.data.repository.defaultBranchRef.target.history.nodes[0].oid

	const newComment = `---
name: ${name}
email: ${email}
date: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}
---
${text}
`
	// return { statusCode: 418 }
	const slugifiedCommenterName = slugify(name, { lower: true, strict: true })
	const commentSlug = `${+new Date()}-${slugifiedCommenterName}`

	const commentPath = `src/content/posts/${postSlug}/comments/${commentSlug}.md`
	// console.log('commentPath', commentPath)

	const variables = `
	{
		"input": {
			"branch": {
				"repositoryNameWithOwner": "neagle/n3",
				"branchName": "main"
				// "branchName": "new-comment-${commentSlug}"
			},
			"message": {
				"headline": "Add new comment from ${name}"
			},
			"fileChanges": {
				"additions": [
					{
						"path": "${commentPath}",
						"contents": "${Buffer.from(newComment).toString('base64')}"
					}
				]
			},
			"expectedHeadOid": "${oid}"
		}
	}
	`

	const mutation = `
	mutation createFile($input: CreateCommitOnBranchInput!) {
		createCommitOnBranch(input: $input) {
			commit {
				url
			}
		}
	}
	`

	const mutationResponse = await fetch('https://api.github.com/graphql', {
		method: 'POST',
		body: JSON.stringify({ query: mutation, variables }),
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	})
		.then((res) => res.json())
		.catch((err) => console.log('err', err))

	// console.log('mutationResponse', mutationResponse)

	// Create pull request

	return {
		statusCode: 200,
		body: JSON.stringify({
			message: mutationResponse.data ? 'Comment added' : 'Error adding comment',
		}),
	}
}
