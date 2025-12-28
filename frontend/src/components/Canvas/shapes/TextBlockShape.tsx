import {
  TLBaseShape,
  ShapeUtil,
  HTMLContainer,
  Rectangle2d,
  TLOnResizeHandler,
  resizeBox,
} from 'tldraw';

// Text styles
export type TextBlockStyle = 'h1' | 'h2' | 'body' | 'caption';

// Text block props
export interface TextBlockShapeProps {
  text: string;
  style: TextBlockStyle;
  w: number;
  align: 'left' | 'center' | 'right';
}

// Text block shape type
export type TextBlockShape = TLBaseShape<'text-block', TextBlockShapeProps>;

// Style configurations
const STYLE_CONFIG: Record<TextBlockStyle, {
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  color: string;
  fontFamily: string;
}> = {
  h1: {
    fontSize: 48,
    fontWeight: 700,
    lineHeight: 1.2,
    color: '#1a1a1a',
    fontFamily: 'system-ui, sans-serif',
  },
  h2: {
    fontSize: 32,
    fontWeight: 600,
    lineHeight: 1.3,
    color: '#1a1a1a',
    fontFamily: 'system-ui, sans-serif',
  },
  body: {
    fontSize: 18,
    fontWeight: 400,
    lineHeight: 1.6,
    color: '#333333',
    fontFamily: 'system-ui, sans-serif',
  },
  caption: {
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.5,
    color: '#666666',
    fontFamily: 'system-ui, sans-serif',
  },
};

const MIN_WIDTH = 100;
const DEFAULT_WIDTH = 400;

// Text block shape util
export class TextBlockShapeUtil extends ShapeUtil<TextBlockShape> {
  static override type = 'text-block' as const;
  static override props = {
    text: { type: 'string' as const },
    style: { type: 'string' as const },
    w: { type: 'number' as const },
    align: { type: 'string' as const },
  };

  getDefaultProps(): TextBlockShapeProps {
    return {
      text: 'Enter text...',
      style: 'body',
      w: DEFAULT_WIDTH,
      align: 'left',
    };
  }

  getGeometry(shape: TextBlockShape): Rectangle2d {
    const config = STYLE_CONFIG[shape.props.style] || STYLE_CONFIG.body;
    // Estimate height based on text and width
    const estimatedHeight = this.estimateHeight(shape.props.text, shape.props.w, config);
    
    return new Rectangle2d({
      width: Math.max(shape.props.w, MIN_WIDTH),
      height: Math.max(estimatedHeight, 30),
      isFilled: true,
    });
  }

  private estimateHeight(text: string, width: number, config: typeof STYLE_CONFIG.body): number {
    // Rough estimation: characters per line based on font size
    const charsPerLine = Math.floor(width / (config.fontSize * 0.5));
    const lines = Math.ceil(text.length / charsPerLine) || 1;
    return lines * config.fontSize * config.lineHeight + 16; // padding
  }

  component(shape: TextBlockShape) {
    const { props } = shape;
    const config = STYLE_CONFIG[props.style] || STYLE_CONFIG.body;
    const w = Math.max(props.w, MIN_WIDTH);
    
    return (
      <HTMLContainer
        id={shape.id}
        style={{
          width: w,
          pointerEvents: 'all',
        }}
      >
        <div
          style={{
            width: '100%',
            padding: 8,
            fontSize: config.fontSize,
            fontWeight: config.fontWeight,
            lineHeight: config.lineHeight,
            color: config.color,
            fontFamily: config.fontFamily,
            textAlign: props.align,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {props.text || ' '}
        </div>
      </HTMLContainer>
    );
  }

  indicator(shape: TextBlockShape) {
    const config = STYLE_CONFIG[shape.props.style] || STYLE_CONFIG.body;
    const w = Math.max(shape.props.w, MIN_WIDTH);
    const h = this.estimateHeight(shape.props.text, w, config);
    
    return (
      <rect
        width={w}
        height={h}
        rx={4}
        ry={4}
      />
    );
  }

  override onResize: TLOnResizeHandler<TextBlockShape> = (shape, info) => {
    const result = resizeBox(shape, info);
    // Only resize width, height is auto
    if (result.props) {
      result.props.w = Math.max(result.props.w ?? shape.props.w, MIN_WIDTH);
    }
    return result;
  };

  override canResize = () => true;
  override canBind = () => false;
}

