const SlackEventDef = require("../eventdef");
const Teams = require("../teams");

class AdaptiveCard {
	constructor(attachment) {
		this.authorName = attachment.author_name;
		this.title = attachment.title;
		this.titleLink = attachment.title_link;
		this.text = attachment.text;
		this.fields = attachment.fields;
		this.footer = attachment.footer;
		this.imageUrl = attachment.image_url;
		this.color = attachment.color;
	}

	render() {
		const items = [
			{
				type: "TextBlock",
				text: this.authorName,
				color: this.color
			},
			{
				type: "TextBlock",
				text: (new MarkdownLink(this.titleLink, this.title)).toString(),
				wrap: true,
				spacing: "Small"
			},
			{
				type: "TextBlock",
				text: this.text,
				wrap: true,
				separator: true,
				fontType: "Default",
				size: "Small"
			},
			{
				type: "ColumnSet",
				columns: [
					{
						type: "Column",
						items: _.toArray(_.map(this.fields, ({ title }) => ({
							type: "TextBlock",
							text: title,
							weight: "Bolder",
							size: "Small",
						}))),
						width: "auto",
						spacing: "Small"
					},
					{
						type: "Column",
						items: _.toArray(_.map(this.fields, ({ value }) => ({
							type: "TextBlock",
							text: value,
							size: "Small",
						}))),
						width: "stretch"
					}
				],
				spacing: "Small"
			}
		];

		if (this.imageUrl) {
			items.push({
				type: "Image",
				url: this.imageUrl
			});
		}
		if (this.footer) {
			items.push({
				type: "TextBlock",
				text: this.footer,
				size: "Small",
				spacing: "Small",
				horizontalAlignment: "Right",
				weight: "Lighter",
				isSubtle: true
			});
		}

		const body = [{
			type: "ColumnSet",
			columns: [
				{
					type: "Column",
					width: "stretch",
					items
				}
			]
		}];

		const message = {
			type: "message",
			attachments: [{
				contentType: "application/vnd.microsoft.card.adaptive",
				content: {
					type: "AdaptiveCard",
					$schema: "http://adaptivecards.io/schemas/adaptive-card.json",
					version: "1.2",
					body
				}
			}]
		};
		console.log(message);
		return message;
	}
};

class EventDef extends SlackEventDef {
	/**
	 * Output a link.
	 *
	 * @param {string} text Text to display
	 * @param {string} url Partial or full URL
	 * @returns {SlackLink} Object with toString() method
	 */
	getLink(text, url) {
		return new MarkdownLink(url, text);
	}

	/**
	 * Fill default info and return a valid Slack message.
	 *
	 * @param {{}} attachment Attachment definition
	 * @returns {{attachments: [{}]}} Slack message definition
	 */
	attachmentWithDefaults(attachment) {
		if (!attachment.ts) {
			attachment.ts = this.getTime() || new Date();
		}
		if (_.isDate(attachment.ts)) {
			attachment.ts = attachment.ts.getTime() / 1000 | 0;
		}

		if (!attachment.footer) {
			// Add link to SNS ARN in footer
			// Example: arn:aws:sns:region:account-id:topicname:subscriptionid
			const snsArn = _.get(this.record, "EventSubscriptionArn");
			if (snsArn) {
				const arn = this.parseArn(snsArn);
				// separate topic from subscription
				const topic = _.split(arn.suffix, ":")[0];
				const url = this.consoleUrl(`/sns/v2/home?region=${arn.region}#/topics/arn:aws:sns:${arn.region}:${arn.account}:${topic}`);
				const signin = `https://${arn.account}.signin.aws.amazon.com/console/sns?region=${arn.region}`;
				// limit visible length of topic
				const topicVisible = topic.length > 40
					? topic.substr(0, 35) + "..."
					: topic;

				const snsLink = this.getLink(`SNS ${topicVisible}`, url);
				const signinLink = this.getLink("Sign-In", signin);
				attachment.footer = `Received via ${snsLink} | ${signinLink}`;
			}
		}
		return (new AdaptiveCard(attachment)).render();
	}
}

class MarkdownLink {
	constructor(url, text) {
		this.url = url;
		this.text = text;
		this.willPrintLink = !/true|1/i.test(process.env.HIDE_AWS_LINKS || "");
	}

	/**
	 * Get Slack-syntax link as a string.
	 * @returns {string} Slack-formatted link
	 */
	toString() {
		if (!this.willPrintLink) {
			return this.text;
		}
		return `[${this.text}](${this.url})`;
	}
}

module.exports = EventDef;
