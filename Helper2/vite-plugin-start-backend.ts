import type { Plugin } from 'vite';
import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';

const API_START_BACKEND = '/api/start-backend';

export function startBackendPlugin(): Plugin {
  return {
    name: 'start-backend',
    configureServer(server) {
      server.middlewares.use((req: any, res: any, next: () => void) => {
        const pathname = (req.url || '').split('?')[0];
        if (pathname !== API_START_BACKEND) {
          next();
          return;
        }
        if (req.method !== 'POST' && req.method !== 'GET') {
          next();
          return;
        }

        const root = path.resolve(server.config.root || process.cwd());
        const backendDir = path.join(root, 'backend');
        const mainFile = path.join(backendDir, 'simple_main.py');

        const send = (status: number, data: object) => {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = status;
          res.end(JSON.stringify(data));
        };

        const run = () => {
          if (!fs.existsSync(mainFile)) {
            send(500, { ok: false, error: `Файл не найден: ${mainFile}` });
            return;
          }

          const isWin = process.platform === 'win32';
          try {
            const child = spawn(
              isWin ? 'python' : 'python3',
              ['simple_main.py'],
              {
                cwd: backendDir,
                detached: true,
                stdio: 'ignore',
                shell: true,
                env: { ...process.env },
              }
            );
            child.unref();
            send(200, { ok: true, message: 'Backend start requested' });
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            send(500, { ok: false, error: `Запуск не удался: ${message}` });
          }
        };

        if (req.method === 'GET') {
          run();
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk; });
        req.on('end', run);
      });
    },
  };
}
