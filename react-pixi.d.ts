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
  import { render, unmountComponentAtNode } from 'react-dom';
  import {
    Point,
  } from 'pixi.js';

  export type StagePropsType = {
    width: number, height: number,
    style?: CSSProperties, backgroundColor?: number,
    transparent?: boolean,
  };
  export class Stage extends Component<StagePropsType, void> {}

  export type TilingSpritePropsType = {
    image: string, width: number, height: number,
  };
  export class TilingSprite extends Component<TilingSpritePropsType, void> {}

  export type TextPropsType = {
    text: string,
    x: number, y: number,
    style: CSSProperties,
    anchor: Point,
  };
  export class Text extends Component<TextPropsType, void> {}

  export type DisplayObjectContainerPropsType = {
    x: number, y: number,
  }
  export const DisplayObjectContainer: SFC<DisplayObjectContainerPropsType>;
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