import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Custom v0 client that accepts API key as parameter
const createV0Client = (apiKey: string) => {
  const BASE_URL = "https://api.v0.dev/v1";

  async function fetcher(
    url: string,
    method: string,
    params: any = {}
  ): Promise<any> {
    const queryString = params.query
      ? "?" + new URLSearchParams(params.query).toString()
      : "";
    const finalUrl = BASE_URL + url + queryString;

    if (!apiKey) {
      throw new Error("V0_API_KEY is required");
    }

    const hasBody = method !== "GET" && params.body;
    const headers = {
      Authorization: `Bearer ${apiKey}`,
      ...params.headers,
    };

    if (hasBody) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(finalUrl, {
      method,
      headers,
      body: hasBody ? JSON.stringify(params.body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    return res.json();
  }

  return {
    chats: {
      async create(params: any) {
        const body = {
          message: params.message,
          attachments: params.attachments,
          system: params.system,
          chatPrivacy: params.chatPrivacy,
          projectId: params.projectId,
          modelConfiguration: params.modelConfiguration,
        };
        return fetcher(`/chats`, "POST", { body });
      },
      async getById(params: { chatId: string }) {
        return fetcher(`/chats/${params.chatId}`, "GET", {});
      },
      async createMessage(params: {
        chatId: string;
        message: string;
        attachments?: any[];
        modelConfiguration?: any;
      }) {
        const body = {
          message: params.message,
          attachments: params.attachments,
          modelConfiguration: params.modelConfiguration,
        };
        return fetcher(`/chats/${params.chatId}/messages`, "POST", { body });
      },
      async find(params?: {
        limit?: string;
        offset?: string;
        isFavorite?: string;
      }) {
        const query = params
          ? Object.fromEntries(
              Object.entries({
                limit: params.limit,
                offset: params.offset,
                isFavorite: params.isFavorite,
              }).filter(([_, value]) => value !== undefined)
            )
          : {};
        const hasQuery = Object.keys(query).length > 0;
        return fetcher(`/chats`, "GET", {
          ...(hasQuery ? { query } : {}),
        });
      },
      async delete(params: { chatId: string }) {
        return fetcher(`/chats/${params.chatId}`, "DELETE", {});
      },
    },
    projects: {
      async create(params: {
        name: string;
        description?: string;
        icon?: string;
        environmentVariables?: any[];
        instructions?: string;
      }) {
        const body = {
          name: params.name,
          description: params.description,
          icon: params.icon,
          environmentVariables: params.environmentVariables,
          instructions: params.instructions,
        };
        return fetcher(`/projects`, "POST", { body });
      },
      async find() {
        return fetcher(`/projects`, "GET", {});
      },
    },
    user: {
      async get() {
        return fetcher(`/user`, "GET", {});
      },
      async getPlan() {
        return fetcher(`/user/plan`, "GET", {});
      },
    },
    rateLimits: {
      async find(params?: { scope?: string }) {
        const query = params
          ? Object.fromEntries(
              Object.entries({
                scope: params.scope,
              }).filter(([_, value]) => value !== undefined)
            )
          : {};
        const hasQuery = Object.keys(query).length > 0;
        return fetcher(`/rate-limits`, "GET", {
          ...(hasQuery ? { query } : {}),
        });
      },
    },
  };
};

type State = {};
type Props = {
  apiKey: string;
};

// Define our MCP agent with v0 tools
export class MyMCP extends McpAgent<Env, State, Props> {
  server = new McpServer({
    name: "V0 Platform MCP",
    version: "1.0.0",
  });

  async init() {
    const v0 = createV0Client(this.props.apiKey);

    // Create a new chat
    this.server.tool(
      "create_chat",
      "Create a new AI-powered chat session. Use this to start a new conversation with the v0 platform, optionally providing a system prompt, privacy setting, and model configuration.",
      {
        message: z.string().describe("The message to send to v0 AI"),
        system: z
          .string()
          .optional()
          .describe("Optional system prompt to guide the AI"),
        chatPrivacy: z
          .enum(["private", "public"])
          .optional()
          .describe("Chat privacy setting"),
        modelId: z
          .enum(["v0-1.5-sm", "v0-1.5-md", "v0-1.5-lg"])
          .optional()
          .describe("Model ID to use"),
        imageGenerations: z
          .boolean()
          .optional()
          .describe("Enable image generations"),
      },
      async ({ message, system, chatPrivacy, modelId, imageGenerations }) => {
        try {
          const result = (await v0.chats.create({
            message,
            system,
            chatPrivacy,
            modelConfiguration: modelId
              ? {
                  modelId,
                  imageGenerations: imageGenerations ?? false,
                }
              : undefined,
          })) as { url: string; id: string };

          return {
            content: [
              {
                type: "text",
                text: `Chat created successfully!\n\nChat URL: ${result.url}\nChat ID: ${result.id}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error creating chat: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Get chat by ID
    this.server.tool(
      "get_chat",
      "Retrieve details for a specific chat session by its ID. Use this to get information or the URL for an existing chat.",
      {
        chatId: z.string().describe("The ID of the chat to retrieve"),
      },
      async ({ chatId }) => {
        try {
          const chat = (await v0.chats.getById({ chatId })) as {
            id: string;
            url: string;
          };
          return {
            content: [
              {
                type: "text",
                text: `Chat Details:\n\nID: ${chat.id}\nURL: ${chat.url}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error retrieving chat: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Add message to existing chat
    this.server.tool(
      "add_message",
      "Add a new message to an existing chat session. Use this to continue a conversation or provide additional instructions to the AI.",
      {
        chatId: z.string().describe("The ID of the chat to add message to"),
        message: z.string().describe("The message to add to the chat"),
      },
      async ({ chatId, message }) => {
        try {
          const response = await v0.chats.createMessage({
            chatId,
            message,
          });

          return {
            content: [
              {
                type: "text",
                text: `Message added successfully!\n\nResponse: ${JSON.stringify(
                  response,
                  null,
                  2
                )}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error adding message: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Find chat history
    this.server.tool(
      "find_chats",
      "List existing chat sessions. Use this to browse your chat history, with optional pagination.",
      {
        limit: z
          .number()
          .optional()
          .describe("Number of chats to retrieve (default: 10)"),
        offset: z
          .number()
          .optional()
          .describe("Number of chats to skip (default: 0)"),
      },
      async ({ limit = 10, offset = 0 }) => {
        try {
          const chats = (await v0.chats.find({
            limit: String(limit),
            offset: String(offset),
          })) as { data: { id: string }[] };
          const chatList = chats.data
            ? chats.data
                .slice(0, limit)
                .map((chat: { id: string }) => `- ${chat.id}`)
                .join("\n")
            : "No chats found";

          return {
            content: [
              {
                type: "text",
                text: `Found ${
                  chats.data ? chats.data.length : 0
                } chats:\n\n${chatList}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error finding chats: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Create a project
    this.server.tool(
      "create_project",
      "Create a new project on the v0 platform. Use this to organize related chats, files, and deployments under a single project.",
      {
        name: z.string().describe("Name of the project"),
        description: z
          .string()
          .optional()
          .describe("Description of the project"),
      },
      async ({ name, description }) => {
        try {
          const project = (await v0.projects.create({
            name,
            description,
          })) as { id: string; name: string };

          return {
            content: [
              {
                type: "text",
                text: `Project created successfully!\n\nID: ${project.id}\nName: ${project.name}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error creating project: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Find projects
    this.server.tool(
      "find_projects",
      "List your v0 projects. Use this to browse and manage your projects, with optional pagination.",
      {
        limit: z
          .number()
          .optional()
          .describe("Number of projects to retrieve (default: 10)"),
        offset: z
          .number()
          .optional()
          .describe("Number of projects to skip (default: 0)"),
      },
      async ({ limit = 10, offset = 0 }) => {
        try {
          const projects = (await v0.projects.find()) as {
            data: { id: string; name: string }[];
          };
          const projectList = projects.data
            ? projects.data
                .slice(offset, offset + limit)
                .map(
                  (project: { id: string; name: string }) =>
                    `- ${project.id}: ${project.name}`
                )
                .join("\n")
            : "No projects found";

          return {
            content: [
              {
                type: "text",
                text: `Found ${
                  projects.data ? projects.data.length : 0
                } projects:\n\n${projectList}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error finding projects: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Get user information
    this.server.tool(
      "get_user_info",
      "Retrieve information about the current user, such as user ID, email, and name.",
      {},
      async () => {
        try {
          const user = (await v0.user.get()) as {
            id: string;
            email: string;
            name?: string;
          };
          return {
            content: [
              {
                type: "text",
                text: `User Information:\n\nID: ${user.id}\nEmail: ${
                  user.email
                }\nName: ${user.name || "Not provided"}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error getting user info: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Get user plan and billing
    this.server.tool(
      "get_user_plan",
      "Get the current user's plan and billing details. Use this to check your subscription and usage limits.",
      {},
      async () => {
        try {
          const plan = await v0.user.getPlan();
          return {
            content: [
              {
                type: "text",
                text: `User Plan:\n\nPlan: ${
                  plan.plan
                }\nDetails: ${JSON.stringify(plan, null, 2)}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error getting user plan: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Check rate limits
    this.server.tool(
      "check_rate_limits",
      "Check your current API rate limits and usage. Use this to monitor your quota and avoid hitting rate limits.",
      {},
      async () => {
        try {
          const rateLimits = await v0.rateLimits.find();
          return {
            content: [
              {
                type: "text",
                text: `Rate Limits:\n\n${JSON.stringify(rateLimits, null, 2)}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error checking rate limits: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Delete a chat
    this.server.tool(
      "delete_chat",
      "Delete a chat session by its ID. Use this to remove a chat and its associated data from your account.",
      {
        chatId: z.string().describe("The ID of the chat to delete"),
      },
      async ({ chatId }) => {
        try {
          await v0.chats.delete({ chatId });
          return {
            content: [
              {
                type: "text",
                text: `Chat ${chatId} deleted successfully!`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error deleting chat: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );
  }
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // Get the API key from the request headers
    // let apiKey = request.headers.get("Authorization")?.split(" ")[1];
    // if (!apiKey) {
    //   // return new Response("Unauthorized", { status: 401 });
    //   apiKey = env.V0_API_KEY;
    // }
    const apiKey = env.V0_API_KEY;

    ctx.props = {
      apiKey,
    };

    if (url.pathname === "/sse" || url.pathname === "/sse/message") {
      return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
    }

    if (url.pathname === "/mcp") {
      return MyMCP.serve("/mcp").fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
};
