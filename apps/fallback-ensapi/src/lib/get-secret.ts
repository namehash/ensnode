import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient();

export const getSecret = async (secretId: string | undefined, key: string) => {
  // in dev mode...
  if (process.env.NODE_ENV !== "production") {
    const value = process.env[key];
    if (!value) throw new Error(`${key} not found in process.env, make sure to provide .env.local`);

    return value;
  }

  if (!secretId) throw new Error(`Unable to fetch secret for ${key}: secretId undefined.`);

  // fetch secret
  const response = await client.send(new GetSecretValueCommand({ SecretId: secretId }));

  // parse into string
  const secretString = response.SecretString ?? response.SecretBinary?.toString();
  if (!secretString) throw new Error(`Unable to fetch secret ${secretId}`);

  // because secret is set via console, it is guaranteed to be JSON object with key
  const value = JSON.parse(secretString)[key] as string | undefined;

  if (!value) {
    throw new Error(`Secret not found via ${secretId}, expected JSON object including ${key}.`);
  }

  return value;
};
