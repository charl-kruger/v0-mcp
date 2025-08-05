import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createClient } from "v0-sdk";

type State = Record<string, never>;
type Props = {
  apiKey: string;
};

// Define our MCP agent with comprehensive v0 tools
export class MyMCP extends McpAgent<Env, State, Props> {
  server = new McpServer({
    name: "V0 Platform MCP",
    version: "2.0.0",
  });

  async init() {
    // Create v0 client using the official SDK
    const v0 = createClient({ apiKey: this.props.apiKey });

    // ===================
    // CHAT MANAGEMENT TOOLS
    // ===================

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
        projectId: z
          .string()
          .optional()
          .describe("Optional project ID to associate the chat with"),
        modelId: z
          .enum(["v0-1.5-sm", "v0-1.5-md", "v0-1.5-lg"])
          .optional()
          .describe("Model ID to use"),
        imageGenerations: z
          .boolean()
          .optional()
          .describe("Enable image generations"),
        attachments: z
          .array(
            z.object({
              url: z.string(),
            })
          )
          .optional()
          .describe("Optional attachments to include (with URLs)"),
      },
      async ({
        message,
        system,
        chatPrivacy,
        projectId,
        modelId,
        imageGenerations,
        attachments,
      }) => {
        try {
          const result = await v0.chats.create({
            message,
            system,
            chatPrivacy,
            projectId,
            modelConfiguration: modelId
              ? {
                  modelId,
                  imageGenerations: imageGenerations ?? false,
                }
              : undefined,
            attachments,
          });

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

    // Find chats
    this.server.tool(
      "find_chats",
      "List existing chat sessions. Use this to browse your chat history, with optional pagination and filtering.",
      {
        limit: z
          .string()
          .optional()
          .describe("Number of chats to retrieve (default: 10)"),
        offset: z
          .string()
          .optional()
          .describe("Number of chats to skip (default: 0)"),
        isFavorite: z
          .string()
          .optional()
          .describe("Filter by favorite status (true/false)"),
      },
      async ({ limit, offset, isFavorite }) => {
        try {
          const chats = await v0.chats.find({
            limit,
            offset,
            isFavorite,
          });

          const chatList = chats.data
            ? chats.data
                .map(
                  (chat: any) =>
                    `- ${chat.id}: ${chat.name || "Untitled"} (${chat.url})`
                )
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

    // Initialize chat from source
    this.server.tool(
      "initialize_chat",
      "Initialize a new chat from a zip source. Enables context-rich conversations based on code or assets.",
      {
        zipUrl: z
          .string()
          .describe("URL to a zip file containing the source code"),
        name: z.string().optional().describe("Name for the chat"),
        projectId: z
          .string()
          .optional()
          .describe("Project ID to associate with"),
        lockAllFiles: z
          .boolean()
          .optional()
          .describe("Whether to lock all files"),
      },
      async ({ zipUrl, name, projectId, lockAllFiles }) => {
        try {
          const result = await v0.chats.init({
            type: "zip",
            zip: { url: zipUrl },
            name,
            projectId,
            lockAllFiles,
          });

          return {
            content: [
              {
                type: "text",
                text: `Chat initialized successfully from zip!\n\nChat URL: ${result.url}\nChat ID: ${result.id}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error initializing chat: ${
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
          const chat = await v0.chats.getById({ chatId });
          return {
            content: [
              {
                type: "text",
                text: `Chat Details:\n\nID: ${chat.id}\nName: ${
                  chat.name || "Untitled"
                }\nURL: ${chat.url}\nCreated: ${chat.createdAt || "Unknown"}`,
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

    // Update chat
    this.server.tool(
      "update_chat",
      "Update the metadata of an existing chat using its chatId. Supports changes to the chat name and privacy setting.",
      {
        chatId: z.string().describe("The ID of the chat to update"),
        name: z.string().optional().describe("New name for the chat"),
      },
      async ({ chatId, name }) => {
        try {
          const result = await v0.chats.update({
            chatId,
            name,
          });

          return {
            content: [
              {
                type: "text",
                text: `Chat updated successfully!\n\nChat ID: ${result.id}${
                  name ? `\nNew name: ${name}` : ""
                }`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error updating chat: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Favorite/unfavorite chat
    this.server.tool(
      "favorite_chat",
      "Mark or unmark a chat as a favorite using its chatId. This helps with organizing and quickly accessing important chats.",
      {
        chatId: z
          .string()
          .describe("The ID of the chat to favorite/unfavorite"),
        isFavorite: z
          .boolean()
          .describe("Whether to mark as favorite (true) or unfavorite (false)"),
      },
      async ({ chatId, isFavorite }) => {
        try {
          await v0.chats.favorite({
            chatId,
            isFavorite,
          });

          return {
            content: [
              {
                type: "text",
                text: `Chat ${
                  isFavorite ? "marked as favorite" : "removed from favorites"
                } successfully!`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error updating favorite status: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Fork chat
    this.server.tool(
      "fork_chat",
      "Create a new chat fork from a specific version within an existing chat. Useful for branching off alternate directions without modifying the original conversation.",
      {
        chatId: z.string().describe("The ID of the chat to fork from"),
        versionId: z.string().describe("The specific version ID to fork from"),
      },
      async ({ chatId, versionId }) => {
        try {
          const result = await v0.chats.fork({
            chatId,
            versionId,
          });

          return {
            content: [
              {
                type: "text",
                text: `Chat forked successfully!\n\nNew Chat ID: ${result.id}\nNew Chat URL: ${result.url}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error forking chat: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Send message to chat
    this.server.tool(
      "send_message",
      "Create a new message in an existing chat. Triggers a model response using the provided prompt, with optional attachments and configuration settings.",
      {
        chatId: z.string().describe("The ID of the chat to send message to"),
        message: z.string().describe("The message to send"),
        attachments: z
          .array(
            z.object({
              url: z.string(),
            })
          )
          .optional()
          .describe("Optional attachments with URLs"),
        modelConfiguration: z
          .object({
            modelId: z.enum(["v0-1.5-sm", "v0-1.5-md", "v0-1.5-lg"]),
            imageGenerations: z.boolean().optional(),
          })
          .optional()
          .describe("Model configuration"),
      },
      async ({ chatId, message, attachments, modelConfiguration }) => {
        try {
          const response = await v0.chats.sendMessage({
            chatId,
            message,
            attachments,
            modelConfiguration,
          });

          return {
            content: [
              {
                type: "text",
                text: `Message sent successfully!\n\nMessage ID: ${
                  response.id
                }\nResponse: ${JSON.stringify(response, null, 2)}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error sending message: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Find chat messages
    this.server.tool(
      "find_chat_messages",
      "Retrieve a list of all messages for a specific chat, ordered by creation date (newest first). Supports cursor-based pagination.",
      {
        chatId: z.string().describe("The ID of the chat"),
        limit: z.string().optional().describe("Number of messages to retrieve"),
        cursor: z.string().optional().describe("Pagination cursor"),
      },
      async ({ chatId, limit, cursor }) => {
        try {
          const messages = await v0.chats.findMessages({
            chatId,
            limit,
            cursor,
          });

          const messageList = messages.data
            ? messages.data
                .map(
                  (msg: any) =>
                    `- ${msg.id}: ${msg.role} - ${msg.content?.substring(
                      0,
                      100
                    )}...`
                )
                .join("\n")
            : "No messages found";

          return {
            content: [
              {
                type: "text",
                text: `Found ${
                  messages.data ? messages.data.length : 0
                } messages:\n\n${messageList}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error finding messages: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Get specific message
    this.server.tool(
      "get_chat_message",
      "Retrieve detailed information about a specific message within a chat, including content, files, model configuration, and demo URLs.",
      {
        chatId: z.string().describe("The ID of the chat"),
        messageId: z.string().describe("The ID of the message"),
      },
      async ({ chatId, messageId }) => {
        try {
          const message = await v0.chats.getMessage({
            chatId,
            messageId,
          });

          return {
            content: [
              {
                type: "text",
                text: `Message Details:\n\nID: ${message.id}\nRole: ${
                  message.role
                }\nContent: ${message.content}\nCreated: ${
                  message.createdAt || "Unknown"
                }`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error getting message: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Find chat versions
    this.server.tool(
      "find_chat_versions",
      "Retrieve a list of all versions (iterations) for a specific chat, ordered by creation date (newest first). Supports cursor-based pagination.",
      {
        chatId: z.string().describe("The ID of the chat"),
        limit: z.string().optional().describe("Number of versions to retrieve"),
        cursor: z.string().optional().describe("Pagination cursor"),
      },
      async ({ chatId, limit, cursor }) => {
        try {
          const versions = await v0.chats.findVersions({
            chatId,
            limit,
            cursor,
          });

          const versionList = versions.data
            ? versions.data
                .map(
                  (version: any) =>
                    `- ${version.id}: ${version.demoUrl || "No demo"}`
                )
                .join("\n")
            : "No versions found";

          return {
            content: [
              {
                type: "text",
                text: `Found ${
                  versions.data ? versions.data.length : 0
                } versions:\n\n${versionList}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error finding versions: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Get chat version
    this.server.tool(
      "get_chat_version",
      "Retrieve detailed information about a specific version of a chat, including all files with their content and lock status.",
      {
        chatId: z.string().describe("The ID of the chat"),
        versionId: z.string().describe("The ID of the version"),
      },
      async ({ chatId, versionId }) => {
        try {
          const version = await v0.chats.getVersion({
            chatId,
            versionId,
          });

          return {
            content: [
              {
                type: "text",
                text: `Version Details:\n\nID: ${version.id}\nDemo URL: ${
                  version.demoUrl || "None"
                }\nFiles: ${
                  version.files
                    ? JSON.stringify(version.files, null, 2)
                    : "None"
                }`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error getting version: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Update chat version files
    this.server.tool(
      "update_chat_version_files",
      "Update the source files of a specific chat version (block) manually. This allows editing generated files directly through the API.",
      {
        chatId: z.string().describe("The ID of the chat"),
        versionId: z.string().describe("The ID of the version"),
        files: z
          .array(
            z.object({
              name: z.string(),
              content: z.string(),
              locked: z.boolean().optional(),
            })
          )
          .describe("Array of files to update"),
      },
      async ({ chatId, versionId, files }) => {
        try {
          await v0.chats.updateVersion({
            chatId,
            versionId,
            files,
          });

          return {
            content: [
              {
                type: "text",
                text: `Version files updated successfully!\n\nUpdated ${files.length} files.`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error updating version files: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Resume message
    this.server.tool(
      "resume_message",
      "Resume processing of a previously interrupted or incomplete message in a chat. Useful for continuing generation when a message was paused or stopped.",
      {
        chatId: z.string().describe("The ID of the chat"),
        messageId: z.string().describe("The ID of the message to resume"),
      },
      async ({ chatId, messageId }) => {
        try {
          const result = await v0.chats.resume({
            chatId,
            messageId,
          });

          return {
            content: [
              {
                type: "text",
                text: `Message resumed successfully!\n\nMessage ID: ${result.id}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error resuming message: ${
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
      "Delete a chat session by its ID. Use this to remove a chat and its associated data from your account. This operation is irreversible.",
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

    // ===================
    // PROJECT MANAGEMENT TOOLS
    // ===================

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
        icon: z.string().optional().describe("Icon for the project"),
        instructions: z
          .string()
          .optional()
          .describe("Instructions for the project"),
      },
      async ({ name, description, icon, instructions }) => {
        try {
          const project = await v0.projects.create({
            name,
            description,
            icon,
            instructions,
          });

          return {
            content: [
              {
                type: "text",
                text: `Project created successfully!\n\nID: ${
                  project.id
                }\nName: ${project.name}\nDescription: ${
                  project.description || "None"
                }`,
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
      {},
      async () => {
        try {
          const projects = await v0.projects.find();
          const projectList = projects.data
            ? projects.data
                .map(
                  (project: any) =>
                    `- ${project.id}: ${project.name} - ${
                      project.description || "No description"
                    }`
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

    // Get project by ID
    this.server.tool(
      "get_project_by_id",
      "Retrieve the details of a specific v0 project by its ID.",
      {
        projectId: z.string().describe("The ID of the project to retrieve"),
      },
      async ({ projectId }) => {
        try {
          const project = await v0.projects.getById({ projectId });

          return {
            content: [
              {
                type: "text",
                text: `Project Details:\n\nID: ${project.id}\nName: ${
                  project.name
                }\nDescription: ${
                  project.description || "None"
                }\nInstructions: ${project.instructions || "None"}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error getting project: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Get project by chat ID
    this.server.tool(
      "get_project_by_chat_id",
      "Retrieve the v0 project associated with a given chat. Useful for determining the context or scope of a chat session.",
      {
        chatId: z.string().describe("The ID of the chat"),
      },
      async ({ chatId }) => {
        try {
          const project = await v0.projects.getByChatId({ chatId });

          return {
            content: [
              {
                type: "text",
                text: `Associated Project:\n\nID: ${project.id}\nName: ${
                  project.name
                }\nDescription: ${project.description || "None"}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error getting project by chat ID: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Update project
    this.server.tool(
      "update_project",
      "Update the metadata of an existing project using its projectId. Supports changes to the project name and privacy setting.",
      {
        projectId: z.string().describe("The ID of the project to update"),
        name: z.string().optional().describe("New name for the project"),
        description: z.string().optional().describe("New description"),
        instructions: z.string().optional().describe("New instructions"),
      },
      async ({ projectId, name, description, instructions }) => {
        try {
          const result = await v0.projects.update({
            projectId,
            name,
            description,
            instructions,
          });

          return {
            content: [
              {
                type: "text",
                text: `Project updated successfully!\n\nProject ID: ${
                  result.id
                }${name ? `\nNew name: ${name}` : ""}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error updating project: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Assign project to chat
    this.server.tool(
      "assign_project_to_chat",
      "Link an existing v0 project to a specific chat. Helps group conversations under a shared project context.",
      {
        chatId: z.string().describe("The ID of the chat"),
        projectId: z.string().describe("The ID of the project to assign"),
      },
      async ({ chatId, projectId }) => {
        try {
          await v0.projects.assign({
            chatId,
            projectId,
          });

          return {
            content: [
              {
                type: "text",
                text: `Project ${projectId} assigned to chat ${chatId} successfully!`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error assigning project to chat: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // ===================
    // DEPLOYMENT TOOLS
    // ===================

    // Find deployments
    this.server.tool(
      "find_deployments",
      "Find deployments by project and chat IDs. This will return a list of deployments for the given project and chat IDs.",
      {
        projectId: z.string().describe("The project ID to filter by"),
        chatId: z.string().describe("The chat ID to filter by"),
        versionId: z.string().describe("The version ID to filter by"),
      },
      async ({ projectId, chatId, versionId }) => {
        try {
          const deployments = await v0.deployments.find({
            projectId,
            chatId,
            versionId,
          });

          const deploymentList = deployments.data
            ? deployments.data
                .map(
                  (deployment: any) =>
                    `- ${deployment.id}: ${deployment.webUrl || "No URL"}`
                )
                .join("\n")
            : "No deployments found";

          return {
            content: [
              {
                type: "text",
                text: `Found ${
                  deployments.data ? deployments.data.length : 0
                } deployments:\n\n${deploymentList}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error finding deployments: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Create deployment
    this.server.tool(
      "create_deployment",
      "Create a new deployment for a specific chat and version. This will trigger a deployment to Vercel.",
      {
        chatId: z.string().describe("The ID of the chat"),
        versionId: z.string().describe("The ID of the version to deploy"),
        projectId: z.string().describe("The ID of the project"),
      },
      async ({ chatId, versionId, projectId }) => {
        try {
          const deployment = await v0.deployments.create({
            chatId,
            versionId,
            projectId,
          });

          return {
            content: [
              {
                type: "text",
                text: `Deployment created successfully!\n\nDeployment ID: ${
                  deployment.id
                }\nWeb URL: ${deployment.webUrl || "Deploying..."}\nAPI URL: ${
                  deployment.apiUrl || "Not available"
                }`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error creating deployment: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Get deployment
    this.server.tool(
      "get_deployment",
      "Get a deployment by ID. This will return the details of the deployment, including the inspector URL, chat ID, project ID, version ID, API URL, and web URL.",
      {
        deploymentId: z.string().describe("The ID of the deployment"),
      },
      async ({ deploymentId }) => {
        try {
          const deployment = await v0.deployments.getById({ deploymentId });

          return {
            content: [
              {
                type: "text",
                text: `Deployment Details:\n\nID: ${deployment.id}\nWeb URL: ${
                  deployment.webUrl || "Not available"
                }\nAPI URL: ${
                  deployment.apiUrl || "Not available"
                }\nInspector URL: ${
                  deployment.inspectorUrl || "Not available"
                }\nChat ID: ${
                  deployment.chatId || "Not available"
                }\nProject ID: ${
                  deployment.projectId || "Not available"
                }\nVersion ID: ${deployment.versionId || "Not available"}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error getting deployment: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Delete deployment
    this.server.tool(
      "delete_deployment",
      "Delete a deployment by ID. This will delete the deployment from Vercel.",
      {
        deploymentId: z.string().describe("The ID of the deployment to delete"),
      },
      async ({ deploymentId }) => {
        try {
          await v0.deployments.delete({ deploymentId });

          return {
            content: [
              {
                type: "text",
                text: `Deployment ${deploymentId} deleted successfully!`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error deleting deployment: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Find deployment logs
    this.server.tool(
      "find_deployment_logs",
      "Retrieve logs for a specific deployment. Supports filtering by timestamp to fetch only recent logs.",
      {
        deploymentId: z.string().describe("The ID of the deployment"),
        since: z
          .string()
          .optional()
          .describe("Timestamp to fetch logs since (ISO string)"),
      },
      async ({ deploymentId, since }) => {
        try {
          const logs = await v0.deployments.findLogs({
            deploymentId,
            since,
          });

          return {
            content: [
              {
                type: "text",
                text: `Deployment Logs:\n\n${JSON.stringify(logs, null, 2)}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error finding deployment logs: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Find deployment errors
    this.server.tool(
      "find_deployment_errors",
      "Retrieve a list of errors that occurred during a specific deployment. Useful for diagnosing and debugging deployment issues.",
      {
        deploymentId: z.string().describe("The ID of the deployment"),
      },
      async ({ deploymentId }) => {
        try {
          const errors = await v0.deployments.findErrors({
            deploymentId,
          });

          return {
            content: [
              {
                type: "text",
                text: `Deployment Errors:\n\n${JSON.stringify(
                  errors,
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
                text: `Error finding deployment errors: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // ===================
    // INTEGRATION TOOLS
    // ===================

    // Create Vercel project integration
    this.server.tool(
      "create_vercel_project",
      "Create a new Vercel project integration for deployments.",
      {
        name: z.string().describe("Name of the Vercel project"),
        projectId: z.string().describe("Project ID to associate with"),
      },
      async ({ name, projectId }) => {
        try {
          const project = await v0.integrations.vercel.projects.create({
            name,
            projectId,
          });

          return {
            content: [
              {
                type: "text",
                text: `Vercel project created successfully!\n\nProject ID: ${project.id}\nName: ${project.name}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error creating Vercel project: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Find Vercel projects
    this.server.tool(
      "find_vercel_projects",
      "List existing Vercel project integrations.",
      {},
      async () => {
        try {
          const projects = await v0.integrations.vercel.projects.find();

          const projectList = projects.data
            ? projects.data
                .map((project: any) => `- ${project.id}: ${project.name}`)
                .join("\n")
            : "No Vercel projects found";

          return {
            content: [
              {
                type: "text",
                text: `Found ${
                  projects.data ? projects.data.length : 0
                } Vercel projects:\n\n${projectList}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error finding Vercel projects: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // ===================
    // WEBHOOK/HOOK TOOLS
    // ===================

    // Find hooks
    this.server.tool(
      "find_hooks",
      "Retrieve a list of existing hooks in your workspace. Useful for managing active webhooks tied to chat events or deployments.",
      {},
      async () => {
        try {
          const hooks = await v0.hooks.find();

          const hookList = hooks.data
            ? hooks.data
                .map(
                  (hook: any) =>
                    `- ${hook.id}: ${hook.name || "Unnamed"} -> ${
                      hook.url
                    } (Events: ${hook.events?.join(", ") || "None"})`
                )
                .join("\n")
            : "No hooks found";

          return {
            content: [
              {
                type: "text",
                text: `Found ${
                  hooks.data ? hooks.data.length : 0
                } hooks:\n\n${hookList}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error finding hooks: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Create hook
    this.server.tool(
      "create_hook",
      "Create a new webhook that listens for specific events. Supports optional association with a chat or project.",
      {
        name: z.string().describe("Name of the webhook"),
        url: z.string().describe("URL to send webhook events to"),
        events: z
          .array(
            z.enum([
              "chat.created",
              "chat.updated",
              "chat.deleted",
              "message.created",
              "message.updated",
              "message.deleted",
              "project.created",
              "project.updated",
              "project.deleted",
            ])
          )
          .describe("Array of events to listen for"),
        chatId: z
          .string()
          .optional()
          .describe("Optional chat ID to associate with"),
        projectId: z
          .string()
          .optional()
          .describe("Optional project ID to associate with"),
      },
      async ({ name, url, events, chatId, projectId }) => {
        try {
          const hook = await v0.hooks.create({
            name,
            url,
            events,
            chatId,
            projectId,
          });

          return {
            content: [
              {
                type: "text",
                text: `Hook created successfully!\n\nHook ID: ${
                  hook.id
                }\nName: ${hook.name}\nURL: ${hook.url}\nEvents: ${events.join(
                  ", "
                )}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error creating hook: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Get hook
    this.server.tool(
      "get_hook",
      "Retrieve the details of a specific webhook using its ID.",
      {
        hookId: z.string().describe("The ID of the hook"),
      },
      async ({ hookId }) => {
        try {
          const hook = await v0.hooks.getById({ hookId });

          return {
            content: [
              {
                type: "text",
                text: `Hook Details:\n\nID: ${hook.id}\nName: ${
                  hook.name || "Unnamed"
                }\nURL: ${hook.url}\nEvents: ${
                  hook.events?.join(", ") || "None"
                }\nChat ID: ${hook.chatId || "None"}\nProject ID: ${
                  hook.projectId || "None"
                }`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error getting hook: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Update hook
    this.server.tool(
      "update_hook",
      "Update the configuration of an existing webhook, including its name, event subscriptions, or target URL.",
      {
        hookId: z.string().describe("The ID of the hook to update"),
        name: z.string().optional().describe("New name for the hook"),
        url: z.string().optional().describe("New URL for the hook"),
        events: z
          .array(
            z.enum([
              "chat.created",
              "chat.updated",
              "chat.deleted",
              "message.created",
              "message.updated",
              "message.deleted",
              "project.created",
              "project.updated",
              "project.deleted",
            ])
          )
          .optional()
          .describe("New events to listen for"),
      },
      async ({ hookId, name, url, events }) => {
        try {
          const hook = await v0.hooks.update({
            hookId,
            name,
            url,
            events,
          });

          return {
            content: [
              {
                type: "text",
                text: `Hook updated successfully!\n\nHook ID: ${
                  hook.id
                }\nName: ${hook.name || "Unnamed"}\nURL: ${hook.url}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error updating hook: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // Delete hook
    this.server.tool(
      "delete_hook",
      "Delete a webhook based on its ID. This action is irreversible.",
      {
        hookId: z.string().describe("The ID of the hook to delete"),
      },
      async ({ hookId }) => {
        try {
          await v0.hooks.delete({ hookId });

          return {
            content: [
              {
                type: "text",
                text: `Hook ${hookId} deleted successfully!`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error deleting hook: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // ===================
    // USER TOOLS
    // ===================

    // Get user information
    this.server.tool(
      "get_user_info",
      "Retrieve information about the authenticated user, including their ID, name, email, and account metadata.",
      {},
      async () => {
        try {
          const user = await v0.user.get();
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

    // Get billing information
    this.server.tool(
      "get_user_billing",
      "Fetch billing usage and quota information for the authenticated user. Can be scoped to a specific context (e.g. project or namespace).",
      {
        scope: z
          .string()
          .optional()
          .describe("Optional scope to filter billing information"),
      },
      async ({ scope }) => {
        try {
          const billing = await v0.user.getBilling({ scope });
          return {
            content: [
              {
                type: "text",
                text: `Billing Information:\n\n${JSON.stringify(
                  billing,
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
                text: `Error getting billing info: ${
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
      "Return the current subscription plan for the authenticated user, including tier details and feature limits.",
      {},
      async () => {
        try {
          const plan = await v0.user.getPlan();
          return {
            content: [
              {
                type: "text",
                text: `User Plan:\n\nPlan: ${
                  plan.plan || "Unknown"
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

    // Get user scopes
    this.server.tool(
      "get_user_scopes",
      "Retrieve all accessible scopes for the authenticated user, such as personal workspaces or shared teams.",
      {},
      async () => {
        try {
          const scopes = await v0.user.getScopes();
          return {
            content: [
              {
                type: "text",
                text: `User Scopes:\n\n${JSON.stringify(scopes, null, 2)}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error getting user scopes: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // ===================
    // RATE LIMIT TOOLS
    // ===================

    // Check rate limits
    this.server.tool(
      "check_rate_limits",
      "Retrieve rate limit information for a given scope. Useful for monitoring usage limits and avoiding throttling.",
      {
        scope: z
          .string()
          .optional()
          .describe("Optional scope to check rate limits for"),
      },
      async ({ scope }) => {
        try {
          const rateLimits = await v0.rateLimits.find({ scope });
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
  }
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // Extract API key from key query parameter
    const apiKey = url.searchParams.get("key");
    console.log("apiKey", apiKey);
    if (!apiKey) {
      return new Response("Missing key query parameter", {
        status: 401,
      });
    }

    // Set the API key in context props
    ctx.props = {
      apiKey,
    };

    if (url.pathname === "/sse" || url.pathname === "/sse/message") {
      // @ts-ignore
      return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
    }

    if (url.pathname === "/mcp") {
      // @ts-ignore
      return MyMCP.serve("/mcp").fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
};
