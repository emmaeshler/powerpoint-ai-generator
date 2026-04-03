/**
 * Mock PptxGenJS Library
 *
 * Captures all API calls from Will's skill code without generating actual PowerPoint files.
 * Used for preview generation in the browser.
 */

class MockSlide {
  constructor() {
    this.elements = [];
    this.notes = '';
    this.background = null;
  }

  /**
   * Add text element to slide
   * @param {string|Array} text - Text content or array of text runs
   * @param {Object} options - Text options (x, y, w, h, fontSize, color, etc.)
   */
  addText(text, options = {}) {
    // Handle array of text runs (styled text segments)
    if (Array.isArray(text)) {
      text.forEach((run, index) => {
        const runOptions = { ...options, ...run.options };
        this.elements.push({
          type: 'text',
          content: run.text,
          ...runOptions,
          isTextRun: true,
          runIndex: index
        });
      });
    } else {
      this.elements.push({
        type: 'text',
        content: text,
        ...options
      });
    }
    return this;
  }

  /**
   * Add shape to slide
   * @param {string} type - Shape type ('rect', 'ellipse', 'line', 'triangle', etc.)
   * @param {Object} options - Shape options
   */
  addShape(type, options = {}) {
    this.elements.push({
      type: 'shape',
      shapeType: type,
      ...options
    });
    return this;
  }

  /**
   * Add table to slide
   * @param {Array} rows - 2D array of table data or array of objects
   * @param {Object} options - Table options
   */
  addTable(rows, options = {}) {
    this.elements.push({
      type: 'table',
      rows: rows,
      ...options
    });
    return this;
  }

  /**
   * Add image to slide
   * @param {Object} options - Image options (data, path, x, y, w, h)
   */
  addImage(options = {}) {
    this.elements.push({
      type: 'image',
      ...options
    });
    return this;
  }

  /**
   * Add chart to slide
   * @param {string} type - Chart type
   * @param {Array} data - Chart data
   * @param {Object} options - Chart options
   */
  addChart(type, data, options = {}) {
    this.elements.push({
      type: 'chart',
      chartType: type,
      data: data,
      ...options
    });
    return this;
  }

  /**
   * Add notes to slide (speaker notes)
   * @param {string} text - Notes text
   */
  addNotes(text) {
    this.notes = text;
    return this;
  }

  /**
   * Set slide background
   * @param {Object} options - Background options
   */
  setBackground(options) {
    this.background = options;
    return this;
  }
}

class MockPresentation {
  constructor() {
    this.slides = [];
    this.layout = 'LAYOUT_WIDE';
    this.layouts = {};
    this.author = '';
    this.title = '';
    this.subject = '';

    // Add ShapeType enum (PptxGenJS standard shapes)
    this.ShapeType = {
      rect: 'rect',
      ellipse: 'ellipse',
      line: 'line',
      triangle: 'triangle',
      rtTriangle: 'rtTriangle',
      diamond: 'diamond',
      pentagon: 'pentagon',
      hexagon: 'hexagon',
      octagon: 'octagon',
      rounded: 'rounded',
      arc: 'arc',
      pie: 'pie'
    };
  }

  /**
   * Add a new slide
   * @param {Object} options - Slide options (masterName, etc.)
   * @returns {MockSlide}
   */
  addSlide(options = {}) {
    const slide = new MockSlide();
    slide.masterName = options.masterName;
    this.slides.push(slide);
    return slide;
  }

  /**
   * Define custom layout
   * @param {Object} options - Layout definition
   */
  defineLayout(options = {}) {
    if (options.name) {
      this.layouts[options.name] = options;
    }
    return this;
  }

  /**
   * Write presentation to file (no-op in mock)
   * @param {Object} options - Write options
   */
  writeFile(options = {}) {
    // No-op: This is a mock, we don't actually write files
    console.log(`[Mock] Would write file: ${options.fileName || 'presentation.pptx'}`);
    return Promise.resolve();
  }

  /**
   * Add slide master definition (no-op in mock)
   * @param {Object} options - Master definition
   */
  defineSlideMaster(options = {}) {
    // No-op: Just track that it was called
    return this;
  }
}

// Export for ES modules
export default MockPresentation;
export { MockPresentation, MockSlide };
