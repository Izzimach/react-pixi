declare module 'react-pixi' {
  import {
    Component,
    ComponentClass,
    CSSProperties,
    SFC,
    ComponentFactory,
    ClassType,
  } from 'react';
  import * as React from 'react';
  import * as PIXI from 'pixi.js';

  export { render, unmountComponentAtNode } from 'react-dom';

  interface ContainerPropsType extends DisplayObjectPropsType {
    children?: PIXI.DisplayObject[];
    width?: number;
    height?: number;
  }
  interface DisplayObjectPropsType {
    cacheAsBitmap?: boolean;
    name?: string | null;
    accessible?: boolean;
    accessibleTitle?: string | null;
    accessibleHint?: string | null;
    tabIndex?: number;
    interactive?: boolean;
    interactiveChildren?: boolean;
    hitArea?: PIXI.Rectangle | PIXI.Circle | PIXI.Ellipse | PIXI.Polygon | PIXI.RoundedRectangle;
    buttonMode?: boolean;
    cursor?: string;
    defaultCursor?: string;
    transform?: PIXI.TransformBase;
    alpha?: number;
    visible?: boolean;
    renderable?: boolean;
    parent?: PIXI.Container;
    worldAlpha?: number;
    filterArea?: PIXI.Rectangle;
    x?: number;
    y?: number;
    worldTransform?: PIXI.Matrix;
    localTransform?: PIXI.Matrix;
    position?: PIXI.Point;
    scale?: PIXI.Point;
    pivot?: PIXI.Point;
    skew?: PIXI.Point;
    rotation?: number;
    worldVisible?: boolean;
    mask?: PIXI.Graphics | PIXI.Sprite;
    filters?: PIXI.Filter[] | null;
  }
  interface GraphicsPropsType extends ContainerPropsType {
    fillAlpha?: number;
    lineWidth?: number;
    nativeLines?: boolean;
    lineColor?: number;
    tint?: number;
    blendMode?: number;
    currentPath?: PIXI.GraphicsData;
    isMask?: boolean;
    boundsPadding?: number;
    dirty?: boolean;
    fastRectDirty?: number;
    clearDirty?: number;
    boundsDirty?: number;
    _SPRITE_TEXTURE?: PIXI.Texture;
  }
  interface SpritePropsType extends ContainerPropsType {
    image?: string;
    anchor?: PIXI.ObservablePoint;
    tint?: number;
    blendMode?: number;
    pluginName?: string;
    texture?: PIXI.Texture;
    vertexData?: Float32Array;
    width?: number;
    height?: number;
  }
  interface TextPropsType extends SpritePropsType {
    text: string;
    style?: PIXI.TextStyleOptions | PIXI.TextStyle;
    canvas?: HTMLCanvasElement;
    context?: CanvasRenderingContext2D;
    resolution?: number;
    fontPropertiesCache?: any;
    fontPropertiesCanvas?: HTMLCanvasElement;
    fontPropertiesContext?: CanvasRenderingContext2D;
    width?: number;
    height?: number;
    dirty?: boolean;
  }
  interface BitmapTextPropsType extends ContainerPropsType {
    text: string;
    style?: PIXI.extras.IBitmapTextStyle;
    textWidth?: number;
    textHeight?: number;
    font?: string | {name?: string; size?: number;};
    maxWidth?: number;
    maxLineHeight?: number;
    dirty?: boolean;
    tint?: number;
    align?: string;
    anchor?: PIXI.Point | number;
    fonts?: any;
  }
  interface TilingSpritePropsType extends SpritePropsType {
    tileTransform?: PIXI.TransformStatic;
    uvTransform?: PIXI.extras.TextureTransform;
    uvRespectAnchor?: boolean;
    clampMargin?: number;
    tileScale?: PIXI.Point | PIXI.ObservablePoint;
    tilePosition?: PIXI.Point | PIXI.ObservablePoint;
    width?: number;
    height?: number;
  }
  interface ParticleContainerPropsType extends ContainerPropsType {
    interactiveChildren?: boolean;
    blendMode?: number;
    roundPixels?: boolean;
    baseTexture?: PIXI.BaseTexture;
  }


  export type StagePropsType = ContainerPropsType;
  export type DisplayObjectContainerPropsType = ContainerPropsType;

  export class Stage extends Component<StagePropsType, void> {}
  export const DisplayObjectContainer: SFC<DisplayObjectContainerPropsType>;
  export class ParticleContainer extends Component<ParticleContainerPropsType, void> {}
  export class Sprite extends Component<SpritePropsType, void> {}
  export class Text extends Component<TextPropsType, void> {}
  export class BitmapText extends Component<BitmapTextPropsType, void> {}
  export class TilingSprite extends Component<TilingSpritePropsType, void> {}
  export class Graphics extends Component<GraphicsPropsType, void> {}
  export class CustomPixiComponentClass<CustomProps, PixiComponent>
      extends React.Component<CustomProps, void> {
    displayObject: PixiComponent;
  }

  export interface CustomPixiComponentClassFactory<CustomProps, PixiComponent>
    extends ComponentFactory<CustomProps, CustomPixiComponentClass<CustomProps, PixiComponent>> {
  }
  export function CustomPIXIComponent<CustomProps, PixiComponent>(args: {
    customDisplayObject(props: CustomProps): PixiComponent,
    customDidAttach?(displayObject: PixiComponent): void,
    customApplyProps(displayObject: PixiComponent, oldProps: CustomProps, newProps: CustomProps): void,
    customWillDetach?(displayObject: PixiComponent): void,
  }): CustomPixiComponentClassFactory<CustomProps, PixiComponent>
}