import fetch from 'node-fetch'

export const handler = async (event, context) => {
	console.log('HANDLE')
	const accessToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN
	console.log('accessToken', accessToken)

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

	const variables = `
	{
		"input": {
			"branch": {
				"repositoryNameWithOwner": "neagle/n3",
				"branchName": "main"
			},
			"message": {
				"headline": "Hello from GraphQL!"
			},
			"fileChanges": {
				"additions": [
					{
						"path": "myfile.txt",
						"contents": "SGVsbG8gZnJvbSBKQVZBIGFuZCBHcmFwaFFM"
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
