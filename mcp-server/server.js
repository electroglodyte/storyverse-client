// server.js
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/schemas');
const tools = require('./tools');
const handlers = require('./handlers');

// Initialize MCP server
const setupServer = () => {
  const server = new Server(
    {
      name: "StoryVerse MCP Server",
      version: "0.3.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.error("Received list_tools request");
    return {
      tools: Object.values(tools)
    };
  });

  // Register tool handlers
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      console.error(`Received call_tool request for: ${request.params.name}`);
      const { name, arguments: args } = request.params;
      
      // Look up the appropriate handler
      const handlerName = name;
      if (!handlers[handlerName]) {
        throw new Error(`Unknown tool: ${name}`);
      }
      
      // Call the handler
      const result = await handlers[handlerName](args);
      
      // Format the response based on the handler's return value
      // ...response formatting logic...
      
      return result;
    } catch (error) {
      console.error("Error in call_tool handler:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
};

module.exports = { setupServer };