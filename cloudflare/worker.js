import { Container, getContainer } from '@cloudflare/containers';

export class ReportContainer extends Container {
  defaultPort = 8080;
  sleepAfter = '10m';
  enableInternet = true;
  envVars = Object.fromEntries([
    'MONGO_URI', 'FIREBASE_SERVICE_ACCOUNT', 'SUPER_ADMIN_EMAILS',
    'FIREBASE_API_KEY', 'FIREBASE_AUTH_DOMAIN', 'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET', 'FIREBASE_MESSAGING_SENDER_ID', 'FIREBASE_APP_ID',
    'EMAIL_USER', 'EMAIL_PASS'
  ].filter(key => typeof this.env[key] === 'string').map(key => [key, this.env[key]]));
}

export default {
  fetch(request, env) {
    return getContainer(env.REPORT_CONTAINER, 'portal').fetch(request);
  }
};
