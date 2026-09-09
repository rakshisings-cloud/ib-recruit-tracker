import { z } from "zod";
import { institutionTypeValues, fetchStrategyValues } from "@/db/schema";

export const firmInputSchema = z.object({
  name: z.string().trim().min(1),
  ticker: z.string().trim().optional().nullable(),
  institutionType: z.enum(institutionTypeValues),
  targetLocation: z.string().trim().optional().nullable(),
  historicalOpenDate: z.string().trim().optional().nullable(),
  actualOpenDate: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export const watchTargetInputSchema = z.object({
  url: z.string().trim().url(),
  cssSelector: z.string().trim().optional().nullable(),
  keywords: z.array(z.string().trim().min(1)).default([]),
  fetchStrategy: z.enum(fetchStrategyValues).default("http"),
  isActive: z.boolean().default(true),
});
