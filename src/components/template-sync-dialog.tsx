import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { Repeat, Plus, X } from "lucide-react";

type Props = {
  open: boolean;
  count: number;
  onChoose: (mode: "replace" | "add" | "skip") => void;
};

export function TemplateSyncDialog({ open, count, onChoose }: Props) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onChoose("skip"); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("wiz.sync.title")}</DialogTitle>
          <DialogDescription>{t("wiz.sync.desc", { n: count })}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 pt-2">
          <Button className="w-full justify-start" onClick={() => onChoose("replace")}>
            <Repeat className="mr-2 size-4" /> {t("wiz.sync.replace")}
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => onChoose("add")}>
            <Plus className="mr-2 size-4" /> {t("wiz.sync.add")}
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={() => onChoose("skip")}>
            <X className="mr-2 size-4" /> {t("wiz.sync.skip")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
