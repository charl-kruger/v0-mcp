# V0 Platform MCP Server

A Cloudflare Workers-based Model Context Protocol (MCP) server that provides tools to interact with the V0 Platform API. This allows AI assistants to create and manage AI-powered chat conversations, projects, and more through the V0 platform.

## Features

- **Chat Management**: Create, retrieve, and manage AI chat conversations
- **Project Operations**: Create and manage V0 projects
- **User Management**: Access user information and billing details
- **Rate Limit Monitoring**: Check API rate limits
- **Error Handling**: Comprehensive error handling with detailed error messages

## Prerequisites

1. **V0 API Key**: Get your API key from [v0.dev/chat/settings/keys](https://v0.dev/chat/settings/keys)
2. **Cloudflare Account**: You'll need a Cloudflare account to deploy the worker
3. **Node.js**: Version 18 or higher

## Installation

1. Clone this repository:

```bash
git clone <repository-url>
cd v0-mcp
```

2. Install dependencies:

```bash
npm install
```

3. Set your V0 API key in the `wrangler.jsonc` file:

```jsonc
{
  "vars": {
    "V0_API_KEY": "your_v0_api_key_here"
  }
}
```

## Development

Start the development server:

```bash
npm run dev
```

This will start a local development server at `http://localhost:8787`.

## Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

## Available Tools

### Chat Operations

#### `create_chat`

Create a new chat conversation with the V0 AI.

**Parameters:**

- `message` (string, required): The message to send to V0 AI
- `system` (string, optional): Optional system prompt to guide the AI
- `chatPrivacy` (string, optional): Chat privacy setting ("private" or "public")
- `modelId` (string, optional): Model ID to use ("v0-1.5-sm", "v0-1.5-md", "v0-1.5-lg")
- `imageGenerations` (boolean, optional): Enable image generations

**Example:**

```json
{
  "message": "Create a responsive navbar with Tailwind CSS",
  "system": "You are an expert React developer",
  "modelId": "v0-1.5-md"
}
```

#### `get_chat`

Retrieve a chat by its ID.

**Parameters:**

- `chatId` (string, required): The ID of the chat to retrieve

#### `add_message`

Add a message to an existing chat.

**Parameters:**

- `chatId` (string, required): The ID of the chat to add message to
- `message` (string, required): The message to add to the chat

#### `find_chats`

Find chat history with pagination.

**Parameters:**

- `limit` (number, optional): Number of chats to retrieve (default: 10)
- `offset` (number, optional): Number of chats to skip (default: 0)

#### `delete_chat`

Delete a chat by its ID.

**Parameters:**

- `chatId` (string, required): The ID of the chat to delete

### Project Operations

#### `create_project`

Create a new V0 project.

**Parameters:**

- `name` (string, required): Name of the project
- `description` (string, optional): Description of the project

#### `find_projects`

Find projects with pagination.

**Parameters:**

- `limit` (number, optional): Number of projects to retrieve (default: 10)
- `offset` (number, optional): Number of projects to skip (default: 0)

### User Management

#### `get_user_info`

Get current user information.

**Parameters:** None

#### `get_user_plan`

Get user plan and billing information.

**Parameters:** None

#### `check_rate_limits`

Check current API rate limits.

**Parameters:** None

## API Endpoints

- **MCP Endpoint**: `/mcp` - Main MCP server endpoint
- **SSE Endpoint**: `/sse` - Server-Sent Events endpoint for real-time communication

## Usage Examples

### Creating a Chat

```bash
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "create_chat",
      "arguments": {
        "message": "Create a login form with validation",
        "system": "You are an expert in React and form validation"
      }
    }
  }'
```

### Getting User Information

```bash
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "get_user_info",
      "arguments": {}
    }
  }'
```

## Error Handling

The MCP server includes comprehensive error handling:

- **Authentication Errors**: Invalid or missing API keys
- **Rate Limit Errors**: When API rate limits are exceeded
- **Validation Errors**: Invalid parameters or missing required fields
- **Network Errors**: Connection issues with the V0 API

All errors are returned with descriptive messages to help with debugging.

## Configuration

### Environment Variables

- `V0_API_KEY`: Your V0 API key (required)

### Wrangler Configuration

The `wrangler.jsonc` file contains the Cloudflare Workers configuration:

```jsonc
{
  "name": "v0-mcp",
  "main": "src/index.ts",
  "compatibility_date": "2025-03-10",
  "compatibility_flags": ["nodejs_compat"],
  "vars": {
    "V0_API_KEY": ""
  },
  "migrations": [
    {
      "new_sqlite_classes": ["V0MCP"],
      "tag": "v1"
    }
  ],
  "durable_objects": {
    "bindings": [
      {
        "class_name": "V0MCP",
        "name": "MCP_OBJECT"
      }
    ]
  },
  "observability": {
    "enabled": true
  }
}
```

## Security Considerations

- **API Key Protection**: Never commit your V0 API key to version control
- **Environment Variables**: Use Cloudflare Workers environment variables for sensitive data
- **Rate Limiting**: Be mindful of V0 API rate limits
- **Input Validation**: All inputs are validated using Zod schemas

## Troubleshooting

### Common Issues

1. **"Cannot find module 'v0-sdk'"**: Make sure you've installed the dependencies with `npm install`
2. **"Authentication error"**: Verify your V0 API key is correctly set in the environment variables
3. **"Rate limit exceeded"**: Check your current usage and wait before making more requests
4. **"Invalid parameters"**: Ensure all required parameters are provided and have the correct types

### Debug Mode

To enable debug logging, set the `DEBUG` environment variable:

```bash
DEBUG=* npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues related to:

- **V0 Platform**: Visit [v0.dev](https://v0.dev) or check their documentation
- **Cloudflare Workers**: Visit [developers.cloudflare.com/workers](https://developers.cloudflare.com/workers)
- **MCP Protocol**: Visit [modelcontextprotocol.io](https://modelcontextprotocol.io)
