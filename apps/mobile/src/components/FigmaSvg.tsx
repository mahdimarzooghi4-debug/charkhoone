import { SvgUri, SvgXml } from "react-native-svg";

type FigmaSvgProps = {
  uri: string;
  width: number | string;
  height: number | string;
};

const SVG_DATA_PREFIX = "data:image/svg+xml;utf8,";

/**
 * The vendoring script stores Figma XML in version-controlled percent-encoded
 * data URIs. Render those bytes with SvgXml on iOS/Android/Web without fetch.
 * SvgUri remains solely for existing, not-yet-vendored working-branch assets.
 */
export function FigmaSvg({ uri, width, height }: FigmaSvgProps) {
  if (uri.startsWith(SVG_DATA_PREFIX)) {
    return <SvgXml xml={decodeURIComponent(uri.slice(SVG_DATA_PREFIX.length))} width={width} height={height} />;
  }
  return <SvgUri uri={uri} width={width} height={height} />;
}
