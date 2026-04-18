---
name: publish-obsidian-to-oss
description: >
  Guide users through setting up automatic publishing of Obsidian vault
  folders to Aliyun OSS as a static website via GitHub Actions.
  Uses inkpress-render-action for md-to-HTML rendering and
  aliyun-oss-website-action for OSS upload.
---

# Publish Obsidian to Aliyun OSS

Help the user set up a GitHub Actions workflow that automatically publishes
their Obsidian vault folders to Aliyun OSS as a static website.

## When to use

User wants to publish Obsidian content to Aliyun OSS using GitHub Actions
(the CI path). They likely already use obsidian-git or push their vault to GitHub.

## Prerequisites to check

Before starting, verify:
1. User has a GitHub repo containing their Obsidian vault
2. User has (or will create) an Aliyun OSS account

## Step-by-step guide

Ask these questions ONE AT A TIME. Wait for each answer before proceeding.

### Step 1: Identify publish directories

Ask: "Which directories in your vault do you want to publish as a website?
For example: `notes`, `guides`, `docs/public`. List them separated by commas."

### Step 2: OSS bucket setup

Ask: "Do you already have an Aliyun OSS bucket for this, or do we need to create one?"

**If they need to create one:**
Guide them:
1. Go to https://oss.console.aliyun.com/
2. Click "Create Bucket"
3. **Recommended region: Hong Kong (`oss-cn-hongkong`)** -- no ICP filing required
4. Bucket ACL: Public Read
5. Enable "Static Website Hosting": set index document to `index.html`

**If they have one:**
Ask for: bucket name, region, and whether static website hosting is enabled.

### Step 3: RAM sub-account (security)

Ask: "Do you have a RAM sub-account with OSS permissions, or are you using a root account AccessKey?"

**If root account or unsure:**
Guide them to create a RAM sub-account:
1. Go to https://ram.console.aliyun.com/users
2. Create user, enable "OpenAPI Access" (AccessKey)
3. Attach this custom policy:

```json
{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "oss:PutObject",
        "oss:DeleteObject",
        "oss:ListObjects",
        "oss:GetObject"
      ],
      "Resource": [
        "acs:oss:*:*:BUCKET_NAME",
        "acs:oss:*:*:BUCKET_NAME/*"
      ]
    }
  ]
}
```

Replace `BUCKET_NAME` with their actual bucket name.

4. Save the AccessKey ID and Secret -- they'll need these for GitHub secrets.

### Step 4: Custom domain (required for website access)

Ask: "Do you have a custom domain bound to this OSS bucket?
(OSS default domain forces file downloads -- a custom domain is required for web browsing.)"

**If no:**
Guide them:
1. Buy or use an existing domain
2. In OSS console -> bucket -> Domain Names -> Bind Custom Domain
3. Add a CNAME record at your DNS provider pointing to `BUCKET.oss-cn-hongkong.aliyuncs.com`
4. If using a mainland China region, the domain must have ICP filing

### Step 5: Generate workflow file

Based on the gathered information, generate and write `.github/workflows/publish.yml`:

```yaml
name: Publish Obsidian to OSS

on:
  push:
    branches: [main]
    paths:
      # Replace with user's actual directories
      - 'PUBLISH_DIR_1/**'
      - 'PUBLISH_DIR_2/**'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: fangbinwei/inkpress-render-action@v1
        with:
          vault-path: '.'
          publish-dirs: 'PUBLISH_DIR_1,PUBLISH_DIR_2'
          output-dir: '.site-output'

      - uses: fangbinwei/aliyun-oss-website-action@v1
        with:
          accessKeyId: ${{ secrets.OSS_ACCESS_KEY_ID }}
          accessKeySecret: ${{ secrets.OSS_ACCESS_KEY_SECRET }}
          bucket: ${{ secrets.OSS_BUCKET }}
          endpoint: ENDPOINT
          folder: '.site-output'
```

Replace ALL placeholders with the user's actual values before writing the file.

### Step 6: Configure GitHub secrets

Check if the user has `gh` CLI installed:

```bash
gh --version
```

**If gh is available:**

```bash
gh secret set OSS_ACCESS_KEY_ID
gh secret set OSS_ACCESS_KEY_SECRET
gh secret set OSS_BUCKET
```

**If gh is not available:**
Guide them to:
1. Go to their GitHub repo -> Settings -> Secrets and variables -> Actions
2. Add these repository secrets:
   - `OSS_ACCESS_KEY_ID`: their RAM sub-account AccessKey ID
   - `OSS_ACCESS_KEY_SECRET`: their RAM sub-account AccessKey Secret
   - `OSS_BUCKET`: their bucket name

### Step 7: Test the setup

Guide them to test:
1. Make a small change to one of the publish directories
2. Commit and push to main
3. Check GitHub Actions tab for the workflow run
4. Once complete, visit their custom domain to see the published site

## Troubleshooting

Common errors and fixes:

- **403 AccessDenied**: RAM policy doesn't include the bucket, or bucket ACL is not Public Read
- **Workflow not triggering**: Check that `paths` in the workflow matches the actual directory names
- **Site shows XML/download**: Static website hosting not enabled, or accessing via OSS default domain instead of custom domain
- **CNAME not working**: DNS propagation can take up to 48 hours; verify CNAME record is correct
