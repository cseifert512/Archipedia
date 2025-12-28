import {
  TLBaseShape,
  ShapeUtil,
  HTMLContainer,
  Rectangle2d,
  TLOnResizeHandler,
  resizeBox,
} from 'tldraw';

// Shape rect props
export interface ShapeRectShapeProps {
  w: number;
  h: number;
  fill: string;
  opacity: number;
  borderRadius: number;
  borderColor: string;
  borderWidth: number;
}

// Shape rect type
export type ShapeRectShape = TLBaseShape<'shape-rect', ShapeRectShapeProps>;

const MIN_SIZE = 20;
const DEFAULT_SIZE = 200;

// Shape rect util
export class ShapeRectShapeUtil extends ShapeUtil<ShapeRectShape> {
  static override type = 'shape-rect' as const;
  static override props = {
    w: { type: 'number' as const },
    h: { type: 'number' as const },
    fill: { type: 'string' as const },
    opacity: { type: 'number' as const },
    borderRadius: { type: 'number' as const },
    borderColor: { type: 'string' as const },
    borderWidth: { type: 'number' as const },
  };

  getDefaultProps(): ShapeRectShapeProps {
    return {
      w: DEFAULT_SIZE,
      h: DEFAULT_SIZE,
      fill: '#f5f5f5',
      opacity: 1,
      borderRadius: 8,
      borderColor: 'transparent',
      borderWidth: 0,
    };
  }

  getGeometry(shape: ShapeRectShape): Rectangle2d {
    return new Rectangle2d({
      width: Math.max(shape.props.w, MIN_SIZE),
      height: Math.max(shape.props.h, MIN_SIZE),
      isFilled: true,
    });
  }

  component(shape: ShapeRectShape) {
    const { props } = shape;
    const w = Math.max(props.w, MIN_SIZE);
    const h = Math.max(props.h, MIN_SIZE);
    
    return (
      <HTMLContainer
        id={shape.id}
        style={{
          width: w,
          height: h,
          pointerEvents: 'all',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: props.fill,
            opacity: props.opacity,
            borderRadius: props.borderRadius,
            border: props.borderWidth > 0 
              ? `${props.borderWidth}px solid ${props.borderColor}`
              : 'none',
          }}
        />
      </HTMLContainer>
    );
  }

  indicator(shape: ShapeRectShape) {
    const w = Math.max(shape.props.w, MIN_SIZE);
    const h = Math.max(shape.props.h, MIN_SIZE);
    const r = shape.props.borderRadius;
    
    return (
      <rect
        width={w}
        height={h}
        rx={r}
        ry={r}
      />
    );
  }

  override onResize: TLOnResizeHandler<ShapeRectShape> = (shape, info) => {
    const result = resizeBox(shape, info);
    if (result.props) {
      result.props.w = Math.max(result.props.w ?? shape.props.w, MIN_SIZE);
      result.props.h = Math.max(result.props.h ?? shape.props.h, MIN_SIZE);
    }
    return result;
  };

  override canResize = () => true;
  override canBind = () => false;
}

