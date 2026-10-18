import { Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { RedisService } from '../../database/redis.service';
import { DiscordService } from './discord.service';
import { DISCORD_QUEUE } from './webhooks.service';
import { DiscordNotificationPayload } from './types/discord-notification';

const DEDUP_TTL = 60 * 60;

@Processor(DISCORD_QUEUE)
export class WebhooksConsumer {
  private readonly logger = new Logger(WebhooksConsumer.name);

  constructor(
    private readonly redis: RedisService,
    private readonly discord: DiscordService,
  ) {}

  @Process()
  async handleNotification(job: Job<DiscordNotificationPayload>) {
    const payload = job.data;

    if (payload.deliveryId) {
      const exists = await this.redis.get(`dedup:${payload.deliveryId}`);
      if (exists) {
        this.logger.debug(`Duplicate delivery ${payload.deliveryId}, skipping`);
        return;
      }
      await this.redis.set(`dedup:${payload.deliveryId}`, '1', 'EX', DEDUP_TTL);
    }

    const embed = this.discord.buildEmbed(
      payload.event,
      payload.owner,
      payload.repo,
      payload.payload,
    );

    const success = await this.discord.sendEmbed(
      payload.discordWebhookUrl,
      embed,
    );

    if (!success) {
      throw new Error(
        `Failed to send Discord notification for ${payload.owner}/${payload.repo}`,
      );
    }

    this.logger.log(
      `Sent Discord notification for ${payload.owner}/${payload.repo} [${payload.event}]`,
    );
  }
}
