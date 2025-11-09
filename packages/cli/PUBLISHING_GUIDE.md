# Publishing @gicm/cli to npm

## Current Status

✅ Package built successfully (`dist/` folder contains compiled code)
✅ Package structure validated (22 files, 53.5 kB unpacked)
❌ Not logged into npm
❌ `@gicm` scope not yet created on npm

## Options for Publishing

### Option 1: Publish as `@gicm/cli` (Scoped Package) - RECOMMENDED

**Pros:**
- Professional namespace
- Matches all install commands in marketplace
- No changes needed to registry

**Requirements:**
1. Create npm organization `@gicm`
2. Log in to npm
3. Publish as public scoped package

**Steps:**

```bash
# 1. Login to npm
npm login
# Enter your username, password, and email

# 2. Create organization (one-time)
# Go to: https://www.npmjs.com/org/create
# Organization name: gicm
# Make it public (free)

# 3. Publish package
cd packages/cli
npm publish --access public
```

**Cost:** FREE (public organizations are free on npm)

---

### Option 2: Publish as `gicm-cli` (No Scope)

**Pros:**
- No organization required
- Simpler setup

**Cons:**
- Requires updating ALL 389 marketplace install commands
- Breaks existing install command format

**Steps:**

```bash
# 1. Update package.json
# Change: "name": "@gicm/cli"
# To: "name": "gicm-cli"

# 2. Update all registry install commands (389 items)
# Change: npx @gicm/cli add agent/slug
# To: npx gicm-cli add agent/slug

# 3. Publish
npm login
npm publish
```

**NOT RECOMMENDED** - Requires major refactoring

---

### Option 3: Use Existing npm Account Scope

If you already have an npm organization:

```bash
# Update package.json to use your scope
# Change: "name": "@gicm/cli"
# To: "name": "@your-org/cli"

# Then publish
npm publish --access public
```

---

## Recommended Publishing Workflow (Option 1)

### Step 1: Create npm Account (if needed)

1. Go to [npmjs.com/signup](https://www.npmjs.com/signup)
2. Create account with email verification
3. Enable 2FA for security

### Step 2: Create `@gicm` Organization

1. Log in to [npmjs.com](https://www.npmjs.com)
2. Go to [npmjs.com/org/create](https://www.npmjs.com/org/create)
3. Enter organization name: `gicm`
4. Select "unlimited public packages" (FREE)
5. Click "Create"

### Step 3: Publish Package

```bash
# Navigate to CLI directory
cd packages/cli

# Login to npm
npm login
# Username: <your-username>
# Password: <your-password>
# Email: <your-email>
# OTP (if 2FA enabled): <6-digit-code>

# Verify you're logged in
npm whoami
# Should output your username

# Publish package
npm publish --access public
```

### Step 4: Verify Publication

```bash
# Check package is live
npm view @gicm/cli

# Test installation (in a different directory)
cd /tmp
npx @gicm/cli add agent/code-reviewer
```

### Step 5: Test All Item Types

```bash
# Test each item type
npx @gicm/cli add agent/icm-anchor-architect
npx @gicm/cli add skill/anchor-macros-deep-dive
npx @gicm/cli add command/anchor-init
npx @gicm/cli add mcp/github
npx @gicm/cli add setting/mcp-timeout-duration

# Verify files were created
ls -R .claude/
```

---

## Troubleshooting

### Error: "need auth"

```bash
npm error code ENEEDAUTH
npm error need auth This command requires you to be logged in.
```

**Solution:** Run `npm login`

---

### Error: "scope not found"

```bash
npm error code E404
npm error 404 Scope not found: @gicm
```

**Solution:** Create the organization at [npmjs.com/org/create](https://www.npmjs.com/org/create)

---

### Error: "package already exists"

```bash
npm error code EEXIST
npm error Package already exists
```

**Solution:**
1. Check if package exists: `npm view @gicm/cli`
2. If it's yours, increment version in `package.json`
3. If it's someone else's, choose different name

---

### Error: "payment required"

```bash
npm error code E402
npm error 402 Payment Required
```

**Solution:** Make sure to:
1. Use `--access public` flag when publishing
2. Create organization as "unlimited public packages" (free tier)

---

## Post-Publishing Checklist

- [ ] Package published successfully
- [ ] `npm view @gicm/cli` shows correct version
- [ ] Test `npx @gicm/cli add agent/code-reviewer` works
- [ ] Test all 5 item types install correctly
- [ ] Update marketplace deployment (Vercel should auto-deploy)
- [ ] Verify marketplace shows correct install commands
- [ ] Test end-to-end: Browse item → Copy install command → Run command → Verify files

---

## Package Info

```
Package name:    @gicm/cli
Version:         1.0.0
Size:            13.6 kB (compressed)
Unpacked:        53.5 kB
Files:           22
Description:     Official CLI for gICM marketplace
Repository:      https://github.com/Kermit457/gICM
```

---

## Next Steps After Publishing

1. **Announce Launch**
   - Update README with npm badge
   - Share on social media
   - Update marketplace homepage

2. **Monitor Usage**
   - Check npm download stats
   - Track install errors
   - Gather user feedback

3. **Future Updates**
   - Add `search` command
   - Add `list` command
   - Add `remove` command
   - Add `update` command

---

## Commands Reference

```bash
# Publishing
npm login                              # Authenticate
npm publish --access public            # Publish scoped package
npm version patch                      # Bump version (1.0.0 → 1.0.1)
npm version minor                      # Bump version (1.0.0 → 1.1.0)
npm version major                      # Bump version (1.0.0 → 2.0.0)

# Testing
npm pack --dry-run                     # Preview package contents
npm view @gicm/cli                     # View published package info
npm unpublish @gicm/cli --force        # Remove package (use carefully!)

# Linking (for local development)
npm link                               # Link package globally
npm link @gicm/cli                     # Use linked package in project
```

---

**Status:** Package is ready to publish. Just need npm login and @gicm organization setup.
