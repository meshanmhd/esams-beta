# Netlify Deployment Troubleshooting Guide

## Common Build Issues and Solutions

### 1. Package Lock File Sync Issues
**Error**: `npm ci can only install packages when your package.json and package-lock.json are in sync`

**Solution**: 
- Delete the existing `package-lock.json` and `node_modules`: `rm -rf package-lock.json node_modules`
- Run `npm install` to regenerate the lock file
- Commit the new `package-lock.json` to your repository
- Use `npm install` instead of `npm ci` in build commands for better compatibility

### 2. TypeScript Module Not Found
**Error**: `Cannot find module 'typescript'`

**Solution**: 
- Ensure TypeScript is installed as a dev dependency: `npm install typescript --save-dev`
- Verify it's in package.json under devDependencies

### 3. Build Command Fails with Exit Code 1/2
**Error**: `Command failed with exit code 1: npm run build`

**Solutions**:
- Use `npm ci` instead of `npm install` for more reliable builds
- Ensure all dependencies are properly listed in package.json
- Check Node.js version compatibility (use Node 18.12.1)
- Verify TypeScript is installed as dev dependency
- Check for any missing environment variables

### 4. Next.js Plugin Issues
**Error**: Plugin-related build failures

**Solutions**:
- Install `@netlify/plugin-nextjs` as dev dependency
- Configure plugin properly in netlify.toml
- Use correct publish directory (`.next`)

### 5. Environment Variables
**Error**: Missing environment variables

**Required Variables**:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-site-name.netlify.app
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=production
```

### 6. Build Configuration
**Current Configuration**:
- Build Command: `npm install && npm run build`
- Publish Directory: `.next`
- Node Version: 18.12.1 (specified in .nvmrc)
- Plugin: `@netlify/plugin-nextjs`
- Environment: Production with telemetry disabled
- Additional: Optimized npm settings for better compatibility

**Optimized Settings**:
- `NPM_CONFIG_AUDIT = "false"` - Disables npm audit
- `NPM_CONFIG_FUND = "false"` - Disables funding messages
- `NPM_CONFIG_UPDATE_NOTIFIER = "false"` - Disables update notifications
- `NPM_CONFIG_PROGRESS = "false"` - Disables progress bars
- `NPM_CONFIG_PACKAGE_LOCK = "true"` - Ensures package-lock.json is used

### 7. Alternative Build Commands
If the main build fails, try these alternatives:

1. **Basic Build**:
   ```bash
   npm run build
   ```

2. **Clean Install + Build**:
   ```bash
   npm ci && npm run build
   ```

3. **Force Clean Build**:
   ```bash
   rm -rf .next node_modules package-lock.json && npm install && npm run build
   ```

### 8. Debugging Steps
1. Check Netlify build logs for specific error messages
2. Verify all dependencies are installed correctly
3. Ensure TypeScript is properly configured
4. Check for any missing environment variables
5. Verify Node.js version compatibility

### 9. Node.js Version Issues
**Error**: Build failures related to Node.js version

**Solutions**:
- Ensure `.nvmrc` file contains `18.12.1`
- Verify `netlify.toml` specifies `NODE_VERSION = "18.12.1"`
- Use a stable LTS version of Node.js
- Avoid using just "18" - be specific with the version number

### 10. Fallback Configuration
If the Next.js plugin causes issues, try this simplified netlify.toml:

```toml
[build]
  command = "npm ci && npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"
  NODE_ENV = "production"
  NEXT_TELEMETRY_DISABLED = "1"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 11. Contact Support
If issues persist:
1. Check Netlify's build logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure the repository is properly connected to Netlify
4. Try deploying from a different branch to test
5. Use the fallback configuration if the main one fails
