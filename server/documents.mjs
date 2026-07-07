import { Buffer } from 'node:buffer';
import { inflateRawSync } from 'node:zlib';

export async function extractInputText(payload) {
  const parts = [];

  if (typeof payload.text === 'string' && payload.text.trim()) {
    parts.push(payload.text.trim());
  }

  if (payload.fileName && payload.fileBase64) {
    const buffer = Buffer.from(payload.fileBase64, 'base64');
    const name = String(payload.fileName).toLowerCase();

    if (name.endsWith('.txt') || name.endsWith('.md')) {
      parts.push(buffer.toString('utf8').trim());
    } else if (name.endsWith('.docx')) {
      parts.push(extractDocxTextFromBuffer(buffer).trim());
    } else {
      throw new Error('只支持 .txt、.md、.docx 文件');
    }
  }

  const text = parts.filter(Boolean).join('\n\n').trim();
  if (!text) throw new Error('请粘贴文本或上传转写文档');
  return text;
}

export function extractDocxTextFromBuffer(buffer) {
  const xml = readZipEntry(buffer, 'word/document.xml');
  if (!xml) throw new Error('无法读取 docx 正文');

  const paragraphs = [...xml.matchAll(/<w:p[\s\S]*?<\/w:p>/g)].map((match) => {
    return [...match[0].matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)]
      .map((textMatch) => decodeXml(textMatch[1]))
      .join('');
  });

  return paragraphs.map((line) => line.trim()).filter(Boolean).join('\n');
}

function readZipEntry(buffer, wantedName) {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  if (eocdOffset < 0) throw new Error('无效的 docx 文件');

  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  let offset = buffer.readUInt32LE(eocdOffset + 16);

  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error('无效的 docx 目录');

    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer.slice(offset + 46, offset + 46 + fileNameLength).toString('utf8');

    if (fileName === wantedName) {
      return readLocalFile(buffer, localHeaderOffset, compressedSize, method).toString('utf8');
    }

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return '';
}

function readLocalFile(buffer, offset, compressedSize, method) {
  if (buffer.readUInt32LE(offset) !== 0x04034b50) throw new Error('无效的 docx 文件头');

  const fileNameLength = buffer.readUInt16LE(offset + 26);
  const extraLength = buffer.readUInt16LE(offset + 28);
  const dataStart = offset + 30 + fileNameLength + extraLength;
  const compressed = buffer.slice(dataStart, dataStart + compressedSize);

  if (method === 0) return compressed;
  if (method === 8) return inflateRawSync(compressed);
  throw new Error(`不支持的 docx 压缩方式：${method}`);
}

function findEndOfCentralDirectory(buffer) {
  for (let offset = buffer.length - 22; offset >= 0; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) return offset;
  }
  return -1;
}

function decodeXml(value) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}