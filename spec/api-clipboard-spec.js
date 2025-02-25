const { expect } = require('chai');
const path = require('path');
const { Buffer } = require('buffer');
const { ifdescribe, ifit } = require('./spec-helpers');

const { clipboard, nativeImage } = require('electron');

// FIXME(zcbenz): Clipboard tests are failing on WOA.
ifdescribe(process.platform !== 'win32' || process.arch !== 'arm64')('clipboard module', () => {
  const fixtures = path.resolve(__dirname, 'fixtures');

  describe('clipboard.readImage()', () => {
    it('returns NativeImage instance', () => {
      const p = path.join(fixtures, 'assets', 'logo.png');
      const i = nativeImage.createFromPath(p);
      clipboard.writeImage(p);
      const readImage = clipboard.readImage();
      expect(readImage.toDataURL()).to.equal(i.toDataURL());
    });
  });

  describe('clipboard.readText()', () => {
    it('returns unicode string correctly', () => {
      const text = '千江有水千江月，万里无云万里天';
      clipboard.writeText(text);
      expect(clipboard.readText()).to.equal(text);
    });
  });

  describe('clipboard.readHTML()', () => {
    it('returns markup correctly', () => {
      const text = '<string>Hi</string>';
      const markup = process.platform === 'darwin' ? "<meta charset='utf-8'><string>Hi</string>" : '<string>Hi</string>';
      clipboard.writeHTML(text);
      expect(clipboard.readHTML()).to.equal(markup);
    });
  });

  describe('clipboard.readRTF', () => {
    it('returns rtf text correctly', () => {
      const rtf = '{\\rtf1\\ansi{\\fonttbl\\f0\\fswiss Helvetica;}\\f0\\pard\nThis is some {\\b bold} text.\\par\n}';
      clipboard.writeRTF(rtf);
      expect(clipboard.readRTF()).to.equal(rtf);
    });
  });

  ifdescribe(process.platform !== 'linux')('clipboard.readBookmark', () => {
    it('returns title and url', () => {
      clipboard.writeBookmark('a title', 'https://electronjs.org');

      const readBookmark = clipboard.readBookmark();
      if (process.platform !== 'win32') {
        expect(readBookmark.title).to.equal('a title');
      }
      expect(clipboard.readBookmark().url).to.equal('https://electronjs.org');

      clipboard.writeText('no bookmark');
      expect(clipboard.readBookmark()).to.deep.equal({
        title: '',
        url: ''
      });
    });
  });

  describe('clipboard.read()', () => {
    ifit(process.platform !== 'linux')('does not crash when reading various custom clipboard types', () => {
      const type = process.platform === 'darwin' ? 'NSFilenamesPboardType' : 'FileNameW';

      expect(() => {
        const result = clipboard.read(type);
      }).to.not.throw();
    });
    it('can read data written with writeBuffer', () => {
      const testText = 'Testing read';
      const buffer = Buffer.from(testText, 'utf8');
      clipboard.writeBuffer('public/utf8-plain-text', buffer);
      expect(clipboard.read('public/utf8-plain-text')).to.equal(testText);
    });
  });

  describe('clipboard.write()', () => {
    it('returns data correctly', () => {
      const text = 'test';
      const rtf = '{\\rtf1\\utf8 text}';
      const p = path.join(fixtures, 'assets', 'logo.png');
      const i = nativeImage.createFromPath(p);
      const markup = process.platform === 'darwin' ? "<meta charset='utf-8'><b>Hi</b>" : '<b>Hi</b>';
      const bookmark = { title: 'a title', url: 'test' };
      clipboard.write({
        text: 'test',
        html: '<b>Hi</b>',
        rtf: '{\\rtf1\\utf8 text}',
        bookmark: 'a title',
        image: p
      });

      expect(clipboard.readText()).to.equal(text);
      expect(clipboard.readHTML()).to.equal(markup);
      expect(clipboard.readRTF()).to.equal(rtf);
      const readImage = clipboard.readImage();
      expect(readImage.toDataURL()).to.equal(i.toDataURL());

      if (process.platform !== 'linux') {
        if (process.platform !== 'win32') {
          expect(clipboard.readBookmark()).to.deep.equal(bookmark);
        } else {
          expect(clipboard.readBookmark().url).to.equal(bookmark.url);
        }
      }
    });
  });

  ifdescribe(process.platform === 'darwin')('clipboard.read/writeFindText(text)', () => {
    it('reads and write text to the find pasteboard', () => {
      clipboard.writeFindText('find this');
      expect(clipboard.readFindText()).to.equal('find this');
    });
  });

  describe('clipboard.readBuffer(format)', () => {
    it('writes a Buffer for the specified format', function () {
      const buffer = Buffer.from('writeBuffer', 'utf8');
      clipboard.writeBuffer('public/utf8-plain-text', buffer);
      expect(buffer.equals(clipboard.readBuffer('public/utf8-plain-text'))).to.equal(true);
    });

    it('throws an error when a non-Buffer is specified', () => {
      expect(() => {
        clipboard.writeBuffer('public/utf8-plain-text', 'hello');
      }).to.throw(/buffer must be a node Buffer/);
    });
  });
});
