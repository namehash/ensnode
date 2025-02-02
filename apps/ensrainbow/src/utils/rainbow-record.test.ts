import { describe, it, expect } from 'vitest';
import { labelhash } from 'viem';
import { buildRainbowRecord } from './rainbow-record';
import { labelHashToBytes } from './label-utils';
import { Labelhash } from '../../../../packages/ensnode-utils/src/types';

describe('buildRainbowRecord', () => {
  it('should parse a valid line', () => {
    const label = 'test-label';
    const validLabelhash = labelhash(label);
    const line = `${validLabelhash}\t${label}`;

    const record = buildRainbowRecord(line);
    expect(record.label).toBe(label);
    expect(record.labelHash).toEqual(labelHashToBytes(validLabelhash as Labelhash));
  });

  it('should handle labels with special characters', () => {
    const label = 'test🚀label';
    const validLabelhash = labelhash(label);
    const line = `${validLabelhash}\t${label}`;

    const record = buildRainbowRecord(line);
    expect(record.label).toBe(label);
    expect(record.labelHash).toEqual(labelHashToBytes(validLabelhash as Labelhash));
  });

  it('should throw on invalid line format', () => {
    const invalidLine = 'just-one-column';
    expect(() => buildRainbowRecord(invalidLine)).toThrow('Invalid line format');
  });

  it('should throw on invalid labelhash format', () => {
    const invalidLine = 'not-a-hash\tsome-label';
    expect(() => buildRainbowRecord(invalidLine)).toThrow('Invalid labelhash length');
  });

  describe('with validation enabled', () => {
    it('should accept valid labelhash', () => {
      const label = 'test-label';
      const validLabelhash = labelhash(label);
      const line = `${validLabelhash}\t${label}`;

      const record = buildRainbowRecord(line, { validateLabelHash: true });
      expect(record.label).toBe(label);
      expect(record.labelHash).toEqual(labelHashToBytes(validLabelhash as Labelhash));
    });

    it('should throw on mismatched labelhash', () => {
      const label = 'test-label';
      const wrongLabelhash = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const line = `${wrongLabelhash}\t${label}`;

      expect(() => buildRainbowRecord(line, { validateLabelHash: true }))
        .toThrow('Labelhash validation failed: computed hash does not match provided hash');
    });
  });
}); 
