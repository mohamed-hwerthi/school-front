import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Copy, Check, RefreshCw } from "lucide-react";
import { useGenerateBulletinComment } from "@/hooks/useAi";
import { notify } from "@/lib/toast";
import type { AiTone, AiCommentResponse } from "@/types/ai";

interface AiBulletinHelperProps {
  studentName: string;
  moyenne: number;
  noteDetails?: string[];
  onAccept?: (comment: string) => void;
}

const TONE_LABELS: Record<AiTone, string> = {
  ENCOURAGEANT: "Encourageant",
  NEUTRE: "Neutre",
  STRICT: "Strict",
};

export default function AiBulletinHelper({
  studentName,
  moyenne,
  noteDetails = [],
  onAccept,
}: AiBulletinHelperProps) {
  const [tone, setTone] = useState<AiTone>("NEUTRE");
  const [result, setResult] = useState<AiCommentResponse | null>(null);
  const [editedComment, setEditedComment] = useState("");
  const [copied, setCopied] = useState(false);

  const generateMutation = useGenerateBulletinComment();

  const handleGenerate = async () => {
    try {
      const response = await generateMutation.mutateAsync({
        studentName,
        moyenne,
        noteDetails,
        tone,
      });
      setResult(response);
      setEditedComment(response.comment);
    } catch {
      notify.error("Erreur lors de la generation du commentaire.");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedComment);
      setCopied(true);
      notify.success("Commentaire copie dans le presse-papiers.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify.error("Impossible de copier le texte.");
    }
  };

  const handleAccept = () => {
    onAccept?.(editedComment);
    notify.success("Commentaire applique.");
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Assistant IA - Commentaire bulletin
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Controls */}
        <div className="flex items-center gap-2">
          <Select
            value={tone}
            onValueChange={(v) => setTone(v as AiTone)}
          >
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="Ton" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(TONE_LABELS) as AiTone[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {TONE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            variant="default"
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="h-8 text-xs"
          >
            {generateMutation.isPending ? (
              <>
                <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                Generation...
              </>
            ) : (
              <>
                <Sparkles className="mr-1 h-3 w-3" />
                Generer
              </>
            )}
          </Button>
        </div>

        {/* Context info */}
        <div className="flex gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {studentName}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Moyenne: {moyenne.toFixed(2)}/20
          </Badge>
        </div>

        {/* Generated comment */}
        {result && (
          <div className="space-y-2">
            <Textarea
              value={editedComment}
              onChange={(e) => setEditedComment(e.target.value)}
              rows={4}
              className="text-sm resize-none"
              placeholder="Le commentaire genere apparaitra ici..."
            />

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="h-7 text-xs"
              >
                {copied ? (
                  <>
                    <Check className="mr-1 h-3 w-3" />
                    Copie
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-3 w-3" />
                    Copier
                  </>
                )}
              </Button>

              {onAccept && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleAccept}
                  className="h-7 text-xs"
                >
                  <Check className="mr-1 h-3 w-3" />
                  Appliquer
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className="h-7 text-xs"
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Regenerer
              </Button>
            </div>

            {/* Suggestions */}
            {result.suggestions && result.suggestions.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Suggestions :
                </p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-primary mt-0.5">&#8226;</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
