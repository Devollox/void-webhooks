import z from 'zod';

export const githubPayloadSchema = z.object({
  repository: z.object({
    name: z.string(),
    owner: z.object({
      login: z.string(),
    }),
  }),
});
