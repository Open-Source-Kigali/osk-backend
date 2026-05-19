import fs from 'fs/promises';
import path from 'path';
import { gh } from './github.service';
import { env } from '../config/env';

const CONTRIBUTORS_MD = path.resolve('CONTRIBUTORS.md');
const CONTRIBUTORS_JSON = path.resolve('contributors.json');

export interface Contributor {
  login: string;
  name: string | null;
  avatarUrl: string;
  profileUrl: string;
  bio: string | null;
  company: string | null;
}

export const contributorsService = {
  async readContributors(): Promise<Contributor[]> {
    try {
      const raw = await fs.readFile(CONTRIBUTORS_JSON, 'utf-8');
      return JSON.parse(raw) as Contributor[];
    } catch {
      return [];
    }
  },

  async refreshContributors(): Promise<{ succeeded: string[]; failed: string[] }> {
    const raw = await fs.readFile(CONTRIBUTORS_MD, 'utf-8');

    // Parse usernames: skip blank lines and HTML comment lines
    const usernames = raw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('<!--') && !line.startsWith('#'));

    const results = await Promise.allSettled(
      usernames.map(async (login) => {
        const data = await gh(`/users/${login}`, env.githubToken);
        return {
          login: data.login as string,
          name: (data.name as string | null) ?? null,
          avatarUrl: data.avatar_url as string,
          profileUrl: data.html_url as string,
          bio: (data.bio as string | null) ?? null,
          company: (data.company as string | null) ?? null,
        } satisfies Contributor;
      }),
    );

    const contributors: Contributor[] = [];
    const succeeded: string[] = [];
    const failed: string[] = [];

    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        contributors.push(result.value);
        succeeded.push(usernames[i]);
      } else {
        failed.push(usernames[i]);
      }
    });

    await fs.writeFile(CONTRIBUTORS_JSON, JSON.stringify(contributors, null, 2), 'utf-8');

    return { succeeded, failed };
  },
};
