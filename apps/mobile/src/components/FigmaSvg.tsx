import { SvgUri, SvgXml } from "react-native-svg";

type FigmaSvgProps = {
  uri: string;
  width: number | string;
  height: number | string;
  tintColor?: string;
};

const SVG_DATA_PREFIX = "data:image/svg+xml;utf8,";

/**
 * The vendoring script stores Figma XML in version-controlled percent-encoded
 * data URIs. Render those bytes with SvgXml on iOS/Android/Web without fetch.
 * SvgUri remains solely for existing, not-yet-vendored working-branch assets.
 */
export function FigmaSvg({ uri, width, height, tintColor }: FigmaSvgProps) {
  if (uri.startsWith(SVG_DATA_PREFIX)) {
    const xml = decodeURIComponent(uri.slice(SVG_DATA_PREFIX.length));
    // Only explicitly tinted icons are recolored; keep transparent paths intact.
    const colored = tintColor ? xml.replace(/(stroke|fill)="(?!none|transparent|url\()[^"]+"/g, `$1="${tintColor}"`) : xml;
    return <SvgXml xml={colored} width={width} height={height} />;
  }
  return <SvgUri uri={uri} width={width} height={height} />;
}
