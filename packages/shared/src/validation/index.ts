import { z } from 'zod';

// Vision content part schemas
const textContentPartSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

const imageContentPartSchema = z.object({
  type: z.literal('image_url'),
  image_url: z.object({
    url: z.string(),
    detail: z.enum(['auto', 'low', 'high']).optional(),
  }),
});

const contentPartSchema = z.union([textContentPartSchema, imageContentPartSchema]);

// Message can have string content or array of content parts (for vision)
const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.union([z.string(), z.array(contentPartSchema)]),
});

export const chatCompletionSchema = z.object({
  model: z.string(),
  messages: z.array(messageSchema),
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
  stream: z.boolean().optional(),
});

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(255),
});

export const updateProviderSchema = z.object({
  enabled: z.boolean(),
  apiKey: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});
