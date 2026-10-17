const API_URL = ''
const API_KEY = ''
const DISCORD_WEBHOOK = ''

const repos = [
	'void-presence',
	'void-web',
	'void-installer',
	'void-updates',
	'void-webhooks',
	'void-bot',
]

for (const repo of repos) {
	const res = await fetch(`${API_URL}/subscriptions`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': API_KEY,
		},
		body: JSON.stringify({
			githubOwner: 'Devollox',
			githubRepo: repo,
			events: ['push'],
			discordWebhookUrl: DISCORD_WEBHOOK,
		}),
	})

	const data = await res.json()
	console.log(`${repo}: ${res.status}`, data)
}
