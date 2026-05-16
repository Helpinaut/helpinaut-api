export const ApiErrorsConfig = {
  AUTH_INVALID_CREDENTIALS: {
    code: 'AUTH_INVALID_CREDENTIALS',
    message: 'Invalid email or password',
  },
  AUTH_INVALID_TOKEN: {
    code: 'AUTH_INVALID_TOKEN',
    message: 'Invalid Json Web Token payload',
  },
  UNIQUE_FIELD_CONFLICT: {
    code: 'UNIQUE_FIELD_CONFLICT',
    message: 'Field is already in use',
  },
  RELATED_ENTITY_NOT_FOUND: {
    code: 'RELATED_ENTITY_NOT_FOUND',
    message: 'Related entity does not exist',
  },
  RESOURCE_NOT_FOUND: {
    code: 'RESOURCE_NOT_FOUND',
    message: 'Resource not found',
  },
  RESOURCE_NOT_AUTHORIZED: {
    code: 'RESOURCE_NOT_AUTHORIZED',
    message: 'You are not authorized to modify this resource',
  },
  INTERNAL_SERVER_ERROR: {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
  },
};
