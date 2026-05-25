import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import {
  CooklangParser,
  getFlatIngredients,
  getFlatCookware,
  getFlatTimers,
} from '@cooklang/cooklang';

const RECIPES_DIR = path.join(process.cwd(), 'recipes');

// ── Flat types used in components ────────────────────────────────────────────

export interface FlatIngredient {
  name: string;
  quantity: number | string | null;
  unit: string | null;
  displayText: string;
}

export interface FlatCookware {
  name: string;
  quantity: number | string | null;
  displayText: string;
}

export interface FlatTimer {
  name: string | null;
  quantity: number | null;
  unit: string | null;
  displayText: string;
}

export interface FlatInlineQty {
  value: number | string;
  unit: string | null;
}

// ── Step item types (index-referenced) ───────────────────────────────────────

export type StepItem =
  | { type: 'text'; value: string }
  | { type: 'ingredient'; index: number }
  | { type: 'cookware'; index: number }
  | { type: 'timer'; index: number }
  | { type: 'inlineQuantity'; index: number };

export interface ParsedStep {
  number: number;
  items: StepItem[];
}

export interface RecipeSection {
  title: string | null;
  /** Each entry is either a step or a text/description block */
  content: Array<{ type: 'step'; step: ParsedStep } | { type: 'note'; text: string }>;
}

export interface ParsedRecipe {
  slug: string;
  title: string;
  tags: string[];
  image?: string;
  servings?: string;
  source?: string;
  category?: string;
  ingredients: FlatIngredient[];
  cookwares: FlatCookware[];
  timers: FlatTimer[];
  inlineQuantities: FlatInlineQty[];
  sections: RecipeSection[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizeTags(data: Record<string, unknown>): string[] {
  const raw = data['tags'] ?? data['tag'] ?? [];
  if (!raw) return [];
  if (typeof raw === 'string') {
    return raw.replace(/^\[|\]$/g, '').split(',').map((t) => t.trim()).filter(Boolean);
  }
  if (Array.isArray(raw)) {
    return (raw as unknown[]).flatMap((t) =>
      typeof t === 'string' ? t.split(',').map((s) => s.trim()).filter(Boolean) : []
    );
  }
  return [];
}

function toSlug(filePath: string): string {
  return path.basename(filePath, '.cook')
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõöø]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractInlineQtyValue(raw: unknown): number | string {
  if (typeof raw !== 'object' || !raw) return '';
  const obj = raw as Record<string, unknown>;
  if (obj['type'] === 'number') {
    const inner = obj['value'] as Record<string, unknown> | null;
    return (inner?.['value'] as number) ?? '';
  }
  if (obj['type'] === 'text') return String(obj['value'] ?? '');
  // Recurse one level for nested value
  if ('value' in obj) return extractInlineQtyValue(obj['value']);
  return '';
}

const parser = new CooklangParser();

function parseFile(filePath: string, category?: string): ParsedRecipe | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data: fm, content } = matter(raw);
    const [recipe] = parser.parse(content);

    const ingredients = getFlatIngredients(recipe) as FlatIngredient[];
    const cookwares = getFlatCookware(recipe) as FlatCookware[];
    const timers = getFlatTimers(recipe) as FlatTimer[];

    const inlineQuantities: FlatInlineQty[] = ((recipe.inlineQuantities as unknown[]) ?? []).map(
      (iq) => {
        const obj = iq as Record<string, unknown>;
        return {
          value: extractInlineQtyValue(obj['value']),
          unit: (obj['unit'] as string) ?? null,
        };
      }
    );

    const sections: RecipeSection[] = ((recipe.sections as unknown[]) ?? []).map((s) => {
      const sec = s as Record<string, unknown>;
      const content: RecipeSection['content'] = ((sec['content'] as unknown[]) ?? []).map(
        (item) => {
          const ci = item as Record<string, unknown>;
          if (ci['type'] === 'step') {
            const v = ci['value'] as Record<string, unknown>;
            return {
              type: 'step' as const,
              step: {
                number: (v['number'] as number) ?? 0,
                items: (v['items'] as StepItem[]) ?? [],
              },
            };
          }
          return { type: 'note' as const, text: String(ci['value'] ?? '') };
        }
      );
      return { title: (sec['name'] as string) ?? null, content };
    });

    return {
      slug: toSlug(filePath),
      title: (fm['title'] as string) || path.basename(filePath, '.cook'),
      tags: normalizeTags(fm as Record<string, unknown>),
      image: (fm['image'] ?? fm['images']) as string | undefined,
      servings: fm['servings'] ? String(fm['servings']) : undefined,
      source: fm['source'] as string | undefined,
      category,
      ingredients,
      cookwares,
      timers,
      inlineQuantities,
      sections,
    };
  } catch (err) {
    console.warn(`Failed to parse ${filePath}:`, err);
    return null;
  }
}

function scanDir(dir: string, category?: string): ParsedRecipe[] {
  const results: ParsedRecipe[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'images') {
      results.push(...scanDir(full, entry.name));
    } else if (entry.isFile() && entry.name.endsWith('.cook')) {
      const r = parseFile(full, category);
      if (r) results.push(r);
    }
  }
  return results;
}

// ── Public API ────────────────────────────────────────────────────────────────

let _cache: ParsedRecipe[] | null = null;

export function getAllRecipes(): ParsedRecipe[] {
  if (_cache) return _cache;
  _cache = scanDir(RECIPES_DIR).sort((a, b) => a.title.localeCompare(b.title, 'it'));
  return _cache;
}

export function getRecipeBySlug(slug: string): ParsedRecipe | undefined {
  return getAllRecipes().find((r) => r.slug === slug);
}

export function getAllTags(): string[] {
  const set = new Set<string>();
  for (const r of getAllRecipes()) for (const t of r.tags) set.add(t);
  return [...set].sort((a, b) => a.localeCompare(b, 'it'));
}

export function getRecipesByTag(tag: string): ParsedRecipe[] {
  return getAllRecipes().filter((r) => r.tags.includes(tag));
}
