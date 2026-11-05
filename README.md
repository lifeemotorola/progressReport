# Progress report portal

The portal uses an Express/Node.js backend, MongoDB (including GridFS uploads), and Firebase Authentication. The Cloudflare configuration runs the existing app in a **Cloudflare Container**, accessed through a Worker, on one origin. It does not deploy the Node server to Cloudflare Pages.

> **Do not deploy this portal publicly with real student records yet.** The existing student lookup returns a report using only the student ID; the name check happens in the browser, not on the server. Upload and file-download endpoints also lack authentication. These and other authorization and dependency issues need a security review and fixes before production use. `npm audit` reports vulnerabilities. This setup is a migration starting point, not a security certification.

## Recovering the old application

Render environment variables cannot be reconstructed from this repository. Check any old Render account, password manager, local `.env`, deployment records, and backups. Do not post secrets in chat or commit them. The records may still exist independently in the old MongoDB Atlas cluster, and instructor accounts may still exist in the old Firebase project. Recovering access to those projects is preferable to creating new ones. A new database or Firebase project starts empty; it does not restore old data or accounts. The app's JSON backup endpoint does not include GridFS file contents.

## Create the services

1. Create a MongoDB Atlas project, cluster, database user and database. Configure its network access to permit connections from the container. Cloudflare container outbound IPs may not be fixed; if using Atlas's `0.0.0.0/0` rule, understand the exposure and use strong, least-privilege database credentials. Copy the connection URI, including a database name and URL-encoded password, as `MONGO_URI`.
2. Create a Firebase project and register a web app. Enable **Authentication → Sign-in method → Email/Password**. Copy the web app config into the six `FIREBASE_*` web settings listed below. Add your Cloudflare Worker/custom domain to Firebase Authentication's authorized domains. For production, restrict API keys as appropriate without breaking Firebase Auth.
3. In Firebase project settings → Service accounts, generate a new private key. Its complete JSON is `FIREBASE_SERVICE_ACCOUNT`; it must remain secret. Use a dedicated service account with only the permissions needed, and rotate any exposed key. Create the instructor accounts and verify their email addresses; the backend requires verified email. Set `SUPER_ADMIN_EMAILS` to a comma-separated list of verified administrator emails. There are no default super-admins.
4. Optional: set `EMAIL_USER` and `EMAIL_PASS` to a Gmail account and its app password for password-reset emails. Email features will fail without them. Do not use your regular Gmail password.

## Deploy to Cloudflare

Cloudflare Containers require an eligible Workers plan and can incur charges; review Cloudflare's current pricing. This configuration is not yet tested against a live Cloudflare account.

### Deploy using Cloudflare Workers Builds

Connect the repository to the `progressreport` Worker. In **Settings → Build**, set:

- Build command: `npm run prepare:container`
- Deploy command: `npx wrangler deploy`
- Root directory: the repository root (leave blank if that is the default).

Save the settings and deploy the commit containing this change. The build command installs production dependencies into an ignored staging directory on Cloudflare's Linux x64 build host. `.node-version` selects Node 22 to match the Docker image. The Dockerfile copies those dependencies without running a command inside Docker, avoiding the `error mounting "proc" ... operation not permitted` failure seen in Workers Builds. If `NODE_VERSION` is set in build variables, remove it or set it to `22`; build-variable overrides take precedence. The fix still needs verification in your Cloudflare account.

### Deploy locally instead

On Linux x64 with Node.js 22, a running Docker daemon and access to your Cloudflare account:

```sh
npm install --legacy-peer-deps
npm run prepare:container
npx wrangler login
npx wrangler deploy
```

The staging step must run before every Docker build, and is intentionally restricted to Linux x64 with Node 22 so dependencies match the image. A macOS, Windows, or ARM host should use Cloudflare Workers Builds or prepare the build in a matching Linux x64 environment instead.

Set each value via Cloudflare's Worker settings as a secret, or use `npx wrangler secret put NAME` and enter the value securely when prompted. Never place real secrets in `wrangler.jsonc`, source files, or shell history. `FIREBASE_SERVICE_ACCOUNT` must be the complete JSON object, including its private key; when entering it via the CLI use compact single-line JSON. Configure the following names:

| Name | Purpose |
| --- | --- |
| `MONGO_URI` | Atlas connection string (secret) |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service-account JSON (secret) |
| `SUPER_ADMIN_EMAILS` | Comma-separated administrator emails |
| `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID` | Firebase web app config; served publicly by `/api/config/firebase`, not secrets |
| `EMAIL_USER`, `EMAIL_PASS` | Optional Gmail account and app password (keep password secret) |

After changing settings, redeploy/restart the container so it receives new values. Open the Worker URL, add its domain to Firebase authorized domains, and test verified instructor login, saving and viewing a test student, file uploads, and email. For a custom domain, configure it on the Worker and authorize it in Firebase as well. The frontend and API use the same origin; no old Render URL is required.

The container sleeps after inactivity. **The existing in-process Sunday email backup is not reliable in a sleeping container** and must not be relied on. Arrange and test an independent MongoDB backup solution, including GridFS files, before storing real data. Local container files are ephemeral. Deploying multiple replicas would also cause the in-process scheduler to run multiple times.

## Local development

Copy `.env.example` to `.env` and fill it in privately. For `FIREBASE_SERVICE_ACCOUNT`, use compact JSON in a quoted dotenv value, or put a service account file named `serviceAccountKey.json` in the repository root for local development only. Both are ignored by Git and excluded from the Docker image. Then:

```sh
npm install --legacy-peer-deps
npm start
```

Visit `http://localhost:3000`. The server requires a reachable MongoDB and valid Firebase settings for the corresponding features. Never serve the repository root as a static directory: it may contain secrets.
