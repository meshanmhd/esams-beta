# Netlify Deployment Guide for ESAMS

This guide will help you deploy the ESAMS (Exam Seat Allocation Management System) to Netlify.

## 🚀 Quick Deployment Steps

### 1. Prepare Your Repository
- Ensure all changes are committed to your Git repository
- Push your code to GitHub, GitLab, or Bitbucket

### 2. Connect to Netlify
1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "New site from Git"
3. Choose your Git provider and select your repository
4. Configure the build settings (see below)

### 3. Build Settings
- **Build command**: `npm run build`
- **Publish directory**: `out`
- **Node version**: 18

### 4. Environment Variables
Set these environment variables in Netlify's site settings:

#### Required Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=https://your-site-name.netlify.app
```

#### Optional Environment Variables:
```
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=production
```

### 5. Deploy
- Click "Deploy site"
- Wait for the build to complete
- Your site will be available at `https://your-site-name.netlify.app`

## 🔧 Configuration Files

The project includes these Netlify-specific files:

### `netlify.toml`
- Main configuration file
- Defines build settings, redirects, and headers
- Optimized for Next.js static export

### `public/_redirects`
- Handles client-side routing
- Ensures all routes work properly in the SPA

### `next.config.ts`
- Configured for static export
- Optimized for Netlify deployment
- Includes bundle size optimizations

## 📦 Build Optimizations

### Size Reductions:
- ✅ Removed MCP server directory (not needed for frontend)
- ✅ Moved testing dependencies to optionalDependencies
- ✅ Enabled static export mode
- ✅ Optimized package imports
- ✅ Excluded unnecessary files from build

### Performance Features:
- ✅ Static file caching headers
- ✅ Image optimization disabled (required for static export)
- ✅ Compressed output
- ✅ Telemetry disabled

## 🛠️ Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check Node.js version (should be 18)
   - Verify all environment variables are set
   - Check build logs for specific errors

2. **Routing Issues**
   - Ensure `_redirects` file is in the `public` directory
   - Verify `netlify.toml` redirects are correct

3. **Environment Variables Not Working**
   - Double-check variable names (case-sensitive)
   - Ensure variables are set in Netlify dashboard
   - Redeploy after adding new variables

4. **Supabase Connection Issues**
   - Verify Supabase URL and keys are correct
   - Check Supabase project is active
   - Ensure RLS policies allow your domain

## 🔒 Security Considerations

- Environment variables are secure in Netlify
- Supabase RLS policies protect your data
- CORS headers are configured for API access
- Security headers are set for protection

## 📊 Monitoring

- Use Netlify's built-in analytics
- Monitor build times and deployment status
- Check function logs if using Netlify Functions

## 🔄 Updates

To update your deployment:
1. Push changes to your Git repository
2. Netlify will automatically trigger a new build
3. Monitor the deploy log for any issues

## 📞 Support

If you encounter issues:
1. Check the Netlify deploy logs
2. Verify your Supabase configuration
3. Test locally with `npm run build` first
4. Check this documentation for common solutions

---

**Note**: This deployment uses static export mode, which means some Next.js features like API routes won't work. If you need server-side functionality, consider using Netlify Functions or switching to a different hosting platform.
