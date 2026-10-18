export type DiscordNotificationPayload = {
  discordWebhookUrl: string;
  owner: string;
  repo: string;
  event: string;
  payload: unknown;
  deliveryId?: string;
};
