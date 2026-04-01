import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { repoSlug, tempDir } = await request.json();

    if (!repoSlug || !tempDir) {
      return NextResponse.json(
        { error: 'Missing repoSlug or tempDir' },
        { status: 400 }
      );
    }

    // Clone the repository using gh CLI
    try {
      await execAsync(`gh repo clone ${repoSlug} ${tempDir}`, {
        timeout: 30000,
      });
    } catch (cloneError: any) {
      return NextResponse.json(
        { error: `Failed to clone repository: ${cloneError.message}` },
        { status: 500 }
      );
    }

    // Look for skill-manifest.json first
    const manifestPath = path.join(tempDir, 'skill-manifest.json');
    try {
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);

      // Cleanup temp directory
      await execAsync(`rm -rf ${tempDir}`);

      return NextResponse.json({ manifest });
    } catch (manifestError) {
      // Manifest not found, look for SKILL.md
      const skillPath = path.join(tempDir, 'SKILL.md');
      try {
        const skillContent = await fs.readFile(skillPath, 'utf-8');

        // Parse frontmatter from SKILL.md
        const frontmatterMatch = skillContent.match(/^---\n([\s\S]*?)\n---/);
        let name = repoSlug.split('/')[1];
        let description = `Skill from ${repoSlug}`;

        if (frontmatterMatch) {
          const frontmatter = frontmatterMatch[1];
          const nameMatch = frontmatter.match(/name:\s*(.+)/);
          const descMatch = frontmatter.match(/description:\s*["'](.+)["']/);

          if (nameMatch) name = nameMatch[1].trim();
          if (descMatch) description = descMatch[1].trim();
        }

        // Cleanup temp directory
        await execAsync(`rm -rf ${tempDir}`);

        return NextResponse.json({
          skillFile: {
            name,
            description,
            path: `~/.claude/skills/${repoSlug.split('/')[1]}/SKILL.md`,
          },
        });
      } catch (skillError) {
        // Neither found
        await execAsync(`rm -rf ${tempDir}`);
        return NextResponse.json(
          { error: 'No skill-manifest.json or SKILL.md found in repository' },
          { status: 404 }
        );
      }
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
