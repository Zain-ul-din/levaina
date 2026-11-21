import { BubbleContent } from "@/components/ui/bubble";

type TextPartProps = {
  text: string;
};

export function TextPart({ text }: TextPartProps) {
  return <BubbleContent className="whitespace-pre-wrap">{text}</BubbleContent>;
}
