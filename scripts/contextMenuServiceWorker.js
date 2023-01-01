const getKey = () => {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get(['openai-key'], (result) => {
			if (result['openai-key']) {
				console.log('found key',);
				const decodedKey = atob(result['openai-key']);
				resolve(decodedKey);
			}
			else {
				console.log('No openai key found',);
			}
		});
	});
};

const sendMessage = (content) => {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		const activeTab = tabs[0].id;

		chrome.tabs.sendMessage(
			activeTab,
			{ message: 'inject', content },
			(response) => {
				if (response.status === 'failed') {
					console.log('injection failed.');
				}
			}
		);
	});
};

const generate = async (prompt) => {
	// Get your API key from storage
	const key = await getKey();
	const url = 'https://api.openai.com/v1/completions';

	// Call completions endpoint
	const completionResponse = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${key}`,
		},
		body: JSON.stringify({
			model: 'text-davinci-003',
			prompt: prompt,
			max_tokens: 3900,
			temperature: 0.7,
		}),
	});

	// Select the top choice and send back
	const completion = await completionResponse.json();
	return completion.choices.pop();
}

const generateCompletionAction = async (info) => {
	try {
		sendMessage('generating...');
		const { selectionText } = info;
		const basePromptPrefix = `
	  Write a comprehensive tutorial in powerpoint slide format on the topic below.It should have more than 40 slides, be segmented into sections, and be targeted at Nigerian small business owners. Include discussion and usage examples of the top 3 management tools and techniques relevant to the topic. Sections should consist of a relevant quote from a famous person (one slide), an explanation of the relevant topic/concept for that section (multiple slides), a FMCG case study, and a suggestion for a practical 10-20 minute activity for students. 
	  Topic: 
	  `;
		const baseCompletion = await generate(`${basePromptPrefix}${selectionText}`);

		// Let's see what we get!
		console.log(baseCompletion.text)
		sendMessage(baseCompletion.text);
	} catch (error) {
		console.log("ERROR IN GENERATE COMPLETION:", error);
	}
};

chrome.runtime.onInstalled.addListener(() => {
	chrome.contextMenus.create({
		id: 'context-run',
		title: 'Generate Presentation Slides',
		contexts: ['selection'],
	});
});

// Add listener
chrome.contextMenus.onClicked.addListener(generateCompletionAction);