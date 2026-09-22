import MiniSearch from 'minisearch';
import { normalizeSearchText as normalize } from '../lib/search-normalize';

interface SearchDocument {
  slug: string;
  title: string;
  tags: string[];
  category?: string;
  ingredientNames: string[];
}

const documents = JSON.parse(document.getElementById('recipe-search-data')!.textContent ?? '[]') as SearchDocument[];
const engine = new MiniSearch<SearchDocument>({
  idField: 'slug',
  fields: ['title', 'tags', 'category', 'ingredientNames'],
  storeFields: ['slug'],
  extractField: (doc, field) => {
    const value = doc[field as keyof SearchDocument];
    return Array.isArray(value) ? value.join(' ') : String(value ?? '');
  },
  processTerm: (term) => normalize(term),
  searchOptions: { boost: { title: 5, ingredientNames: 2, tags: 2 }, prefix: true, fuzzy: 0.2, combineWith: 'AND' },
});
engine.addAll(documents);

const queryInput = document.querySelector<HTMLInputElement>('#recipe-search')!;
const ingredientInput = document.querySelector<HTMLInputElement>('#ingredient-search')!;
const tagInputs = [...document.querySelectorAll<HTMLInputElement>('input[name="tag"]')];
const ingredientInputs = [...document.querySelectorAll<HTMLInputElement>('input[name="ingredient"]')];
const cards = [...document.querySelectorAll<HTMLElement>('.card-wrap')];
const sections = [...document.querySelectorAll<HTMLElement>('.letter-section')];
const alphaButtons = [...document.querySelectorAll<HTMLButtonElement>('.alpha-btn')];
const countElement = document.querySelector<HTMLElement>('#recipe-count')!;
const emptyElement = document.querySelector<HTMLElement>('#empty-state')!;
const activeFilters = document.querySelector<HTMLElement>('#active-filters')!;
const clearButton = document.querySelector<HTMLButtonElement>('#clear-filters')!;
const bySlug = new Map(documents.map((recipe) => [recipe.slug, recipe]));

function selected(inputs: HTMLInputElement[]): string[] {
  return inputs.filter((input) => input.checked).map((input) => input.value);
}

function syncUrl(push = false) {
  const url = new URL(location.href);
  url.search = '';
  const query = queryInput.value.trim();
  if (query) url.searchParams.set('q', query);
  for (const tag of selected(tagInputs)) url.searchParams.append('tag', tag);
  for (const ingredient of selected(ingredientInputs)) url.searchParams.append('ingredient', ingredient);
  if (url.href !== location.href) history[push ? 'pushState' : 'replaceState'](null, '', url);
}

function fromUrl() {
  const params = new URL(location.href).searchParams;
  queryInput.value = params.get('q') ?? '';
  const tags = params.getAll('tag');
  const ingredients = params.getAll('ingredient').map(normalize);
  for (const input of tagInputs) input.checked = tags.includes(input.value);
  for (const input of ingredientInputs) input.checked = ingredients.includes(normalize(input.value));
  render();
}

function render() {
  const query = normalize(queryInput.value);
  const tags = selected(tagInputs);
  const ingredients = selected(ingredientInputs).map(normalize);
  const results = query ? engine.search(query) : [];
  const scores = new Map(results.map((result) => [String(result.id), result.score]));
  const matches = query ? new Set(scores.keys()) : null;
  let total = 0;
  for (const card of cards) {
    const recipe = bySlug.get(card.dataset.slug ?? '');
    const ingredientKeys = recipe?.ingredientNames.map(normalize) ?? [];
    const show = !!recipe && (!matches || matches.has(recipe.slug)) &&
      (tags.length === 0 || tags.some((tag) => recipe.tags.includes(tag))) &&
      ingredients.every((ingredient) => ingredientKeys.includes(ingredient));
    card.hidden = !show;
    if (show) total++;
  }
  for (const section of sections) {
    const grid = section.querySelector<HTMLElement>('.recipe-grid')!;
    const sectionCards = [...grid.querySelectorAll<HTMLElement>('.card-wrap')];
    sectionCards.sort((a, b) => query
      ? (scores.get(b.dataset.slug ?? '') ?? 0) - (scores.get(a.dataset.slug ?? '') ?? 0)
      : (a.querySelector('.card-title')?.textContent ?? '').localeCompare(b.querySelector('.card-title')?.textContent ?? '', 'it'));
    grid.append(...sectionCards);
    const visible = !!section.querySelector('.card-wrap:not([hidden])');
    section.hidden = !visible;
    const button = alphaButtons.find((item) => item.dataset.letter === section.id.slice('letter-'.length));
    if (button) button.disabled = !visible;
  }
  const page = document.querySelector<HTMLElement>('.page-wrap')!;
  const orderedSections = [...sections].sort((a, b) => query
    ? Math.max(...[...a.querySelectorAll<HTMLElement>('.card-wrap:not([hidden])')].map((card) => scores.get(card.dataset.slug ?? '') ?? 0), 0) -
      Math.max(...[...b.querySelectorAll<HTMLElement>('.card-wrap:not([hidden])')].map((card) => scores.get(card.dataset.slug ?? '') ?? 0), 0)
    : a.id.localeCompare(b.id, 'it'));
  if (query) orderedSections.reverse();
  for (const section of orderedSections) page.insertBefore(section, emptyElement);
  countElement.textContent = `${total} ricett${total === 1 ? 'a' : 'e'}`;
  emptyElement.hidden = total !== 0;
  clearButton.hidden = !query && tags.length === 0 && ingredients.length === 0;
  document.querySelector('#tag-selection-count')!.textContent = tags.length ? `(${tags.length})` : '';
  document.querySelector('#ingredient-selection-count')!.textContent = ingredients.length ? `(${ingredients.length})` : '';
  activeFilters.replaceChildren();
  for (const input of [...tagInputs, ...ingredientInputs].filter((item) => item.checked)) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.textContent = `${input.value} ×`;
    chip.setAttribute('aria-label', `Rimuovi filtro ${input.value}`);
    chip.addEventListener('click', () => { input.checked = false; update(true); });
    activeFilters.append(chip);
  }
  activeFilters.hidden = activeFilters.childElementCount === 0;
}

function update(push = false) { render(); syncUrl(push); }

queryInput.addEventListener('input', () => update());
for (const input of [...tagInputs, ...ingredientInputs]) input.addEventListener('change', () => update(true));
ingredientInput.addEventListener('input', () => {
  const term = normalize(ingredientInput.value);
  for (const label of document.querySelectorAll<HTMLElement>('.ingredient-option')) {
    const checkbox = label.querySelector<HTMLInputElement>('input')!;
    label.hidden = !checkbox.checked && !!term && !label.dataset.name?.includes(term);
  }
});
clearButton.addEventListener('click', () => {
  queryInput.value = '';
  for (const input of [...tagInputs, ...ingredientInputs]) input.checked = false;
  update(true);
  queryInput.focus();
});
for (const button of alphaButtons) button.addEventListener('click', () => {
  if (!button.disabled) document.getElementById(`letter-${button.dataset.letter}`)?.scrollIntoView({ behavior: 'smooth' });
});
window.addEventListener('popstate', fromUrl);
fromUrl();

const header = document.querySelector<HTMLElement>('.site-header');
const filterBar = document.querySelector<HTMLElement>('.filter-bar');
if (header && filterBar) {
  const pin = () => {
    filterBar.style.top = `${header.offsetHeight}px`;
    for (const section of sections) section.style.scrollMarginTop = `${header.offsetHeight + filterBar.offsetHeight + 16}px`;
  };
  pin();
  new ResizeObserver(pin).observe(header);
  new ResizeObserver(pin).observe(filterBar);
}
