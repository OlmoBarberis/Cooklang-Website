import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { normalizeSearchText } from './search-normalize';
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
  ingredients: FlatIngredient[];        // original, index-ordered — used by StepText
  sidebarIngredients: FlatIngredient[]; // merged by name+unit — used by the ingredient panel
  cookwares: FlatCookware[];
  timers: FlatTimer[];
  inlineQuantities: FlatInlineQty[];
  sections: RecipeSection[];
  /** Pipe tables extracted from guide files; referenced from steps by `[[table:N]]` */
  tables: string[][][];
}

export interface RecipeSummary {
  slug: string;
  title: string;
  tags: string[];
  image?: string;
  ingredientCount: number;
  ingredientNames: string[];
}

export function toRecipeSummary(recipe: ParsedRecipe): RecipeSummary {
  const names = new Map<string, string>();
  for (const ingredient of recipe.ingredients) {
    const name = ingredient.name.trim();
    const key = normalizeSearchText(name);
    if (key && !names.has(key)) names.set(key, name);
  }
  return {
    slug: recipe.slug,
    title: recipe.title,
    tags: recipe.tags,
    image: recipe.image,
    ingredientCount: names.size,
    ingredientNames: [...names.values()],
  };
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

function toSlug(name: string): string {
  return name
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

const UNIT_TRANSLATIONS: Record<string, [singular: string, plural: string]> = {
  second: ['secondo', 'secondi'], seconds: ['secondo', 'secondi'], sec: ['secondo', 'secondi'],
  minute: ['minuto', 'minuti'], minutes: ['minuto', 'minuti'], min: ['minuto', 'minuti'],
  hour: ['ora', 'ore'], hours: ['ora', 'ore'],
  day: ['giorno', 'giorni'], days: ['giorno', 'giorni'],
  week: ['settimana', 'settimane'], weeks: ['settimana', 'settimane'],
  month: ['mese', 'mesi'], months: ['mese', 'mesi'],
  celsius: ['°C', '°C'],
};

/** Shows English time units (as written in some .cook files) in Italian; Italian units pass through. */
export function translateUnit(unit: string, quantity: number | string | null): string {
  const forms = UNIT_TRANSLATIONS[unit.trim().toLowerCase()];
  if (!forms) return unit;
  return Number(quantity) === 1 ? forms[0] : forms[1];
}

function formatQuantity(quantity: string, unit?: string): string {
  const q = quantity.trim();
  return unit?.trim() ? `${q} ${translateUnit(unit, q)}` : q;
}

/**
 * Renders Cooklang tokens inside plain text the parser leaves untouched (notes, table cells):
 * ~{30%minutes} → "30 minuti", @sale{5%g} → "sale (5 g)", #pentola{} → "pentola".
 */
export function formatInlineTokens(text: string): string {
  return text
    .replace(/~[^{\s]*\{([^}%]*)(?:%([^}]*))?\}/g, (_, q: string, u?: string) => formatQuantity(q, u))
    .replace(/@([^@#~{]+?)\{([^}%]*)(?:%([^}]*))?\}/g, (_, name: string, q: string, u?: string) =>
      q.trim() ? `${name.trim()} (${formatQuantity(q, u)})` : name.trim())
    .replace(/#([^@#~{]+?)\{[^}]*\}/g, (_, name: string) => name.trim());
}

function fileSlug(filePath: string): string {
  return toSlug(path.basename(filePath, '.cook'));
}

/** Splits an optional numeric ordering prefix ("01-", "2_", "3. ") off a chapter filename. */
export function parseChapterPrefix(name: string): { order: number | null; name: string } {
  const match = /^(\d+)[-_. ]+/.exec(name);
  if (!match) return { order: null, name };
  return { order: parseInt(match[1], 10), name: name.slice(match[0].length) };
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

function mergeIngredients(ingredients: FlatIngredient[]): FlatIngredient[] {
  // Group all occurrences by normalized name
  const groups = new Map<string, FlatIngredient[]>();
  for (const ing of ingredients) {
    const key = ing.name.toLowerCase().trim();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ing);
  }

  const result: FlatIngredient[] = [];
  for (const group of groups.values()) {
    // Within each name group, sum entries that share the same unit
    const byUnit = new Map<string, FlatIngredient>();
    for (const ing of group) {
      const unitKey = (ing.unit ?? '').toLowerCase().trim();
      const existing = byUnit.get(unitKey);
      if (existing && typeof existing.quantity === 'number' && typeof ing.quantity === 'number') {
        const qty = parseFloat((existing.quantity + ing.quantity).toFixed(4));
        byUnit.set(unitKey, {
          ...existing,
          quantity: qty,
          displayText: existing.unit ? `${qty} ${existing.unit}` : String(qty),
        });
      } else if (!existing) {
        byUnit.set(unitKey, ing);
      }
    }

    const merged = Array.from(byUnit.values());
    // If some entries have a real quantity/unit and others are bare (no unit, no qty),
    // drop the bare ones — they're duplicate mentions without amounts.
    const withQty = merged.filter((i) => i.quantity !== null && i.unit);
    result.push(...(withQty.length > 0 && withQty.length < merged.length ? withQty : merged));
  }

  return result.sort((a, b) => a.name.localeCompare(b.name, 'it'));
}

const TABLE_PLACEHOLDER = /^\[\[table:(\d+)\]\]$/;

/** Returns the table index when a step is a `[[table:N]]` placeholder left by extractTables. */
export function tableIndexOf(step: ParsedStep): number | null {
  if (step.items.length !== 1 || step.items[0].type !== 'text') return null;
  const match = TABLE_PLACEHOLDER.exec(step.items[0].value.trim());
  return match ? Number(match[1]) : null;
}

/**
 * Cooklang has no tables and joins a paragraph's lines into one step, so runs of lines starting
 * with "|" are lifted out before parsing and replaced by a `[[table:N]]` placeholder paragraph.
 * Markdown separator rows (|---|:--:|) are dropped; cell text keeps its Cooklang tokens.
 */
function extractTables(content: string): { content: string; tables: string[][][] } {
  const tables: string[][][] = [];
  const out: string[] = [];
  let rows: string[][] | null = null;
  const flush = () => {
    if (!rows) return;
    out.push('', `[[table:${tables.length}]]`, '');
    tables.push(rows);
    rows = null;
  };
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|')) {
      rows ??= [];
      if (/^[|\s:-]+$/.test(trimmed) && trimmed.includes('-')) continue;
      rows.push(trimmed.replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim()));
    } else {
      flush();
      out.push(line);
    }
  }
  flush();
  return { content: out.join('\n'), tables };
}

const parser = new CooklangParser();

function parseFile(filePath: string): ParsedRecipe | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data: fm, content: rawContent } = matter(raw);
    const isGuide = normalizeTags(fm as Record<string, unknown>).some(isGuideTag);
    const { content, tables } = isGuide ? extractTables(rawContent) : { content: rawContent, tables: [] };
    const [recipe] = parser.parse(content);

    const ingredients = getFlatIngredients(recipe) as FlatIngredient[];
    const cookwares = getFlatCookware(recipe) as FlatCookware[];
    const timers = (getFlatTimers(recipe) as FlatTimer[]).map((t) => {
      if (!t.unit) return t;
      const unit = translateUnit(t.unit, t.quantity);
      return unit === t.unit || !t.displayText.endsWith(t.unit)
        ? t
        : { ...t, unit, displayText: t.displayText.slice(0, -t.unit.length) + unit };
    });

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
      slug: fileSlug(filePath),
      title: (fm['title'] as string) || path.basename(filePath, '.cook'),
      tags: normalizeTags(fm as Record<string, unknown>),
      image: (fm['image'] ?? fm['images']) as string | undefined,
      servings: fm['servings'] ? String(fm['servings']) : undefined,
      source: fm['source'] as string | undefined,
      ingredients,
      sidebarIngredients: mergeIngredients(ingredients),
      cookwares,
      timers,
      inlineQuantities,
      sections,
      tables,
    };
  } catch (err) {
    console.warn(`Failed to parse ${filePath}:`, err);
    return null;
  }
}

interface ScannedFile {
  parsed: ParsedRecipe;
  /** Filename without the .cook extension */
  baseName: string;
  /** Path of the containing folder relative to recipes/, or null for root-level files */
  folder: string | null;
}

function scanDir(dir: string, folder: string | null = null): ScannedFile[] {
  const results: ScannedFile[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'images') {
      results.push(...scanDir(full, folder ? path.join(folder, entry.name) : entry.name));
    } else if (entry.isFile() && entry.name.endsWith('.cook')) {
      const parsed = parseFile(full);
      if (parsed) results.push({ parsed, baseName: path.basename(entry.name, '.cook'), folder });
    }
  }
  return results;
}

// ── Guides ────────────────────────────────────────────────────────────────────

export const GUIDE_TAG = 'Guida';

export function isGuideTag(tag: string): boolean {
  return tag.trim().toLowerCase() === GUIDE_TAG.toLowerCase();
}

export interface GuideDoc {
  slug: string;
  title: string;
  /** Tags without "Guida" */
  tags: string[];
  image?: string;
  source?: string;
  ingredients: FlatIngredient[];
  cookwares: FlatCookware[];
  timers: FlatTimer[];
  inlineQuantities: FlatInlineQty[];
  sections: RecipeSection[];
  tables: string[][][];
}

export interface Chapter extends GuideDoc {
  order: number | null;
}

export interface SingleGuide {
  kind: 'single';
  slug: string;
  title: string;
  tags: string[];
  image?: string;
  doc: GuideDoc;
}

export interface GuideCollection {
  kind: 'collection';
  slug: string;
  title: string;
  tags: string[];
  image?: string;
  chapters: Chapter[];
}

export type GuideEntry = SingleGuide | GuideCollection;

export interface ChapterView {
  collection: GuideCollection;
  chapter: Chapter;
  position: number;
  total: number;
  prev?: Chapter;
  next?: Chapter;
}

function toGuideDoc(recipe: ParsedRecipe, slug = recipe.slug): GuideDoc {
  return {
    slug,
    title: recipe.title,
    tags: recipe.tags.filter((t) => !isGuideTag(t)),
    image: recipe.image,
    source: recipe.source,
    ingredients: recipe.ingredients,
    cookwares: recipe.cookwares,
    timers: recipe.timers,
    inlineQuantities: recipe.inlineQuantities,
    sections: recipe.sections,
    tables: recipe.tables,
  };
}

const byTitle = (a: { title: string }, b: { title: string }) => a.title.localeCompare(b.title, 'it');

/** Keeps the first item per slug (in the given order) and warns about the rest. */
function dedupeBySlug<T extends { slug: string }>(items: T[], label: string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.slug)) {
      console.warn(`Duplicate ${label} slug: ${item.slug}`);
      return false;
    }
    seen.add(item.slug);
    return true;
  });
}

function buildGuides(files: ScannedFile[]): GuideEntry[] {
  const entries: GuideEntry[] = [];
  const folders = new Map<string, ScannedFile[]>();

  for (const file of files) {
    if (file.folder === null) {
      const doc = toGuideDoc(file.parsed);
      entries.push({ kind: 'single', slug: doc.slug, title: doc.title, tags: doc.tags, image: doc.image, doc });
    } else {
      if (!folders.has(file.folder)) folders.set(file.folder, []);
      folders.get(file.folder)!.push(file);
    }
  }

  for (const [folder, folderFiles] of folders) {
    const title = path.basename(folder);
    const chapters = dedupeBySlug(
      folderFiles
        .map((file) => {
          const { order, name } = parseChapterPrefix(file.baseName);
          return { ...toGuideDoc(file.parsed, toSlug(name)), order };
        })
        .sort((a, b) => {
          if (a.order !== b.order) {
            if (a.order === null) return 1;
            if (b.order === null) return -1;
            return a.order - b.order;
          }
          return byTitle(a, b);
        }),
      `chapter (${title})`
    );
    const tags = [...new Set(chapters.flatMap((c) => c.tags))].sort((a, b) => a.localeCompare(b, 'it'));
    entries.push({
      kind: 'collection',
      slug: toSlug(title),
      title,
      tags,
      image: chapters.find((c) => c.image)?.image,
      chapters,
    });
  }

  return dedupeBySlug(entries.sort(byTitle), 'guide');
}

// ── Catalog ───────────────────────────────────────────────────────────────────

interface Catalog {
  recipes: ParsedRecipe[];
  guides: GuideEntry[];
}

let catalogCache: Catalog | undefined;

function buildCatalog(): Catalog {
  const files = scanDir(RECIPES_DIR);
  const guideFiles = files.filter((f) => f.parsed.tags.some(isGuideTag));
  const recipes = files
    .filter((f) => !f.parsed.tags.some(isGuideTag))
    .map((f) => f.parsed)
    .sort(byTitle);
  const slugs = new Set<string>();
  for (const recipe of recipes) {
    if (slugs.has(recipe.slug)) console.warn(`Duplicate recipe slug: ${recipe.slug}`);
    slugs.add(recipe.slug);
  }
  return { recipes, guides: buildGuides(guideFiles) };
}

function getCatalog(): Catalog {
  if (process.env.NODE_ENV !== 'production') return buildCatalog();
  catalogCache ??= buildCatalog();
  return catalogCache;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getAllRecipes(): ParsedRecipe[] {
  return getCatalog().recipes;
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

export function getGuideIndex(): GuideEntry[] {
  return getCatalog().guides;
}

export function getGuideBySlug(slug: string): GuideEntry | undefined {
  return getGuideIndex().find((g) => g.slug === slug);
}

export function getChapter(collectionSlug: string, chapterSlug: string): ChapterView | undefined {
  const collection = getGuideBySlug(collectionSlug);
  if (collection?.kind !== 'collection') return undefined;
  const index = collection.chapters.findIndex((c) => c.slug === chapterSlug);
  if (index === -1) return undefined;
  return {
    collection,
    chapter: collection.chapters[index],
    position: index + 1,
    total: collection.chapters.length,
    prev: collection.chapters[index - 1],
    next: collection.chapters[index + 1],
  };
}

export function getGuidesByTag(tag: string): GuideEntry[] {
  if (isGuideTag(tag)) return [];
  return getGuideIndex().filter((g) => g.tags.includes(tag));
}
