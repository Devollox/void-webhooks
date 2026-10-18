import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DiscordEmbed } from './types/discord-embed';

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);
  private readonly username: string;

  constructor(private configService: ConfigService) {
    this.username = this.configService.get('DISCORD_USERNAME', 'Void Webhooks');
  }

  async sendEmbed(webhookUrl: string, embed: DiscordEmbed): Promise<boolean> {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: this.username,
          embeds: [embed],
        }),
      });

      if (res.status === 429) {
        const data = (await res.json()) as { retry_after?: number };
        const retryAfter = (data.retry_after ?? 1) * 1000;
        this.logger.warn(`Discord rate limit, retrying after ${retryAfter}ms`);
        await new Promise((resolve) => setTimeout(resolve, retryAfter));
        return this.sendEmbed(webhookUrl, embed);
      }

      return res.ok;
    } catch (err) {
      this.logger.error('Failed to send Discord embed', err);
      return false;
    }
  }

  buildEmbed(
    event: string,
    owner: string,
    repo: string,
    payload: unknown,
  ): DiscordEmbed {
    const repoUrl = `https://github.com/${owner}/${repo}`;
    const colors: Record<string, number> = {
      push: 0x5865f2,
      release: 0x57f287,
      pull_request: 0xfee75c,
      issues: 0xed4245,
    };

    const descriptions: Record<string, string> = {
      push: `New push to **${owner}/${repo}**`,
      release: `New release in **${owner}/${repo}**`,
      pull_request: `Pull request activity in **${owner}/${repo}**`,
      issues: `Issue activity in **${owner}/${repo}**`,
    };

    const p = payload as Record<string, unknown>;

    let description =
      descriptions[event] ?? `Event \`${event}\` in **${owner}/${repo}**`;

    if (event === 'push') {
      const commits = p.commits as
        Array<{ message: string; url: string }> | undefined;
      if (commits?.length) {
        const list = commits
          .slice(0, 5)
          .map((c) => `• [${c.message.split('\n')[0]}](${c.url})`)
          .join('\n');
        description += `\n\n${list}`;
        if (commits.length > 5)
          description += `\n_...and ${commits.length - 5} more_`;
      }
    }

    if (event === 'release') {
      const release = p.release as Record<string, unknown> | undefined;
      if (release?.name && typeof release.name === 'string')
        description += `\n\n**${release.name}**`;
      if (release?.body && typeof release.body === 'string')
        description += `\n${release.body.slice(0, 300)}`;
    }

    return {
      title: `[${owner}/${repo}] ${event}`,
      description,
      color: colors[event] ?? 0x99aab5,
      url: repoUrl,
      timestamp: new Date().toISOString(),
      footer: { text: 'Void Webhooks' },
    };
  }
}
