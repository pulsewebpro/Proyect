/**
 * Puerta mínima verificable antes de publicar: analiza package.json del proyecto
 * (dependencias declaradas). No es SAST ni escaneo de vulnerabilidades CVE.
 */

export type PublishSecurityFinding = {
  code: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  detail: string;
};

const RISKY_PATTERNS: { code: string; re: RegExp; title: string; severity: 'high' | 'medium'; detail: string }[] = [
  {
    code: 'dep_file_protocol',
    re: /^\s*file:/i,
    title: 'Dependencia con protocolo file:',
    severity: 'high',
    detail: 'Las dependencias `file:` no se pueden resolver en el runtime de preview/publicación del producto.',
  },
  {
    code: 'dep_link_protocol',
    re: /^\s*link:/i,
    title: 'Dependencia con protocolo link:',
    severity: 'high',
    detail: 'Las dependencias `link:` no están soportadas en el bundler del proyecto.',
  },
  {
    code: 'dep_workspace',
    re: /^\s*workspace:/i,
    title: 'Dependencia workspace:',
    severity: 'medium',
    detail: 'Referencias `workspace:` no existen en el entorno de ejecución publicado.',
  },
];

function parseJsonObject(raw: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function collectDeps(root: Record<string, unknown>): { name: string; spec: string }[] {
  const out: { name: string; spec: string }[] = [];
  for (const key of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'] as const) {
    const block = root[key];
    if (!block || typeof block !== 'object' || Array.isArray(block)) continue;
    for (const [name, spec] of Object.entries(block as Record<string, unknown>)) {
      if (typeof spec === 'string') out.push({ name, spec });
    }
  }
  return out;
}

export function runPublishPackageJsonGate(files: { path: string; content: string }[]): {
  blocked: boolean;
  findings: PublishSecurityFinding[];
} {
  const pkg = files.find((f) => f.path === 'package.json' || f.path.endsWith('/package.json'));
  if (!pkg) {
    return {
      blocked: false,
      findings: [],
    };
  }
  const root = parseJsonObject(pkg.content);
  if (!root) {
    return {
      blocked: true,
      findings: [
        {
          code: 'package_json_invalid',
          title: 'package.json no válido',
          severity: 'high',
          detail: 'No se pudo analizar package.json como JSON.',
        },
      ],
    };
  }
  const deps = collectDeps(root);
  const findings: PublishSecurityFinding[] = [];
  for (const { name, spec } of deps) {
    for (const p of RISKY_PATTERNS) {
      if (p.re.test(spec)) {
        findings.push({
          code: p.code,
          title: `${p.title}: ${name}`,
          severity: p.severity,
          detail: `${p.detail} Valor: ${spec.slice(0, 120)}`,
        });
      }
    }
  }
  const blocked = findings.some((f) => f.severity === 'high');
  return { blocked, findings };
}
