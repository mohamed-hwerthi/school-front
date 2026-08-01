import { motion } from "framer-motion";
import { MessageSquareText } from "lucide-react";
import { CarnetSelectionProvider, useCarnetSelection } from "@/components/carnet/CarnetSelectionContext";
import AppreciationsTab from "@/components/carnet/AppreciationsTab";

export default function BulletinsIndividuelsPage() {
  return (
    <CarnetSelectionProvider goToTab={() => {}}>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
              <MessageSquareText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">
                Appréciations
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Recommandations, observations et certificats par classe
              </p>
            </div>
          </div>
        </motion.div>

        <AppreciationsTab />
      </div>
    </CarnetSelectionProvider>
  );
}
