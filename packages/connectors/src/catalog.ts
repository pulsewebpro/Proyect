export type ConnectorType =
  | 'github'
  | 'slack'
  | 'notion'
  | 'shopify'
  | 'posthog'
  | 'rest'
  | 'mcp';

export const CONNECTOR_CATALOG: { type: ConnectorType; label: string; mock: boolean }[] = [
  { type: 'github', label: 'GitHub', mock: false },
  { type: 'slack', label: 'Slack', mock: true },
  { type: 'notion', label: 'Notion', mock: true },
  { type: 'shopify', label: 'Shopify', mock: true },
  { type: 'posthog', label: 'PostHog', mock: true },
  { type: 'rest', label: 'API REST genérica', mock: true },
  { type: 'mcp', label: 'MCP genérico', mock: true },
];
