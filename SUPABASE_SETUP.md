# Supabase Setup Guide for Quiz App

This guide will help you set up Supabase as the backend database for your quiz app.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Node.js installed on your system
3. Basic knowledge of SQL

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter a project name (e.g., "quiz-app")
5. Enter a database password (save this securely)
6. Choose a region close to your users
7. Click "Create new project"

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to Settings → API
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)
   - **Service role key** (starts with `eyJ...`)

## Step 3: Configure Environment Variables

1. Open the `config.env` file in your project root
2. Replace the placeholder values with your actual Supabase credentials:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
PORT=3000
NODE_ENV=development
```

## Step 4: Set Up Database Schema

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the entire contents of `database-schema.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute the schema

This will create:

- `study_sets` table for storing study sets
- `flashcards` table for storing individual flashcards
- `study_sessions` table for tracking study sessions
- `session_answers` table for tracking individual card performance
- Row Level Security (RLS) policies for data protection
- Indexes for better performance

## Step 5: Install Dependencies

Run the following command in your project directory:

```bash
npm install
```

This will install:

- `@supabase/supabase-js` - Supabase client library
- `dotenv` - Environment variable management
- `cors` - Cross-origin resource sharing
- `nodemon` - Development server with auto-restart

## Step 6: Test the Setup

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Open your browser and go to `http://localhost:3000`

3. Try creating a study set and adding flashcards

## Step 7: Verify Database Connection

You can verify the connection by checking the server console. You should see:

```
Server running at http://localhost:3000
Supabase integration enabled
```

## Database Schema Overview

### Tables

1. **study_sets**

   - `id` - Primary key
   - `title` - Study set title
   - `description` - Study set description
   - `created_at` - Creation timestamp
   - `updated_at` - Last update timestamp
   - `user_id` - User who created the set (for future auth)
   - `is_public` - Whether the set is public

2. **flashcards**

   - `id` - Primary key
   - `study_set_id` - Foreign key to study_sets
   - `question` - Flashcard question
   - `answer` - Flashcard answer
   - `created_at` - Creation timestamp
   - `updated_at` - Last update timestamp
   - `order_index` - Display order

3. **study_sessions**

   - `id` - Primary key
   - `study_set_id` - Foreign key to study_sets
   - `user_id` - User who did the session (for future auth)
   - `started_at` - Session start time
   - `completed_at` - Session completion time
   - `total_cards` - Total cards in session
   - `correct_answers` - Number of correct answers
   - `incorrect_answers` - Number of incorrect answers

4. **session_answers**
   - `id` - Primary key
   - `session_id` - Foreign key to study_sessions
   - `flashcard_id` - Foreign key to flashcards
   - `is_correct` - Whether the answer was correct
   - `answered_at` - When the answer was given
   - `time_taken_ms` - Time taken to answer

## Security Features

- **Row Level Security (RLS)** - Ensures users can only access their own data
- **Prepared statements** - Prevents SQL injection
- **Environment variables** - Keeps sensitive data secure

## API Endpoints

The server provides the following REST API endpoints:

### Study Sets

- `GET /api/study-sets` - Get all study sets
- `POST /api/study-sets` - Create a new study set
- `PUT /api/study-sets/:id` - Update a study set
- `DELETE /api/study-sets/:id` - Delete a study set

### Flashcards

- `GET /api/study-sets/:id/flashcards` - Get flashcards for a study set
- `POST /api/study-sets/:id/flashcards` - Add a flashcard to a study set
- `PUT /api/flashcards/:id` - Update a flashcard
- `DELETE /api/flashcards/:id` - Delete a flashcard

### Study Sessions

- `GET /api/study-sessions` - Get all study sessions
- `POST /api/study-sessions` - Create a new study session
- `PUT /api/study-sessions/:id` - Update a study session

### Session Answers

- `POST /api/session-answers` - Record an answer during a study session

### Analytics

- `GET /api/analytics/study-sets` - Get study set analytics
- `GET /api/analytics/sessions` - Get session analytics

## Troubleshooting

### Common Issues

1. **"Missing Supabase configuration" error**

   - Check that your `config.env` file has the correct Supabase URL and keys
   - Ensure the file is in the project root directory

2. **Database connection errors**

   - Verify your Supabase project is active
   - Check that the database schema has been created
   - Ensure your service role key is correct

3. **CORS errors**

   - The server includes CORS middleware, but you may need to configure it for your specific domain

4. **Permission denied errors**
   - Check that the RLS policies are correctly set up
   - Verify the database schema was created successfully

### Getting Help

- Check the Supabase documentation: [docs.supabase.com](https://docs.supabase.com)
- Review the server console for detailed error messages
- Ensure all environment variables are properly set

## Next Steps

Once the basic setup is working, you can:

1. Add user authentication using Supabase Auth
2. Implement real-time features with Supabase Realtime
3. Add file storage for images using Supabase Storage
4. Set up automated backups
5. Configure monitoring and logging

## Security Notes

- Never commit your `config.env` file to version control
- Use environment variables for all sensitive data
- Regularly rotate your API keys
- Monitor your database usage and costs
- Set up proper backup strategies
