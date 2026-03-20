# IdeaSpark

## Overview
**IdeaSpark** is an AI-powered brainstorming application designed to help you generate original, practical, and exciting ideas across various categories.

## How it Works
Select a category (e.g., Startup, Writing, Design, Marketing), provide an optional custom prompt with specific details, and hit **Generate**. The application leverages an AI model to instantly produce 5 creative ideas, complete with catchy titles, clear descriptions, and a "why it's cool" factor. 

You can also save your favorite ideas to your personal collection for later review, or use the "Surprise Me" feature to generate ideas for a randomly selected category.

## Technical Stack
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion for animations
- **UI Components**: Shadcn UI (Radix UI + Lucide React)
- **Database**: Supabase (Postgres)
- **Data Fetching**: TanStack React Query

## Local Development Prerequisites

1.  Clone the repository using the project's Git URL.
2.  Navigate to the project directory.
3.  Install dependencies: 
    ```bash
    npm install
    ```
4.  Create an `.env.local` file and set the required environment variables for your Supabase project:

    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

5.  **Database Setup**:
    Ensure you have the following tables created in your Supabase project (Snake Case):
    - `saved_ideas`: For storing favorite ideas.
    - `prompt_history`: For logging the history of generated prompts.

6.  Run the development server: 
    ```bash
    npm run dev
    ```

## Setup Notes
- **API Keys**: Once the AI provider is confirmed (e.g., OpenAI), you will need to add your API key to the environment variables to enable real idea generation.
- Ensure all UI components are correctly located in `src/components/ui`.
