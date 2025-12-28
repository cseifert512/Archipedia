import {
  TLBaseShape,
  ShapeUtil,
  HTMLContainer,
  Rectangle2d,
  TLOnResizeHandler,
  resizeBox,
} from 'tldraw';

// Reference card display toggles
export interface ReferenceCardDisplayToggles {
  showTitle: boolean;
  showMeta: boolean;
  showCaption: boolean;
}

// Reference card props (snapshot model)
export interface ReferenceCardShapeProps {
  // Core identity
  project_id: string;
  image_id: string | null;
  
  // Snapshot data (won't break if corpus changes)
  thumb_url_snapshot: string;
  image_url_snapshot: string | null;
  title_snapshot: string;
  architect_snapshot: string | null;
  location_snapshot: string | null;
  year_snapshot: number | null;
  source_url_snapshot: string | null;
  
  // User editable
  caption: string;
  
  // Display toggles
  showTitle: boolean;
  showMeta: boolean;
  showCaption: boolean;
  
  // Size (min 220x180, default 320x260)
  w: number;
  h: number;
}

// Reference card shape type
export type ReferenceCardShape = TLBaseShape<'reference-card', ReferenceCardShapeProps>;

// Min/default sizes
const MIN_WIDTH = 220;
const MIN_HEIGHT = 180;
const DEFAULT_WIDTH = 320;
const DEFAULT_HEIGHT = 260;

// Reference card shape util
export class ReferenceCardShapeUtil extends ShapeUtil<ReferenceCardShape> {
  static override type = 'reference-card' as const;
  static override props = {
    project_id: { type: 'string' as const },
    image_id: { type: 'string' as const },
    thumb_url_snapshot: { type: 'string' as const },
    image_url_snapshot: { type: 'string' as const },
    title_snapshot: { type: 'string' as const },
    architect_snapshot: { type: 'string' as const },
    location_snapshot: { type: 'string' as const },
    year_snapshot: { type: 'number' as const },
    source_url_snapshot: { type: 'string' as const },
    caption: { type: 'string' as const },
    showTitle: { type: 'boolean' as const },
    showMeta: { type: 'boolean' as const },
    showCaption: { type: 'boolean' as const },
    w: { type: 'number' as const },
    h: { type: 'number' as const },
  };

  getDefaultProps(): ReferenceCardShapeProps {
    return {
      project_id: '',
      image_id: null,
      thumb_url_snapshot: '',
      image_url_snapshot: null,
      title_snapshot: 'Untitled',
      architect_snapshot: null,
      location_snapshot: null,
      year_snapshot: null,
      source_url_snapshot: null,
      caption: '',
      showTitle: true,
      showMeta: true,
      showCaption: true,
      w: DEFAULT_WIDTH,
      h: DEFAULT_HEIGHT,
    };
  }

  getGeometry(shape: ReferenceCardShape): Rectangle2d {
    return new Rectangle2d({
      width: Math.max(shape.props.w, MIN_WIDTH),
      height: Math.max(shape.props.h, MIN_HEIGHT),
      isFilled: true,
    });
  }

  component(shape: ReferenceCardShape) {
    const { props } = shape;
    const w = Math.max(props.w, MIN_WIDTH);
    const h = Math.max(props.h, MIN_HEIGHT);
    
    // Calculate image height (70-80% when showing metadata)
    const metaHeight = (props.showTitle ? 24 : 0) + 
                       (props.showMeta ? 20 : 0) + 
                       (props.showCaption && props.caption ? 24 : 0);
    const imageHeight = Math.max(h - metaHeight - 16, h * 0.5);
    
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
            backgroundColor: '#ffffff',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Image */}
          <div
            style={{
              width: '100%',
              height: imageHeight,
              backgroundColor: '#f0f0f0',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {props.thumb_url_snapshot && (
              <img
                src={props.thumb_url_snapshot}
                alt={props.title_snapshot}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                draggable={false}
              />
            )}
          </div>
          
          {/* Content */}
          <div
            style={{
              flex: 1,
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              minHeight: 0,
            }}
          >
            {props.showTitle && (
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'system-ui, sans-serif',
                  color: '#1a1a1a',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {props.title_snapshot}
              </div>
            )}
            
            {props.showMeta && (
              <div
                style={{
                  fontSize: 11,
                  fontFamily: 'system-ui, sans-serif',
                  color: '#666666',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {[
                  props.architect_snapshot,
                  props.location_snapshot,
                  props.year_snapshot,
                ].filter(Boolean).join(' · ')}
              </div>
            )}
            
            {props.showCaption && props.caption && (
              <div
                style={{
                  fontSize: 10,
                  fontFamily: 'system-ui, sans-serif',
                  fontStyle: 'italic',
                  color: '#888888',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginTop: 'auto',
                }}
              >
                "{props.caption}"
              </div>
            )}
          </div>
        </div>
      </HTMLContainer>
    );
  }

  indicator(shape: ReferenceCardShape) {
    const w = Math.max(shape.props.w, MIN_WIDTH);
    const h = Math.max(shape.props.h, MIN_HEIGHT);
    
    return (
      <rect
        width={w}
        height={h}
        rx={8}
        ry={8}
      />
    );
  }

  override onResize: TLOnResizeHandler<ReferenceCardShape> = (shape, info) => {
    const result = resizeBox(shape, info);
    // Enforce minimum size
    if (result.props) {
      result.props.w = Math.max(result.props.w ?? shape.props.w, MIN_WIDTH);
      result.props.h = Math.max(result.props.h ?? shape.props.h, MIN_HEIGHT);
    }
    return result;
  };

  override canResize = () => true;
  override canBind = () => false;
}

// Create reference card props from project data
export function createReferenceCardProps(data: {
  project_id: string;
  image_id?: string;
  thumb_url: string;
  image_url?: string;
  title: string;
  architect?: string;
  location?: string;
  year?: number;
}): Partial<ReferenceCardShapeProps> {
  return {
    project_id: data.project_id,
    image_id: data.image_id || null,
    thumb_url_snapshot: data.thumb_url,
    image_url_snapshot: data.image_url || null,
    title_snapshot: data.title,
    architect_snapshot: data.architect || null,
    location_snapshot: data.location || null,
    year_snapshot: data.year || null,
    showTitle: true,
    showMeta: true,
    showCaption: true,
    w: DEFAULT_WIDTH,
    h: DEFAULT_HEIGHT,
  };
}

