import test from 'node:test';
import assert from 'node:assert/strict';
import { DISTRICTS, CITY_CONFIG } from '../src/data.js';
import { readFile } from 'node:fs/promises';

test('district data is complete and renderable', () => {
  assert.ok(Array.isArray(DISTRICTS) && DISTRICTS.length >= 7);
  for (const district of DISTRICTS) {
    for (const field of ['eyebrow', 'title', 'desc', 'colorNight', 'colorDay']) {
      assert.equal(typeof district[field], 'string', `${field} is required`);
    }
    assert.ok(Array.isArray(district.tags) && district.tags.length > 0);
    assert.ok(Number.isFinite(district.pos.x) && Number.isFinite(district.pos.z));
  }
  assert.ok(CITY_CONFIG.totalWidth > 0 && CITY_CONFIG.totalDepth > 0);
});

test('UI renders tags without an HTML injection sink', async () => {
  const source = await readFile(new URL('../src/ui.js', import.meta.url), 'utf8');
  assert.equal(source.includes('.innerHTML'), false);
});
