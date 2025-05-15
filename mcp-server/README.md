# StoryVerse MCP Server

This directory contains the Model Context Protocol (MCP) server for the StoryVerse application.

## Directory Structure

The MCP server code is organized as follows:

```
mcp-server/
├── config.js           # Supabase configuration
├── server.js           # MCP server setup
├── index.js            # Main entry point
├── tools/              # Tool definitions
│   ├── index.js        # Exports all tools
│   ├── style-tools.js  # Style analysis tools
│   ├── narrative-tools.js # Narrative structure tools
│   └── entity-tools.js # Entity creation tools
├── handlers/           # Implementation functions
│   ├── index.js        # Exports all handlers
│   ├── style-handlers.js # Style analysis handlers
│   ├── narrative-handlers.js # Narrative structure handlers
│   ├── entity-handlers.js # Entity creation handlers
│   └── scene-handlers.js # Scene management handlers
└── utils/              # Utility functions
    └── helpers.js      # Common helper functions
```

## Running the Server

To run the MCP server:

1. Install dependencies: `npm install`
2. Set up environment variables in `.env` file (see `.env.example`)
3. Start the server: `node index.js`

## MCP Tools

The server implements various tools for:

- Style Analysis (analyze samples, create profiles, etc.)
- Narrative Structure (manage events, characters, timelines, etc.)
- Entity Creation (create story worlds, characters, locations, etc.)
- Scene Management (import/export scenes, version control, etc.)

See `src/mcp-tools.ts` for a complete list of tools and their descriptions.

## Usage

This server is designed to be used with Claude or another AI assistant that supports the Model Context Protocol. It provides tools for the AI to help with writing and story development tasks.

## Development

To add a new tool:

1. Define the tool in the appropriate `tools/*.js` file
2. Implement the handler in the appropriate `handlers/*.js` file
3. Export the tool and handler through the respective index.js files
4. Update the tools list in `src/mcp-tools.ts` if needed
