-- Store a per-connection encrypted Jira API token/PAT.
ALTER TABLE "JiraConnection" ADD COLUMN "apiTokenEncrypted" TEXT;
