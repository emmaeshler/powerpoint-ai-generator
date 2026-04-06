/**
 * PptxGenJS Sandbox Executor
 *
 * Safely executes Will's PptxGenJS code in an isolated environment
 * and captures all slide generation API calls for preview.
 */

import vm from 'vm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import MockPresentation from './pptxgen-sandbox.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// INSIGHT color palette (from Will's slide-lib)
const INSIGHT_COLORS = {
  primary: '00446A',      // Navy
  accent: 'E56910',       // Orange
  primaryLight: 'D9E6EC',
  accentLight: 'FCEEE4',
  textDark: '25282A',
  textMid: '4A6070',
  textLight: '7A95A5',
  border: 'C8D9E2',
  green: '339966',
  red: 'CB333B',
  gray: '75787B',
  white: 'FFFFFF',
  offWhite: 'F3F4F4',
  darkNavy: '051C2C',
  font: 'Arial Narrow'
};

// Standard PowerPoint dimensions (16:9)
const W = 13.3;  // Width in inches
const H = 7.5;   // Height in inches
const MARGIN = 0.35;
const GUTTER = 0.23;

const CONTENT_AREA = {
  x: MARGIN,
  y: 1.35,
  w: W - MARGIN * 2,
  h: H - 1.35 - MARGIN
};

const FRAME = {
  title: { x: MARGIN, y: 0.35, w: W - MARGIN * 2, h: 0.5 },
  subtitle: { x: MARGIN, y: 0.9, w: W - MARGIN * 2, h: 0.3 },
  footer: { x: MARGIN, y: H - 0.35, w: W - MARGIN * 2, h: 0.25 }
};

/**
 * Execute Will's PptxGenJS code and capture slide data
 * @param {string} code - JavaScript code from Will's skill
 * @returns {Promise<Object>} Preview data with captured elements
 */
async function executeWillsCode(code) {
  try {
    // Load Will's slide-lib.js
    const slideLibPath = path.join(
      process.env.HOME || '/Users/emmaeshler',
      '.claude/skills/poc-branded-pptx-slide/slide-lib.js'
    );

    if (!fs.existsSync(slideLibPath)) {
      throw new Error(`slide-lib.js not found at: ${slideLibPath}`);
    }

    const slideLibCode = fs.readFileSync(slideLibPath, 'utf8');

    // Create sandbox context
    const skillDir = path.dirname(slideLibPath);
    const sandbox = {
      // Module system
      module: { exports: {} },
      exports: {},
      require: createSafeRequire(),

      // Node.js globals
      console: console,
      Buffer: Buffer,
      process: {
        env: process.env,
        cwd: () => process.cwd()
      },
      __dirname: skillDir,  // Directory where slide-lib.js lives
      __filename: slideLibPath,  // Full path to slide-lib.js

      // Common globals
      setTimeout: setTimeout,
      setInterval: setInterval,
      clearTimeout: clearTimeout,
      clearInterval: clearInterval,

      // Will's constants
      W, H, MARGIN, GUTTER,
      CONTENT_AREA,
      FRAME
    };

    // Execute slide-lib.js first to load helpers
    const slideLibModule = { exports: {} };
    sandbox.module = slideLibModule;
    sandbox.exports = slideLibModule.exports;

    try {
      vm.runInNewContext(slideLibCode, sandbox, {
        filename: 'slide-lib.js',
        timeout: 5000,
        displayErrors: true
      });
    } catch (err) {
      console.error('Failed to load slide-lib.js:', err);
      throw new Error(`slide-lib.js execution failed: ${err.message}`);
    }

    // Store slide-lib exports for use in Will's code
    const slideLibExports = slideLibModule.exports;

    // Now execute Will's generated code
    const willsModule = { exports: {} };
    sandbox.module = willsModule;
    sandbox.exports = willsModule.exports;

    // Make slide-lib available
    Object.assign(sandbox, slideLibExports);

    try {
      vm.runInNewContext(code, sandbox, {
        filename: 'wills-slide.js',
        timeout: 5000,
        displayErrors: true
      });
    } catch (err) {
      console.error('Failed to execute Will\'s code:', err);
      throw new Error(`Will's code execution failed: ${err.message}`);
    }

    // Get the exported addSlide function
    const addSlide = willsModule.exports;

    if (typeof addSlide !== 'function') {
      throw new Error('Will\'s code did not export a function');
    }

    // Create mock presentation and run addSlide
    const mockPres = new MockPresentation();
    const C = INSIGHT_COLORS;

    // Execute the addSlide function
    await addSlide(mockPres, C);

    // Extract captured data
    if (mockPres.slides.length === 0) {
      throw new Error('No slides were generated');
    }

    return {
      success: true,
      slides: mockPres.slides.map(slide => ({
        elements: slide.elements,
        notes: slide.notes,
        background: slide.background,
        masterName: slide.masterName
      })),
      metadata: {
        slideCount: mockPres.slides.length,
        elementCount: mockPres.slides.reduce((sum, s) => sum + s.elements.length, 0)
      }
    };

  } catch (error) {
    console.error('PptxGenJS execution error:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Create a safe require function for the sandbox
 * @returns {Function}
 */
function createSafeRequire() {
  return function safeRequire(moduleName) {
    // Replace pptxgenjs with our mock
    if (moduleName === 'pptxgenjs') {
      return MockPresentation;
    }

    // Return actual Node.js built-in modules
    if (moduleName === 'fs') {
      return fs;
    }
    if (moduleName === 'path') {
      return path;
    }

    // Allow specific safe modules with mocks
    const mockedModules = ['react', 'react-dom/server', 'sharp'];

    if (mockedModules.includes(moduleName)) {
      // Return minimal mocks for unavailable modules
      if (moduleName === 'react') {
        return { createElement: () => ({}) };
      }
      if (moduleName === 'react-dom/server') {
        return { renderToStaticMarkup: () => '<svg></svg>' };
      }
      if (moduleName === 'sharp') {
        return () => ({ png: () => ({ toBuffer: () => Promise.resolve(Buffer.from('')) }) });
      }
    }

    throw new Error(`Module '${moduleName}' is not allowed in sandbox`);
  };
}

export {
  executeWillsCode,
  INSIGHT_COLORS,
  W, H, CONTENT_AREA, FRAME
};
