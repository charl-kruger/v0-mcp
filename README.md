# V0 MCP Server

A comprehensive Model Context Protocol (MCP) server that provides complete access to the [v0 Platform API](https://v0.dev/docs/api/platform). This server enables AI agents to create and manage chats, projects, deployments, integrations, webhooks, and interact with the full v0 development infrastructure on behalf of users.

## 🚀 Features

- **🔐 Simple Authentication**: Pass your v0 API key via `key` query parameter
- **💬 Complete Chat Management**: Full CRUD operations for AI chat sessions, messages, and versions
- **📁 Project Management**: Create and organize v0 projects with full lifecycle management
- **🚀 Deployment Management**: Deploy to Vercel, manage deployments, view logs and errors
- **🔗 Integration Support**: Vercel project integrations for seamless deployments
- **🎣 Webhook Management**: Complete webhook/hook management for event-driven workflows
- **👤 User Management**: Access user information, billing, plans, and scopes
- **⏱️ Rate Limit Monitoring**: Monitor API usage and avoid throttling

## 🛠️ Architecture

This MCP server uses:

- **Official v0-sdk v0.6.2**: Latest v0 Platform SDK for all API interactions
- **Query Parameter Authentication**: Simple `key` query parameter for API key authentication
- **Full API Coverage**: Implements all available tools from the v0 Platform API
- **Type Safety**: Complete TypeScript implementation with proper error handling

## 🔐 Authentication

Simply pass your v0 API key in the `key` query parameter with each request.

### How to Get Your V0 API Key

1. Go to [v0.dev](https://v0.dev)
2. Sign in to your account
3. Navigate to your account settings
4. Generate and copy your API key

### MCP Client Configuration

Configure your MCP client to use the `key` query parameter:

```json
{
  "mcpServers": {
    "v0": {
      "command": "node",
      "args": ["/path/to/your/mcp-client.js"],
      "env": {
        "MCP_SERVER_URL": "https://your-worker.your-subdomain.workers.dev/mcp?key=your_v0_api_key_here",
        "V0_API_KEY": "your_v0_api_key_here"
      }
    }
  }
}
```

Or use curl directly:

```bash
curl -X POST "https://your-worker.your-subdomain.workers.dev/mcp?key=your_v0_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "create_chat",
      "arguments": {
        "message": "Create a Next.js login form"
      }
    }
  }'
```

### Cursor IDE Configuration

To use this MCP server with Cursor IDE, add the following to your `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "v0-mcp-server": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:8787/sse?key=YOUR_V0_API_KEY_HERE"
      ]
    }
  }
}
```

**Important**: Replace `YOUR_V0_API_KEY_HERE` with your actual v0 API key from [v0.dev](https://v0.dev).

For production deployment, use your deployed worker URL:

```json
{
  "mcpServers": {
    "v0-mcp-server": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://your-worker.your-subdomain.workers.dev/sse?key=YOUR_V0_API_KEY_HERE"
      ]
    }
  }
}
```

## 🛠️ Available Tools

### 💬 Chat Management (15 tools)

- **`create_chat`**: Create new AI-powered chat sessions with system prompts and model configuration
- **`find_chats`**: List and search existing chat sessions with pagination and filtering
- **`initialize_chat`**: Initialize chats from zip archives for context-rich conversations
- **`get_chat`**: Retrieve detailed information about specific chats
- **`update_chat`**: Update chat metadata including names and settings
- **`favorite_chat`**: Mark/unmark chats as favorites for organization
- **`fork_chat`**: Create chat branches from specific versions for alternate directions
- **`send_message`**: Send messages to chats with attachments and model configuration
- **`find_chat_messages`**: Retrieve all messages from chats with pagination
- **`get_chat_message`**: Get detailed message information including content and files
- **`find_chat_versions`**: List all versions/iterations of chat conversations
- **`get_chat_version`**: Retrieve specific version details with files and content
- **`update_chat_version_files`**: Directly edit generated files in chat versions
- **`resume_message`**: Resume interrupted or incomplete message generation
- **`delete_chat`**: Permanently delete chat sessions

### 📁 Project Management (6 tools)

- **`create_project`**: Create new v0 projects with descriptions and instructions
- **`find_projects`**: List all v0 projects with pagination
- **`get_project_by_id`**: Retrieve specific project details by ID
- **`get_project_by_chat_id`**: Find project associated with a chat session
- **`update_project`**: Update project metadata and settings
- **`assign_project_to_chat`**: Link projects to chat sessions for organization

### 🚀 Deployment Management (6 tools)

- **`find_deployments`**: Search deployments by project and chat IDs
- **`create_deployment`**: Deploy chat versions to Vercel with project association
- **`get_deployment`**: Retrieve deployment details including URLs and status
- **`delete_deployment`**: Remove deployments from Vercel
- **`find_deployment_logs`**: Access deployment logs with timestamp filtering
- **`find_deployment_errors`**: Retrieve deployment errors for debugging

### 🔗 Integration Management (2 tools)

- **`create_vercel_project`**: Create Vercel project integrations for deployments
- **`find_vercel_projects`**: List existing Vercel project integrations

### 🎣 Webhook/Hook Management (5 tools)

- **`find_hooks`**: List all configured webhooks in workspace
- **`create_hook`**: Create new webhooks for event monitoring
- **`get_hook`**: Retrieve detailed webhook configuration
- **`update_hook`**: Modify webhook settings and event subscriptions
- **`delete_hook`**: Remove webhook configurations

### 👤 User Management (4 tools)

- **`get_user_info`**: Retrieve authenticated user information and metadata
- **`get_user_billing`**: Access billing usage and quota information
- **`get_user_plan`**: Get current subscription plan and feature limits
- **`get_user_scopes`**: List accessible scopes and team permissions

### ⏱️ System Tools (1 tool)

- **`check_rate_limits`**: Monitor API rate limits and usage quotas

## 🏗️ Development

### Prerequisites

- Node.js 18+
- Wrangler CLI
- v0 API key

### Setup

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure your environment:

   ```bash
   # Copy the example configuration
   cp wrangler.jsonc.example wrangler.jsonc

   # Edit wrangler.jsonc with your settings
   ```

4. Deploy to Cloudflare Workers:
   ```bash
   npm run deploy
   ```

### Local Development

Run the server locally:

```bash
npm run dev
```

The server will be available at `http://localhost:8787`

## 📡 API Endpoints

- `POST /mcp?key=YOUR_API_KEY`: MCP server endpoint (requires `key` query parameter)
- `GET /sse?key=YOUR_API_KEY`: Server-sent events endpoint
- `POST /sse/message?key=YOUR_API_KEY`: SSE message endpoint

## 🔧 Error Handling

The server provides comprehensive error handling:

- **401 Unauthorized**: Missing `key` query parameter
- **Rate Limit Errors**: When API rate limits are exceeded
- **Validation Errors**: Invalid parameters or missing required fields
- **Network Errors**: Connection issues with the v0 API

All errors include descriptive messages to help with debugging.

## 📊 Usage Examples

### Creating a Chat

```bash
curl -X POST "http://localhost:8787/mcp?key=your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "create_chat",
      "arguments": {
        "message": "Create a Next.js login form with validation",
        "system": "You are an expert in React and form validation",
        "modelId": "v0-1.5-md"
      }
    }
  }'
```

### Deploying a Chat Version

```bash
curl -X POST "http://localhost:8787/mcp?key=your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "create_deployment",
      "arguments": {
        "chatId": "chat_123",
        "versionId": "version_456",
        "projectId": "project_789"
      }
    }
  }'
```

### Using with MCP Client Libraries

If you're using an MCP client library, configure it to include the `key` query parameter:

```javascript
const client = new MCPClient({
  serverUrl:
    "https://your-worker.your-subdomain.workers.dev/mcp?key=your_v0_api_key_here",
});

// Create a chat
const result = await client.callTool("create_chat", {
  message: "Build a todo app with React and TypeScript",
  modelId: "v0-1.5-md",
});
```

## 🚀 What's New in v2.0.0

- **🆕 Official v0-sdk Integration**: Migrated from custom implementation to official v0-sdk v0.6.2
- **📈 Complete API Coverage**: All 40+ tools from the v0 Platform API now available
- **🔧 Enhanced Deployment Management**: Full deployment lifecycle with logs and error tracking
- **🎣 Webhook Support**: Complete webhook management for event-driven workflows
- **🔗 Vercel Integration**: Native Vercel project integration support
- **💡 Improved Type Safety**: Full TypeScript implementation with comprehensive error handling
- **📊 Advanced Chat Management**: Version control, forking, and file editing capabilities
- **👥 User & Billing Tools**: Complete user management and billing information access
- **🔐 Simplified Authentication**: Clean query parameter-based API key authentication

## 🛡️ Security Considerations

- **API Key Protection**: Never commit your v0 API key to version control
- **HTTPS**: Always use HTTPS in production
- **Rate Limiting**: Monitor usage to avoid hitting v0 API rate limits
- **Environment Variables**: Store API keys in secure environment variables
- **Query Parameter Security**: Be aware that API keys in query parameters may be logged in server logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- [v0.dev](https://v0.dev) for the comprehensive Platform API
- [Model Context Protocol](https://modelcontextprotocol.io) for the MCP specification
- [Cloudflare Workers](https://workers.cloudflare.com) for the serverless platform
