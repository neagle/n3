import fetch from 'node-fetch'
import slugify from 'slugify'

export const handler = async (event, context) => {
	const accessToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN
	console.log('accessToken', accessToken)
	const body = JSON.parse(event.body)
	const { name, email, text, postSlug } = body

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
	console.log('query', query)

	const queryResponse = await fetch('https://api.github.com/graphql', {
		method: 'POST',
		body: JSON.stringify({ query }),
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	})
		.then((res) => res.json())
		.catch((err) => console.log('err', err))

	console.log('response!', queryResponse)
	const oid =
		queryResponse.data.repository.defaultBranchRef.target.history.nodes[0].oid

	const newComment = `---
name: ${name}
email: ${email}
---
${text}
`
	const commentPath = `src/content/posts/${postSlug}/comments/${+new Date()}-${slugify(
		name,
		{
			lower: true,
			strict: true,
		}
	)}.md`
	console.log('commentPath', commentPath)

	const variables = `
	{
		"input": {
			"branch": {
				"repositoryNameWithOwner": "neagle/n3",
				"branchName": "main"
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

	console.log('mutationResponse', mutationResponse)

	return {
		statusCode: 200,
		body: JSON.stringify({ message: oid }),
	}
}
