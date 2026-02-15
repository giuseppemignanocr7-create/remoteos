import * as fs from 'fs';
import * as path from 'path';
import type { ToolResult } from './executor';

export async function readFileContent(params: Record<string, unknown>): Promise<ToolResult> {
  const filePath = params.path as string;
  if (!filePath) {
    return { success: false, output: 'Missing "path" parameter', exitCode: 1, errorCode: 'MISSING_PARAM' };
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, output: content, exitCode: 0 };
  } catch (err: any) {
    return { success: false, output: `Read failed: ${err.message}`, exitCode: 1, errorCode: 'READ_ERROR' };
  }
}

export async function readLog(params: Record<string, unknown>): Promise<ToolResult> {
  const filePath = params.path as string;
  const lines = (params.lines as number) || 100;
  if (!filePath) {
    return { success: false, output: 'Missing "path" parameter', exitCode: 1, errorCode: 'MISSING_PARAM' };
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const allLines = content.split('\n');
    const tail = allLines.slice(-lines).join('\n');
    return { success: true, output: tail, exitCode: 0 };
  } catch (err: any) {
    return { success: false, output: `Read log failed: ${err.message}`, exitCode: 1, errorCode: 'READ_ERROR' };
  }
}

export async function writeFileContent(params: Record<string, unknown>): Promise<ToolResult> {
  const filePath = params.path as string;
  const content = params.content as string;
  if (!filePath || content === undefined || content === null) {
    return { success: false, output: 'Missing "path" or "content" parameter', exitCode: 1, errorCode: 'MISSING_PARAM' };
  }
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true, output: `Written ${content.length} bytes to ${filePath}`, exitCode: 0 };
  } catch (err: any) {
    return { success: false, output: `Write failed: ${err.message}`, exitCode: 1, errorCode: 'WRITE_ERROR' };
  }
}

export async function listFiles(params: Record<string, unknown>): Promise<ToolResult> {
  const dirPath = (params.path as string) || '.';
  const recursive = (params.recursive as boolean) || false;

  try {
    if (recursive) {
      const entries = walkDir(dirPath, 3);
      return { success: true, output: entries.join('\n'), exitCode: 0 };
    }
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const lines = entries.map((e) => `${e.isDirectory() ? 'd' : 'f'} ${e.name}`);
    return { success: true, output: lines.join('\n'), exitCode: 0 };
  } catch (err: any) {
    return { success: false, output: `List failed: ${err.message}`, exitCode: 1, errorCode: 'LIST_ERROR' };
  }
}

function walkDir(dir: string, maxDepth: number, depth = 0): string[] {
  if (depth >= maxDepth) return [];
  const results: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const prefix = '  '.repeat(depth);
      if (entry.isDirectory()) {
        results.push(`${prefix}d ${entry.name}/`);
        results.push(...walkDir(fullPath, maxDepth, depth + 1));
      } else {
        results.push(`${prefix}f ${entry.name}`);
      }
    }
  } catch {
    // Skip unreadable directories
  }
  return results;
}
