import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import CarnetsTab from "@/components/carnet/CarnetsTab";
import { CarnetSelectionProvider } from "@/components/carnet/CarnetSelectionContext";

export default function BulletinsMasse() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <FileText className="h-5 w-5 text-blue-600" />
          <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">
            Generation en masse
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Generez tous les bulletins d'une classe en un clic
        </p>
      </motion.div>

      <CarnetSelectionProvider goToTab={() => {}}>
        <CarnetsTab />
      </CarnetSelectionProvider>
    </div>
  );
}
