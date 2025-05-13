# StoryVerse Client

StoryVerse is a comprehensive system designed to help authors analyze, understand, and maintain consistency in their writing style. It offers tools to analyze writing samples, create style profiles, and instruct Claude to write in a specific style.

## Features

- **Writing Sample Management**: Upload, view, and organize writing samples
- **Style Analysis**: Analyze your writing to identify style characteristics
- **Style Profiles**: Create and manage profiles based on your writing samples
- **Claude Integration**: Use Claude to write in your specific style

## Project Structure

- **React + TypeScript**: Built with React and TypeScript for type safety
- **Tailwind CSS**: Styling using Tailwind CSS
- **Vite**: Fast build tooling with Vite
- **Supabase**: Backend database and authentication

## UI Screens

The application includes the following main screens:

- **Dashboard**: Overview of key features with quick access cards
- **Writing Samples**: Browse, filter, and manage writing samples
- **Style Analysis**: View and create style profiles
- **Claude Assistant**: Interface for using Claude with your writing style

## Development

To run the development server:

```bash
npm install
npm run dev
```

## Build

To build for production:

```bash
npm run build
```

## Deployment

This project is deployed on Vercel and automatically updates when changes are pushed to the main branch.

## MCP Server

The MCP server for Claude integration is in a separate repository. See the main project documentation for details on setting up the MCP server.

## Recent Changes

- **UI Update (May 2025)**: Refreshed the UI to match the design mockups
- **SideNav Improvements**: Updated sidebar navigation with better icons and styling
- **Dashboard Cards**: Implemented feature cards on the dashboard for quick access
- **Empty States**: Added helpful empty states for when no data is available

## License

MIT License
