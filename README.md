# MailMerge-JS ⚡

MailMerge-JS is a next-generation Gmail automation tool supercharged by AI. Effortlessly draft and send highly personalized templated emails without worrying about email templating and data massaging, all from your Gmail inbox.

<img src="https://raw.githubusercontent.com/WarmSaluters/mailmerge-js/main/assets/demo-sources.png" width="800" height="400" />

<img src="https://raw.githubusercontent.com/WarmSaluters/mailmerge-js/main/assets/demo.gif" width="800" height="400" />

## How it Works

MailMerge-JS leverages the power of GenAI and the Gmail API to streamline the email drafting process. Write your templates in any format you prefer (HTML/Markdown/Text/Jinja) and loosely express variables and directives in pseudocode using double curly braces `{{ }}`. The AI will then generate the actual email content for you, synthesized against any data file format you provide.

## Features

- **Bring Your Own Keys and Credentials**: Maintain control over your API keys and credentials.
- **Scale**: Draft and send emails at scale, perfect for large outreach campaigns.
- **Flexibility**: Understands loose or missing data requirements, making it adaptable to various data sources.
- **Free and Open-Source**: Completely free to use and modify.
- **OpenAI Integration**: Enhances the email drafting process with AI-powered content generation.

## Installation

To install MailMerge-JS, use the following commands:

```bash
npm install -g mailmerge-js
mailmerge setup
```

Setup will guide you through the process of setting up your MailMerge-JS environment.
To get the most out of this tool, you will need an OpenAI API key and Google App credentials.


### Setting up Google App Credentials

This tool requires Google App credentials to draft and send emails. Here is how you can obtain those credentials:

1. Go to the [Google Developer Console](https://console.developers.google.com/).
2. Create a new project.
3. Enable the Gmail API for that project.
4. Add the following scopes to the project:
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.compose`
5. Create credentials for a desktop application.
6. Download the JSON file

**NOTICE (5/22/2024) - We used to provide a simple way to authorize via a hosted web server. This is no longer supported due to difficulties with getting Google App Approval. You will need to provide your own application credentials**

### Setting up OpenAI API Key

To use OpenAI features you will need an OpenAI developer API key (read more to see how you can use our tool with local LLMs)

You can sign up on [OpenAI's website](https://platform.openai.com/signup/).
Get your API key from the [OpenAI API Keys page](https://platform.openai.com/api-keys).

### Setting up Local LLM with Ollama
We also support using this tool with local language models thru Ollama. For example, to compose emails using llama3, you will feed the following
flag to the `compose` command: `--renderer llama3`

Install Ollama by following the instructions [here](https://ollama.com/download).

## Quickstart

### Draft personalized emails

```
mailmerge compose --contacts ./examples/sample-contacts.csv ./examples/outreach-template.md
```

#### Template: `examples/outreach-template.md`

```markdown
# Subject

{{ "Insert some subject related to connecting via their company or title, whichever more appropriate" }}

# Body

Hi {{first name}},

I hope this message finds you well. I'm Bob from MailMerge-JS, a startup that's building a tool to automate email outreach.
I came across your profile and was impressed by your track record in {{ industry in company }} and wanted to show
you how our tool can help you automate {{ insert reason to use the outreach tool based on their title }}

Would you be open to a quick chat next week?

Best,
Bob @ MailMerge-JS
[https://mailmerge-js.dev](https://mailmerge-js.dev)
```

#### Contact Data: `examples/sample-contacts.csv`

```csv
name,email,company,position
John Doe,john.doe@example.com,Crunch Fitness,Fitness Instructor
Jane Smith,jane.smith@example.com,Coca-Cola,CTO
Alice Johnson,alice.johnson@example.com,Microsoft,Product Manager
Bob Brown,bob.brown@example.com,Bank of America,Marketing Director
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](https://github.com/WarmSaluters/mailmerge-js/blob/main/CONTRIBUTING.md) for details.

## License

Licensed under the MIT License. See [LICENSE](https://github.com/WarmSaluters/mailmerge-js/blob/main/LICENSE) for details.

## Privacy

Our hosted server endpoint on the `mailmerge-js.dev` domain is used solely for authorizing our app against Google APIs. We do not store any data; all tokens are stored on the user side. We do not collect or store any data. The server code can be inspected in this repository.

_Note: This privacy policy only applies if you are using the hosted server._

## Terms of Service

The server exists to make the app more accessible for users setting up the CLI. Its purpose is to obfuscate our own credentials from abuse. We do not collect or store any data.

_Note: These terms of service only apply if you are using the hosted server._

---

Made with ❤️ by charlesyu108 & ryanhuang519
