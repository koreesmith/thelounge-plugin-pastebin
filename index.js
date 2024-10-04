const https = require('https');
const querystring = require('querystring');  // Added this line

// Replace 'YOUR_API_KEY' with your actual Pastebin API key
const API_KEY = 'YOUR_API_KEY';
const API_URL = 'https://pastebin.com/api/api_post.php';

const pastebinCommand = {
    input: function (client, target, command, args) {
        try {
            const argArray = args;

            console.info("[ Pastebin Plugin ] Received arguments:", argArray);

            if (!argArray || argArray.length === 0) {
                client.sendMessage(
                    "Usage: /pastebin <code>. Please provide a code snippet to post.",
                    target.chan
                );
                return;
            }

            const codeSnippet = argArray.join(' ');

            if (!codeSnippet || codeSnippet.trim().length === 0) {
                client.sendMessage(
                    "Please provide a valid code snippet.",
                    target.chan
                );
                return;
            }

            const postData = querystring.stringify({
                api_dev_key: API_KEY,
                api_option: 'paste',
                api_paste_code: codeSnippet,
                api_paste_private: '0', // 0 = public, 1 = unlisted, 2 = private
                api_paste_expire_date: '1440M', // Expiration: 10 minutes
            });

            const options = {
                hostname: 'pastebin.com',
                path: '/api/api_post.php',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData),
                },
            };

            console.info("[ Pastebin Plugin ] Posting code to Pastebin...");

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        console.info("[ Pastebin Plugin ] Response received:", data);

                        if (res.statusCode === 200) {
                            client.sendMessage(
                                `Code posted to Pastebin: ${data}`,
                                target.chan
                            );
			    client.runAsUser(data, target.chan.id);
                        } else {
                            client.sendMessage(
                                `Error: Failed to post code to Pastebin (status code: ${res.statusCode})`,
                                target.chan
                            );
                        }
                    } catch (error) {
                        console.error("[ Pastebin Plugin ] Parsing response error:", error);
                        client.sendMessage(
                            "Could not parse Pastebin response. Please try again later.",
                            target.chan
                        );
                    }
                });
            });

            req.on('error', (error) => {
                console.error("[ Pastebin Plugin ] Request error:", error);
                client.sendMessage(
                    "Could not post code to Pastebin. Please try again later.",
                    target.chan
                );
            });

            req.write(postData);
            req.end();
        } catch (error) {
            console.error("[ Pastebin Plugin ] Unexpected error:", error);
            client.sendMessage(
                "An unexpected error occurred while posting to Pastebin.",
                target.chan
            );
        }
    },
    allowDisconnected: true,
};

module.exports = {
    onServerStart: api => {
        try {
            console.info("[ Pastebin Plugin ] Registering pastebin command...");
            api.Commands.add("pastebin", pastebinCommand);
        } catch (error) {
            console.error("[ Pastebin Plugin ] Error registering pastebin command:", error);
        }
    },
};

