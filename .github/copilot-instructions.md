<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Test API Veri Dökümantasyonu Project

This is a full-stack application with:
- **Backend**: Node.js + Express.js (Port 3001)
- **Database**: PostgreSQL
- **Frontend**: Next.js + React + TypeScript (Port 3000)
- **Styling**: Tailwind CSS

## Project Structure
- `/server/` - Express.js backend server
- `/src/app/` - Next.js frontend application
- `/src/components/` - React components

## Key Features
- API data synchronization from external service
- Hierarchical data display with expandable tree structure
- Three-level account code breakdown (3-digit, 5-digit, full code)
- Real-time data sync with PostgreSQL database
- Responsive UI with Tailwind CSS

## Environment Variables
Configure `.env.local` with database and API settings.

## Database Schema
- `accounts` table: account_code, total_debt, timestamps
- `sync_log` table: sync history and status

## API Endpoints
- GET `/api/accounts` - All accounts
- GET `/api/accounts/hierarchy` - Hierarchical structure  
- POST `/api/sync` - Manual sync
- GET `/api/sync-log` - Sync history
