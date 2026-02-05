import axios, { AxiosInstance } from 'axios';

/**
 * Create Axios HTTP client
 */
export function createAxiosClient(
  baseUrl: string,
  headers: Record<string, string>,
  timeout = 30000,
): AxiosInstance {
  return axios.create({
    baseURL: baseUrl,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    timeout,
  });
}

/**
 * Create GitHub API client
 */
export function createGitHubClient(baseUrl: string, token?: string): AxiosInstance {
  return createAxiosClient(baseUrl || 'https://api.github.com', {
    Accept: 'application/vnd.github.v3+json',
    ...(token && { Authorization: `Bearer ${token}` }),
  });
}

/**
 * Create GitLab API client
 */
export function createGitLabClient(baseUrl: string, token: string): AxiosInstance {
  return createAxiosClient(`${baseUrl}/api/v4`, {
    'PRIVATE-TOKEN': token,
  });
}

/**
 * Create Gitea API client
 */
export function createGiteaClient(baseUrl: string, token?: string): AxiosInstance {
  return createAxiosClient(`${baseUrl}/api/v1`, {
    ...(token && { Authorization: `token ${token}` }),
  });
}
