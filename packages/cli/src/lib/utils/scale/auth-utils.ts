import { extractAuthDetails, extractAuthType } from './openai-utils';
import { AuthDetails, OpenAPISpec } from './types';

const generateAuthTemplate = (
  authType: string,
  authDetails: AuthDetails,
): string => {
  if (authType === 'oauth2') {
    return `
      export const ${authDetails.displayName} = BlockAuth.OAuth2({
        description: \`${authDetails.description}\`,
        authUrl: ${JSON.stringify(authDetails.authUrl)},
        tokenUrl: ${JSON.stringify(authDetails.tokenUrl)},
        required: ${authDetails.required},
        scope: ${JSON.stringify(authDetails.scope)},
      });
    `;
  } else if (authType === 'apikey') {
    return `
      export const ${authDetails.displayName} = BlockAuth.SecretText({
        displayName: ${JSON.stringify(authDetails.displayName)},
        required: ${authDetails.required},
        description: \`${authDetails.description}\`,
      });
    `;
  }
  return '';
};

export const generateAuth = async (
  openAPISpec: OpenAPISpec,
): Promise<string> => {
  const authType = await extractAuthType(openAPISpec);
  const authDetails = await extractAuthDetails(openAPISpec);

  return generateAuthTemplate(authType, authDetails);
};
