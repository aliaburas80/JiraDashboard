// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Human-readable error translations for cloud storage SDK errors.

interface ErrorExplanation {
  cause:  string;
  fix:    string;
}

// ── Pattern → explanation map ─────────────────────────────────────────────────

const ERROR_MAP: Array<{ pattern: RegExp | string; explanation: ErrorExplanation }> = [
  // ── AWS: No credentials found in any source ──────────────────────────────
  {
    pattern: /Could not load credentials from any providers/i,
    explanation: {
      cause: 'The AWS SDK tried every credential source and found nothing.\n\n'
           + 'It checks in this order:\n'
           + '  1. Explicit keys in the form (accessKeyId + secretAccessKey) — empty\n'
           + '  2. Environment variables: AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY — not set\n'
           + '  3. Shared credentials file: ~/.aws/credentials — not found or empty\n'
           + '  4. IAM instance role (EC2/ECS/Lambda) — not attached to this server\n\n'
           + 'All four sources failed.',
      fix:   'Choose one of these options:\n\n'
           + 'Option A — Fill in the form: Click "Change provider", enter your AWS Access Key ID and Secret Access Key, click Save.\n\n'
           + 'Option B — Environment variables: On your server, set:\n'
           + '  AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxx\n'
           + '  AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxx\n'
           + 'Then restart the app.\n\n'
           + 'Option C — AWS credentials file: Create ~/.aws/credentials with:\n'
           + '  [default]\n'
           + '  aws_access_key_id = AKIAxxxxxxxxxxxx\n'
           + '  aws_secret_access_key = xxxxxxxxxxxxxxxxxxxx\n\n'
           + 'Option D — IAM role: If your server runs on EC2/ECS/Lambda, attach an IAM role with S3 permissions.',
    },
  },
  // Azure
  {
    pattern: /Invalid URL/i,
    explanation: {
      cause: 'The connection string is missing or malformed.',
      fix:   'Azure connection strings start with "DefaultEndpointsProtocol=https;AccountName=...". '
           + 'Copy it from: Azure Portal → Storage Account → Access keys → key1 → Connection string. '
           + 'Or set AZURE_STORAGE_CONNECTION_STRING as a server environment variable.',
    },
  },
  {
    pattern: /AuthorizationFailure|AuthenticationFailed|403/,
    explanation: {
      cause: 'The credentials were rejected by the cloud provider.',
      fix:   'Double-check your Access Key / Connection String / Service Account. '
           + 'For AWS S3, verify the IAM user has s3:ListBucket, s3:PutObject, s3:GetObject permissions. '
           + 'For Azure, make sure the connection string is from the correct storage account. '
           + 'For GCP, ensure the service account has Storage Object Admin role.',
    },
  },
  {
    pattern: /NoSuchBucket|BucketNotFound|ContainerNotFound|does not exist/i,
    explanation: {
      cause: 'The bucket or container name does not exist in your cloud account.',
      fix:   'Check the bucket/container name for typos. Create it in your cloud console first, then try again.',
    },
  },
  {
    pattern: /ENOTFOUND|getaddrinfo|name or service not known/i,
    explanation: {
      cause: 'DNS lookup failed — the server cannot reach the cloud provider.',
      fix:   'Check your server\'s internet connectivity. If using a custom endpoint (MinIO/Backblaze), '
           + 'verify the endpoint URL is correct and reachable from the server.',
    },
  },
  {
    pattern: /ECONNREFUSED|ECONNRESET|ETIMEDOUT/i,
    explanation: {
      cause: 'The connection to the cloud provider was refused or timed out.',
      fix:   'The server may be behind a firewall blocking outbound HTTPS (port 443). '
           + 'Check your server\'s firewall/security group rules. '
           + 'For a custom endpoint, verify it is running and accessible.',
    },
  },
  {
    pattern: /InvalidAccessKeyId|InvalidClientTokenId/i,
    explanation: {
      cause: 'The AWS Access Key ID is invalid or does not exist.',
      fix:   'Regenerate the access key in AWS IAM → Users → your user → Security credentials. '
           + 'Make sure you copied the full key without spaces.',
    },
  },
  {
    pattern: /SignatureDoesNotMatch|InvalidSignature/i,
    explanation: {
      cause: 'The AWS Secret Access Key is incorrect.',
      fix:   'The secret access key is only shown once at creation. If lost, create a new access key pair in AWS IAM.',
    },
  },
  {
    pattern: /SyntaxError|JSON/i,
    explanation: {
      cause: 'The Service Account JSON is not valid JSON.',
      fix:   'Paste the entire contents of the downloaded .json file. '
           + 'Do not edit or trim the file — it must be valid JSON with all fields intact.',
    },
  },
  {
    pattern: /invalid_grant|invalid credentials/i,
    explanation: {
      cause: 'The GCP service account credentials have been revoked or are expired.',
      fix:   'Create a new key for the service account in Google Cloud Console → IAM → Service Accounts → your account → Keys → Add key.',
    },
  },
  {
    pattern: /No connection string|AZURE_STORAGE_CONNECTION_STRING/,
    explanation: {
      cause: 'No Azure connection string is configured.',
      fix:   'Either enter the connection string in the form, or set the AZURE_STORAGE_CONNECTION_STRING environment variable on your server.',
    },
  },
  {
    pattern: /credential|credentials/i,
    explanation: {
      cause: 'No cloud credentials could be found.',
      fix:   'Either fill in the credentials in the form, or configure environment variables: '
           + 'AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY for S3, '
           + 'AZURE_STORAGE_CONNECTION_STRING for Azure, '
           + 'GOOGLE_APPLICATION_CREDENTIALS for GCP.',
    },
  },
];

// ── Main translator ───────────────────────────────────────────────────────────

export interface FriendlyStorageError {
  raw:   string;
  cause: string;
  fix:   string;
}

export function explainStorageError(err: unknown): FriendlyStorageError {
  const raw = err instanceof Error ? err.message : String(err);

  for (const { pattern, explanation } of ERROR_MAP) {
    const matches = typeof pattern === 'string'
      ? raw.includes(pattern)
      : pattern.test(raw);
    if (matches) {
      return { raw, ...explanation };
    }
  }

  // Fallback — no pattern matched
  return {
    raw,
    cause: 'An unexpected error occurred connecting to the cloud provider.',
    fix:   'Check the browser console and server logs for more detail. '
         + 'Ensure the bucket/container exists, credentials are correct, '
         + 'and the server can reach the internet.',
  };
}

export function formatStorageError(err: unknown): string {
  const { raw, cause, fix } = explainStorageError(err);
  return `${cause}\n\nHow to fix: ${fix}\n\nRaw error: ${raw}`;
}
