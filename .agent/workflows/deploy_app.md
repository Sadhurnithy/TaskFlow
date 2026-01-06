---
description: How to deploy the application to Vercel
---

# Deploy Application

1.  **Read the Guide**: Review the comprehensive deployment guide.
    // turbo
    [Read Guide](file:///C:/Users/sathu/.gemini/antigravity/brain/63278299-559c-42e2-b0db-ec01ce1302b7/deployment.md)

2.  **Prepare Database**: Ensure you have a production database (Neon/Supabase) ready.
    -   Need to run migrations? Use: `npx prisma migrate deploy`

3.  **Check Build**: Verify your application builds locally before deploying.
    // turbo
    npm run build

4.  **Push Code**: Commit and push your latest changes to GitHub.

5.  **Deploy**: Connect your repo to Vercel and add environment variables.
