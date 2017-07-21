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

  export interface ContainerPropsType extends DisplayObjectPropsType {
    children?: PIXI.DisplayObject[];
    width?: number;
    height?: number;
  }
  export interface DisplayObjectPropsType {
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
    position?: PIXI.Point | number[] | number | string;
    scale?: PIXI.Point | number[] | number | string;
    pivot?: PIXI.Point | number[] | number | string;
    skew?: PIXI.Point | number[] | number | string;
    rotation?: number;
    worldVisible?: boolean;
    mask?: PIXI.Graphics | PIXI.Sprite;
    filters?: PIXI.Filter[] | null;
  }
  export interface GraphicsPropsType extends ContainerPropsType {
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
  export interface SpritePropsType extends ContainerPropsType {
    image?: string;
    anchor?: PIXI.ObservablePoint | number[] | number | string;
    tint?: number;
    blendMode?: number;
    pluginName?: string;
    texture?: PIXI.Texture;
    vertexData?: Float32Array;
    width?: number;
    height?: number;
  }
  export interface TextPropsType extends SpritePropsType {
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
  export interface BitmapTextPropsType extends ContainerPropsType {
    text: string;
    style?: PIXI.extras.BitmapTextStyle;
    textWidth?: number;
    textHeight?: number;
    font?: string | {name?: string; size?: number;};
    maxWidth?: number;
    maxLineHeight?: number;
    dirty?: boolean;
    tint?: number;
    align?: string;
    anchor?: PIXI.Point | number[] | number | string | number;
    fonts?: any;
  }
  export interface TilingSpritePropsType extends SpritePropsType {
    tileTransform?: PIXI.TransformStatic;
    uvTransform?: PIXI.extras.TextureTransform;
    uvRespectAnchor?: boolean;
    clampMargin?: number;
    tileScale?: PIXI.Point | number[] | number | string | PIXI.ObservablePoint | number[] | number | string;
    tilePosition?: PIXI.Point | number[] | number | string | PIXI.ObservablePoint | number[] | number | string;
    width?: number;
    height?: number;
  }
  export interface ParticleContainerPropsType extends ContainerPropsType {
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
      extends React.Component<CustomProps, any> {
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
