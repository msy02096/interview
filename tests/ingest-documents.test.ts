// @ts-nocheck
import { Buffer } from 'node:buffer';
import { deflateRawSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { extractDocxTextFromBuffer, extractInputText } from '../server/documents.mjs';

describe('ingest document extraction', () => {
  it('extracts paragraph text from docx buffers', () => {
    const docx = createZip({
      'word/document.xml': '<w:document><w:body><w:p><w:r><w:t>发言人1 你好</w:t></w:r></w:p><w:p><w:r><w:t>发言人2 您好</w:t></w:r></w:p></w:body></w:document>'
    });

    expect(extractDocxTextFromBuffer(docx)).toBe('发言人1 你好\n发言人2 您好');
  });

  it('combines pasted text with uploaded txt content', async () => {
    const text = await extractInputText({
      text: '手动文本',
      fileName: 'record.txt',
      fileBase64: Buffer.from('上传文本', 'utf8').toString('base64')
    });

    expect(text).toBe('手动文本\n\n上传文本');
  });
});

function createZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const [name, content] of Object.entries(entries)) {
    const nameBuffer = Buffer.from(name, 'utf8');
    const raw = Buffer.from(content, 'utf8');
    const compressed = deflateRawSync(raw);

    const local = Buffer.alloc(30 + nameBuffer.length + compressed.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(0, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBuffer.length, 26);
    nameBuffer.copy(local, 30);
    compressed.copy(local, 30 + nameBuffer.length);
    localParts.push(local);

    const central = Buffer.alloc(46 + nameBuffer.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(0, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(nameBuffer.length, 28);
    central.writeUInt32LE(offset, 42);
    nameBuffer.copy(central, 46);
    centralParts.push(central);

    offset += local.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(centralParts.length, 8);
  end.writeUInt16LE(centralParts.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);

  return Buffer.concat([...localParts, centralDirectory, end]);
}