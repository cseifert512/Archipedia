import {
  TLBaseShape,
  ShapeUtil,
  HTMLContainer,
  Rectangle2d,
  TLOnResizeHandler,
  resizeBox,
  TLShapePartial,
} from 'tldraw';

// Frame presets
export const FRAME_PRESETS = {
  '16:9': { w: 1920, h: 1080 },
  '4:3': { w: 1600, h: 1200 },
  'letter': { w: 2550, h: 3300 }, // 8.5x11 @ 300dpi
} as const;

export type FramePreset = keyof typeof FRAME_PRESETS;

// Frame shape props
export interface FrameShapeProps {
  title: string;
  preset: FramePreset;
  clip: boolean;
}

// Frame shape type
export type FrameShape = TLBaseShape<'frame', FrameShapeProps>;

// Frame shape util
export class FrameShapeUtil extends ShapeUtil<FrameShape> {
  static override type = 'frame' as const;
  static override props = {
    title: { type: 'string' as const },
    preset: { type: 'string' as const },
    clip: { type: 'boolean' as const },
  };

  getDefaultProps(): FrameShapeProps {
    return {
      title: 'Untitled Frame',
      preset: '16:9',
      clip: true,
    };
  }

  getGeometry(shape: FrameShape): Rectangle2d {
    return new Rectangle2d({
      width: shape.props.w ?? FRAME_PRESETS[shape.props.preset]?.w ?? 1920,
      height: shape.props.h ?? FRAME_PRESETS[shape.props.preset]?.h ?? 1080,
      isFilled: false,
    });
  }

  component(shape: FrameShape) {
    const w = shape.props.w ?? FRAME_PRESETS[shape.props.preset]?.w ?? 1920;
    const h = shape.props.h ?? FRAME_PRESETS[shape.props.preset]?.h ?? 1080;
    
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
            border: '2px solid #B64424',
            borderRadius: 4,
            backgroundColor: '#ffffff',
            position: 'relative',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}
        >
          {/* Frame title bar */}
          <div
            style={{
              position: 'absolute',
              top: -28,
              left: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              backgroundColor: '#B64424',
              color: 'white',
              borderRadius: '4px 4px 0 0',
              fontSize: 12,
              fontFamily: 'system-ui, sans-serif',
              fontWeight: 500,
            }}
          >
            <span>{shape.props.title}</span>
            <span style={{ opacity: 0.7, fontSize: 10 }}>
              {w}×{h}
            </span>
          </div>
        </div>
      </HTMLContainer>
    );
  }

  indicator(shape: FrameShape) {
    const w = shape.props.w ?? FRAME_PRESETS[shape.props.preset]?.w ?? 1920;
    const h = shape.props.h ?? FRAME_PRESETS[shape.props.preset]?.h ?? 1080;
    
    return (
      <rect
        width={w}
        height={h}
        rx={4}
        ry={4}
      />
    );
  }

  override onResize: TLOnResizeHandler<FrameShape> = (shape, info) => {
    return resizeBox(shape, info);
  };

  override canResize = () => true;
  override canBind = () => true;
  override isAspectRatioLocked = () => false;
}

// Get default frame size
export function getDefaultFrameSize(preset: FramePreset = '16:9') {
  return FRAME_PRESETS[preset] || FRAME_PRESETS['16:9'];
}

