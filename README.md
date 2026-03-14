# My Blog

A simple, markdown-based personal blog built with Next.js 15, TypeScript, and CSS variables.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000 in your browser
```

## Writing Posts

1. Go to http://localhost:3000/write
2. Fill in the title, date, tags, and description
3. Write your post in markdown in the left panel
4. See the preview in real-time on the right panel
5. Click "Save Post" to save it to `/posts` folder

## Features

- 📝 Write posts in markdown format
- 🔍 Full-text search across posts
- 🏷️ Filter posts by tags
- 🌙 Dark mode support (automatic + toggle)
- ⚡ Fast and minimal (no external dependencies for styling)
- 📱 Responsive design

## Project Structure

- `/posts` - Markdown files for blog posts
- `/src/app` - Next.js app router pages
- `/src/components` - React components
- `/src/lib` - Utility functions and data access
- `/src/hooks` - Custom React hooks

## Building for Production

```bash
npm run build
npm run start
```

## Deployment

The blog is ready to be deployed on Vercel:

1. Push to GitHub
2. Connect your repository to Vercel
3. Environment variables: none required for local development

Posts are automatically loaded from the `/posts` folder during build time.
