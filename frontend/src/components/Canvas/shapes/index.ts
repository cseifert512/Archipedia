export { FrameShapeUtil, FRAME_PRESETS, getDefaultFrameSize } from './FrameShape';
export type { FrameShape, FrameShapeProps, FramePreset } from './FrameShape';

export { ReferenceCardShapeUtil, createReferenceCardProps } from './ReferenceCardShape';
export type { ReferenceCardShape, ReferenceCardShapeProps, ReferenceCardDisplayToggles } from './ReferenceCardShape';

export { TextBlockShapeUtil } from './TextBlockShape';
export type { TextBlockShape, TextBlockShapeProps, TextBlockStyle } from './TextBlockShape';

export { ShapeRectShapeUtil } from './ShapeRectShape';
export type { ShapeRectShape, ShapeRectShapeProps } from './ShapeRectShape';

// All custom shape utils for registration with tldraw
export const customShapeUtils = [
  FrameShapeUtil,
  ReferenceCardShapeUtil,
  TextBlockShapeUtil,
  ShapeRectShapeUtil,
];

