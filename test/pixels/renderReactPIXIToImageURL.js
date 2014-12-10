// For some tests we want to check the actual pixels being rendered.
// To help with that this function will render the React Components and then grab the canvas data.
//
// Pass in:
// - component to render
// - props to use
// - DOM element to mount to

function RenderReactPIXIToImageURL(component, props, mountpoint) {
  var reactinstance = React.render(component(props), mountpoint);

  // convert the rendered image to a data blob we can use
  var renderer = reactinstance.refs['stage'].pixirenderer;
  var renderURL = renderer.view.toDataURL();

  React.unmountComponentAtNode(mountpoint);

  return renderURL;
}
