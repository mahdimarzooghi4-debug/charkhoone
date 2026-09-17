import { SvgUri } from "react-native-svg";

type FigmaSvgProps = {
  uri: string;
  width: number | string;
  height: number | string;
};

export function FigmaSvg({ uri, width, height }: FigmaSvgProps) {
  return <SvgUri uri={uri} width={width} height={height} />;
}
