import { prisma } from '@amable/db';

export async function ensureDefaultFiles(projectId: string) {
  const count = await prisma.projectFile.count({ where: { projectId } });
  if (count > 0) return;
  const files = [
    {
      path: 'src/App.tsx',
      content: `export default function App() {\n  return (\n    <main style={{ fontFamily: 'system-ui', padding: 24 }}>\n      <h1>Vista previa Amable Studio</h1>\n      <p>Describe cambios en el compositor y usa modo Construir.</p>\n    </main>\n  );\n}\n`,
    },
    {
      path: 'package.json',
      content: JSON.stringify({ name: 'preview', private: true }, null, 2),
    },
  ];
  for (const f of files) {
    const hash = simpleHash(f.content);
    await prisma.projectFile.create({
      data: {
        projectId,
        path: f.path,
        content: f.content,
        hash,
        size: Buffer.byteLength(f.content, 'utf8'),
      },
    });
  }
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return `h${(h >>> 0).toString(16)}`;
}
